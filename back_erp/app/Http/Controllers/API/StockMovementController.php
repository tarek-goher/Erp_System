<?php
namespace App\Http\Controllers\API;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class StockMovementController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::with('product','warehouse','user')
            ->when($request->product_id, fn($q)=>$q->where('product_id',$request->product_id))
            ->when($request->warehouse_id, fn($q)=>$q->where('warehouse_id',$request->warehouse_id))
            ->when($request->type, fn($q)=>$q->where('type',$request->type))
            ->latest()->paginate($this->perPage());
        return $this->success($movements);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['product_id'=>'required|exists:products,id','warehouse_id'=>'nullable|exists:warehouses,id','type'=>'required|in:in,out,adjustment,transfer_in,transfer_out','qty'=>'required|numeric','notes'=>'nullable|string']);
        $movement = StockMovement::create(['company_id'=>$this->companyId(),'user_id'=>auth()->id(),...$data]);
        $delta = in_array($data['type'],['in','transfer_in']) ? $data['qty'] : -$data['qty'];
        \App\Models\Product::find($data['product_id'])?->increment('qty',$delta);
        return $this->created($movement->load('product','warehouse'));
    }
}
