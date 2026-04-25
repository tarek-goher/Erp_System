<?php

namespace App\Http\Controllers\API\Portal;

use App\Http\Controllers\API\BaseController;
use App\Models\Portal\PortalInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortalInvoiceController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user     = $request->user();
            $invoices = PortalInvoice::where('portal_user_id', $user->id)
                ->where('company_id', $user->company_id)
                ->orderByDesc('created_at')
                ->paginate(20);
            return $this->sendResponse($invoices, 'Invoices retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function download(Request $request, PortalInvoice $invoice)
    {
        try {
            $user = $request->user();
            if ($invoice->portal_user_id !== $user->id) {
                return $this->sendError('Unauthorized', [], 403);
            }
            if (! $invoice->file_path || ! Storage::exists($invoice->file_path)) {
                return $this->sendError('Invoice file not found', [], 404);
            }
            return Storage::download($invoice->file_path, "invoice_{$invoice->invoice_number}.pdf");
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
