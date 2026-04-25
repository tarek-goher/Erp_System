<?php
namespace App\Http\Controllers\API;
use App\Models\CannedResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CannedResponseController extends BaseController
{
    public function index(): JsonResponse { 
        return $this->success(CannedResponse::where(fn($q) => $q
            ->whereNull('company_id')
            ->orWhere('company_id', $this->companyId())
        )->get()); 
    }
    
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'required|string',
            'tags'    => 'nullable|array'
        ]);
        
        return $this->created(CannedResponse::create([
            'company_id' => $this->companyId(),
            'title'      => $data['title'],
            'content'    => $data['content'],
            'tags'       => $data['tags'] ?? [],
        ]), 'تم إنشاء الرد الجاهز');
    }
    
    public function show(CannedResponse $cannedResponse): JsonResponse { 
        return $this->success($cannedResponse); 
    }
    
    public function update(Request $request, CannedResponse $cannedResponse): JsonResponse { 
        $data = $request->validate([
            'title'   => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'tags'    => 'nullable|array'
        ]);
        $cannedResponse->update($data); 
        return $this->success($cannedResponse, 'تم التحديث'); 
    }
    
    public function destroy(CannedResponse $cannedResponse): JsonResponse { 
        $cannedResponse->delete(); 
        return $this->success(null, 'تم الحذف'); 
    }
}