<?php

namespace App\Http\Controllers\API;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;

/**
 * TwoFactorController — المصادقة الثنائية TOTP
 * Fix: استبدلنا الـ dummy verify() بـ TOTP حقيقي باستخدام pragmarx/google2fa
 */
class TwoFactorController extends BaseController
{
    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /** GET /api/2fa/setup — توليد secret وQR code */
    public function setup(): JsonResponse
    {
        $user   = auth()->user();
        $secret = $this->google2fa->generateSecretKey();

        $user->update(['two_factor_secret' => $secret, 'two_factor_confirmed' => false]);

        $qrUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'CodeSphere ERP'),
            $user->email,
            $secret
        );

        return $this->success([
            'secret' => $secret,
            'qr_url' => $qrUrl,
            'manual_entry' => $secret,
        ]);
    }

    /** POST /api/2fa/enable — تفعيل 2FA بعد التحقق من الكود */
    public function enable(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user   = auth()->user();
        $secret = $user->two_factor_secret;

        if (!$secret) {
            return $this->error('يجب إعداد 2FA أولاً. استدعِ /api/2fa/setup.', 400);
        }

        // ✅ Fix: التحقق الحقيقي من الـ TOTP code
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            return $this->error('الكود غير صحيح. تأكد من توقيت جهازك وأعد المحاولة.', 422);
        }

        $user->update(['two_factor_confirmed' => true]);

        return $this->success(null, 'تم تفعيل المصادقة الثنائية بنجاح.');
    }

    /** POST /api/2fa/disable — إلغاء 2FA */
    public function disable(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user   = auth()->user();
        $secret = $user->two_factor_secret;

        if (!$secret || !$user->two_factor_confirmed) {
            return $this->error('المصادقة الثنائية غير مفعّلة.', 400);
        }

        // ✅ التحقق من الكود قبل الإلغاء
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            return $this->error('الكود غير صحيح.', 422);
        }

        $user->update(['two_factor_confirmed' => false, 'two_factor_secret' => null]);

        return $this->success(null, 'تم إلغاء المصادقة الثنائية.');
    }

    /** POST /api/2fa/verify — التحقق من الكود عند تسجيل الدخول */
    public function verify(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string|size:6']);

        $user   = auth()->user();
        $secret = $user->two_factor_secret;

        if (!$secret) {
            return $this->error('المصادقة الثنائية غير مُعدّة.', 400);
        }

        // ✅ Fix: تحقق حقيقي بدل return true دايماً
        $valid = $this->google2fa->verifyKey($secret, $request->code);

        if (!$valid) {
            return $this->error('كود التحقق غير صحيح أو منتهي الصلاحية.', 422);
        }

        return $this->success(['verified' => true], 'تم التحقق بنجاح.');
    }
}
