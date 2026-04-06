<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Helpdesk\StoreTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\HelpdeskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * HelpdeskController — نظام الدعم الفني
 */
class HelpdeskController extends BaseController
{
    public function __construct(private HelpdeskService $helpdeskService) {}

    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::with('customer', 'assignedTo')
            ->where('company_id', $this->companyId())
            ->when($request->status,   fn($q) => $q->where('status', $request->status))
            ->when($request->priority, fn($q) => $q->where('priority', $request->priority))
            ->when($request->search,   fn($q) => $q->where('subject', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(TicketResource::collection($tickets)->response()->getData(true));
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $ticket = $this->helpdeskService->createTicket($request->validated(), $this->companyId());
        return $this->created(new TicketResource($ticket));
    }

    public function show(Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);
        return $this->success(new TicketResource($ticket->load('customer', 'assignedTo', 'messages.user')));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'status'      => 'sometimes|in:open,in_progress,resolved,closed',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'category'    => 'nullable|string|max:100',
        ]);

        if (isset($data['assigned_to']) && $data['assigned_to'] !== $ticket->assigned_to) {
            $this->helpdeskService->assignTicket($ticket, $data['assigned_to']);
        } else {
            $ticket->update($data);
        }

        return $this->success(new TicketResource($ticket->fresh('customer', 'assignedTo')), 'تم تحديث التذكرة.');
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $this->authorize('delete', $ticket);
        $ticket->messages()->delete();
        $ticket->delete();
        return $this->success(null, 'تم حذف التذكرة.');
    }

    /** POST /api/helpdesk/{ticket}/reply */
    public function reply(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'message'     => 'required|string|max:5000',
            'is_internal' => 'nullable|boolean',
        ]);

        $message = $this->helpdeskService->addMessage(
            $ticket,
            $data['message'],
            $data['is_internal'] ?? false
        );

        return $this->created($message, 'تم إضافة الرد.');
    }

    /** POST /api/helpdesk/{ticket}/resolve */
    public function resolve(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);
        $ticket = $this->helpdeskService->resolveTicket($ticket, $request->resolution);
        return $this->success(new TicketResource($ticket), 'تم إغلاق التذكرة.');
    }

    /** GET /api/helpdesk/stats */
    public function stats(): JsonResponse
    {
        return $this->success($this->helpdeskService->getStats($this->companyId()));
    }
}
