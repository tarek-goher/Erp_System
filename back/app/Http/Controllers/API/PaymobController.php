<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
class PaymobController extends BaseController
{
    private string $apiKey;
    public function __construct() { $this->apiKey = config('services.paymob.api_key',''); }
    public function paymobAuthToken(): JsonResponse
    {
        if (empty($this->apiKey)) return $this->error('Paymob API key not configured',503);
        $res = Http::post('https://accept.paymob.com/api/auth/tokens',['api_key'=>$this->apiKey]);
        return $this->success($res->json());
    }
    public function paymobCreateOrder(Request $request): JsonResponse
    {
        $data = $request->validate(['auth_token'=>'required|string','amount_cents'=>'required|integer','currency'=>'nullable|string']);
        $res = Http::post('https://accept.paymob.com/api/ecommerce/orders',['auth_token'=>$data['auth_token'],'delivery_needed'=>false,'amount_cents'=>$data['amount_cents'],'currency'=>$data['currency']??'EGP']);
        return $this->success($res->json());
    }
    public function paymobPaymentKey(Request $request): JsonResponse
    {
        $data = $request->validate(['auth_token'=>'required','order_id'=>'required','amount_cents'=>'required|integer']);
        $res = Http::post('https://accept.paymob.com/api/acceptance/payment_keys',array_merge($data,['expiration'=>3600,'billing_data'=>['email'=>auth()->user()->email,'first_name'=>auth()->user()->name,'last_name'=>'','phone_number'=>auth()->user()->phone??'N/A','apartment'=>'N/A','floor'=>'N/A','street'=>'N/A','building'=>'N/A','city'=>'N/A','country'=>'EG','state'=>'N/A','postal_code'=>'N/A']]));
        return $this->success($res->json());
    }
    public function transactions(): JsonResponse { return $this->success([]); }
}
