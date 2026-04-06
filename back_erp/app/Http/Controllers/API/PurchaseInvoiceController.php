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
            'invoice_number' => 'required|string|unique:purchase_invoices',
            'amount'         => 'required|numeric|min:0',
            'tax'            => 'nullable|numeric|min:0',
            'total'          => 'required|numeric|min:0',
            'due_date'       => 'nullable|date',
            'notes'          => 'nullable|string',
        ]);
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
