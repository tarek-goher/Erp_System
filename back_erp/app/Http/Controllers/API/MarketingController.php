<?php
namespace App\Http\Controllers\API;
use App\Models\MarketingCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class MarketingController extends BaseController
{
    public function campaigns(Request $request): JsonResponse { return $this->success(MarketingCampaign::with('contactList')->paginate($this->perPage())); }
    public function storeCampaign(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','type'=>'required|in:email,sms,whatsapp','subject'=>'nullable|string','content'=>'required|string','contact_list_id'=>'nullable|exists:marketing_contact_lists,id','scheduled_at'=>'nullable|date']);
        return $this->created(MarketingCampaign::create(['company_id'=>$this->companyId(),'status'=>'draft',...$data]));
    }
    public function updateCampaign(Request $request, MarketingCampaign $campaign): JsonResponse { $campaign->update($request->only('name','subject','content','status','scheduled_at')); return $this->success($campaign,'Updated'); }
    public function destroyCampaign(MarketingCampaign $campaign): JsonResponse { $campaign->delete(); return $this->success(null,'Deleted'); }
    public function send(MarketingCampaign $campaign): JsonResponse
    {
        $campaign->update(['status'=>'sent','sent_at'=>now()]);
        return $this->success($campaign,'Campaign sent');
    }
    public function stats(): JsonResponse
    {
        return $this->success(['total'=>MarketingCampaign::count(),'sent'=>MarketingCampaign::where('status','sent')->count(),'draft'=>MarketingCampaign::where('status','draft')->count(),'total_sent'=>MarketingCampaign::sum('sent_count')]);
    }
}
