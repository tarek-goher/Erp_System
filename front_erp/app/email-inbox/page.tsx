'use client'

// ══════════════════════════════════════════════════════════
// app/email-inbox/page.tsx — صندوق الوارد
// ══════════════════════════════════════════════════════════
// API endpoints:
//   GET /api/email-inbox/inbox    → جلب الرسائل
//   GET /api/email-inbox/folders  → قائمة المجلدات
//   GET /api/email-inbox/{uid}    → تفاصيل رسالة
//   GET /api/mail-config          → إعدادات IMAP
//   POST /api/mail-config         → حفظ إعدادات IMAP
// ══════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type EmailMessage = {
  uid: string
  subject: string
  from: string
  date: string
  seen: boolean
  body?: string
}

type MailConfig = {
  imap_host: string
  imap_port: number
  imap_username: string
  imap_encryption: string
  is_configured: boolean
}

export default function EmailInboxPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [messages,       setMessages]       = useState<EmailMessage[]>([])
  const [loading,        setLoading]        = useState(true)
  const [folders,        setFolders]        = useState<string[]>([])
  const [activeFolder,   setActiveFolder]   = useState('INBOX')
  const [selectedMsg,    setSelectedMsg]    = useState<EmailMessage | null>(null)
  const [config,         setConfig]         = useState<MailConfig | null>(null)
  const [showConfig,     setShowConfig]     = useState(false)
  const [configForm,     setConfigForm]     = useState({
    imap_host: '',
    imap_port: '993',
    imap_username: '',
    imap_password: '',
    imap_encryption: 'ssl',
  })
  const [configSaving,   setConfigSaving]   = useState(false)
  const [configErr,      setConfigErr]      = useState('')
  const [configSuccess,  setConfigSuccess]  = useState('')

  const fetchInbox = async () => {
    setLoading(true)
    setSelectedMsg(null)
    const res = await api.get<{ messages: EmailMessage[] }>('/email-inbox/inbox')
    if (res.data?.messages) setMessages(res.data.messages)
    setLoading(false)
  }

  const fetchFolders = async () => {
    const res = await api.get<{ folders: string[] }>('/email-inbox/folders')
    if (res.data?.folders) setFolders(res.data.folders)
  }

  const fetchConfig = async () => {
    const res = await api.get<MailConfig>('/mail-config')
    if (res.data) {
      setConfig(res.data)
      setConfigForm({
        imap_host: res.data.imap_host || '',
        imap_port: String(res.data.imap_port || 993),
        imap_username: res.data.imap_username || '',
        imap_password: '',
        imap_encryption: res.data.imap_encryption || 'ssl',
      })
    }
  }

  useEffect(() => {
    fetchInbox()
    fetchFolders()
    fetchConfig()
  }, [])

  const handleSaveConfig = async () => {
    setConfigErr('')
    setConfigSuccess('')
    if (!configForm.imap_host || !configForm.imap_username) {
      setConfigErr(ar('يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields'))
      return
    }
    setConfigSaving(true)
    const res = await api.post('/mail-config', {
      imap_host:       configForm.imap_host,
      imap_port:       Number(configForm.imap_port),
      imap_username:   configForm.imap_username,
      imap_password:   configForm.imap_password || undefined,
      imap_encryption: configForm.imap_encryption,
    })
    setConfigSaving(false)
    if (res.error) { setConfigErr(res.error); return }
    setConfigSuccess(ar('تم حفظ الإعدادات بنجاح', 'Settings saved successfully'))
    setShowConfig(false)
    fetchInbox()
  }

  return (
    <ERPLayout pageTitle={ar('صندوق الوارد', 'Email Inbox')}>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="toolbar">
        <div className="toolbar-actions">
          <button className="btn btn-secondary" onClick={fetchInbox} disabled={loading}>
            🔄 {ar('تحديث', 'Refresh')}
          </button>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowConfig(true)}>
          ⚙️ {ar('إعدادات IMAP', 'IMAP Settings')}
        </button>
      </div>

      {/* ── محتوى البريد ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', height: 'calc(100vh - 200px)', minHeight: 500 }}>

        {/* ── Folders Sidebar ──────────────────────────────── */}
        <div className="card" style={{ padding: '0.75rem', overflow: 'auto' }}>
          <p className="fw-semibold text-muted" style={{ fontSize: '0.78rem', marginBottom: '0.5rem', paddingInlineStart: '0.5rem' }}>
            {ar('المجلدات', 'FOLDERS')}
          </p>
          {(folders.length > 0 ? folders : ['INBOX', 'Sent', 'Drafts', 'Trash']).map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)', border: 'none',
                background: activeFolder === folder ? 'var(--color-primary-light)' : 'transparent',
                color: activeFolder === folder ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: activeFolder === folder ? 700 : 400,
                cursor: 'pointer', textAlign: 'start', fontSize: '0.875rem',
                transition: 'all var(--transition)',
              }}
            >
              <span>
                {folder === 'INBOX' ? '📥' : folder === 'Sent' ? '📤' : folder === 'Drafts' ? '📝' : '🗑️'}
              </span>
              {folder}
            </button>
          ))}
        </div>

        {/* ── Message List + Preview ───────────────────────── */}
        <div style={{ display: 'grid', gridTemplateRows: selectedMsg ? '1fr 1fr' : '1fr', gap: '1rem', overflow: 'hidden' }}>

          {/* Message List */}
          <div className="card" style={{ padding: 0, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 64 }} />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-text">
                  {config?.is_configured === false
                    ? ar('يرجى إعداد IMAP من الإعدادات أولاً', 'Please configure IMAP settings first')
                    : ar('لا توجد رسائل', 'No messages found')}
                </p>
                {config?.is_configured === false && (
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowConfig(true)}>
                    ⚙️ {ar('إعداد IMAP', 'Setup IMAP')}
                  </button>
                )}
              </div>
            ) : messages.map(msg => (
              <div
                key={msg.uid}
                onClick={() => setSelectedMsg(selectedMsg?.uid === msg.uid ? null : msg)}
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selectedMsg?.uid === msg.uid ? 'var(--bg-selected)' : msg.seen ? 'transparent' : 'var(--color-primary-light)',
                  transition: 'background var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: msg.seen ? 400 : 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject || ar('(بدون موضوع)', '(No Subject)')}
                    </p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.from}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {msg.date ? new Date(msg.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Message Preview */}
          {selectedMsg && (
            <div className="card" style={{ overflow: 'auto' }}>
              <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <h3 className="fw-bold" style={{ margin: 0, marginBottom: '0.35rem' }}>
                  {selectedMsg.subject || ar('(بدون موضوع)', '(No Subject)')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {ar('من', 'From')}: {selectedMsg.from} · {selectedMsg.date}
                </p>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.8 }}>
                {selectedMsg.body
                  ? <div dangerouslySetInnerHTML={{ __html: selectedMsg.body }} />
                  : <p className="text-muted">{ar('لا يوجد محتوى للرسالة', 'No message body')}</p>
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: إعدادات IMAP ───────────────────────────── */}
      {showConfig && (
        <div className="modal-overlay" onClick={() => setShowConfig(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{ar('إعدادات IMAP', 'IMAP Settings')}</h3>
              <button className="btn-icon" onClick={() => setShowConfig(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="input-group">
                  <label className="input-label">{ar('خادم IMAP', 'IMAP Host')} *</label>
                  <input
                    className="input"
                    placeholder="imap.gmail.com"
                    value={configForm.imap_host}
                    onChange={e => setConfigForm({ ...configForm, imap_host: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{ar('المنفذ', 'Port')}</label>
                  <input
                    className="input"
                    type="number"
                    value={configForm.imap_port}
                    onChange={e => setConfigForm({ ...configForm, imap_port: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{ar('اسم المستخدم', 'Username')} *</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="user@example.com"
                    value={configForm.imap_username}
                    onChange={e => setConfigForm({ ...configForm, imap_username: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">{ar('كلمة المرور', 'Password')}</label>
                  <input
                    className="input"
                    type="password"
                    placeholder={ar('اتركها فارغة للإبقاء على القديمة', 'Leave blank to keep existing')}
                    value={configForm.imap_password}
                    onChange={e => setConfigForm({ ...configForm, imap_password: e.target.value })}
                  />
                </div>
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">{ar('التشفير', 'Encryption')}</label>
                  <select
                    className="input"
                    value={configForm.imap_encryption}
                    onChange={e => setConfigForm({ ...configForm, imap_encryption: e.target.value })}
                  >
                    <option value="ssl">SSL (993)</option>
                    <option value="tls">TLS (143)</option>
                    <option value="none">{ar('بدون تشفير', 'None')}</option>
                  </select>
                </div>
              </div>
              {configErr && (
                <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>⚠️ {configErr}</div>
              )}
              {configSuccess && (
                <div style={{ color: 'var(--color-success)', marginTop: '0.75rem', fontSize: '0.875rem' }}>✓ {configSuccess}</div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfig(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleSaveConfig} disabled={configSaving}>
                {configSaving ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

    </ERPLayout>
  )
}
