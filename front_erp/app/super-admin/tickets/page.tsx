'use client'
import { useState, useEffect } from 'react'
import { api, extractArray } from '../../../lib/api'
import { useToast } from '../../../hooks/useToast'
import { StatCard, Badge, EmptyState, SearchInput, ToastContainer } from '../../../components/ui'

type Ticket = {
  id: number
  title: string
  description: string
  status: string
  priority: string
  company: string
  created_at: string
}
type Company = { id: number; name: string }

const STATUS_COLOR: Record<string, any> = { open: 'danger', in_progress: 'warning', resolved: 'success', closed: 'gray' }
const PRIORITY_COLOR: Record<string, any> = { low: 'info', medium: 'warning', high: 'danger', urgent: 'danger' }

export default function SuperAdminTicketsPage() {
  const { toasts, show, remove } = useToast()
  const [tickets,       setTickets]       = useState<Ticket[]>([])
  const [companies,     setCompanies]     = useState<Company[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [companyFilter, setCompanyFilter] = useState('all')
  const [selected,      setSelected]      = useState<Ticket | null>(null)
  const [reply,         setReply]         = useState('')
  const [saving,        setSaving]        = useState(false)

  // ── رسائل جماعية ─────────────────────────────────
  const [bulkMode,    setBulkMode]    = useState(false)
  const [bulkMsg,     setBulkMsg]     = useState('')
  const [bulkTarget,  setBulkTarget]  = useState<'all' | 'open' | 'company'>('all')
  const [bulkCompany, setBulkCompany] = useState('')
  const [bulkSending, setBulkSending] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/super-admin/tickets?per_page=100')
    const raw = extractArray(res.data)
    setTickets(raw.map((t: any) => ({
      ...t,
      // الـ backend بيبعت subject وmessage — نعملهم alias لـ title وdescription
      title:       t.title       ?? t.subject ?? '(بدون عنوان)',
      description: t.description ?? t.message ?? '',
      company: typeof t.company === 'object' ? (t.company?.name ?? '—') : (t.company ?? '—'),
    })))
    setLoading(false)
  }

  const loadCompanies = async () => {
    const res = await api.get('/super-admin/companies?per_page=200&status=active')
    const raw = extractArray(res.data)
    setCompanies(raw.map((c: any) => ({ id: c.id, name: c.name })))
  }

  useEffect(() => { load(); loadCompanies() }, [])

  const filtered = tickets.filter(t => {
    const matchSearch  = !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.company?.toLowerCase().includes(search.toLowerCase())
    const matchStatus  = statusFilter  === 'all' || t.status  === statusFilter
    const matchCompany = companyFilter === 'all' || t.company === companyFilter
    return matchSearch && matchStatus && matchCompany
  })

  const updateStatus = async (id: number, status: string) => {
    const res = await api.patch(`/super-admin/tickets/${id}/status`, { status })
    if (res.error) { show(res.error, 'error'); return }
    show('تم تحديث الحالة ✅')
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (selected?.id === id) setSelected(t => t ? { ...t, status } : null)
  }

  const sendReply = async () => {
    if (!selected || !reply.trim()) return
    setSaving(true)
    const res = await api.post(`/super-admin/tickets/${selected.id}/reply`, { reply, status: 'in_progress' })
    setSaving(false)
    if (res.error) { show(res.error, 'error'); return }
    show('تم إرسال الرد ✅'); setReply('')
  }

  // ── إرسال رسالة جماعية ───────────────────────────
  const sendBulkMessage = async () => {
    if (!bulkMsg.trim()) return
    setBulkSending(true)

    // تحديد التذاكر المستهدفة
    let targetTickets = tickets
    if (bulkTarget === 'open')    targetTickets = tickets.filter(t => t.status === 'open')
    if (bulkTarget === 'company') targetTickets = tickets.filter(t => t.company === bulkCompany)

    if (targetTickets.length === 0) {
      show('لا توجد تذاكر مطابقة للفلتر المحدد', 'error')
      setBulkSending(false)
      return
    }

    let successCount = 0
    let failCount = 0

    // إرسال لكل تذكرة
    for (const ticket of targetTickets) {
      const res = await api.post(`/super-admin/tickets/${ticket.id}/reply`, { reply: bulkMsg })
      if (res.error) failCount++
      else successCount++
    }

    setBulkSending(false)
    setBulkMsg('')
    setBulkMode(false)
    show(`✅ تم الإرسال لـ ${successCount} تذكرة${failCount > 0 ? ` (فشل: ${failCount})` : ''}`)
  }

  const INP: React.CSSProperties = {
    width: '100%', padding: '0.6rem', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', resize: 'none' as any, fontFamily: 'inherit',
    fontSize: '0.875rem', background: 'var(--bg-input)', color: 'var(--text-primary)', outline: 'none',
  }

  // الشركات الموجودة في التذاكر للفلتر
  const companiesInTickets = Array.from(new Set(tickets.map(t => t.company).filter(c => c && c !== '—')))

  return (
    <div>
      <ToastContainer toasts={toasts} remove={remove} />
      <div className="page-header">
        <div>
          <h1 className="page-title">🎫 تذاكر الدعم</h1>
          <p className="page-subtitle">تذاكر دعم الشركات المشتركة</p>
        </div>
        <button
          className={`btn ${bulkMode ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => { setBulkMode(!bulkMode); setBulkMsg('') }}
        >
          {bulkMode ? '✕ إلغاء الرسائل الجماعية' : '📢 رسالة جماعية'}
        </button>
      </div>

      {/* ── إحصائيات ─────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <StatCard icon="🎫" label="إجمالي التذاكر" value={tickets.length} />
        <StatCard icon="🔴" label="مفتوحة"  value={tickets.filter(t => t.status === 'open').length}         accent="var(--color-danger)" />
        <StatCard icon="🟡" label="جارية"   value={tickets.filter(t => t.status === 'in_progress').length}  accent="var(--color-warning)" />
        <StatCard icon="✅" label="محلولة"  value={tickets.filter(t => t.status === 'resolved').length}      accent="var(--color-success)" />
      </div>

      {/* ── لوحة الرسائل الجماعية ────────────────────── */}
      {bulkMode && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--color-primary)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem',
        }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>📢 إرسال رسالة جماعية</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* نوع الإرسال */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { val: 'all' as const,     label: `كل التذاكر (${tickets.length})` },
                { val: 'open' as const,    label: `المفتوحة فقط (${tickets.filter(t => t.status === 'open').length})` },
                { val: 'company' as const, label: 'شركة محددة' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setBulkTarget(opt.val)}
                  className="btn btn-sm"
                  style={{
                    background: bulkTarget === opt.val ? 'var(--color-primary)' : 'transparent',
                    color:      bulkTarget === opt.val ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* اختيار الشركة لو اختار company */}
            {bulkTarget === 'company' && (
              <select
                className="input"
                value={bulkCompany}
                onChange={e => setBulkCompany(e.target.value)}
                style={{ maxWidth: 320 }}
              >
                <option value="">اختر الشركة...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {companiesInTickets.filter(n => !companies.find(c => c.name === n)).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            )}

            <textarea
              value={bulkMsg}
              onChange={e => setBulkMsg(e.target.value)}
              rows={3}
              placeholder="اكتب رسالتك هنا... ستُرسل لجميع التذاكر المحددة"
              style={INP}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={sendBulkMessage}
                disabled={bulkSending || !bulkMsg.trim() || (bulkTarget === 'company' && !bulkCompany)}
              >
                {bulkSending ? '⏳ جارٍ الإرسال...' : '📤 إرسال للجميع'}
              </button>
              <button className="btn btn-secondary" onClick={() => setBulkMode(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* ── الفلاتر ───────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="بحث بالعنوان أو الشركة..." />

        {/* فلتر الحالة */}
        <select
          className="input"
          style={{ width: 'auto', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">كل الحالات</option>
          <option value="open">مفتوحة</option>
          <option value="in_progress">جارية</option>
          <option value="resolved">محلولة</option>
          <option value="closed">مغلقة</option>
        </select>

        {/* فلتر الشركة */}
        <select
          className="input"
          style={{ width: 'auto', minWidth: 160 }}
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
        >
          <option value="all">كل الشركات ({companies.length})</option>
          {companies.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
          {/* شركات من التذاكر ولو مش موجودة في القائمة */}
          {companiesInTickets
            .filter(n => !companies.find(c => c.name === n))
            .map(n => <option key={n} value={n}>{n}</option>)
          }
        </select>
      </div>

      {/* ── القائمة + التفاصيل ────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🎫" title="لا توجد تذاكر" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(t => (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    padding: '1rem', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                    border: `1px solid ${selected?.id === t.id ? 'var(--color-primary)' : 'var(--border)'}`,
                    background: selected?.id === t.id ? 'var(--color-primary-light)' : 'var(--bg-card)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <Badge color={STATUS_COLOR[t.status] ?? 'gray'}>
                      {t.status === 'open' ? 'مفتوحة' : t.status === 'in_progress' ? 'جارية' : t.status === 'resolved' ? 'محلولة' : 'مغلقة'}
                    </Badge>
                    <Badge color={PRIORITY_COLOR[t.priority] ?? 'gray'}>{t.priority}</Badge>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    🏢 {t.company} • 📅 {new Date(t.created_at).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── لوحة التفاصيل والرد ──────────────────────── */}
        {selected && (
          <div style={{
            width: 360, flexShrink: 0, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{selected.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10 }}>🏢 {selected.company}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className="btn btn-sm"
                    style={{
                      background: selected.status === s ? 'var(--color-primary)' : 'transparent',
                      color:      selected.status === s ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {s === 'open' ? 'مفتوح' : s === 'in_progress' ? 'جاري' : s === 'resolved' ? 'محلول' : 'مغلق'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: '1rem', flex: 1, background: 'var(--bg-hover)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {selected.description}
            </div>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={3}
                placeholder="اكتب ردك هنا..."
                style={INP}
              />
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={sendReply}
                disabled={saving || !reply.trim()}
              >
                {saving ? '⏳ جارٍ الإرسال...' : '📤 إرسال الرد'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
