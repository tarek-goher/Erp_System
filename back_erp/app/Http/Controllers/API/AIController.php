<?php
namespace App\Http\Controllers\API;
use App\Models\Sale;
use App\Models\CrmLead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AIController extends BaseController
{
    /** GET /api/ai/sales-forecast — توقع المبيعات (تحليل بسيط) */
    public function salesForecast(): JsonResponse
    {
        $monthly = Sale::selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, SUM(total) as total')
            ->groupBy('year','month')->orderBy('year')->orderBy('month')->get();
        $avg = $monthly->avg('total');
        return $this->success(['historical'=>$monthly,'forecast_next_month'=>round($avg*1.05,2),'trend'=>'upward']);
    }
    /** GET /api/ai/demand-planning */
    public function demandPlanning(): JsonResponse
    {
        $topProducts = \App\Models\SaleItem::selectRaw('product_id, SUM(qty) as total_qty')
            ->groupBy('product_id')->orderByDesc('total_qty')->limit(10)->with('product:id,name,qty,min_qty')->get();
        return $this->success($topProducts);
    }
    /** GET /api/ai/churn-prediction */
    public function churnPrediction(): JsonResponse
    {
        $inactive = \App\Models\Customer::whereDoesntHave('sales',fn($q)=>$q->whereDate('created_at','>',now()->subMonths(3)))->count();
        return $this->success(['at_risk_customers'=>$inactive,'recommendation'=>'Run a win-back campaign for inactive customers']);
    }
    /** GET /api/ai/lead-scoring */
    public function leadScoring(): JsonResponse
    {
        $leads = CrmLead::withCount('activities')->orderByDesc('activities_count')->limit(10)->get();
        return $this->success($leads);
    }
}
