<?php
namespace App\Http\Controllers\API;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
/** QuotationController — عروض الأسعار (نوع quotation من Sale) */
class QuotationController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $quotations = Sale::where('status','quotation')
            ->with('customer')
            ->when($request->customer_id, fn($q) => $q->where('customer_id', $request->customer_id))
            ->latest()->paginate($this->perPage());
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
                'company_id' => $this->companyId(),
                'customer_id'=> $data['customer_id'] ?? null,
                'user_id'    => auth()->id(),
                'status'     => 'quotation',
                'subtotal'   => $total,
                'total'      => $total,
                'notes'      => $data['notes'] ?? null,
            ]);
            foreach ($data['items'] as $item) {
                $sale->items()->create([
                    'product_id' => $item['product_id'],
                    'qty'        => $item['qty'],
                    'price'      => $item['price'],
                    'total'      => $item['qty'] * $item['price'],
                ]);
            }
            return $this->created($sale->load('items.product', 'customer'));
        });
    }
    public function show(Sale $sale): JsonResponse
    {
        abort_unless($sale->status === 'quotation', 404);
        return $this->success($sale->load('items.product','customer'));
    }
    public function update(Request $request, Sale $sale): JsonResponse
    {
        abort_unless($sale->status === 'quotation', 422);
        $sale->update($request->only('notes','customer_id'));
        return $this->success($sale, 'Quotation updated');
    }
    public function destroy(Sale $sale): JsonResponse
    {
        $sale->items()->delete();
        $sale->delete();
        return $this->success(null, 'Quotation deleted');
    }
    /** POST /api/quotations/{sale}/convert — تحويل لفاتورة */
    public function convertToSale(Sale $sale): JsonResponse
    {
        abort_unless($sale->status === 'quotation', 422);
        $sale->update(['status' => 'completed']);
        foreach ($sale->items as $item) {
            \App\Models\Product::find($item->product_id)?->decrement('qty', $item->qty);
        }
        return $this->success($sale, 'Quotation converted to sale');
    }
}
