<?php
namespace App\Http\Controllers\API;

use App\Models\Sale;
use App\Models\Product;
use App\Models\ProductLocation;
use App\Models\StockMovement;
use App\Exceptions\InsufficientStockException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** QuotationController — عروض الأسعار (نوع quotation من Sale) */
class QuotationController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $quotations = Sale::whereIn('status', ['quotation', 'sent', 'confirmed', 'cancelled'])
            ->where('company_id', $this->companyId()) // ✅ FIX 1: كان ناقص — bug أمني
            ->with('customer')
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->when($request->search,      fn($q) => $q->where('invoice_number', 'like', "%{$request->search}%"))
            ->when($request->date_from,   fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,     fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($quotations);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id'        => 'nullable|exists:customers,id',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty'        => 'required|numeric|min:0.001',
            'items.*.price'      => 'required|numeric|min:0',
            'valid_until'        => 'nullable|date',
            'notes'              => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data) {
            $total = collect($data['items'])->sum(fn($i) => $i['qty'] * $i['price']);

            $sale = Sale::create([
                'company_id'  => $this->companyId(),
                'customer_id' => $data['customer_id'] ?? null,
                'user_id'     => auth()->id(),
                'status'      => 'quotation',
                'subtotal'    => $total,
                'tax'         => 0,
                'discount'    => 0,
                'total'       => $total,
                'notes'       => $data['notes']       ?? null,
                'valid_until' => $data['valid_until'] ?? null, // ✅ FIX 2: كان ناقص
            ]);

            foreach ($data['items'] as $item) {
                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['qty'],
                    'unit_price' => $item['price'],
                    'total'      => $item['qty'] * $item['price'],
                ]);
            }

            return $this->created($sale->load('items.product', 'customer'));
        });
    }

    public function show(Sale $sale): JsonResponse
    {
        abort_unless($sale->status === 'quotation', 404);
        abort_unless($sale->company_id === $this->companyId(), 403); // ✅ FIX 1: تأكد الملكية
        return $this->success($sale->load('items.product', 'customer'));
    }

    public function update(Request $request, Sale $sale): JsonResponse
    {
        abort_unless($sale->company_id === $this->companyId(), 403); // ✅ FIX 1
        abort_unless(in_array($sale->status, ['quotation', 'sent', 'confirmed']), 422);

        $data = $request->validate([
            'notes'       => 'nullable|string',
            'customer_id' => 'nullable|exists:customers,id',
            'valid_until' => 'nullable|date',
            'status'      => 'nullable|in:quotation,sent,confirmed,cancelled',
        ]);

        $sale->update($data);
        return $this->success($sale->load('customer'), 'تم تحديث عرض السعر');
    }

    public function destroy(Sale $sale): JsonResponse
    {
        abort_unless($sale->company_id === $this->companyId(), 403); // ✅ FIX 1
        $sale->items()->delete();
        $sale->delete();
        return $this->success(null, 'تم حذف عرض السعر');
    }

    /**
     * POST /api/quotations/{sale}/convert — تحويل لفاتورة مبيعات
     *
     * ✅ FIX 3: الكود القديم كان:
     *   - مش بيتحقق من رصيد المخزن
     *   - مش بيسجل StockMovement
     *   - مش بيحدّث ProductLocation
     */
    public function convertToSale(Sale $sale): JsonResponse
    {
        abort_unless($sale->company_id === $this->companyId(), 403);
        abort_unless($sale->status === 'quotation', 422);

        return DB::transaction(function () use ($sale) {
            $companyId = $this->companyId();
            $sale->load('items');

            foreach ($sale->items as $item) {
                $product = Product::withoutGlobalScopes()->find($item->product_id);
                if (!$product) continue;

                $qty         = (float) $item->quantity;
                $warehouseId = $item->warehouse_id ?? $product->warehouse_id ?? null;
                $qtyBefore   = (float) $product->qty;

                // ✅ التحقق من الرصيد الكلي
                if ($qtyBefore < $qty) {
                    throw new InsufficientStockException($qtyBefore, $qty);
                }

                // ✅ تحديث ProductLocation لو في مخزن محدد
                if ($warehouseId) {
                    $location = ProductLocation::firstOrCreate(
                        [
                            'product_id'   => $item->product_id,
                            'warehouse_id' => $warehouseId,
                            'company_id'   => $companyId,
                        ],
                        ['qty' => 0]
                    );

                    if ($location->qty < $qty) {
                        throw new InsufficientStockException($location->qty, $qty);
                    }

                    $location->decrement('qty', $qty);
                }

                // ✅ تحديث المخزون الكلي
                $product->decrement('qty', $qty);

                // ✅ تسجيل حركة المخزون
                StockMovement::create([
                    'company_id'     => $companyId,
                    'product_id'     => $item->product_id,
                    'warehouse_id'   => $warehouseId,
                    'user_id'        => auth()->id(),
                    'type'           => 'out',
                    'qty'            => $qty,
                    'qty_before'     => $qtyBefore,
                    'qty_after'      => $qtyBefore - $qty,
                    'reference_type' => Sale::class,
                    'reference_id'   => $sale->id,
                    'notes'          => "تحويل عرض سعر #{$sale->invoice_number} لفاتورة مبيعات",
                ]);
            }

            // ✅ تحديث الحالة لـ completed
            $sale->update(['status' => 'pending']);

            return $this->success(
                $sale->load('items.product', 'customer'),
                'تم تحويل عرض السعر لفاتورة مبيعات بنجاح'
            );
        });
    }
}