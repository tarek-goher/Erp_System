'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  service?: { name: string };
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  assigned_to?: { name: string; email: string };
  attachments: Attachment[];
  messages: Message[];
  form_data?: Record<string, any>;
}

interface Attachment {
  id: number;
  file_name: string;
  file_size: number;
  file_path: string;
  uploaded_by: { name: string };
  created_at: string;
}

interface Message {
  id: number;
  message: string;
  user: { name: string; email: string };
  created_at: string;
  attachments?: Attachment[];
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
  low: { label: 'منخفض', icon: '🟢', color: 'text-green-400' },
  medium: { label: 'متوسط', icon: '🟡', color: 'text-yellow-400' },
  high: { label: 'عالي', icon: '🟠', color: 'text-orange-400' },
  urgent: { label: 'عاجل', icon: '🔴', color: 'text-red-400' },
};

export default function RequestDetail() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'attachments' | 'timeline'>('details');
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/my-requests/${ticketId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
      });

      if (res.ok) {
        const data = await res.json();
        setTicket(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !ticket) return;

    try {
      setReplying(true);
      const res = await fetch(`/api/helpdesk/${ticket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('erp_token')}`,
        },
        body: JSON.stringify({ message: replyText }),
      });

      if (res.ok) {
        setReplyText('');
        await fetchTicket();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg">لم يتم العثور على الطلب</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[ticket.status as keyof typeof statusConfig] || statusConfig.open;
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← رجوع
            </button>
            <span className="text-slate-400 text-sm">#{ticket.ticket_number || ticket.id}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{ticket.subject}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
              {status.label}
            </span>
            <span className={`${priority.color} font-semibold`}>
              {priority.icon} {priority.label}
            </span>
            {ticket.service && (
              <span className="px-3 py-1 rounded-full text-sm bg-slate-700 text-slate-300">
                📁 {ticket.service.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-24 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {['details', 'messages', 'attachments', 'timeline'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab === 'details' && '📋 التفاصيل'}
                {tab === 'messages' && '💬 الرسائل'}
                {tab === 'attachments' && '📎 المرفقات'}
                {tab === 'timeline' && '⏱️ السجل'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">معلومات الطلب</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm">الموضوع</p>
                  <p className="text-white font-medium mt-1">{ticket.subject}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">تاريخ الإنشاء</p>
                  <p className="text-white font-medium mt-1">
                    {new Date(ticket.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-slate-400 text-sm">الوصف</p>
                  <p className="text-white mt-2 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </div>
            </div>

            {ticket.assigned_to && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">المعين</h3>
                <div>
                  <p className="text-white font-medium">{ticket.assigned_to.name}</p>
                  <p className="text-slate-400 text-sm">{ticket.assigned_to.email}</p>
                </div>
              </div>
            )}

            {ticket.form_data && Object.keys(ticket.form_data).length > 0 && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">معلومات إضافية</h3>
                <div className="space-y-4">
                  {Object.entries(ticket.form_data).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-slate-400 text-sm capitalize">{key}</p>
                      <p className="text-white mt-1">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(ticket.messages || []).map((msg) => (
                <div key={msg.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{msg.user.name}</p>
                      <p className="text-slate-400 text-sm">{msg.user.email}</p>
                    </div>
                    <p className="text-slate-400 text-sm">
                      {new Date(msg.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">إضافة رد</h3>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك هنا..."
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition resize-none mb-4"
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-medium transition-colors"
                >
                  {replying ? 'جاري الإرسال...' : 'إرسال الرد'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="space-y-4">
            {(ticket.attachments || []).length > 0 ? (
              ticket.attachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="text-white font-medium">{att.file_name}</p>
                      <p className="text-slate-400 text-sm">
                        {formatFileSize(att.file_size)} • {att.uploaded_by.name}
                      </p>
                    </div>
                  </div>
                  <a
                    href={att.file_path}
                    download
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm transition-colors"
                  >
                    ⬇️ تحميل
                  </a>
                </div>
              ))
            ) : (
              <p className="text-slate-400">لا توجد مرفقات</p>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <p className="text-slate-400">سجل التغييرات سيتم عرضه هنا</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}