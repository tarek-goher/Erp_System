<?php

namespace App\Http\Controllers\API\Portal;

use App\Http\Controllers\API\BaseController;
use App\Models\Portal\PortalInvoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PortalPaymentController extends BaseController
{
    public function store(Request $request): JsonResponse
    {
        try {
            $v = $request->validate([
                'invoice_id'     => 'required|integer',
                'payment_method' => 'required|in:card,paymob,cash',
                'amount'         => 'required|numeric|min:1',
            ]);

            $user    = $request->user();
            $invoice = PortalInvoice::where('portal_user_id', $user->id)
                ->where('company_id', $user->company_id)
                ->findOrFail($v['invoice_id']);

            if ($invoice->status === 'paid') {
                return $this->sendError('Invoice already paid', [], 422);
            }

            $result = match ($v['payment_method']) {
                'paymob' => $this->initiatePaymob($invoice, $v['amount'], $user),
                default  => ['status' => 'pending', 'message' => 'Payment recorded'],
            };

            return $this->sendResponse($result, 'Payment initiated');
        } catch (\Exception $e) {
            Log::error('PortalPayment failed', ['error' => $e->getMessage()]);
            return $this->sendError($e->getMessage());
        }
    }

    private function initiatePaymob(PortalInvoice $invoice, float $amount, $user): array
    {
        $apiKey = config('services.paymob.api_key');

        // Step 1: Auth
        $authRes = Http::post('https://accept.paymob.com/api/auth/tokens', ['api_key' => $apiKey]);
        if ($authRes->failed()) throw new \Exception('Paymob auth failed');
        $token = $authRes->json('token');

        // Step 2: Order
        $orderRes = Http::withToken($token)->post('https://accept.paymob.com/api/ecommerce/orders', [
            'amount_cents'    => (int)($amount * 100),
            'currency'        => 'EGP',
            'merchant_order_id' => 'INV-' . $invoice->id . '-' . time(),
        ]);
        if ($orderRes->failed()) throw new \Exception('Paymob order creation failed');
        $orderId = $orderRes->json('id');

        // Step 3: Payment key
        $keyRes = Http::withToken($token)->post('https://accept.paymob.com/api/acceptance/payment_keys', [
            'amount_cents'    => (int)($amount * 100),
            'expiration'      => 3600,
            'order_id'        => $orderId,
            'currency'        => 'EGP',
            'integration_id'  => config('services.paymob.integration_id'),
            'billing_data'    => [
                'first_name' => $user->first_name,
                'last_name'  => $user->last_name,
                'email'      => $user->email,
                'phone_number' => $user->phone ?? 'N/A',
                'apartment'  => 'NA', 'floor' => 'NA', 'street' => 'NA',
                'building'   => 'NA', 'shipping_method' => 'NA',
                'postal_code'=> 'NA', 'city' => 'NA', 'country' => 'EG', 'state' => 'NA',
            ],
        ]);
        if ($keyRes->failed()) throw new \Exception('Paymob payment key failed');

        return [
            'payment_key'  => $keyRes->json('token'),
            'iframe_url'   => 'https://accept.paymob.com/api/acceptance/iframes/' . config('services.paymob.iframe_id') . '?payment_token=' . $keyRes->json('token'),
            'order_id'     => $orderId,
        ];
    }
}
