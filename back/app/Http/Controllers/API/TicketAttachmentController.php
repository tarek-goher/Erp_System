<?php

namespace App\Http\Controllers\API;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TicketAttachmentController extends BaseController
{
    // GET /api/helpdesk/{ticket}/attachments
    public function index(Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        $attachments = $ticket->attachments()->with('uploadedBy')->latest()->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'file_name'     => $a->file_name,
                'file_size'     => $a->file_size,
                'file_size_human' => $a->file_size_human,
                'mime_type'     => $a->mime_type,
                'is_image'      => $a->is_image,
                'url'           => $a->url,
                'uploaded_by'   => optional($a->uploadedBy)->name,
                'created_at'    => $a->created_at,
            ]);

        return $this->success($attachments);
    }

    // POST /api/helpdesk/{ticket}/attachments
    public function store(Request $request, Ticket $ticket): JsonResponse
    {
        $this->authorize('view', $ticket);

        $request->validate([
            'file'  => 'required|file|max:10240', // 10MB max
        ]);

        $file     = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $path     = $file->store("tickets/{$ticket->id}", 'public');

        $attachment = TicketAttachment::create([
            'ticket_id'   => $ticket->id,
            'uploaded_by' => auth()->id(),
            'file_name'   => $fileName,
            'file_path'   => $path,
            'mime_type'   => $file->getMimeType(),
            'file_size'   => $file->getSize(),
        ]);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'attachment_added',
            'new_value' => $fileName,
        ]);

        return $this->created([
            'id'              => $attachment->id,
            'file_name'       => $attachment->file_name,
            'file_size_human' => $attachment->file_size_human,
            'url'             => $attachment->url,
            'mime_type'       => $attachment->mime_type,
            'is_image'        => $attachment->is_image,
        ], 'تم رفع الملف.');
    }

    // DELETE /api/helpdesk/{ticket}/attachments/{attachment}
    public function destroy(Ticket $ticket, TicketAttachment $attachment): JsonResponse
    {
        $this->authorize('update', $ticket);

        if ($attachment->ticket_id !== $ticket->id) {
            return $this->notFound('الملف غير موجود في هذه التذكرة.');
        }

        $fileName = $attachment->file_name;
        Storage::disk('public')->delete($attachment->file_path);

        TicketLog::create([
            'ticket_id' => $ticket->id,
            'done_by'   => auth()->id(),
            'action'    => 'attachment_deleted',
            'old_value' => $fileName,
        ]);

        $attachment->delete();

        return $this->success(null, 'تم حذف الملف.');
    }
}