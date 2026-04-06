'use client'

// ══════════════════════════════════════════════════════════
// app/notifications/page.tsx — صفحة الإشعارات
// API: GET /api/notifications
//      PATCH /api/notifications/{id}/read
//      POST /api/notifications/read-all
//      DELETE /api/notifications/{id}
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type Notification = { id: number; title?: string; data: any; read_at: string | null; created_at: string }

export default function NotificationsPage() {
  const { t, lang } = useI18n()
  const [notifs,   setNotifs]   = useState<Notification[]>([])
  const [loading,  setLoading]  = useState(true)

  const fetchNotifs = async () => {
    setLoading(true)
    const res = await api.get<{ data: Notification[] }>('/notifications?per_page=50')
    if (res.data) setNotifs(res.data.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotifs() }, [])

  // تعليم كإشعار مقروء
  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`, {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  // تعليم الكل كمقروء
  const markAllRead = async () => {
    await api.post('/notifications/read-all', {})
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  // حذف إشعار
  const deleteNotif = async (id: number) => {
    await api.delete(`/notifications/${id}`)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const fmtDate = (d: string) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')
  const unreadCount = notifs.filter(n => !n.read_at).length

  return (
    <ERPLayout pageTitle={t('notifications')}>

      <div className="toolbar">
        <span className="fw-semibold text-secondary">
          {unreadCount > 0
            ? (lang === 'ar' ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread`)
            : (lang === 'ar' ? 'كل الإشعارات مقروءة' : 'All caught up!')
          }
        </span>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            ✓ {lang === 'ar' ? 'تعليم الكل كمقروء' : 'Mark All Read'}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64 }} />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <p className="empty-state-text">{lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
          </div>
        ) : (
          <div>
            {notifs.map(notif => (
              <div
                key={notif.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border-light)',
                  background: notif.read_at ? 'transparent' : 'var(--color-primary-light)',
                  transition: 'background var(--transition)',
                }}
              >
                {/* أيقونة الإشعار */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: notif.read_at ? 'var(--bg-hover)' : 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  🔔
                </div>

                {/* نص الإشعار */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: notif.read_at ? 400 : 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {notif.data?.message || notif.title || (lang === 'ar' ? 'إشعار جديد' : 'New notification')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {fmtDate(notif.created_at)}
                  </p>
                </div>

                {/* أزرار التحكم */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {!notif.read_at && (
                    <button className="btn btn-secondary btn-sm" onClick={() => markRead(notif.id)}>
                      ✓
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => deleteNotif(notif.id)} style={{ fontSize: '0.9rem' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ERPLayout>
  )
}
