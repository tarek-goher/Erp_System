<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * SendEmailJob — إرسال الإيميلات في الخلفية
 * الاستخدام: SendEmailJob::dispatch('user@example.com', $mailable)
 */
class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(
        private readonly string   $to,
        private readonly Mailable $mailable
    ) {}

    public function handle(): void
    {
        Mail::to($this->to)->send($this->mailable);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Failed to send email to {$this->to}: " . $exception->getMessage());
    }
}
