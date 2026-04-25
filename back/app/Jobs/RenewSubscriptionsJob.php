<?php

namespace App\Jobs;

use App\Models\Subscription;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * RenewSubscriptionsJob — تجديد الاشتراكات المنتهية تلقائياً
 *
 * Bug Fix #4: الـ SubscriptionController بيتكلم عن auto-billing Job
 * مجدول في Kernel.php، لكن الـ Job مكانش موجود.
 *
 * الـ Job ده بيعمل الآتي يومياً:
 *  1. يجيب كل الاشتراكات النشطة اللي auto_renew=true وانتهت
 *  2. لكل اشتراك → يعمل تجديد (نفس المنطق من SubscriptionController::renew)
 *  3. يلوج الأخطاء بدل ما يكسر كل الـ batch
 */
class RenewSubscriptionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 1;
    public int $timeout = 300;

    public function handle(): void
    {
        $expiredSubs = Subscription::where('status', 'active')
            ->where('auto_renew', true)
            ->where('ends_at', '<', now()->toDateString())
            ->get();

        foreach ($expiredSubs as $sub) {
            try {
                DB::transaction(function () use ($sub) {
                    // أنهِ الاشتراك القديم
                    $sub->update(['status' => 'expired']);

                    $newEndsAt = match ($sub->billing_cycle) {
                        'monthly'   => now()->addMonth()->toDateString(),
                        'quarterly' => now()->addMonths(3)->toDateString(),
                        'yearly'    => now()->addYear()->toDateString(),
                        default     => now()->addMonth()->toDateString(),
                    };

                    Subscription::create([
                        'company_id'    => $sub->company_id,
                        'plan'          => $sub->plan,
                        'billing_cycle' => $sub->billing_cycle,
                        'starts_at'     => now()->toDateString(),
                        'ends_at'       => $newEndsAt,
                        'status'        => 'active',
                        'amount'        => $sub->amount,
                        'auto_renew'    => true,
                    ]);
                });

                Log::info("[RenewSubscriptionsJob] Renewed sub #{$sub->id} for company #{$sub->company_id}");
            } catch (\Throwable $e) {
                Log::error("[RenewSubscriptionsJob] Failed to renew sub #{$sub->id}: {$e->getMessage()}");
            }
        }

        // أيضاً: عطّل الشركات التي انتهى اشتراكها ولم يُجدَّد
        $expiredNoRenew = Subscription::where('status', 'active')
            ->where('auto_renew', false)
            ->where('ends_at', '<', now()->toDateString())
            ->get();

        foreach ($expiredNoRenew as $sub) {
            try {
                $sub->update(['status' => 'expired']);
                Company::where('id', $sub->company_id)->update(['status' => 'suspended']);
                Log::info("[RenewSubscriptionsJob] Expired + suspended company #{$sub->company_id}");
            } catch (\Throwable $e) {
                Log::error("[RenewSubscriptionsJob] Failed expiring sub #{$sub->id}: {$e->getMessage()}");
            }
        }
    }
}
