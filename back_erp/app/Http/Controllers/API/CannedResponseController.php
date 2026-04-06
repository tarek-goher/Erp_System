<?php
namespace App\Http\Controllers\API;
use App\Models\CannedResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class CannedResponseController extends BaseController
{
    public function index(): JsonResponse { return $this->success(CannedResponse::all()); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['title'=>'required|string','content'=>'required|string','tags'=>'nullable|array']);
        return $this->created(CannedResponse::create(['company_id'=>$this->companyId(),...$data]));
    }
    public function show(CannedResponse $cannedResponse): JsonResponse { return $this->success($cannedResponse); }
    public function update(Request $request, CannedResponse $cannedResponse): JsonResponse { $cannedResponse->update($request->only('title','content','tags')); return $this->success($cannedResponse,'Updated'); }
    public function destroy(CannedResponse $cannedResponse): JsonResponse { $cannedResponse->delete(); return $this->success(null,'Deleted'); }
}
