<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CompanySetting;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompanySettingController extends Controller
{
    /**
     * Get company settings
     */
    public function show(int $companyId): JsonResponse
    {
        try {
            $setting = CompanySetting::firstOrCreate(
                ['company_id' => $companyId],
                ['timezone' => 'Africa/Cairo']
            );

            return response()->json([
                'success' => true,
                'data' => $setting,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل الحصول على الإعدادات: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update company settings
     */
    public function update(Request $request, int $companyId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'work_start_hour' => 'nullable|date_format:H:i',
                'work_end_hour' => 'nullable|date_format:H:i',
                'weekend_days' => 'nullable|array',
                'weekend_days.*' => 'integer|min:0|max:6',
                'timezone' => 'nullable|timezone',
                'company_name_ar' => 'nullable|string|max:255',
                'company_name_en' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email',
                'address' => 'nullable|string',
                'enable_sms_notifications' => 'boolean',
                'enable_email_notifications' => 'boolean',
                'enable_push_notifications' => 'boolean',
            ]);

            $setting = CompanySetting::firstOrCreate(
                ['company_id' => $companyId]
            );

            $setting->update($validated);

            // Clear SlaCalculator cache
            \App\Services\SlaCalculator::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث الإعدادات بنجاح',
                'data' => $setting,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في التحقق من البيانات',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل تحديث الإعدادات: ' . $e->getMessage(),
            ], 500);
        }
    }
}
