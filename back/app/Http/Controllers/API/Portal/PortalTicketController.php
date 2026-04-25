<?php

namespace App\Http\Controllers\API\Portal;

use App\Http\Controllers\API\BaseController;
use App\Models\Portal\PortalTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalTicketController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $user    = $request->user();
            $tickets = PortalTicket::where('portal_user_id', $user->id)
                ->where('company_id', $user->company_id)
                ->orderByDesc('created_at')
                ->paginate(20);
            return $this->sendResponse($tickets, 'Tickets retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $v    = $request->validate([
                'subject'     => 'required|string|max:255',
                'description' => 'required|string',
                'priority'    => 'in:low,medium,high',
                'category'    => 'nullable|string',
            ]);
            $user   = $request->user();
            $ticket = PortalTicket::create([
                'company_id'     => $user->company_id,
                'portal_user_id' => $user->id,
                'subject'        => $v['subject'],
                'description'    => $v['description'],
                'priority'       => $v['priority'] ?? 'medium',
                'category'       => $v['category'] ?? null,
                'status'         => 'open',
            ]);
            return $this->sendResponse($ticket, 'Ticket created', 201);
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }

    public function show(Request $request, PortalTicket $ticket): JsonResponse
    {
        try {
            $user = $request->user();
            if ($ticket->portal_user_id !== $user->id) {
                return $this->sendError('Unauthorized', [], 403);
            }
            return $this->sendResponse($ticket->load('messages'), 'Ticket retrieved');
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage());
        }
    }
}
