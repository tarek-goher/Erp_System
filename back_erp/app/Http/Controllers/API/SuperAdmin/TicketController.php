<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** SuperAdmin\TicketController — تذاكر الدعم من منظور السوبر أدمن */
class TicketController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tickets = SupportTicket::with('company')
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate($this->perPage());
        return $this->success($tickets);
    }

    public function show(SupportTicket $ticket): JsonResponse
    {
        return $this->success($ticket->load('company', 'messages'));
    }

    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validate([
            'status'   => 'sometimes|in:open,in_progress,resolved,closed',
            'priority' => 'sometimes|in:low,medium,high,urgent',
        ]);
        $ticket->update($data);
        return $this->success($ticket, 'Ticket updated');
    }

    /** PATCH /api/super-admin/tickets/{ticket}/status */
    public function updateStatus(Request $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validate(['status' => 'required|in:open,in_progress,resolved,closed']);
        $ticket->update(['status' => $data['status']]);
        return $this->success($ticket, 'Status updated');
    }

    /** POST /api/super-admin/tickets/{ticket}/reply */
    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $data = $request->validate([
            'reply'  => 'required|string',
            'status' => 'nullable|string|in:open,in_progress,resolved,closed',
        ]);

        // تحديث الرد المباشر في موديل SupportTicket أو إضافة رسالة
        $ticket->update([
            'admin_reply' => $data['reply'],
            'status'      => $data['status'] ?? $ticket->status,
        ]);

        // إضافة رسالة لو فيه جدول رسائل (TicketMessage)
        if (class_exists(\App\Models\TicketMessage::class)) {
            $ticket->messages()->create([
                'message'    => $data['reply'],
                'user_id'    => auth()->id(),
                'company_id' => $ticket->company_id,
            ]);
        }

        return $this->success($ticket, 'Reply sent');
    }

    public function destroy(SupportTicket $ticket): JsonResponse
    {
        $ticket->delete();
        return $this->success(null, 'Ticket deleted');
    }
}
