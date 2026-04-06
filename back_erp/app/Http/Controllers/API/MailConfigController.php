<?php
namespace App\Http\Controllers\API;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class MailConfigController extends BaseController
{
    public function show(): JsonResponse
    {
        return $this->success(['driver'=>config('mail.default'),'host'=>config('mail.mailers.smtp.host'),'port'=>config('mail.mailers.smtp.port'),'from_address'=>config('mail.from.address')]);
    }
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate(['host'=>'required|string','port'=>'required|integer','username'=>'nullable|string','password'=>'nullable|string','from_address'=>'required|email','from_name'=>'nullable|string','encryption'=>'nullable|in:tls,ssl,null']);
        // Save to company settings
        auth()->user()->company?->update(['settings'=>array_merge(auth()->user()->company->settings??[],$data)]);
        return $this->success($data,'Mail config updated');
    }
    public function test(Request $request): JsonResponse
    {
        $request->validate(['to'=>'required|email']);
        try {
            \Mail::raw('Test email from CodeSphere ERP',fn($m)=>$m->to($request->to)->subject('Test Email'));
            return $this->success(null,'Test email sent');
        } catch (\Exception $e) {
            return $this->error('Failed: '.$e->getMessage());
        }
    }
}
