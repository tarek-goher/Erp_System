<?php
namespace App\Http\Controllers\API;
use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class CurrencyController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Currency::all()); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['code'=>'required|string|size:3|unique:currencies','name'=>'required|string','symbol'=>'required|string','exchange_rate'=>'required|numeric|min:0','is_default'=>'nullable|boolean']);
        if ($data['is_default'] ?? false) Currency::where('is_default',true)->update(['is_default'=>false]);
        return $this->created(Currency::create($data));
    }
    public function update(Request $request, Currency $currency): JsonResponse
    {
        $currency->update($request->only('exchange_rate','is_active','name','symbol'));
        return $this->success($currency,'Currency updated');
    }
    public function destroy(Currency $currency): JsonResponse { $currency->delete(); return $this->success(null,'Deleted'); }
}
