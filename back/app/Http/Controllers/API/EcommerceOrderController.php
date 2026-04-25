<?php

namespace App\Http\Controllers\API;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Customer;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * EcommerceOrderController
 * إدارة طلبات المتجر الإلكتروني
 * 
 * ملاحظة: نستخدم Sale model كـ Order للمتجر الإلكتروني
 */
class EcommerceOrderController extends BaseController
{
    /**
     * عرض قائمة الطلبات
     * GET /api/ecommerce/orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = Sale::where('company_id', $this->companyId())
            ->with('customer', 'items.product', 'user');

        // البحث برقم الطلب أو البريد الإلكتروني
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                  ->orWhereHas('customer', fn($c) => $c->where('email', 'like', "%{$request->search}%"));
            });
        }

        // تصفية حسب الحالة
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // ترتيب حسب الأحدث
        $query->orderBy('created_at', 'desc');

        return $this->success($query->paginate($this->perPage()));
    }

    /**
     * عرض تفاصيل طلب واحد
     * GET /api/ecommerce/orders/{order}
     */
    public function show(Sale $order): JsonResponse
    {
        abort_unless($order->company_id === $this->companyId(), 403);

        return $this->success($order->load('customer', 'items.product', 'user'));
    }

    /**
     * إنشاء طلب جديد من المتجر الإلكتروني
     * POST /api/ecommerce/orders
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id'    => 'required|exists:customers,id',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:1',
            'items.*.price'      => 'required|numeric|min:0',
            'discount'       => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string',
            'payment_method' => 'required|in:cash,card,bank_transfer,wallet',
        ]);

        // تحقق من وجود العميل
        $customer = Customer::where('company_id', $this->companyId())
            ->find($data['customer_id']);
        abort_unless($customer, 422, 'Customer not found');

        // حساب الإجمالي
        $subtotal = 0;
        foreach ($data['items'] as $item) {
            $subtotal += $item['quantity'] * $item['price'];
        }

        $discount = $data['discount'] ?? 0;
        $total = $subtotal - $discount;

        // إنشاء الطلب
        $order = Sale::create([
            'company_id'     => $this->companyId(),
            'customer_id'    => $data['customer_id'],
            'user_id'        => auth()->id(),
            'subtotal'       => $subtotal,
            'discount'       => $discount,
            'tax'            => 0,
            'total'          => $total,
            'status'         => 'pending',
            'payment_method' => $data['payment_method'],
            'notes'          => $data['notes'] ?? null,
        ]);

        // إضافة الأصناف
        foreach ($data['items'] as $item) {
            SaleItem::create([
                'sale_id'     => $order->id,
                'product_id'  => $item['product_id'],
                'quantity'    => $item['quantity'],
                'unit_price'  => $item['price'],
                'discount'    => 0,
                'total'       => $item['quantity'] * $item['price'],
            ]);

            // ✅ FIX: تحديث المخزون وتسجيل حركة
            $product = Product::find($item['product_id']);
            if ($product) {
                $qtyBefore = (float) $product->qty;
                $product->decrement('qty', $item['quantity']);

                StockMovement::create([
                    'company_id'     => $this->companyId(),
                    'product_id'     => $item['product_id'],
                    'user_id'        => auth()->id(),
                    'type'           => 'out',
                    'qty'            => $item['quantity'],
                    'qty_before'     => $qtyBefore,
                    'qty_after'      => $qtyBefore - $item['quantity'],
                    'reference_type' => Sale::class,
                    'reference_id'   => $order->id,
                    'notes'          => "طلب eCommerce - فاتورة #{$order->id}",
                ]);
            }
        }

        return $this->created($order->load('customer', 'items.product'));
    }

    /**
     * تحديث حالة الطلب
     * PUT /api/ecommerce/orders/{order}/status
     */
    public function updateStatus(Request $request, Sale $order): JsonResponse
    {
        abort_unless($order->company_id === $this->companyId(), 403);

        $data = $request->validate([
            'status' => 'required|in:pending,processing,shipped,delivered,cancelled,refunded',
        ]);

        $order->update(['status' => $data['status']]);

        return $this->success($order, 'Order status updated');
    }

    /**
     * تحديث الطلب (الملاحظات وغيرها)
     * PUT/PATCH /api/ecommerce/orders/{order}
     */
    public function update(Request $request, Sale $order): JsonResponse
    {
        abort_unless($order->company_id === $this->companyId(), 403);

        $data = $request->validate([
            'notes'          => 'nullable|string',
            'payment_method' => 'sometimes|in:cash,card,bank_transfer,wallet',
        ]);

        $order->update($data);

        return $this->success($order, 'Order updated');
    }

    /**
     * حذف/إلغاء الطلب
     * DELETE /api/ecommerce/orders/{order}
     */
    public function destroy(Sale $order): JsonResponse
    {
        abort_unless($order->company_id === $this->companyId(), 403);

        // فقط الطلبات المعلقة يمكن حذفها
        if ($order->status !== 'pending') {
            return $this->error('Only pending orders can be deleted', 422);
        }

        $order->delete();

        return $this->success(null, 'Order deleted');
    }

    /**
     * إحصائيات الطلبات
     * GET /api/ecommerce/orders/stats
     */
    public function stats(): JsonResponse
    {
        $baseQuery = Sale::where('company_id', $this->companyId());

        return $this->success([
            'total_orders'    => (clone $baseQuery)->count(),
            'pending'         => (clone $baseQuery)->where('status', 'pending')->count(),
            'processing'      => (clone $baseQuery)->where('status', 'processing')->count(),
            'shipped'         => (clone $baseQuery)->where('status', 'shipped')->count(),
            'delivered'       => (clone $baseQuery)->where('status', 'delivered')->count(),
            'cancelled'       => (clone $baseQuery)->where('status', 'cancelled')->count(),
            'total_revenue'   => (float) (clone $baseQuery)->where('status', 'delivered')->sum('total'),
        ]);
    }
}
