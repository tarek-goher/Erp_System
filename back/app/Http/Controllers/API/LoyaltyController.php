<?php

namespace App\Http\Controllers\API;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * LoyaltyController — نقاط الولاء والقسائم
 *
 * Missing Feature: كانت ناقصة خالص من النظام.
 *
 * يحتاج:
 *  1. إضافة loyalty_points للـ customers table (migration موجود في 000011)
 *  2. إنشاء vouchers table (migration موجود في 000011)
 *
 * Endpoints:
 *   GET  /api/loyalty/customers     → عملاء مع نقاطهم
 *   POST /api/loyalty/award         → منح نقاط
 *   POST /api/loyalty/redeem        → استرداد نقاط
 *   GET  /api/loyalty/vouchers      → قائمة القسائم
 *   POST /api/loyalty/vouchers      → إنشاء قسيمة
 *   PUT  /api/loyalty/vouchers/{id} → تعديل
 *   DELETE /api/loyalty/vouchers/{id} → حذف
 */
class LoyaltyController extends BaseController
{
    // ── Customers + Points ───────────────────────────────

    /** GET /api/loyalty/customers */
    public function customers(Request $request): JsonResponse
    {
        $customers = Customer::where('company_id', $this->companyId())
            ->where('is_active', true)
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->select('id', 'name', 'email', 'phone', 'loyalty_points', 'balance')
            ->orderByDesc('loyalty_points')
            ->paginate($this->perPage());

        // احسب total_spent من المبيعات
        $customerIds = $customers->pluck('id');
        $spentMap = DB::table('sales')
            ->whereIn('customer_id', $customerIds)
            ->where('company_id', $this->companyId())
            ->where('status', 'completed')
            ->groupBy('customer_id')
            ->pluck(DB::raw('SUM(total)'), 'customer_id');

        $items = $customers->through(fn($c) => array_merge($c->toArray(), [
            'total_spent'    => (float) ($spentMap[$c->id] ?? 0),
            'tier'           => $this->calcTier($c->loyalty_points),
        ]));

        return $this->success($customers->toArray());
    }

    /** POST /api/loyalty/award */
    public function award(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'points'      => 'required|integer|min:1',
            'reason'      => 'nullable|string|max:255',
        ]);

        $customer = Customer::where('id', $data['customer_id'])
            ->where('company_id', $this->companyId())
            ->firstOrFail();

        $customer->increment('loyalty_points', $data['points']);

        return $this->success([
            'customer_id'    => $customer->id,
            'points_awarded' => $data['points'],
            'new_total'      => $customer->fresh()->loyalty_points,
        ], 'تم منح النقاط.');
    }

    /** POST /api/loyalty/redeem */
    public function redeem(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'points'      => 'required|integer|min:1',
        ]);

        $customer = Customer::where('id', $data['customer_id'])
            ->where('company_id', $this->companyId())
            ->firstOrFail();

        abort_if($customer->loyalty_points < $data['points'], 422,
            "النقاط المطلوبة ({$data['points']}) أكبر من الرصيد ({$customer->loyalty_points}).");

        $customer->decrement('loyalty_points', $data['points']);

        return $this->success([
            'customer_id'    => $customer->id,
            'points_redeemed' => $data['points'],
            'new_total'       => $customer->fresh()->loyalty_points,
        ], 'تم استرداد النقاط.');
    }

    // ── Vouchers ──────────────────────────────────────────

    /** GET /api/loyalty/vouchers */
    public function vouchers(Request $request): JsonResponse
    {
        $vouchers = DB::table('vouchers')
            ->where('company_id', $this->companyId())
            ->when($request->search, fn($q) => $q->where('code', 'like', "%{$request->search}%"))
            ->orderByDesc('created_at')
            ->paginate($this->perPage());

        return $this->success($vouchers);
    }

    /** POST /api/loyalty/vouchers */
    public function storeVoucher(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'       => 'required|string|max:20',
            'type'       => 'required|in:percentage,fixed',
            'value'      => 'required|numeric|min:0.01',
            'min_order'  => 'nullable|numeric|min:0',
            'max_uses'   => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active'  => 'nullable|boolean',
        ]);

        // تأكد إن الكود unique على مستوى الشركة
        $exists = DB::table('vouchers')
            ->where('company_id', $this->companyId())
            ->where('code', strtoupper($data['code']))
            ->exists();
        abort_if($exists, 422, 'الكود موجود بالفعل.');

        $id = DB::table('vouchers')->insertGetId([
            'company_id' => $this->companyId(),
            'code'       => strtoupper($data['code']),
            'type'       => $data['type'],
            'value'      => $data['value'],
            'min_order'  => $data['min_order']  ?? null,
            'max_uses'   => $data['max_uses']   ?? null,
            'uses_count' => 0,
            'expires_at' => $data['expires_at'] ?? null,
            'is_active'  => $data['is_active']  ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->created(DB::table('vouchers')->find($id), 'تم إنشاء القسيمة.');
    }

    /** PUT /api/loyalty/vouchers/{id} */
    public function updateVoucher(Request $request, int $id): JsonResponse
    {
        $voucher = DB::table('vouchers')
            ->where('id', $id)->where('company_id', $this->companyId())->first();
        abort_if(!$voucher, 404);

        $data = $request->validate([
            'code'       => 'sometimes|string|max:20',
            'type'       => 'sometimes|in:percentage,fixed',
            'value'      => 'sometimes|numeric|min:0.01',
            'min_order'  => 'nullable|numeric|min:0',
            'max_uses'   => 'nullable|integer|min:1',
            'expires_at' => 'nullable|date',
            'is_active'  => 'nullable|boolean',
        ]);

        if (isset($data['code'])) $data['code'] = strtoupper($data['code']);
        $data['updated_at'] = now();

        DB::table('vouchers')->where('id', $id)->update($data);

        return $this->success(DB::table('vouchers')->find($id), 'تم التعديل.');
    }

    /** DELETE /api/loyalty/vouchers/{id} */
    public function destroyVoucher(int $id): JsonResponse
    {
        $deleted = DB::table('vouchers')
            ->where('id', $id)->where('company_id', $this->companyId())->delete();
        abort_if(!$deleted, 404);
        return $this->success(null, 'تم الحذف.');
    }

    // ── Helper ────────────────────────────────────────────

    private function calcTier(int $points): string
    {
        return match(true) {
            $points >= 15000 => 'platinum',
            $points >= 5000  => 'gold',
            $points >= 1000  => 'silver',
            default          => 'bronze',
        };
    }
}
