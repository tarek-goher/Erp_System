<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
/** CompanySettingsController — إعدادات الشركة */
class CompanySettingsController extends BaseController
{
    public function show(): JsonResponse
    {
        $company = auth()->user()->company;
        return $this->success($company);
    }
    public function update(Request $request): JsonResponse
    {
        $company = auth()->user()->company;
        $data = $request->validate([
            'name'       => 'sometimes|string|max:200',
            'email'      => 'nullable|email',
            'phone'      => 'nullable|string',
            'address'    => 'nullable|string',
            'currency'   => 'nullable|string|max:5',
            'country'    => 'nullable|string',
            'tax_number' => 'nullable|string',
            'settings'   => 'nullable|array',
        ]);
        $company->update($data);
        return $this->success($company, 'Settings updated');
    }
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate(['logo' => 'required|image|max:2048']);
        $path = $request->file('logo')->store('logos', 'public');
        auth()->user()->company->update(['logo' => $path]);
        return $this->success(['logo' => $path], 'Logo uploaded');
    }
}
