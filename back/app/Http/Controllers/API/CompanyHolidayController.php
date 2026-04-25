<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CompanyHoliday;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompanyHolidayController extends Controller
{
    /**
     * List all holidays for a company
     */
    public function index(int $companyId, Request $request): JsonResponse
    {
        try {
            $query = CompanyHoliday::where('company_id', $companyId);

            // Filter by year
            if ($request->has('year')) {
                $query->whereYear('holiday_date', $request->year);
            } else {
                // Default: current year
                $query->whereYear('holiday_date', now()->year);
            }

            // Filter: upcoming or past
            if ($request->get('type') === 'upcoming') {
                $query->upcoming();
            } elseif ($request->get('type') === 'past') {
                $query->past();
            }

            $holidays = $query->orderBy('holiday_date')->get();

            return response()->json([
                'success' => true,
                'count' => $holidays->count(),
                'data' => $holidays,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل الحصول على العطل: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new holiday
     */
    public function store(Request $request, int $companyId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'holiday_date' => 'required|date|date_format:Y-m-d',
                'name' => 'required|string|max:255',
                'name_ar' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'is_recurring' => 'boolean',
            ]);

            $holiday = CompanyHoliday::create([
                'company_id' => $companyId,
                ...$validated,
            ]);

            // Clear SlaCalculator cache
            \App\Services\SlaCalculator::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'تم إضافة العطلة بنجاح',
                'data' => $holiday,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'خطأ في التحقق من البيانات',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل إضافة العطلة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a holiday
     */
    public function update(Request $request, int $companyId, int $holidayId): JsonResponse
    {
        try {
            $holiday = CompanyHoliday::where('company_id', $companyId)
                ->findOrFail($holidayId);

            $validated = $request->validate([
                'holiday_date' => 'sometimes|date|date_format:Y-m-d',
                'name' => 'sometimes|string|max:255',
                'name_ar' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'is_recurring' => 'boolean',
            ]);

            $holiday->update($validated);

            // Clear SlaCalculator cache
            \App\Services\SlaCalculator::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'تم تحديث العطلة بنجاح',
                'data' => $holiday,
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
                'message' => 'فشل تحديث العطلة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a holiday
     */
    public function destroy(int $companyId, int $holidayId): JsonResponse
    {
        try {
            $holiday = CompanyHoliday::where('company_id', $companyId)
                ->findOrFail($holidayId);

            $holiday->delete();

            // Clear SlaCalculator cache
            \App\Services\SlaCalculator::clearCache();

            return response()->json([
                'success' => true,
                'message' => 'تم حذف العطلة بنجاح',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل حذف العطلة: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Bulk import holidays
     */
    public function bulkImport(Request $request, int $companyId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'holidays' => 'required|array',
                'holidays.*.holiday_date' => 'required|date|date_format:Y-m-d',
                'holidays.*.name' => 'required|string|max:255',
                'holidays.*.name_ar' => 'nullable|string|max:255',
            ]);

            $created = 0;
            foreach ($validated['holidays'] as $holiday) {
                CompanyHoliday::updateOrCreate(
                    [
                        'company_id' => $companyId,
                        'holiday_date' => $holiday['holiday_date'],
                    ],
                    $holiday
                );
                $created++;
            }

            // Clear SlaCalculator cache
            \App\Services\SlaCalculator::clearCache();

            return response()->json([
                'success' => true,
                'message' => "تم استيراد {$created} عطلة بنجاح",
                'count' => $created,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'فشل استيراد العطل: ' . $e->getMessage(),
            ], 500);
        }
    }
}
