<?php

namespace App\Http\Controllers\API;

use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CustomerController
 *
 * Bug جديد: store() كان بيحفظ العميل بدون company_id
 *  - Customer model عنده $fillable يحتوي company_id وبيستخدم BelongsToCompany
 *  - العميل المُنشأ كان بيبقى company_id = null وبيختفي من قوائم كل الشركات
 *  - الحل: إضافة company_id صراحةً في create()
 */
class CustomerController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        // BelongsToCompany global scope بيفلتر تلقائياً على company_id
        $customers = Customer::when($request->search, fn($q) =>
            $q->where('name', 'like', "%{$request->search}%")
              ->orWhere('phone', 'like', "%{$request->search}%")
              ->orWhere('email', 'like', "%{$request->search}%"))
            ->paginate($this->perPage());

        return $this->success($customers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:150',
            'email'        => 'nullable|email',
            'phone'        => 'nullable|string|max:25',
            'address'      => 'nullable|string',
            'tax_number'   => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes'        => 'nullable|string',
        ]);

        // Bug Fix: إضافة company_id عشان العميل يظهر في قائمة الشركة الصح
        return $this->created(Customer::create([
            ...$data,
            'company_id' => $this->companyId(),
        ]));
    }

    public function show(Customer $customer): JsonResponse
    {
        // BelongsToCompany scope بيحمي Route Model Binding تلقائياً
        return $this->success($customer->load('sales'));
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $customer->update($request->validate([
            'name'         => 'sometimes|string|max:150',
            'email'        => 'nullable|email',
            'phone'        => 'nullable|string|max:25',
            'address'      => 'nullable|string',
            'credit_limit' => 'nullable|numeric|min:0',
            'is_active'    => 'sometimes|boolean',
        ]));
        return $this->success($customer, 'Customer updated');
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->delete();
        return $this->success(null, 'Customer deleted');
    }

    public function statement(Customer $customer): JsonResponse
    {
        $sales = $customer->sales()->with('items')->latest()->get();
        return $this->success([
            'customer' => $customer,
            'sales'    => $sales,
            'balance'  => $customer->balance,
        ]);
    }
}
