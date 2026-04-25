<?php

namespace App\Http\Controllers\API;

use App\Mail\TicketMailer;
use App\Models\CsatRating;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * CsatController
 *
 * CSAT (Customer Satisfaction) — تقييم رضا العميل
 *
 * Routes:
 *   POST  /api/helpdesk/{ticket}/csat/send       (إرسال رابط التقييم للعميل)
 *   POST  /api/csat/{token}                      (تقديم التقييم — بدون auth)
 *   GET   /api/helpdesk/csat/summary             (ملخص للـ dashboard)
 *   GET   /api/helpdesk/csat/responses           (كل الردود — للـ manager)
 */
class CsatController extends BaseController
{
    // ── POST /api/helpdesk/{ticket}/csat/send ────────────────────
    // يرسل رابط التقييم للعميل بعد حل التذكرة
    public function send(Request $request, Ticket $ticket): JsonResponse
    {
        // التذكرة لازم تكون محلولة أو مغلقة
        if (!in_array($ticket->status, ['resolved', 'closed'])) {
            return $this->error('لا يمكن إرسال تقييم إلا بعد حل التذكرة.', 422);
        }

        // لو موجود تقييم بالفعل — تجاهل
        $existing = CsatRating::where('ticket_id', $ticket->id)->first();
        if ($existing && $existing->isRated()) {
            return $this->error('العميل قيّم التذكرة بالفعل.', 422);
        }

        // إنشاء أو تحديث الـ token
        $token = $existing
            ? $existing->token
            : Str::random(64);

        CsatRating::updateOrCreate(
            ['ticket_id' => $ticket->id],
            [
                'company_id' => $ticket->company_id,
                'token'      => $token,
                'rating'     => 0,    // 0 = لم يُقيَّم
                'rated_at'   => null,
            ]
        );

        // إرسال الإيميل
        $email = $ticket->customer?->email ?? $ticket->requester?->email;
        if ($email) {
            $csatUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/csat/' . $token;

            try {
                // نبعت إيميل عادي مع رابط التقييم
                Mail::to($email)->queue(
                    new TicketMailer($ticket, 'ticket_resolved', $csatUrl)
                );
            } catch (\Throwable $e) {
                // مش نكسر الـ flow
            }
        }

        return $this->success(['token' => $token], 'تم إرسال طلب التقييم.');
    }

    // ── POST /api/csat/{token} ───────────────────────────────────
    // Public route — العميل يقدّم تقييمه (بدون تسجيل دخول)
    public function submit(Request $request, string $token): JsonResponse
    {
        $csat = CsatRating::where('token', $token)->firstOrFail();

        if ($csat->isRated()) {
            return $this->error('تم تسجيل تقييمك مسبقاً، شكراً لك.', 422);
        }

        $data = $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        DB::transaction(function () use ($csat, $data) {
            $csat->update([
                'rating'   => $data['rating'],
                'comment'  => $data['comment'] ?? null,
                'rated_at' => now(),
            ]);

            // تحديث csat_rating على الـ ticket نفسه (للـ analytics queries)
            Ticket::where('id', $csat->ticket_id)
                  ->update(['csat_rating' => $data['rating']]);
        });

        return $this->success(null, 'شكراً على تقييمك! رأيك يساعدنا على التحسين.');
    }

    // ── GET /api/helpdesk/csat/summary ───────────────────────────
    // ملخص CSAT للـ dashboard: متوسط التقييم، التوزيع، معدل الاستجابة
    public function summary(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);
        $from      = now()->subDays($days);

        $base = CsatRating::where('company_id', $companyId)
                           ->whereNotNull('rated_at')
                           ->where('rated_at', '>=', $from);

        $total  = (clone $base)->count();
        $avgRaw = (clone $base)->avg('rating');

        // توزيع كل تقييم (1–5)
        $distribution = (clone $base)
            ->select('rating', DB::raw('count(*) as count'))
            ->groupBy('rating')
            ->orderBy('rating')
            ->pluck('count', 'rating');

        // معدل التقييم الإيجابي (4 و5)
        $positive     = (clone $base)->whereIn('rating', [4, 5])->count();
        $positiveRate = $total > 0 ? round(($positive / $total) * 100, 1) : null;

        // عدد المرسَلة (token موجود) مقابل المُستجاب لها
        $sent = CsatRating::where('company_id', $companyId)
                           ->where('created_at', '>=', $from)
                           ->count();

        $responseRate = $sent > 0 ? round(($total / $sent) * 100, 1) : null;

        return $this->success([
            'period_days'    => $days,
            'total_ratings'  => $total,
            'avg_rating'     => $avgRaw ? round($avgRaw, 2) : null,
            'positive_rate'  => $positiveRate,
            'response_rate'  => $responseRate,
            'distribution'   => $distribution,
        ]);
    }

    // ── GET /api/helpdesk/csat/responses ─────────────────────────
    // كل التقييمات مع تعليقات العملاء — للـ manager
    public function responses(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);

        $responses = CsatRating::where('company_id', $companyId)
            ->whereNotNull('rated_at')
            ->where('rated_at', '>=', now()->subDays($days))
            ->with(['ticket:id,ticket_number,subject,assigned_to', 'ticket.assignedTo:id,name'])
            ->select('id', 'ticket_id', 'rating', 'comment', 'rated_at')
            ->latest('rated_at')
            ->paginate($this->perPage());

        return $this->success($responses);
    }
}
