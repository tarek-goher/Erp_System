<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

// ══════════════════════════════════════════════════════════
// LogsActivity Trait
// ══════════════════════════════════════════════════════════
// بيوفر logging موحّد في كل الـ controllers
//
// الاستخدام:
//   use LogsActivity;
//
//   // في أي method:
//   $this->logInfo('تم إنشاء فاتورة', ['sale_id' => $sale->id]);
//   $this->logError('فشل في الإرسال', $exception);
//
// الـ AuditLog middleware بيسجل الـ write operations تلقائياً
// هذا الـ trait للـ custom logs إضافية فقط
// ══════════════════════════════════════════════════════════
trait LogsActivity
{
    // ─── Log معلومة عادية ─────────────────────────────────
    protected function logInfo(string $message, array $context = []): void
    {
        Log::info($this->buildMessage($message), $this->buildContext($context));
    }

    // ─── Log خطأ ──────────────────────────────────────────
    protected function logError(string $message, \Throwable $e, array $extra = []): void
    {
        Log::error($this->buildMessage($message), array_merge(
            $this->buildContext($extra),
            [
                'exception' => $e->getMessage(),
                'file'      => $e->getFile() . ':' . $e->getLine(),
            ]
        ));
    }

    // ─── Log تحذير ────────────────────────────────────────
    protected function logWarning(string $message, array $context = []): void
    {
        Log::warning($this->buildMessage($message), $this->buildContext($context));
    }

    // ─── بناء رسالة الـ log بنمط موحّد ────────────────────
    private function buildMessage(string $message): string
    {
        return '[' . class_basename(static::class) . '] ' . $message;
    }

    // ─── إضافة معلومات المستخدم والشركة للسياق ─────────────
    private function buildContext(array $extra = []): array
    {
        $user = auth()->user();
        return array_merge([
            'user_id'    => $user?->id,
            'company_id' => $user?->company_id,
        ], $extra);
    }
}
