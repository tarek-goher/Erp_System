<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\API\BaseController;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** SuperAdmin\TicketController — تذاكر الدعم من منظور السوبر أدمن */
class TicketController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::with('customer', 'agent')
            ->when($request->company_id, fn($q) => $q->where('company_id', $request->company_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->latest()->paginate($this->perPage());
        return $this->success($tickets);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return $this->success($ticket->load('messages', 'customer', 'agent'));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $ticket->update($request->only('status', 'priority', 'agent_id'));
        return $this->success($ticket, 'Ticket updated');
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();
        return $this->success(null, 'Ticket deleted');
    }
}
