<?php
namespace App\Http\Controllers\API;
use App\Models\PurchaseInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class PurchaseInvoiceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $invoices = PurchaseInvoice::with('supplier','purchase')
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate($this->perPage());
        return $this->success($invoices);
    }
   public function store(Request $request): JsonResponse
{
    $data = $request->validate([
        'supplier_id'    => 'required|exists:suppliers,id',
        'purchase_id'    => 'nullable|exists:purchases,id',
        'invoice_number' => 'nullable|string|max:100',
        'invoice_date'   => 'nullable|date',
        'amount'         => 'nullable|numeric|min:0',
        'tax'            => 'nullable|numeric|min:0',
        'tax_amount'     => 'nullable|numeric|min:0',
        'discount'       => 'nullable|numeric|min:0',
        'total'          => 'nullable|numeric|min:0',
        'total_amount'   => 'nullable|numeric|min:0',
        'due_date'       => 'nullable|date',
        'status' => 'nullable|string|in:draft,pending,matched,discrepancy,approved,paid,overdue,cancelled',
        'notes'          => 'nullable|string',
        'reference'      => 'nullable|string|max:100',
    ]);

    // حساب الـ total لو مش موجود
    if (!isset($data['total']) || $data['total'] === null) {
        $amount   = floatval($data['amount'] ?? 0);
        $tax      = floatval($data['tax'] ?? $data['tax_amount'] ?? 0);
        $discount = floatval($data['discount'] ?? 0);
        $data['total'] = $amount + $tax - $discount;
    }

    // auto-generate رقم الفاتورة لو مش موجود
    if (empty($data['invoice_number'])) {
        $data['invoice_number'] = 'PI-' . date('Ymd') . '-' . str_pad(PurchaseInvoice::count() + 1, 4, '0', STR_PAD_LEFT);
    }

    $data['company_id'] = $this->companyId();

    return $this->created(PurchaseInvoice::create($data));
}   
    public function show(PurchaseInvoice $purchaseInvoice): JsonResponse
    {
        return $this->success($purchaseInvoice->load('supplier','purchase'));
    }
    public function update(Request $request, PurchaseInvoice $purchaseInvoice): JsonResponse
    {
        $purchaseInvoice->update($request->only('status','due_date','notes'));
        return $this->success($purchaseInvoice, 'Invoice updated');
    }
    public function destroy(PurchaseInvoice $purchaseInvoice): JsonResponse
    {
        $purchaseInvoice->delete();
        return $this->success(null, 'Invoice deleted');
    }
}
