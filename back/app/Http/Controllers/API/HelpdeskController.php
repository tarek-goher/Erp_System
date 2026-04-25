<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\Helpdesk\StoreTicketRequest;
use App\Http\Resources\TicketResource;
use App\Models\Ticket;
use App\Services\HelpdeskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * HelpdeskController — MERGED
 * دمج ERP القديم (StoreTicketRequest + TicketResource + close) مع الجديد (changeStatus + assign + tags + filters)
 */
class HelpdeskController extends BaseController
{
    public function __construct(private HelpdeskService $helpdeskService) {}

    // GET /api/helpdesk
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::with(['customer', 'assignedTo', 'tags', 'service'])
            ->where('company_id', $this->companyId())
            ->when($request->status,      fn($q) => $q->where('status', $request->status))
            ->when($request->priority,    fn($q) => $q->where('priority', $request->priority))
            ->when($request->assigned_to, fn($q) => $q->where('assigned_to', $request->assigned_to))
            ->when($request->service_id,  fn($q) => $q->where('service_id', $request->service_id))
            ->when($request->overdue,     fn($q) => $q->overdue())
            ->when($request->search,      fn($q) => $q->where(function ($q2) use ($request) {
                $q2->where('subject', 'like', "%{$request->search}%")
                   ->orWhere('ticket_number', 'like', "%{$request->search}%");
            }))
            ->latest()
            ->paginate($this->perPage());

        return $this->success(TicketResource::collection($tickets)->response()->getData(true));
    }

    // POST /api/helpdesk
    // ⚠️ لا تزال تقبل StoreTicketRequest القديمة + الحقول الجديدة
    public function store(StoreTicketRequest $request): JsonResponse
    {
        $extra = $request->only(['service_id', 'form_data', 'requester_id']);
        $ticket = $this->helpdeskService->createTicket(
            array_merge($request->validated(), $extra),
            $this->companyId()
        );
        return $this->created(new TicketResource($ticket), 'تم إنشاء التذكرة.');
    }

    // GET /api/helpdesk/{ticket}
    public function show(Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        return $this->success(new TicketResource(
            $ticket->load([
                'customer',
                'assignedTo',
                'requester',
                'service',
                'messages.user',
                'attachments.uploadedBy',
                'tags',
                'logs.doneBy',
                'slaPolicy',
            ])
        ));
    }

    // PUT /api/helpdesk/{ticket}
    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'subject'     => 'sometimes|string|max:255',
            'priority'    => 'sometimes|in:low,medium,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'category'    => 'nullable|string|max:100',
        ]);

        if (array_key_exists('assigned_to', $data) && $data['assigned_to'] !== $ticket->assigned_to) {
            $this->helpdeskService->assignTicket($ticket, $data['assigned_to']);
            unset($data['assigned_to']);
        }

        if (!empty($data)) {
            $ticket->update($data);
        }

        return $this->success(new TicketResource($ticket->fresh(['customer', 'assignedTo'])), 'تم تحديث التذكرة.');
    }

    // DELETE /api/helpdesk/{ticket}
    public function destroy(Ticket $ticket): JsonResponse
    {
        $this->authorize('delete', $ticket);
        $ticket->messages()->delete();
        $ticket->attachments()->delete();
        $ticket->logs()->delete();
        $ticket->tags()->detach();
        $ticket->delete();
        return $this->success(null, 'تم حذف التذكرة.');
    }

    // POST /api/helpdesk/{ticket}/reply
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

    // PATCH /api/helpdesk/{ticket}/status  ← جديد
    public function changeStatus(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'status' => 'required|in:open,assigned,in_progress,waiting_user,resolved,closed',
            'notes'  => 'nullable|string|max:1000',
        ]);

        try {
            $ticket = $this->helpdeskService->changeStatus(
                $ticket,
                $data['status'],
                $data['notes'] ?? null
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(new TicketResource($ticket), 'تم تغيير حالة التذكرة.');
    }

    // POST /api/helpdesk/{ticket}/assign  ← جديد
    public function assign(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $ticket = $this->helpdeskService->assignTicket($ticket, $data['user_id']);
        return $this->success(new TicketResource($ticket), 'تم تعيين التذكرة.');
    }

    // POST /api/helpdesk/{ticket}/resolve
    // ← موجودة في ERP القديم، اتبقت كما هي
    public function resolve(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);
        $ticket = $this->helpdeskService->resolveTicket($ticket, $request->resolution);
        return $this->success(new TicketResource($ticket), 'تم إغلاق التذكرة.');
    }

    // POST /api/helpdesk/{ticket}/close
    // ← موجودة في ERP القديم، بتعمل نفس resolveTicket بس بـ status=closed
    public function close(Ticket $ticket): JsonResponse
    {
        $this->authorize('update', $ticket);

        try {
            $ticket = $this->helpdeskService->changeStatus($ticket, 'closed');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(new TicketResource($ticket), 'تم إغلاق التذكرة.');
    }

    // POST /api/helpdesk/{ticket}/tags/{tagId}  ← جديد
    public function addTag(Ticket $ticket, int $tagId): JsonResponse
    {
        $this->authorize('update', $ticket);
        $this->helpdeskService->addTag($ticket, $tagId);
        return $this->success(null, 'تم إضافة الوسم.');
    }

    // DELETE /api/helpdesk/{ticket}/tags/{tagId}  ← جديد
    public function removeTag(Ticket $ticket, int $tagId): JsonResponse
    {
        $this->authorize('update', $ticket);
        $this->helpdeskService->removeTag($ticket, $tagId);
        return $this->success(null, 'تم إزالة الوسم.');
    }

    // GET /api/helpdesk/stats
    public function stats(): JsonResponse
    {
        return $this->success($this->helpdeskService->getStats($this->companyId()));
    }
}
