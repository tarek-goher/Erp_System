<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * SuperAdmin\SubscriptionController
 * المسارات: /api/super-admin/subscriptions
 */
class SubscriptionController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $subscriptions = Subscription::with('company')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->plan,   fn($q) => $q->where('plan', $request->plan))
            ->when($request->search, fn($q) => $q->whereHas('company', fn($q2) =>
                $q2->where('name', 'like', "%{$request->search}%")
            ))
            ->latest()->paginate($this->perPage());

        return $this->success($subscriptions);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id'    => 'required|exists:companies,id',
            'plan'          => 'required|in:starter,professional,enterprise',
            'amount'        => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,quarterly,yearly',
            'starts_at'     => 'required|date',
            'auto_renew'    => 'boolean',
            'notes'         => 'nullable|string',
        ]);

        $starts = Carbon::parse($data['starts_at']);
        $ends   = match ($data['billing_cycle']) {
            'monthly'   => $starts->copy()->addMonth(),
            'quarterly' => $starts->copy()->addMonths(3),
            'yearly'    => $starts->copy()->addYear(),
            default     => $starts->copy()->addMonth(),
        };

        $subscription = Subscription::create([
            'status'  => 'active',
            'ends_at' => $ends->toDateString(),
            ...$data,
        ]);

        return $this->created($subscription->load('company'));
    }

    public function show(Subscription $subscription): JsonResponse
    {
        return $this->success($subscription->load('company'));
    }

    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        $data = $request->validate([
            'plan'          => 'sometimes|in:starter,professional,enterprise',
            'amount'        => 'sometimes|numeric|min:0',
            'billing_cycle' => 'sometimes|in:monthly,quarterly,yearly',
            'status'        => 'sometimes|in:active,expired,cancelled,suspended',
            'ends_at'       => 'sometimes|date',
            'auto_renew'    => 'sometimes|boolean',
            'notes'         => 'nullable|string',
        ]);

        $subscription->update($data);
        return $this->success($subscription->load('company'), 'تم التحديث بنجاح');
    }

    public function destroy(Subscription $subscription): JsonResponse
    {
        $subscription->delete();
        return $this->success(null, 'تم الحذف بنجاح');
    }

    /** POST /api/super-admin/subscriptions/{id}/renew */
    public function renew(Subscription $subscription): JsonResponse
    {
        $starts = now();
        $ends   = match ($subscription->billing_cycle) {
            'monthly'   => $starts->copy()->addMonth(),
            'quarterly' => $starts->copy()->addMonths(3),
            'yearly'    => $starts->copy()->addYear(),
            default     => $starts->copy()->addMonth(),
        };

        $subscription->update([
            'status'    => 'active',
            'starts_at' => $starts->toDateString(),
            'ends_at'   => $ends->toDateString(),
        ]);

        return $this->success($subscription->load('company'), 'تم تجديد الاشتراك بنجاح');
    }

    /** POST /api/super-admin/subscriptions/{id}/cancel */
    public function cancel(Subscription $subscription): JsonResponse
    {
        $subscription->update(['status' => 'cancelled']);
        return $this->success($subscription->load('company'), 'تم إلغاء الاشتراك');
    }

    /** GET /api/super-admin/subscriptions/stats */
    public function stats(): JsonResponse
    {
        $active       = Subscription::where('status', 'active')->count();
        $expired      = Subscription::where('status', 'expired')->count();
        $cancelled    = Subscription::where('status', 'cancelled')->count();
        $expiringSoon = Subscription::where('status', 'active')
            ->whereBetween('ends_at', [now(), now()->addDays(30)])
            ->count();

        $monthlyRevenue = Subscription::where('status', 'active')
            ->where('billing_cycle', 'monthly')
            ->sum('amount');

        $plans = Subscription::selectRaw('plan, COUNT(*) as count')
            ->groupBy('plan')
            ->get()
            ->map(fn($r) => ['plan' => $r->plan, 'count' => (int) $r->count]);

        return $this->success([
            'active'          => $active,
            'expired'         => $expired,
            'cancelled'       => $cancelled,
            'expiring_soon'   => $expiringSoon,
            'monthly_revenue' => (float) $monthlyRevenue,
            'plans'           => $plans,
        ]);
    }
}