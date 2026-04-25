<?php
// ══════════════════════════════════════════════════════
// app/Http/Controllers/API/SupplierController.php
// ══════════════════════════════════════════════════════

namespace App\Http\Controllers\API;

use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Models\Supplier;
use App\Models\SupplierLedger; // ← أضفه فوق مع الـ use
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::where('company_id', $this->companyId())
            ->withCount('purchases')
            ->when($request->search, fn($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('code', 'like', "%{$request->search}%");
            }))
            ->when($request->status,         fn($q) => $q->where('status',         $request->status))
            ->when($request->type,           fn($q) => $q->where('type',           $request->type))
            ->when($request->payment_method, fn($q) => $q->where('payment_method', $request->payment_method))
            ->latest()
            ->paginate($this->perPage());

        return $this->success($suppliers);
    }

public function store(StoreSupplierRequest $request): JsonResponse
{
    $data = array_merge($request->validated(), [
        'company_id' => $this->companyId(),
    ]);

    // ★ توليد الكود تلقائياً لو مش موجود
    if (empty($data['code'])) {
        $last = Supplier::where('company_id', $this->companyId())->max('id') ?? 0;
        $data['code'] = 'SUP-' . str_pad($last + 1, 4, '0', STR_PAD_LEFT);
    }

    $supplier = Supplier::create($data);
    return $this->created($supplier);
}


public function show(Supplier $supplier): JsonResponse
{
    $supplier->loadCount('purchases');

    $stats = [
        'total_purchases' => (float) ($supplier->purchases()->sum('total') ?? 0),
        'purchases_count' => $supplier->purchases_count,
        'last_purchase'   => $supplier->purchases()->latest()->first()?->created_at,
        'balance'         => (float) ($supplier->ledger()->latest()->first()?->balance_after ?? 0),
    ];

    $ledger    = $supplier->ledger()->latest()->take(10)->get();
    $purchases = $supplier->purchases()->latest()->take(5)->get();

    return $this->success([
        'supplier'  => $supplier,
        'stats'     => $stats,
        'ledger'    => $ledger,
        'purchases' => $purchases,
    ]);
}


    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'           => 'sometimes|string|max:150',
            'code'           => 'nullable|string|max:50',
            'type'           => 'nullable|in:company,individual',
            'status'         => 'nullable|in:active,suspended,blocked',
            'rating'         => 'nullable|integer|min:0|max:5',
            'email'          => 'nullable|email|max:150',
            'phone'          => 'nullable|string|max:20',
            'country'        => 'nullable|string|max:100',
            'city'           => 'nullable|string|max:100',
            'street'         => 'nullable|string|max:255',
            'address'        => 'nullable|string|max:500',
            'contact_person' => 'nullable|string|max:150',
            'contact_phone'  => 'nullable|string|max:20',
            'payment_method' => 'nullable|in:cash,bank_transfer,deferred',
            'payment_terms'  => 'nullable|string|max:50',
            'bank_name'      => 'nullable|string|max:150',
            'bank_account'   => 'nullable|string|max:100',
            'tax_number'     => 'nullable|string|max:50',
            'products_notes' => 'nullable|string|max:2000',
            'notes'          => 'nullable|string|max:2000',
            'is_active'      => 'nullable|boolean',
        ]);

        $supplier->update($data);
        return $this->success($supplier, 'تم تحديث بيانات المورد.');
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        // منع الحذف لو عنده مشتريات
        if ($supplier->purchases()->exists()) {
            return $this->error('لا يمكن حذف هذا المورد لوجود مشتريات مرتبطة به.', 422);
        }

        $supplier->delete();
        return $this->success(null, 'تم حذف المورد.');
    }
    public function storeAttachments(Request $request, Supplier $supplier): JsonResponse
{
    $request->validate([
        'files'   => 'required|array|max:10',
        'files.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
    ]);

    $paths = [];
    foreach ($request->file('files') as $file) {
        $paths[] = $file->store("suppliers/{$supplier->id}/attachments", 'public');
    }

    return $this->success(['paths' => $paths], 'تم رفع الملفات بنجاح.');
}
public function storeLedger(Request $request, Supplier $supplier): JsonResponse
{
    $data = $request->validate([
        'type'      => 'required|in:payment,adjustment',
        'direction' => 'required|in:debit,credit',
        'amount'    => 'required|numeric|min:0.01',
        'reference' => 'nullable|string|max:100',
        'notes'     => 'nullable|string|max:1000',
    ]);

    // احسب الرصيد الجديد بناءً على آخر حركة
    $lastBalance = (float) ($supplier->ledger()->latest()->first()?->balance_after ?? 0);

    $newBalance = $data['direction'] === 'debit'
        ? $lastBalance + $data['amount']
        : $lastBalance - $data['amount'];

    $entry = $supplier->ledger()->create([
        ...$data,
        'company_id'    => $this->companyId(),
        'balance_after' => $newBalance,
        'created_by'    => auth()->id(),
    ]);

    return $this->success($entry, $data['type'] === 'payment'
        ? 'تم إضافة الدفعة بنجاح'
        : 'تم حفظ التسوية بنجاح'
    );
}
}