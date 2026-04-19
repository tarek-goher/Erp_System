'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type FixedAsset = {
  id: number
  name: string
  category?: string
  asset_code?: string
  location?: string
  vendor?: string
  warranty_expiry_date?: string | null
  purchase_date: string
  purchase_value: number
  useful_life_years: number
  salvage_value: number | null
  depreciation_method: string | null
  depreciation_rate: number | null
  accumulated_depreciation: number
  status: string
  disposal_date?: string | null
  disposal_value?: number | null
  disposal_reason?: string | null
  book_value?: number
  created_at: string
}

type DepreciationScheduleRow = {
  year: number
  annual_depreciation: number
  accumulated: number
  book_value: number
}

const STATUSES    = ['active', 'disposed', 'under_maintenance']
const DEP_METHODS = ['straight_line', 'declining_balance']

const EMPTY_FORM = {
  name:                 '',
  category:             '',
  asset_code:           '',
  location:             '',
  vendor:               '',
  warranty_expiry_date: '',
  purchase_date:        '',
  purchase_value:       '',
  useful_life_years:    '',
  salvage_value:        '',
  depreciation_method:  'straight_line',
  depreciation_rate:    '',
  status:               'active',
  disposal_date:        '',
  disposal_value:       '',
  disposal_reason:      '',
}

export default function FixedAssetsPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [assets,   setAssets]   = useState<FixedAsset[]>([])
  const [total,    setTotal]    = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)

  // فلاتر البحث
  const [search,          setSearch]          = useState('')
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterCategory,  setFilterCategory]  = useState('')
  const [searchInput,     setSearchInput]     = useState('')

  const [modal,     setModal]     = useState(false)
  const [editAsset, setEditAsset] = useState<FixedAsset | null>(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [formErr,   setFormErr]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [deleteId,  setDeleteId]  = useState<number | null>(null)

  const [depModal,    setDepModal]    = useState(false)
  const [depAsset,    setDepAsset]    = useState<FixedAsset | null>(null)
  const [depSchedule, setDepSchedule] = useState<DepreciationScheduleRow[]>([])
  const [depLoading,  setDepLoading]  = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => { setIsMounted(true) }, [])

  const fetchAssets = async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), per_page: '15' })
    if (search)         params.append('search',   search)
    if (filterStatus)   params.append('status',   filterStatus)
    if (filterCategory) params.append('category', filterCategory)

    const res = await api.get<any>(`/fixed-assets?${params}`)
    if (res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.data || [])
      setAssets(list)
      setTotal(res.data.total || list.length)
      setLastPage(res.data.last_page || 1)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAssets() }, [page, search, filterStatus, filterCategory])

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setFilterStatus('')
    setFilterCategory('')
    setPage(1)
  }

  const openAdd = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setEditAsset(null)
    setForm({ ...EMPTY_FORM, purchase_date: new Date().toISOString().split('T')[0] })
    setFormErr('')
    setModal(true)
  }

  const openEdit = (asset: FixedAsset, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setEditAsset(asset)
    setForm({
      name:                 asset.name,
      category:             asset.category || '',
      asset_code:           asset.asset_code || '',
      location:             asset.location || '',
      vendor:               asset.vendor || '',
      warranty_expiry_date: asset.warranty_expiry_date || '',
      purchase_date:        asset.purchase_date,
      purchase_value:       String(asset.purchase_value),
      useful_life_years:    String(asset.useful_life_years),
      salvage_value:        asset.salvage_value != null ? String(asset.salvage_value) : '',
      depreciation_method:  asset.depreciation_method || 'straight_line',
      depreciation_rate:    asset.depreciation_rate != null ? String(asset.depreciation_rate) : '',
      status:               asset.status,
      disposal_date:        asset.disposal_date || '',
      disposal_value:       asset.disposal_value != null ? String(asset.disposal_value) : '',
      disposal_reason:      asset.disposal_reason || '',
    })
    setFormErr('')
    setModal(true)
  }

  const buildSchedule = (asset: FixedAsset): DepreciationScheduleRow[] => {
    const cost    = asset.purchase_value
    const salvage = asset.salvage_value ?? 0
    const life    = asset.useful_life_years || 1
    const rate    = asset.depreciation_rate ?? 0
    const method  = asset.depreciation_method || 'straight_line'
    const rows: DepreciationScheduleRow[] = []
    let bookValue   = cost
    let accumulated = 0

    for (let year = 1; year <= life; year++) {
      let annualDep = method === 'declining_balance'
        ? bookValue * (rate / 100)
        : (cost - salvage) / life
      annualDep   = Math.max(0, Math.min(annualDep, bookValue - salvage))
      accumulated += annualDep
      bookValue   -= annualDep
      rows.push({
        year,
        annual_depreciation: Math.round(annualDep   * 100) / 100,
        accumulated:         Math.round(accumulated * 100) / 100,
        book_value:          Math.round(Math.max(bookValue, salvage) * 100) / 100,
      })
    }
    return rows
  }

  const openDepreciation = async (asset: FixedAsset, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    setDepAsset(asset)
    setDepLoading(true)
    setDepModal(true)
    setDepSchedule([])

    const res = await api.get<any>(`/fixed-assets/${asset.id}`)
    setDepLoading(false)

    if (res.data?.depreciation_schedule && Array.isArray(res.data.depreciation_schedule)) {
      setDepSchedule(res.data.depreciation_schedule)
      if (res.data.book_value != null) {
        setDepAsset({ ...asset, book_value: res.data.book_value })
      }
    } else {
      setDepSchedule(buildSchedule(asset))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErr('')

    if (!form.name.trim())       { setFormErr(ar('الاسم مطلوب',            'Name is required'));          return }
    if (!form.purchase_date)     { setFormErr(ar('تاريخ الشراء مطلوب',    'Purchase date is required'));  return }
    if (!form.purchase_value)    { setFormErr(ar('قيمة الشراء مطلوبة',    'Purchase value is required')); return }
    if (!form.useful_life_years) { setFormErr(ar('العمر الافتراضي مطلوب', 'Useful life is required'));    return }

    if (form.depreciation_method === 'declining_balance' && !form.depreciation_rate) {
      setFormErr(ar('معدل الاستهلاك مطلوب للرصيد المتناقص', 'Depreciation rate required for declining balance'))
      return
    }

    if (form.salvage_value && Number(form.salvage_value) >= Number(form.purchase_value)) {
      setFormErr(ar('القيمة التخريدية يجب أن تكون أقل من قيمة الشراء', 'Salvage value must be less than purchase value'))
      return
    }

    if (form.status === 'disposed' && !form.disposal_date) {
      setFormErr(ar('تاريخ الاستبعاد مطلوب عند تحديد الحالة كمُستبعَد', 'Disposal date is required when status is disposed'))
      return
    }

    setSaving(true)
    const payload = {
      name:                 form.name,
      category:             form.category             || null,
      asset_code:           form.asset_code           || null,
      location:             form.location             || null,
      vendor:               form.vendor               || null,
      warranty_expiry_date: form.warranty_expiry_date || null,
      purchase_date:        form.purchase_date,
      purchase_value:       Number(form.purchase_value),
      useful_life_years:    Number(form.useful_life_years),
      salvage_value:        form.salvage_value   ? Number(form.salvage_value)   : null,
      depreciation_method:  form.depreciation_method || null,
      depreciation_rate:    form.depreciation_rate ? Number(form.depreciation_rate) : null,
      status:               form.status,
      disposal_date:        form.disposal_date   || null,
      disposal_value:       form.disposal_value  ? Number(form.disposal_value)  : null,
      disposal_reason:      form.disposal_reason || null,
    }

    const res = editAsset
      ? await api.put(`/fixed-assets/${editAsset.id}`, payload)
      : await api.post('/fixed-assets', payload)

    setSaving(false)
    if (res.error) { setFormErr(res.error); return }
    setModal(false)
    fetchAssets()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/fixed-assets/${deleteId}`)
    setDeleteId(null)
    fetchAssets()
  }

  const fmt = (n: number | null | undefined) =>
    n != null
      ? new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
      : '—'

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : '—'

  const calcBookValue = (asset: FixedAsset) =>
    asset.book_value != null
      ? asset.book_value
      : asset.purchase_value - (asset.accumulated_depreciation || 0)

  const statusLabel = (s: string) => ({
    active:            ar('نشط',          'Active'),
    disposed:          ar('مُستبعَد',     'Disposed'),
    under_maintenance: ar('تحت الصيانة', 'Under Maintenance'),
  }[s] || s)

  const methodLabel = (m: string | null) => ({
    straight_line:     ar('القسط الثابت',    'Straight Line'),
    declining_balance: ar('الرصيد المتناقص', 'Declining Balance'),
  }[m || ''] || '—')

  const statusBadge = (s: string) => ({
    active:            'badge-success',
    disposed:          'badge-danger',
    under_maintenance: 'badge-warning',
  }[s] || 'badge-muted')

  // تحذير انتهاء الضمان (خلال 30 يوم)
  const warrantyWarning = (d: string | null | undefined) => {
    if (!d) return null
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    if (diff < 0)  return <span title={fmtDate(d)} style={{ color: 'var(--color-danger)',  cursor: 'help' }}>🔴</span>
    if (diff <= 30) return <span title={fmtDate(d)} style={{ color: 'var(--color-warning)', cursor: 'help' }}>⚠️</span>
    return <span title={fmtDate(d)} style={{ color: 'var(--color-success)', cursor: 'help' }}>🟢</span>
  }

  const totalCost  = assets.reduce((s, a) => s + a.purchase_value, 0)
  const totalAccum = assets.reduce((s, a) => s + (a.accumulated_depreciation || 0), 0)
  const totalBook  = assets.reduce((s, a) => s + calcBookValue(a), 0)

  const hasActiveFilters = search || filterStatus || filterCategory

  return (
    <ERPLayout pageTitle={ar('الأصول الثابتة', 'Fixed Assets')}>

      {/* KPIs */}
      {!loading && assets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {[
            { label: ar('إجمالي الأصول',   'Total Assets'),     value: total,           icon: '🏢' },
            { label: ar('إجمالي التكلفة',  'Total Cost'),       value: fmt(totalCost),  icon: '💰' },
            { label: ar('مجمع الاستهلاك',  'Accumulated Dep.'), value: fmt(totalAccum), icon: '📉' },
            { label: ar('القيمة الدفترية', 'Total Book Value'), value: fmt(totalBook),  icon: '📋' },
            { label: ar('الأصول النشطة',   'Active Assets'),    value: assets.filter(a => a.status === 'active').length, icon: '✅' },
          ].map(card => (
            <div key={card.label} className="stat-card">
  <div className="stat-icon">{card.icon}</div>
  <div style={{ minWidth: 0, flex: 1 }}>
    <p className="stat-value" style={{
      fontSize: 'clamp(0.85rem, 2vw, 1.25rem)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      margin: 0,
    }}>
      {card.value}
    </p>
    <p className="stat-label" style={{ margin: 0 }}>{card.label}</p>
  </div>
</div>
          ))}
        </div>
      )}

      {/* شريط البحث والفلاتر */}
      <div className="card" style={{ padding: '0.875rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {ar('بحث', 'Search')}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder={ar('اسم الأصل أو الكود...', 'Asset name or code...')}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="btn btn-secondary" onClick={handleSearch}>🔍</button>
            </div>
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {ar('الحالة', 'Status')}
            </label>
            <select className="input" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
              <option value="">{ar('الكل', 'All')}</option>
              {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>

          <div style={{ flex: '0 1 160px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              {ar('الفئة', 'Category')}
            </label>
            <input
              className="input"
              placeholder={ar('مثال: مركبات', 'e.g. Vehicles')}
              value={filterCategory}
              onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 1 }}>
            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters}>
                ✕ {ar('مسح', 'Clear')}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              + {ar('أصل جديد', 'New Asset')}
            </button>
          </div>

        </div>
      </div>

      {/* الجدول */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : assets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p className="empty-state-text">
              {hasActiveFilters
                ? ar('لا توجد نتائج للبحث', 'No results found')
                : ar('لا توجد أصول ثابتة', 'No fixed assets found')}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{ar('اسم الأصل', 'Asset Name')}</th>
                  <th>{ar('الكود', 'Code')}</th>
                  <th>{ar('الموقع', 'Location')}</th>
                  <th>{ar('تاريخ الشراء', 'Purchase Date')}</th>
                  <th>{ar('قيمة الشراء', 'Purchase Value')}</th>
                  <th>{ar('مجمع الاستهلاك', 'Accum. Dep.')}</th>
                  <th>{ar('القيمة الدفترية', 'Book Value')}</th>
                  <th>{ar('طريقة الاستهلاك', 'Dep. Method')}</th>
                  <th>{ar('الضمان', 'Warranty')}</th>
                  <th>{ar('الحالة', 'Status')}</th>
                  <th>{ar('الإجراءات', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td className="text-muted">{asset.id}</td>
                    <td className="fw-semibold">
                      {asset.name}
                      {asset.category && (
                        <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>
                          {asset.category}
                        </span>
                      )}
                      {asset.vendor && (
                        <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>
                          🏭 {asset.vendor}
                        </span>
                      )}
                    </td>
                    <td className="text-muted">{asset.asset_code || '—'}</td>
                    <td className="text-muted">{asset.location || '—'}</td>
                    <td className="text-muted">{fmtDate(asset.purchase_date)}</td>
                    <td>{fmt(asset.purchase_value)}</td>
                    <td className="text-muted">{fmt(asset.accumulated_depreciation)}</td>
                    <td className="fw-semibold">{fmt(calcBookValue(asset))}</td>
                    <td className="text-muted">{methodLabel(asset.depreciation_method)}</td>
                    <td style={{ textAlign: 'center' }}>{warrantyWarning(asset.warranty_expiry_date)}</td>
                    <td>
                      <span className={`badge ${statusBadge(asset.status)}`}>
                        {statusLabel(asset.status)}
                      </span>
                      {asset.status === 'disposed' && asset.disposal_date && (
                        <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>
                          {fmtDate(asset.disposal_date)}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openDepreciation(asset)}>
                          📊 {ar('جدول', 'Schedule')}
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(asset)}>
                          {t('edit')}
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteId(asset.id)}>
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 15 && (
          <div className="sales-pagination">
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              {ar('← السابق', '← Prev')}
            </button>
            <span className="text-muted">{ar(`صفحة ${page} من ${lastPage}`, `Page ${page} of ${lastPage}`)}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= lastPage}>
              {ar('التالي →', 'Next →')}
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: إضافة / تعديل أصل
      ══════════════════════════════════════ */}
      {modal && isMounted && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setModal(false)}
        >
          <div
            style={{ maxWidth: 760, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editAsset ? ar('تعديل أصل', 'Edit Asset') : ar('أصل جديد', 'New Asset')}
              </h3>
              <button type="button" className="btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ overflowY: 'auto' }}>

                {/* ── قسم: معلومات أساسية ── */}
                <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  {ar('المعلومات الأساسية', 'Basic Information')}
                </p>
                <div className="form-grid form-grid-2" style={{ marginBottom: '1.25rem' }}>

                  <div className="input-group">
                    <label className="input-label">{ar('اسم الأصل', 'Asset Name')} *</label>
                    <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={ar('مثال: سيارة تويوتا', 'e.g. Toyota Vehicle')} autoFocus />
                  </div>

                  <div className="input-group">
  <label className="input-label">{ar('كود الأصل', 'Asset Code')}</label>
  <div style={{ position: 'relative' }}>
    <input
      className="input"
      value={form.asset_code}
      onChange={e => setForm({ ...form, asset_code: e.target.value })}
      placeholder={ar('سيتولد تلقائياً', 'Auto-generated')}
      style={{ paddingInlineEnd: '7rem' }}
    />
    <span style={{
      position: 'absolute',
      insetInlineEnd: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {ar('اختياري • تلقائي', 'Optional • Auto')}
    </span>
  </div>
</div>

                  <div className="input-group">
                    <label className="input-label">{ar('الفئة', 'Category')}</label>
                    <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder={ar('مثال: مركبات', 'e.g. Vehicles')} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('الموقع', 'Location')}</label>
                    <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder={ar('مثال: مخزن أ', 'e.g. Warehouse A')} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('المورد', 'Vendor')}</label>
                    <input className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} placeholder={ar('اسم المورد', 'Vendor name')} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('انتهاء الضمان', 'Warranty Expiry')}</label>
                    <input className="input" type="date" value={form.warranty_expiry_date} onChange={e => setForm({ ...form, warranty_expiry_date: e.target.value })} />
                  </div>

                </div>

                {/* ── قسم: بيانات الشراء والاستهلاك ── */}
                <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  {ar('بيانات الشراء والاستهلاك', 'Purchase & Depreciation')}
                </p>
                <div className="form-grid form-grid-2" style={{ marginBottom: '1.25rem' }}>

                  <div className="input-group">
                    <label className="input-label">{ar('تاريخ الشراء', 'Purchase Date')} *</label>
                    <input className="input" type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('قيمة الشراء', 'Purchase Value')} *</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.purchase_value} onChange={e => setForm({ ...form, purchase_value: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('العمر الافتراضي (سنة)', 'Useful Life (years)')} *</label>
                    <input className="input" type="number" min="1" value={form.useful_life_years} onChange={e => setForm({ ...form, useful_life_years: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('القيمة التخريدية', 'Salvage Value')}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.salvage_value} onChange={e => setForm({ ...form, salvage_value: e.target.value })} />
                  </div>

                  <div className="input-group">
                    <label className="input-label">{ar('طريقة الاستهلاك', 'Depreciation Method')}</label>
                    <select className="input" value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value, depreciation_rate: '' })}>
                      {DEP_METHODS.map(m => <option key={m} value={m}>{methodLabel(m)}</option>)}
                    </select>
                  </div>

                  {form.depreciation_method === 'declining_balance' && (
                    <div className="input-group">
                      <label className="input-label">{ar('معدل الاستهلاك (%)', 'Depreciation Rate (%)')} *</label>
                      <input className="input" type="number" min="0" max="100" step="0.01" value={form.depreciation_rate} onChange={e => setForm({ ...form, depreciation_rate: e.target.value })} />
                    </div>
                  )}

                  <div className="input-group" style={{ gridColumn: form.depreciation_method !== 'declining_balance' ? '2' : '1' }}>
                    <label className="input-label">{ar('الحالة', 'Status')}</label>
                    <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </select>
                  </div>

                </div>

                {/* ── قسم: بيانات الاستبعاد (يظهر فقط عند disposed) ── */}
                {form.status === 'disposed' && (
                  <>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                      ⚠️ {ar('بيانات الاستبعاد', 'Disposal Details')}
                    </p>
                    <div className="form-grid form-grid-2">

                      <div className="input-group">
                        <label className="input-label">{ar('تاريخ الاستبعاد', 'Disposal Date')} *</label>
                        <input className="input" type="date" value={form.disposal_date} onChange={e => setForm({ ...form, disposal_date: e.target.value })} />
                      </div>

                      <div className="input-group">
                        <label className="input-label">{ar('قيمة الاستبعاد', 'Disposal Value')}</label>
                        <input className="input" type="number" min="0" step="0.01" value={form.disposal_value} onChange={e => setForm({ ...form, disposal_value: e.target.value })} />
                      </div>

                      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="input-label">{ar('سبب الاستبعاد', 'Disposal Reason')}</label>
                        <input className="input" value={form.disposal_reason} onChange={e => setForm({ ...form, disposal_reason: e.target.value })} placeholder={ar('مثال: بيع، تلف، إهلاك كامل', 'e.g. Sold, Damaged, Fully depreciated')} />
                      </div>

                    </div>
                  </>
                )}

                {formErr && (
                  <div style={{ color: 'var(--color-danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    ⚠️ {formErr}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>{t('cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('loading') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════
          MODAL: Depreciation Schedule
      ══════════════════════════════════════ */}
      {depModal && isMounted && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => { setDepModal(false); setDepSchedule([]) }}
        >
          <div
            style={{ maxWidth: 640, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{ar('جدول الاستهلاك', 'Depreciation Schedule')}</h3>
                {depAsset && (
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {depAsset.name} — {methodLabel(depAsset.depreciation_method)}
                  </p>
                )}
              </div>
              <button type="button" className="btn-icon" onClick={() => { setDepModal(false); setDepSchedule([]) }}>✕</button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 0 }}>
              {depLoading ? (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
                </div>
              ) : depAsset && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', padding: '1rem 1.25rem' }}>
                    {[
                      { label: ar('قيمة الشراء',    'Purchase Value'), value: fmt(depAsset.purchase_value),     icon: '💰' },
                      { label: ar('القيمة التخريدية', 'Salvage Value'), value: fmt(depAsset.salvage_value ?? 0), icon: '🏷️' },
                      { label: ar('القيمة الدفترية', 'Book Value'),     value: fmt(calcBookValue(depAsset)),     icon: '📋' },
                    ].map(card => (
  <div key={card.label} className="stat-card">
    <div className="stat-icon">{card.icon}</div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p className="stat-value" style={{
        fontSize: 'clamp(0.85rem, 2vw, 1.25rem)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        margin: 0,
      }}>
        {card.value}
      </p>
      <p className="stat-label" style={{ margin: 0 }}>{card.label}</p>
    </div>
  </div>
))}
                  </div>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{ar('السنة', 'Year')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('قسط الاستهلاك', 'Annual Dep.')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('مجمع الاستهلاك', 'Accum. Dep.')}</th>
                          <th style={{ textAlign: 'end' }}>{ar('القيمة الدفترية', 'Book Value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depSchedule.map(row => (
                          <tr key={row.year}>
                            <td className="fw-semibold">{ar(`السنة ${row.year}`, `Year ${row.year}`)}</td>
                            <td style={{ textAlign: 'end' }}>{fmt(row.annual_depreciation)}</td>
                            <td style={{ textAlign: 'end' }}>{fmt(row.accumulated)}</td>
                            <td style={{ textAlign: 'end', fontWeight: 600 }}>{fmt(row.book_value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ padding: '0.75rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    * {ar('الجدول محسوب بناءً على بيانات الأصل الحالية', 'Schedule calculated based on current asset data')}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => { setDepModal(false); setDepSchedule([]) }}>{t('close')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ══════════════════════════════════════
          MODAL: تأكيد الحذف
      ══════════════════════════════════════ */}
      {deleteId && isMounted && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999999 }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{ maxWidth: 400, width: '95%', background: 'var(--bg-card, #fff)', color: 'var(--text-color, #000)', borderRadius: 8, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">{ar('تأكيد الحذف', 'Confirm Delete')}</h3>
              <button type="button" className="btn-icon" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>{ar('هل أنت متأكد من حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to delete this asset? This action cannot be undone.')}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </ERPLayout>
  )
}