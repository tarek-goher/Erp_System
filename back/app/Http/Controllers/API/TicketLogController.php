<?php

namespace App\Http\Controllers\API;

use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class TicketLogController extends BaseController
{
    // GET /api/helpdesk/{ticket}/logs
    public function index(Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        $logs = $ticket->logs()
            ->with('doneBy:id,name,email')
            ->latest()
            ->get()
            ->map(fn($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'old_value'   => $log->old_value,
                'new_value'   => $log->new_value,
                'notes'       => $log->notes,
                'done_by'     => optional($log->doneBy)->name,
                'created_at'  => $log->created_at,
            ]);

        return $this->success($logs);
    }
}