<?php

namespace App\Http\Controllers\API;

use App\Models\FixedAsset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FixedAssetController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $query = FixedAsset::query()->where('company_id', $this->companyId());

        if ($s = $request->search) {
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")
                  ->orWhere('asset_code', 'like', "%$s%")
                  ->orWhere('category', 'like', "%$s%");
            });
        }

        if ($request->status)   $query->where('status',   $request->status);
        if ($request->category) $query->where('category', $request->category);

        return $this->success($query->paginate($this->perPage()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'required|string|max:200',
            'category'             => 'nullable|string|max:100',
            'asset_code'           => 'nullable|string|max:50|unique:fixed_assets,asset_code',
            'location'             => 'nullable|string|max:150',
            'vendor'               => 'nullable|string|max:150',
            'warranty_expiry_date' => 'nullable|date',
            'purchase_date'        => 'required|date',
            'purchase_value'       => 'required|numeric|min:0',
            'useful_life_years'    => 'required|integer|min:1',
            'salvage_value'        => 'nullable|numeric|min:0',
            'depreciation_method'  => 'nullable|in:straight_line,declining_balance',
            'depreciation_rate'    => 'nullable|numeric|min:0|max:100',
            'status'               => 'nullable|in:active,disposed,under_maintenance',
            'disposal_date'        => 'nullable|date',
            'disposal_value'       => 'nullable|numeric|min:0',
            'disposal_reason'      => 'nullable|string|max:255',
        ]);

        if (
            isset($data['depreciation_method']) &&
            $data['depreciation_method'] === 'declining_balance' &&
            empty($data['depreciation_rate'])
        ) {
            return $this->error('depreciation_rate is required for declining balance method', 422);
        }

        if (
            isset($data['salvage_value'], $data['purchase_value']) &&
            $data['salvage_value'] >= $data['purchase_value']
        ) {
            return $this->error('Salvage value must be less than purchase value', 422);
        }

     if (empty($data['asset_code'])) {
    $year  = date('Y');
    $count = FixedAsset::where('company_id', $this->companyId())
                       ->whereYear('created_at', $year)
                       ->count() + 1;
    $data['asset_code'] = 'FA-' . $year . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
}

$asset = FixedAsset::create([
    'company_id'               => $this->companyId(),
    'accumulated_depreciation' => 0,
    'salvage_value'            => $data['salvage_value'] ?? 0,
    ...$data,
]);

        return $this->created($asset);
    }

    public function show(FixedAsset $fixedAsset): JsonResponse
    {
        $schedule = $this->buildDepreciationSchedule($fixedAsset);

        return $this->success([
            ...$fixedAsset->toArray(),
            'depreciation_schedule' => $schedule,
            'book_value'            => $fixedAsset->purchase_value - $fixedAsset->accumulated_depreciation,
        ]);
    }

    public function update(Request $request, FixedAsset $fixedAsset): JsonResponse
    {
        $data = $request->validate([
            'name'                 => 'sometimes|string|max:200',
            'category'             => 'nullable|string|max:100',
            'asset_code'           => 'nullable|string|max:50|unique:fixed_assets,asset_code,' . $fixedAsset->id,
            'location'             => 'nullable|string|max:150',
            'vendor'               => 'nullable|string|max:150',
            'warranty_expiry_date' => 'nullable|date',
            'purchase_date'        => 'sometimes|date',
            'purchase_value'       => 'sometimes|numeric|min:0',
            'useful_life_years'    => 'sometimes|integer|min:1',
            'salvage_value'        => 'nullable|numeric|min:0',
            'depreciation_method'  => 'nullable|in:straight_line,declining_balance',
            'depreciation_rate'    => 'nullable|numeric|min:0|max:100',
            'status'               => 'nullable|in:active,disposed,under_maintenance',
            'disposal_date'        => 'nullable|date',
            'disposal_value'       => 'nullable|numeric|min:0',
            'disposal_reason'      => 'nullable|string|max:255',
        ]);

        $fixedAsset->update($data);
        return $this->success($fixedAsset, 'Asset updated');
    }

    public function destroy(FixedAsset $fixedAsset): JsonResponse
    {
        $fixedAsset->delete();
        return $this->success(null, 'Asset deleted');
    }

    private function buildDepreciationSchedule(FixedAsset $asset): array
    {
        $cost        = $asset->purchase_value;
        $salvage     = $asset->salvage_value ?? 0;
        $life        = max(1, $asset->useful_life_years);
        $rate        = $asset->depreciation_rate ?? 0;
        $method      = $asset->depreciation_method ?? 'straight_line';
        $bookValue   = $cost;
        $accumulated = 0;
        $rows        = [];

        for ($year = 1; $year <= $life; $year++) {
            $annualDep = $method === 'declining_balance'
                ? $bookValue * ($rate / 100)
                : ($cost - $salvage) / $life;

            $annualDep   = max(0, min($annualDep, $bookValue - $salvage));
            $accumulated += $annualDep;
            $bookValue   -= $annualDep;

            $rows[] = [
                'year'                => $year,
                'annual_depreciation' => round($annualDep, 2),
                'accumulated'         => round($accumulated, 2),
                'book_value'          => round(max($bookValue, $salvage), 2),
            ];
        }

        return $rows;
    }
}