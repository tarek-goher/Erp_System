<?php
namespace App\Http\Controllers\API;
use App\Models\ErpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class NotificationController extends BaseController
{
    public function index(): JsonResponse
    {
        $notifications = ErpNotification::where('user_id',auth()->id())->latest()->paginate($this->perPage());
        return $this->success($notifications);
    }
    public function markRead(ErpNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id===auth()->id(),403);
        $notification->update(['read_at'=>now()]);
        return $this->success($notification,'Marked as read');
    }
    public function markAllRead(): JsonResponse
    {
        ErpNotification::where('user_id',auth()->id())->whereNull('read_at')->update(['read_at'=>now()]);
        return $this->success(null,'All marked as read');
    }
    public function destroy(ErpNotification $notification): JsonResponse
    {
        abort_unless($notification->user_id===auth()->id(),403);
        $notification->delete(); return $this->success(null,'Deleted');
    }
    public function unreadCount(): JsonResponse
    {
        $count = ErpNotification::where('user_id',auth()->id())->whereNull('read_at')->count();
        return $this->success(['count'=>$count]);
    }
    public function broadcast(Request $request): JsonResponse
    {
        $data = $request->validate(['title'=>'required|string','message'=>'required|string','type'=>'nullable|string']);
        // TODO: send to all company users
        return $this->success(null,'Broadcast sent');
    }
}
