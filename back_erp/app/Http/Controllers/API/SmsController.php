<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class SmsController extends BaseController
{
    public function send(Request $request): JsonResponse
    {
        $data = $request->validate(['to'=>'required|string','message'=>'required|string|max:160']);
        // TODO: Integrate with Twilio/Vonage based on SMS_PROVIDER env
        return $this->success(null,'SMS queued for sending');
    }
    public function balance(): JsonResponse { return $this->success(['provider'=>config('sms.provider','twilio'),'balance'=>'N/A']); }
    public function logs(): JsonResponse { return $this->success([]); }
}
