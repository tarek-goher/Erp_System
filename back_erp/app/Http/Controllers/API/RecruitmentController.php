<?php
namespace App\Http\Controllers\API;
use App\Models\Recruitment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class RecruitmentController extends BaseController
{
    public function index(): JsonResponse { return $this->success(Recruitment::paginate($this->perPage())); }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['title'=>'required|string','department'=>'nullable|string','requirements'=>'nullable|string','salary_range_min'=>'nullable|numeric','salary_range_max'=>'nullable|numeric','open_date'=>'nullable|date','close_date'=>'nullable|date']);
        return $this->created(Recruitment::create(['company_id'=>$this->companyId(),'status'=>'open',...$data]));
    }
    public function show(Recruitment $recruitment): JsonResponse { return $this->success($recruitment); }
    public function update(Request $request, Recruitment $recruitment): JsonResponse { $recruitment->update($request->only('title','department','status','close_date')); return $this->success($recruitment,'Updated'); }
    public function destroy(Recruitment $recruitment): JsonResponse { $recruitment->delete(); return $this->success(null,'Deleted'); }
}
