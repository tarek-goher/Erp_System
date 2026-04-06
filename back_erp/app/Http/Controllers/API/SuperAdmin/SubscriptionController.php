<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            ->when($request->plan, fn($q) => $q->where('plan', $request->plan))
            ->latest()->paginate($this->perPage());
        return $this->success($subscriptions);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_id'    => 'required|exists:companies,id',
            'plan'          => 'required|in:basic,professional,enterprise',
            'price'         => 'required|numeric|min:0',
            'billing_cycle' => 'required|in:monthly,quarterly,annual',
            'starts_at'     => 'required|date',
            'expires_at'    => 'required|date|after:starts_at',
            'notes'         => 'nullable|string',
        ]);
        return $this->created(Subscription::create(['status' => 'active', ...$data]));
    }

    public function show(Subscription $subscription): JsonResponse
    {
        return $this->success($subscription->load('company'));
    }

    public function update(Request $request, Subscription $subscription): JsonResponse
    {
        $subscription->update($request->only('plan', 'price', 'status', 'expires_at'));
        return $this->success($subscription, 'Subscription updated');
    }

    public function destroy(Subscription $subscription): JsonResponse
    {
        $subscription->delete();
        return $this->success(null, 'Subscription deleted');
    }

    /** GET /api/super-admin/subscriptions/revenue */
    public function revenue(): JsonResponse
    {
        $monthly   = Subscription::selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, SUM(price) as revenue')
            ->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get();
        $byPlan    = Subscription::selectRaw('plan, COUNT(*) as count, SUM(price) as revenue')->groupBy('plan')->get();
        $totalMRR  = Subscription::where('status', 'active')->where('billing_cycle', 'monthly')->sum('price');
        return $this->success(['monthly_revenue' => $monthly, 'by_plan' => $byPlan, 'mrr' => $totalMRR]);
    }
}
