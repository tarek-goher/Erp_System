'use client'

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faBell, 
  faCheck, 
  faCheckDouble, 
  faTrash, 
  faInbox 
} from '@fortawesome/free-solid-svg-icons'

type Notification = { 
  id: number; 
  title?: string; 
  data: any; 
  read_at: string | null; 
  created_at: string 
}

export default function NotificationsPage() {
  const { t, lang } = useI18n()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const res = await api.get<{ data: Notification[] }>('/notifications?per_page=50')
      if (res.data) setNotifs(res.data.data || [])
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [])

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`, {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const markAllRead = async () => {
    await api.post('/notifications/read-all', {})
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
  }

  const deleteNotif = async (id: number) => {
    await api.delete(`/notifications/${id}`)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const fmtDate = (d: string) => new Date(d).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US')
  const unreadCount = notifs.filter(n => !n.read_at).length

  return (
    <ERPLayout pageTitle={t('notifications')}>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span className="fw-semibold text-secondary">
          <FontAwesomeIcon icon={faBell} style={{ marginRight: lang === 'ar' ? 0 : '8px', marginLeft: lang === 'ar' ? '8px' : 0 }} />
          {unreadCount > 0
            ? (lang === 'ar' ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread`)
            : (lang === 'ar' ? 'كل الإشعارات مقروءة' : 'All caught up!')
          }
        </span>
        {unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px' }} />
            {lang === 'ar' ? 'تعليم الكل كمقروء' : 'Mark All Read'}
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: '8px' }} />)}
          </div>
        ) : notifs.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <FontAwesomeIcon icon={faInbox} />
            </div>
            <p className="empty-state-text" style={{ color: 'var(--text-muted)' }}>
                {lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
            </p>
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
                  background: notif.read_at ? 'transparent' : 'rgba(var(--color-primary-rgb), 0.05)',
                  transition: 'background 0.2s ease',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '12px',
                  background: notif.read_at ? 'var(--bg-hover)' : 'var(--color-primary)',
                  color: notif.read_at ? 'var(--text-secondary)' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  <FontAwesomeIcon icon={faBell} />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontWeight: notif.read_at ? 400 : 600, 
                    fontSize: '0.9rem', 
                    color: 'var(--text-primary)',
                    margin: 0 
                  }}>
                    {notif.data?.message || notif.title || (lang === 'ar' ? 'إشعار جديد' : 'New notification')}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginBottom: 0 }}>
                    {fmtDate(notif.created_at)}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!notif.read_at && (
                    <button 
                      className="btn btn-outline-secondary btn-sm" 
                      onClick={() => markRead(notif.id)}
                      title={lang === 'ar' ? 'مقروء' : 'Mark as read'}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                  )}
                  <button 
                    className="btn btn-outline-danger btn-sm" 
                    onClick={() => deleteNotif(notif.id)}
                    style={{ color: '#dc3545', border: '1px solid transparent' }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
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