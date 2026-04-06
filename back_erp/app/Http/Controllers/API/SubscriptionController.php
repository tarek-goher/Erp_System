<?php

namespace App\Http\Controllers\API;

use App\Models\Subscription;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * SubscriptionController — إدارة الاشتراكات
 *
 * يُستخدم من:
 *  - Super Admin: يدير اشتراكات كل الشركات
 *  - شركة: تشوف اشتراكها الحالي + فواتير الاشتراك
 *
 * Auto-billing logic:
 *  - عند انتهاء الاشتراك → يتم تجديده تلقائياً عبر Job مجدول
 *  - الـ Job موجود في Console/Kernel.php → schedule('daily')
 */
class SubscriptionController extends BaseController
{
    // ── عرض الاشتراك الحالي للشركة ─────────────────────────

    /** GET /api/subscription — اشتراك الشركة الحالية */
    public function current(): JsonResponse
    {
        $sub = Subscription::where('company_id', $this->companyId())
            ->where('status', 'active')
            ->latest()
            ->first();

        return $this->success($sub);
    }

    /** GET /api/subscription/history — تاريخ الاشتراكات */
    public function history(): JsonResponse
    {
        $history = Subscription::where('company_id', $this->companyId())
            ->orderByDesc('created_at')
            ->paginate($this->perPage());

        return $this->success($history);
    }

    // ── Super Admin ─────────────────────────────────────────

    /** GET /api/super-admin/subscriptions — كل الاشتراكات */
    public function index(Request $request): JsonResponse
    {
        $subs = Subscription::with('company')
            ->when($request->status,  fn($q) => $q->where('status',  $request->status))
            ->when($request->plan,    fn($q) => $q->where('plan',    $request->plan))
            ->when($request->search,  fn($q) => $q->whereHas('company', fn($c) => $c->where('name', 'like', "%{$request->search}%")))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($subs);
    }

    /** POST /api/super-admin/subscriptions — إنشاء اشتراك يدوياً */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id'   => 'required|exists:companies,id',
            'plan'         => 'required|in:starter,professional,enterprise',
            'billing_cycle'=> 'required|in:monthly,quarterly,yearly',
            'starts_at'    => 'required|date',
            'auto_renew'   => 'nullable|boolean',
            'notes'        => 'nullable|string',
        ]);

        $endsAt = $this->calcEndsAt($data['starts_at'], $data['billing_cycle']);

        $sub = Subscription::create([
            ...$data,
            'ends_at'    => $endsAt,
            'status'     => 'active',
            'amount'     => $this->planPrice($data['plan'], $data['billing_cycle']),
            'auto_renew' => $data['auto_renew'] ?? true,
        ]);

        // فعّل الشركة
        Company::where('id', $data['company_id'])->update(['status' => 'active']);

        return $this->created($sub->load('company'));
    }

    /** PUT /api/super-admin/subscriptions/{sub} — تعديل اشتراك */
    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        $data = $request->validate([
            'plan'         => 'sometimes|required|in:starter,professional,enterprise',
            'billing_cycle'=> 'sometimes|required|in:monthly,quarterly,yearly',
            'status'       => 'nullable|in:active,expired,cancelled,suspended',
            'auto_renew'   => 'nullable|boolean',
            'ends_at'      => 'nullable|date',
            'notes'        => 'nullable|string',
        ]);

        $subscription->update($data);

        return $this->success($subscription->load('company'), 'تم تحديث الاشتراك.');
    }

    /** POST /api/super-admin/subscriptions/{sub}/renew — تجديد يدوي */
    public function renew(Subscription $subscription): JsonResponse
    {
        return DB::transaction(function () use ($subscription) {
            // أنهِ الاشتراك القديم
            $subscription->update(['status' => 'expired']);

            $newEndsAt = $this->calcEndsAt(
                now()->toDateString(),
                $subscription->billing_cycle
            );

            $newSub = Subscription::create([
                'company_id'    => $subscription->company_id,
                'plan'          => $subscription->plan,
                'billing_cycle' => $subscription->billing_cycle,
                'starts_at'     => now()->toDateString(),
                'ends_at'       => $newEndsAt,
                'status'        => 'active',
                'amount'        => $subscription->amount,
                'auto_renew'    => $subscription->auto_renew,
            ]);

            return $this->created($newSub->load('company'), 'تم تجديد الاشتراك.');
        });
    }

    /** POST /api/super-admin/subscriptions/{sub}/cancel — إلغاء */
    public function cancel(Subscription $subscription): JsonResponse
    {
        $subscription->update(['status' => 'cancelled', 'auto_renew' => false]);
        Company::where('id', $subscription->company_id)->update(['status' => 'suspended']);

        return $this->success(null, 'تم إلغاء الاشتراك وإيقاف الشركة.');
    }

    /** GET /api/super-admin/subscriptions/stats — إحصائيات */
    public function stats(): JsonResponse
    {
        return $this->success([
            'active'      => Subscription::where('status', 'active')->count(),
            'expired'     => Subscription::where('status', 'expired')->count(),
            'cancelled'   => Subscription::where('status', 'cancelled')->count(),
            'expiring_soon' => Subscription::where('status', 'active')
                ->whereBetween('ends_at', [now(), now()->addDays(7)])
                ->count(),
            'monthly_revenue' => Subscription::where('status', 'active')
                ->where('billing_cycle', 'monthly')
                ->sum('amount'),
            'plans' => Subscription::where('status', 'active')
                ->selectRaw('plan, count(*) as count')
                ->groupBy('plan')
                ->get(),
        ]);
    }

    // ── Helpers ─────────────────────────────────────────────

    private function calcEndsAt(string $startsAt, string $cycle): string
    {
        return match ($cycle) {
            'monthly'   => now()->parse($startsAt)->addMonth()->toDateString(),
            'quarterly' => now()->parse($startsAt)->addMonths(3)->toDateString(),
            'yearly'    => now()->parse($startsAt)->addYear()->toDateString(),
            default     => now()->parse($startsAt)->addMonth()->toDateString(),
        };
    }

    private function planPrice(string $plan, string $cycle): float
    {
        $prices = [
            'starter'      => ['monthly' => 299,  'quarterly' => 799,  'yearly' => 2999],
            'professional' => ['monthly' => 799,  'quarterly' => 2199, 'yearly' => 7999],
            'enterprise'   => ['monthly' => 1999, 'quarterly' => 5499, 'yearly' => 19999],
        ];

        return (float) ($prices[$plan][$cycle] ?? 0);
    }
}
