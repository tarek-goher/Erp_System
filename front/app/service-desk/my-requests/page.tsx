'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  service_id: number;
  service?: { name: string };
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to?: { name: string };
}

const statusConfig = {
  open: { label: 'جديد', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
  assigned: { label: 'معين', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
  in_progress: { label: 'قيد المراجعة', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  waiting_user: { label: 'بانتظار الرد', color: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
  resolved: { label: 'محل', color: 'bg-green-500/20 text-green-300 border-green-500/50' },
  closed: { label: 'مغلق', color: 'bg-gray-500/20 text-gray-300 border-gray-500/50' },
};

const priorityConfig = {
  low: { label: 'منخفض', icon: '🟢' },
  medium: { label: 'متوسط', icon: '🟡' },
  high: { label: 'عالي', icon: '🟠' },
  urgent: { label: 'عاجل', icon: '🔴' },
};

export default function MyRequests() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/my-requests', window.location.origin);
      if (filter) {
        url.searchParams.append('status', filter);
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(Array.isArray(data.data) ? data.data : data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                طلباتي
              </h1>
              <p className="text-slate-400 mt-1">كل الطلبات اللي بعتتها</p>
            </div>
            <Link
              href="/employee/catalog"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2"
            >
              ➕ طلب جديد
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              filter === null
                ? 'bg-cyan-500/20 border-cyan-500 border text-cyan-300'
                : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
            }`}
          >
            الكل
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg transition-all font-medium ${
                filter === key
                  ? `${config.color} border`
                  : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-slate-700/30 rounded-lg h-20 animate-pulse border border-slate-600"
              />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open;
              const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;

              return (
                <Link
                  key={ticket.id}
                  href={`/employee/my-requests/${ticket.id}`}
                  className="group"
                >
                  <div className="bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600 hover:border-slate-500 rounded-lg p-5 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-slate-400 text-sm font-mono">#{ticket.ticket_number || ticket.id}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {ticket.service?.name && `📁 ${ticket.service.name}`}
                          {ticket.assigned_to && ` • معين ل: ${ticket.assigned_to.name}`}
                        </p>
                      </div>

                      {/* Right Side */}
                      <div className="flex items-center gap-4 text-right">
                        <div className="text-sm text-slate-400 whitespace-nowrap">
                          <div className="font-medium text-white">
                            {priority.icon} {priority.label}
                          </div>
                          <div className="text-xs mt-1">
                            {formatRelativeTime(ticket.updated_at)}
                          </div>
                        </div>
                        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-400 text-lg">لم تقم بإرسال أي طلبات بعد</p>
            <Link
              href="/employee/catalog"
              className="mt-6 inline-block px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              ابدأ الآن
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { locale: ar, addSuffix: true });
  } catch {
    return 'للتو';
  }
}