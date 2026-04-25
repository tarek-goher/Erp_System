<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\MarketingContact;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// ══════════════════════════════════════════════════════════
// SendCampaignJob — إرسال حملة تسويقية في الـ background
// ══════════════════════════════════════════════════════════
// بدل ما نرسل لآلاف العملاء في نفس الـ HTTP request
// نحط الإرسال في الـ queue ويتنفذ في الـ background
//
// الاستخدام:
//   SendCampaignJob::dispatch($campaign);
//
// تشغيل الـ queue worker:
//   php artisan queue:work --tries=3
// ══════════════════════════════════════════════════════════
class SendCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // عدد محاولات إعادة التشغيل لو فشل الـ job
    public int $tries = 3;

    // مهلة التنفيذ بالثواني (5 دقايق)
    public int $timeout = 300;

    public function __construct(private Campaign $campaign) {}

    public function handle(): void
    {
        $campaign = $this->campaign;

        // تأكد إن الحملة لسه في الحالة الصح
        if (! in_array($campaign->status, ['draft', 'scheduled'])) {
            Log::info("[SendCampaignJob] Campaign #{$campaign->id} skipped — status: {$campaign->status}");
            return;
        }

        // ─── جلب جهات الاتصال المستهدفة ────────────────
        $contacts = MarketingContact::where('company_id', $campaign->company_id)
            ->where('is_subscribed', true)
            ->whereNotNull('email')
            ->get();

        $sentCount = 0;

        // ─── إرسال لكل جهة اتصال ────────────────────────
        foreach ($contacts as $contact) {
            try {
                if ($campaign->type === 'email') {
                    Mail::raw($campaign->body, function ($m) use ($campaign, $contact) {
                        $m->to($contact->email)
                          ->subject($campaign->subject ?? $campaign->name);
                    });
                }
                // لو SMS: استدعي SmsService هنا
                $sentCount++;
            } catch (\Throwable $e) {
                // لو فشل إرسال واحد — مش نوقف الكل
                Log::warning("[SendCampaignJob] Failed for contact #{$contact->id}: " . $e->getMessage());
            }
        }

        // ─── تحديث حالة الحملة ─────────────────────────
        $campaign->update([
            'status'     => 'sent',
            'sent_count' => $sentCount,
            'sent_at'    => now(),
        ]);

        Log::info("[SendCampaignJob] Campaign #{$campaign->id} sent to {$sentCount} contacts.");
    }

    // ─── لو فشلت كل المحاولات ─────────────────────────
    public function failed(\Throwable $exception): void
    {
        Log::error("[SendCampaignJob] Campaign #{$this->campaign->id} failed: " . $exception->getMessage());

        $this->campaign->update(['status' => 'failed']);
    }
}
