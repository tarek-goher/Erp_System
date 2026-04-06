<?php
namespace App\Http\Controllers\API;
use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class ProjectController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $projects = Project::with('manager','client')->when($request->status,fn($q)=>$q->where('status',$request->status))->paginate($this->perPage());
        return $this->success($projects);
    }
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name'=>'required|string','description'=>'nullable|string','client_id'=>'nullable|exists:customers,id','manager_id'=>'nullable|exists:users,id','start_date'=>'nullable|date','end_date'=>'nullable|date','budget'=>'nullable|numeric','priority'=>'nullable|in:low,medium,high,critical']);
        return $this->created(Project::create(['company_id'=>$this->companyId(),'status'=>'active',...$data]));
    }
    public function show(Project $project): JsonResponse { return $this->success($project->load('tasks','manager','client','members')); }
    public function update(Request $request, Project $project): JsonResponse { $project->update($request->only('name','status','budget','spent','end_date')); return $this->success($project,'Project updated'); }
    public function destroy(Project $project): JsonResponse { $project->delete(); return $this->success(null,'Project deleted'); }
    // ── Tasks ────────────────────────────────────────
    public function tasks(Project $project): JsonResponse { return $this->success($project->tasks()->with('assignedTo')->get()); }
    public function storeTask(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate(['title'=>'required|string','description'=>'nullable|string','assigned_to'=>'nullable|exists:users,id','status'=>'nullable|in:todo,in_progress,review,done','priority'=>'nullable|in:low,medium,high','due_date'=>'nullable|date']);
        return $this->created(ProjectTask::create(['project_id'=>$project->id,...$data]));
    }
    public function updateTask(Request $request, ProjectTask $task): JsonResponse { $task->update($request->only('status','title','assigned_to','due_date')); return $this->success($task,'Task updated'); }
    public function destroyTask(ProjectTask $task): JsonResponse { $task->delete(); return $this->success(null,'Task deleted'); }
    // ── Members ──────────────────────────────────────
    public function addMember(Request $request, Project $project): JsonResponse
    {
        $request->validate(['user_id'=>'required|exists:users,id']);
        $project->members()->syncWithoutDetaching([$request->user_id]);
        return $this->success(null,'Member added');
    }
    public function removeMember(Request $request, Project $project): JsonResponse
    {
        $request->validate(['user_id'=>'required|exists:users,id']);
        $project->members()->detach($request->user_id);
        return $this->success(null,'Member removed');
    }
    public function stats(): JsonResponse
    {
        return $this->success(['total'=>Project::count(),'active'=>Project::where('status','active')->count(),'completed'=>Project::where('status','completed')->count(),'overdue'=>Project::where('end_date','<',now())->where('status','!=','completed')->count()]);
    }
}
