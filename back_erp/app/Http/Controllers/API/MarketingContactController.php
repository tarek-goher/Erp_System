<?php
namespace App\Http\Controllers\API;
use App\Models\MarketingContactList;
use App\Models\MarketingContact;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class MarketingContactController extends BaseController
{
    public function allContacts(): JsonResponse { return $this->success(MarketingContact::paginate($this->perPage())); }
    public function lists(): JsonResponse { return $this->success(MarketingContactList::withCount('contacts')->paginate($this->perPage())); }
    public function storeList(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','description'=>'nullable|string']);
        return $this->created(MarketingContactList::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function destroyList(MarketingContactList $marketingContactList): JsonResponse { $marketingContactList->delete(); return $this->success(null,'Deleted'); }
    public function contacts(MarketingContactList $marketingContactList): JsonResponse { return $this->success($marketingContactList->contacts); }
    public function storeContact(Request $request, MarketingContactList $marketingContactList): JsonResponse
    {
        $data = $request->validate(['name'=>'nullable|string','email'=>'nullable|email','phone'=>'nullable|string']);
        return $this->created($marketingContactList->contacts()->create($data));
    }
    public function updateContact(Request $request, MarketingContact $marketingContact): JsonResponse { $marketingContact->update($request->only('name','email','phone','is_subscribed')); return $this->success($marketingContact,'Updated'); }
    public function destroyContact(MarketingContact $marketingContact): JsonResponse { $marketingContact->delete(); return $this->success(null,'Deleted'); }
}
