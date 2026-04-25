<?php

namespace App\Http\Controllers\API;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * HelpdeskAnalyticsController
 *
 * Analytics Dashboard للـ Helpdesk — تقارير أداء الفريق + SLA Compliance
 * Routes: GET /api/helpdesk/analytics/*
 */
class HelpdeskAnalyticsController extends BaseController
{
    // ── GET /api/helpdesk/analytics/overview ────────────────────
    // ملخص عام: إجمالي التذاكر، معدل الحل، SLA Compliance، متوسط وقت الرد
    public function overview(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);
        $from      = now()->subDays($days);

        $base  = Ticket::where('company_id', $companyId);
        $range = Ticket::where('company_id', $companyId)->where('created_at', '>=', $from);

        // إجمالي التذاكر في الفترة
        $total = (clone $range)->count();

        // معدل الحل
        $resolved    = (clone $range)->whereIn('status', ['resolved', 'closed'])->count();
        $resolveRate = $total > 0 ? round(($resolved / $total) * 100, 1) : 0;

        // SLA Compliance: التذاكر المحلولة في الوقت المحدد / كل التذاكر المحلولة
        $resolvedWithSla = (clone $range)
            ->whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('resolution_due_at')
            ->count();

        $resolvedOnTime = (clone $range)
            ->whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('resolution_due_at')
            ->whereColumn('resolved_at', '<=', 'resolution_due_at')
            ->count();

        $slaCompliance = $resolvedWithSla > 0
            ? round(($resolvedOnTime / $resolvedWithSla) * 100, 1)
            : null;

        // متوسط وقت الحل (ساعات)
        $avgResolution = (clone $range)
            ->whereIn('status', ['resolved', 'closed'])
            ->whereNotNull('resolved_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours'))
            ->value('avg_hours');

        // متوسط وقت أول رد (ساعات)
        $avgFirstResponse = (clone $range)
            ->whereNotNull('first_response_at')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, first_response_at)) as avg_hours'))
            ->value('avg_hours');

        // التذاكر المتأخرة حالياً
        $overdueNow = (clone $base)->overdue()->count();

        // التوزيع حسب الأولوية
        $byPriority = (clone $range)
            ->select('priority', DB::raw('count(*) as count'))
            ->groupBy('priority')
            ->pluck('count', 'priority');

        // التوزيع حسب الحالة
        $byStatus = (clone $range)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return $this->success([
            'period_days'          => $days,
            'total_tickets'        => $total,
            'resolved_tickets'     => $resolved,
            'resolve_rate'         => $resolveRate,
            'sla_compliance'       => $slaCompliance,
            'avg_resolution_hours' => $avgResolution ? round($avgResolution, 1) : null,
            'avg_first_response_hours' => $avgFirstResponse ? round($avgFirstResponse, 1) : null,
            'overdue_now'          => $overdueNow,
            'by_priority'          => $byPriority,
            'by_status'            => $byStatus,
        ]);
    }

    // ── GET /api/helpdesk/analytics/team ────────────────────────
    // أداء كل موظف: عدد التذاكر، معدل الحل، متوسط وقت الحل، CSAT
    public function teamPerformance(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);
        $from      = now()->subDays($days);

        $agents = Ticket::where('tickets.company_id', $companyId)
            ->where('tickets.created_at', '>=', $from)
            ->whereNotNull('tickets.assigned_to')
            ->join('users', 'users.id', '=', 'tickets.assigned_to')
            ->select(
                'users.id',
                'users.name',
                DB::raw('COUNT(tickets.id) as total'),
                DB::raw('SUM(CASE WHEN tickets.status IN ("resolved","closed") THEN 1 ELSE 0 END) as resolved'),
                DB::raw('AVG(CASE WHEN tickets.status IN ("resolved","closed") AND tickets.resolved_at IS NOT NULL
                             THEN TIMESTAMPDIFF(HOUR, tickets.created_at, tickets.resolved_at)
                             ELSE NULL END) as avg_resolution_hours'),
                DB::raw('SUM(CASE WHEN tickets.sla_breached = 1 THEN 1 ELSE 0 END) as sla_breaches'),
                // CSAT: متوسط تقييم العملاء لو موجود
                DB::raw('AVG(tickets.csat_rating) as avg_csat')
            )
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) {
                return [
                    'agent_id'             => $row->id,
                    'agent_name'           => $row->name,
                    'total'                => (int) $row->total,
                    'resolved'             => (int) $row->resolved,
                    'resolve_rate'         => $row->total > 0
                        ? round(($row->resolved / $row->total) * 100, 1)
                        : 0,
                    'avg_resolution_hours' => $row->avg_resolution_hours
                        ? round($row->avg_resolution_hours, 1)
                        : null,
                    'sla_breaches'         => (int) $row->sla_breaches,
                    'avg_csat'             => $row->avg_csat
                        ? round($row->avg_csat, 2)
                        : null,
                ];
            });

        return $this->success(['agents' => $agents, 'period_days' => $days]);
    }

    // ── GET /api/helpdesk/analytics/volume ──────────────────────
    // حجم التذاكر اليومي/الأسبوعي خلال فترة — للرسم البياني
    public function volume(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);
        $from      = now()->subDays($days)->startOfDay();

        $groupBy = $days <= 30 ? 'DATE(created_at)' : 'YEARWEEK(created_at, 1)';
        $label   = $days <= 30 ? 'date' : 'week';

        $created = Ticket::where('company_id', $companyId)
            ->where('created_at', '>=', $from)
            ->select(DB::raw("$groupBy as period, COUNT(*) as created"))
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('created', 'period');

        $resolved = Ticket::where('company_id', $companyId)
            ->whereIn('status', ['resolved', 'closed'])
            ->where('resolved_at', '>=', $from)
            ->select(DB::raw("$groupBy as period, COUNT(*) as resolved"))
            ->groupBy('period')
            ->orderBy('period')
            ->pluck('resolved', 'period');

        // دمج الفترتين في array واحد
        $allPeriods = collect($created->keys())->merge($resolved->keys())->unique()->sort()->values();

        $series = $allPeriods->map(fn($period) => [
            $label    => $period,
            'created' => $created->get($period, 0),
            'resolved'=> $resolved->get($period, 0),
        ]);

        return $this->success(['series' => $series, 'period_days' => $days]);
    }

    // ── GET /api/helpdesk/analytics/sla ─────────────────────────
    // تقرير SLA مفصّل: compliance per priority + breaches trend
    public function slaReport(Request $request): JsonResponse
    {
        $companyId = $this->companyId();
        $days      = (int) $request->get('days', 30);
        $from      = now()->subDays($days);

        // Compliance per priority
        $perPriority = Ticket::where('company_id', $companyId)
            ->where('created_at', '>=', $from)
            ->whereNotNull('resolution_due_at')
            ->select(
                'priority',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status IN ("resolved","closed") AND resolved_at <= resolution_due_at THEN 1 ELSE 0 END) as on_time'),
                DB::raw('SUM(CASE WHEN sla_breached = 1 THEN 1 ELSE 0 END) as breached')
            )
            ->groupBy('priority')
            ->get()
            ->map(fn($r) => [
                'priority'   => $r->priority,
                'total'      => (int) $r->total,
                'on_time'    => (int) $r->on_time,
                'breached'   => (int) $r->breached,
                'compliance' => $r->total > 0
                    ? round(($r->on_time / $r->total) * 100, 1)
                    : null,
            ]);

        // أسوأ 10 تذاكر متأخرة حالياً
        $worstOverdue = Ticket::where('company_id', $companyId)
            ->overdue()
            ->with(['customer:id,name', 'assignedTo:id,name'])
            ->select('id', 'ticket_number', 'subject', 'priority', 'resolution_due_at', 'customer_id', 'assigned_to')
            ->orderBy('resolution_due_at')
            ->limit(10)
            ->get()
            ->map(fn($t) => [
                'id'             => $t->id,
                'ticket_number'  => $t->ticket_number,
                'subject'        => $t->subject,
                'priority'       => $t->priority,
                'overdue_hours'  => round(now()->diffInHours($t->resolution_due_at), 1),
                'customer'       => $t->customer?->name,
                'assigned_to'    => $t->assignedTo?->name,
            ]);

        return $this->success([
            'period_days'    => $days,
            'per_priority'   => $perPriority,
            'worst_overdue'  => $worstOverdue,
        ]);
    }
}
