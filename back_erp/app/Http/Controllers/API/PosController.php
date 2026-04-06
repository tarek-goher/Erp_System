<?php

namespace App\Http\Controllers\API;

use App\Models\PosShift;
use App\Models\PosOrder;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * PosController — نقطة البيع
 *
 * جديد مقارنة بالنسخة القديمة:
 *  - barcode lookup بالـ barcode أو SKU
 *  - loyalty points: كسب عند الشراء + استرداد عند الدفع
 *  - company_id filter على الـ stats (كانت بتجيب كل الشركات)
 *  - تحقق من وجود وردية مفتوحة قبل فتح واحدة جديدة
 */
class PosController extends BaseController
{
    // ── Shift Management ──────────────────────────────────

    public function openShift(Request $request): JsonResponse
    {
        $data = $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'warehouse_id'    => 'nullable|exists:warehouses,id',
        ]);

        $existing = PosShift::where('cashier_id', auth()->id())
            ->where('status', 'open')
            ->exists();

        abort_if($existing, 422, 'لديك وردية مفتوحة بالفعل.');

        $shift = PosShift::create([
            'company_id'      => $this->companyId(),
            'cashier_id'      => auth()->id(),
            'opening_balance' => $data['opening_balance'],
            'status'          => 'open',
        ]);

        return $this->created($shift, 'تم فتح الوردية.');
    }

    public function closeShift(PosShift $shift, Request $request): JsonResponse
    {
        abort_if($shift->company_id !== $this->companyId(), 403);
        abort_if($shift->status === 'closed', 422, 'الوردية مغلقة بالفعل.');

        $data = $request->validate(['closing_balance' => 'required|numeric|min:0']);

        $totals = PosOrder::where('shift_id', $shift->id)
            ->selectRaw('SUM(total) as total_sales, COUNT(*) as total_orders')
            ->first();

        $shift->update([
            'closing_balance' => $data['closing_balance'],
            'status'          => 'closed',
            'closed_at'       => now(),
            'total_sales'     => $totals->total_sales  ?? 0,
            'total_orders'    => $totals->total_orders ?? 0,
        ]);

        return $this->success($shift, 'تم إغلاق الوردية.');
    }

    public function currentShift(): JsonResponse
    {
        $shift = PosShift::where('cashier_id', auth()->id())
            ->where('status', 'open')
            ->latest()
            ->first();

        return $this->success($shift);
    }

    // ── Barcode Lookup ─────────────────────────────────────

    /**
     * GET /api/pos/barcode/{code}
     * بحث بالـ barcode أو SKU — للـ scanner في الـ POS.
     */
    public function barcodeLookup(string $code): JsonResponse
    {
        $product = Product::where('company_id', $this->companyId())
            ->where(function ($q) use ($code) {
                $q->where('barcode', $code)
                  ->orWhere('sku', $code);
            })
            ->with('category')
            ->select('id', 'name', 'barcode', 'sku', 'sell_price', 'qty', 'category_id')
            ->first();

        if (!$product) {
            return $this->notFound('لم يتم العثور على المنتج بهذا الباركود.');
        }

        return $this->success($product);
    }

    // ── Loyalty Points ─────────────────────────────────────

    /**
     * GET /api/pos/loyalty/{customer}
     * رصيد نقاط الولاء للعميل.
     * معادلة: 10 نقاط = 1 جنيه مصري
     */
    public function loyaltyBalance(Customer $customer): JsonResponse
    {
        abort_if($customer->company_id !== $this->companyId(), 403);

        return $this->success([
            'customer_id'    => $customer->id,
            'customer_name'  => $customer->name,
            'loyalty_points' => $customer->loyalty_points ?? 0,
            'redeemable_egp' => ($customer->loyalty_points ?? 0) * 0.1,
        ]);
    }

    // ── POS Sale ───────────────────────────────────────────

    /**
     * POST /api/pos/sale
     *
     * يدعم:
     *  - payment_method: cash | card | split
     *  - redeem_points: استرداد نقاط ولاء
     *  - items.*.discount: خصم على كل صنف
     */
    public function sale(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shift_id'           => 'required|exists:pos_shifts,id',
            'customer_id'        => 'nullable|exists:customers,id',
            'items'              => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty'        => 'required|numeric|min:0.001',
            'items.*.price'      => 'required|numeric|min:0',
            'items.*.discount'   => 'nullable|numeric|min:0',
            'payment_method'     => 'nullable|in:cash,card,bank_transfer,split',
            'tax'                => 'nullable|numeric|min:0',
            'discount'           => 'nullable|numeric|min:0',
            'redeem_points'      => 'nullable|integer|min:0',
            'notes'              => 'nullable|string',
        ]);

        return DB::transaction(function () use ($data) {
            $companyId = $this->companyId();

            $subtotal = collect($data['items'])->sum(
                fn($i) => ($i['qty'] * $i['price']) - ($i['discount'] ?? 0)
            );

            $tax      = $data['tax']      ?? 0;
            $discount = $data['discount'] ?? 0;

            // استرداد نقاط الولاء
            $pointsDiscount = 0;
            $customer = null;
            if (!empty($data['customer_id'])) {
                $customer = Customer::lockForUpdate()->find($data['customer_id']);
            }

            if ($customer && !empty($data['redeem_points']) && $data['redeem_points'] > 0) {
                $redeemPoints   = min($data['redeem_points'], $customer->loyalty_points ?? 0);
                $pointsDiscount = $redeemPoints * 0.1;
                $customer->decrement('loyalty_points', $redeemPoints);
            }

            $total = max(0, $subtotal + $tax - $discount - $pointsDiscount);

            $order = PosOrder::create([
                'company_id'     => $companyId,
                'shift_id'       => $data['shift_id'],
                'customer_id'    => $data['customer_id'] ?? null,
                'cashier_id'     => auth()->id(),
                'subtotal'       => $subtotal,
                'tax'            => $tax,
                'discount'       => $discount + $pointsDiscount,
                'total'          => $total,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status'         => 'completed',
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'qty'        => $item['qty'],
                    'price'      => $item['price'],
                    'discount'   => $item['discount'] ?? 0,
                    'total'      => ($item['qty'] * $item['price']) - ($item['discount'] ?? 0),
                ]);

                Product::withoutGlobalScopes()
                    ->where('id', $item['product_id'])
                    ->decrement('qty', $item['qty']);
            }

            // كسب نقاط الولاء: 10 جنيه = 1 نقطة
            if ($customer) {
                $earned = (int) floor($total / 10);
                if ($earned > 0) {
                    $customer->increment('loyalty_points', $earned);
                }
            }

            return $this->created(
                $order->load('items.product', 'customer'),
                'تم تسجيل البيع بنجاح.'
            );
        });
    }

    // ── Queries ────────────────────────────────────────────

    public function orders(Request $request): JsonResponse
    {
        $orders = PosOrder::with('customer', 'cashier')
            ->where('company_id', $this->companyId())
            ->when($request->shift_id, fn($q) => $q->where('shift_id', $request->shift_id))
            ->when($request->from, fn($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->to,   fn($q) => $q->whereDate('created_at', '<=', $request->to))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($orders);
    }

    public function shifts(): JsonResponse
    {
        return $this->success(
            PosShift::where('company_id', $this->companyId())
                ->with('cashier')
                ->latest()
                ->paginate($this->perPage())
        );
    }

    public function stats(): JsonResponse
    {
        $companyId = $this->companyId();
        $today = now()->toDateString();

        return $this->success([
            'today_sales'  => PosOrder::where('company_id', $companyId)->whereDate('created_at', $today)->sum('total'),
            'today_orders' => PosOrder::where('company_id', $companyId)->whereDate('created_at', $today)->count(),
            'open_shifts'  => PosShift::where('company_id', $companyId)->where('status', 'open')->count(),
        ]);
    }

    /** GET /api/pos/products — كاتالوج الـ POS مع الباركود */
    public function products(): JsonResponse
    {
        return $this->success(
            Product::where('company_id', $this->companyId())
                ->where('is_active', true)
                ->with('category')
                ->select('id', 'name', 'barcode', 'sku', 'sell_price', 'qty', 'category_id')
                ->get()
        );
    }
}
