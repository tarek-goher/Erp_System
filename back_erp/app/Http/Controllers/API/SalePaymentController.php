<?php

namespace App\Http\Controllers\API;

use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * SalePaymentController — الدفعات الجزئية للمبيعات
 *
 * يتيح دفع فاتورة على دفعات:
 *  GET  /api/sales/{sale}/payments   → قائمة الدفعات
 *  POST /api/sales/{sale}/payments   → إضافة دفعة جديدة
 *
 * عندما يكتمل الدفع → الفاتورة تتحول لـ "completed" تلقائياً.
 */
class SalePaymentController extends BaseController
{
    /** GET /api/sales/{sale}/payments */
    public function index(Sale $sale): JsonResponse
    {
        abort_if($sale->company_id !== $this->companyId(), 403);

        $payments = SalePayment::where('sale_id', $sale->id)->orderBy('created_at')->get();

        $totalPaid      = $payments->sum('amount');
        $remainingAmount = max(0, $sale->total - $totalPaid);

        return $this->success([
            'sale'             => [
                'id'             => $sale->id,
                'invoice_number' => $sale->invoice_number,
                'total'          => $sale->total,
                'status'         => $sale->status,
            ],
            'payments'         => $payments,
            'total_paid'       => $totalPaid,
            'remaining_amount' => $remainingAmount,
            'is_fully_paid'    => $remainingAmount <= 0,
        ]);
    }

    /** POST /api/sales/{sale}/payments */
    public function store(Request $request, Sale $sale): JsonResponse
    {
        abort_if($sale->company_id !== $this->companyId(), 403);
        abort_if($sale->status === 'cancelled', 422, 'لا يمكن إضافة دفعة لفاتورة ملغية.');

        $data = $request->validate([
            'amount'         => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,card,bank_transfer,credit',
            'reference'      => 'nullable|string|max:100',
            'notes'          => 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($data, $sale) {
            $totalPaid = SalePayment::where('sale_id', $sale->id)->sum('amount');
            $remaining = $sale->total - $totalPaid;

            abort_if($remaining <= 0, 422, 'الفاتورة مدفوعة بالكامل.');
            abort_if($data['amount'] > $remaining, 422, "الدفعة أكبر من المتبقي ({$remaining}).");

            $payment = SalePayment::create([
                'company_id'     => $this->companyId(),
                'sale_id'        => $sale->id,
                'user_id'        => auth()->id(),
                'amount'         => $data['amount'],
                'payment_method' => $data['payment_method'],
                'reference'      => $data['reference'] ?? null,
                'notes'          => $data['notes']     ?? null,
            ]);

            // لو اكتمل الدفع → غيّر حالة الفاتورة
            $newTotalPaid = $totalPaid + $data['amount'];
            if ($newTotalPaid >= $sale->total) {
                $sale->update(['status' => 'completed']);
            } elseif ($sale->status === 'draft') {
                $sale->update(['status' => 'pending']);
            }

            return $this->created($payment, 'تم تسجيل الدفعة.');
        });
    }

    /** DELETE /api/sales/{sale}/payments/{payment} */
    public function destroy(Sale $sale, SalePayment $payment): JsonResponse
    {
        abort_if($sale->company_id !== $this->companyId(), 403);
        abort_if($payment->sale_id !== $sale->id, 404);

        $payment->delete();

        // أعد حساب الحالة
        $totalPaid = SalePayment::where('sale_id', $sale->id)->sum('amount');
        if ($totalPaid <= 0 && $sale->status !== 'cancelled') {
            $sale->update(['status' => 'pending']);
        }

        return $this->success(null, 'تم حذف الدفعة.');
    }
}
