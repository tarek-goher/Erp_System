'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useToast } from '../../hooks/useToast'
import { EmptyState, ToastContainer } from '../../components/ui'

interface Service {
  id: number
  name: string
  description: string
  icon: string
  category: 'IT' | 'HR' | 'Admin' | 'Finance' | 'Other'
  default_priority: string
  sla_hours: number
  is_active: boolean
}

const CAT_ICONS: Record<string, string> = { IT: '💻', HR: '👥', Admin: '📋', Finance: '💰', Other: '⭐' }
const CAT_LABELS: Record<string, string> = { IT: 'تقنية المعلومات', HR: 'الموارد البشرية', Admin: 'الإدارة', Finance: 'المالية', Other: 'أخرى' }
const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'var(--color-danger)',
  high: 'var(--color-warning)',
  medium: 'var(--color-info)',
  low: 'var(--color-success)',
}

const MOCK_SERVICES: Service[] = [
  { id: 1, name: 'دعم تقني', description: 'مشكلة في الكمبيوتر أو البرنامج أو الشبكة', icon: '🔧', category: 'IT', default_priority: 'high', sla_hours: 4, is_active: true },
  { id: 2, name: 'طلب جهاز جديد', description: 'طلب لابتوب أو كمبيوتر أو أي جهاز', icon: '💻', category: 'IT', default_priority: 'medium', sla_hours: 48, is_active: true },
  { id: 3, name: 'إجازة سنوية', description: 'تقديم طلب إجازة مدفوعة', icon: '🏖️', category: 'HR', default_priority: 'low', sla_hours: 24, is_active: true },
  { id: 4, name: 'شهادة راتب', description: 'طلب شهادة راتب أو خطاب توظيف', icon: '📄', category: 'HR', default_priority: 'medium', sla_hours: 8, is_active: true },
  { id: 5, name: 'صرف مصاريف', description: 'تسوية مصاريف عمل أو سلفة', icon: '💰', category: 'Finance', default_priority: 'medium', sla_hours: 72, is_active: true },
  { id: 6, name: 'طلب مستلزمات مكتبية', description: 'ورق، أقلام، ملفات وغيرها', icon: '📦', category: 'Admin', default_priority: 'low', sla_hours: 48, is_active: true },
]

const CATEGORIES = ['IT', 'HR', 'Admin', 'Finance', 'Other']

export default function ServiceDeskPage() {
  const { toasts, show, remove } = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isMock, setIsMock] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = async (category?: string | null) => {
    setLoading(true)
    let endpoint = '/employee/catalog'
    if (category) endpoint += `?category=${category}`
    const res = await api.get(endpoint)
    const raw = res.data
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : null)
    if (list) { setServices(list); setIsMock(false) }
    else { setServices(MOCK_SERVICES); setIsMock(true) }
    setLoading(false)
  }

  useEffect(() => { load(selectedCategory) }, [selectedCategory])

  const filtered = services.filter(s => {
    const matchCat = !selectedCategory || s.category === selectedCategory
    const matchSearch = !search || s.name.includes(search) || s.description.includes(search)
    return matchCat && matchSearch && s.is_active
  })

  return (
    <ERPLayout pageTitle="مكتب الخدمات">
      <ToastContainer toasts={toasts} remove={remove} />

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 مكتب الخدمات</h1>
          <p className="page-subtitle">اختر الخدمة المناسبة وقدّم طلبك بسهولة</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isMock && (
            <span style={{ padding: '4px 10px', background: 'var(--color-warning-light)', color: 'var(--color-warning)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>
              ⚠️ بيانات تجريبية
            </span>
          )}
          <Link href="/service-desk/my-requests" className="btn btn-secondary btn-sm">📋 طلباتي</Link>
          <Link href="/service-desk/new-request" className="btn btn-primary btn-sm">+ طلب جديد</Link>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          className="input"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 ابحث عن خدمة..."
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedCategory(null)}
        >
          🌐 كل الخدمات
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {CAT_ICONS[cat]} {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="لا توجد خدمات مطابقة" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {filtered.map(s => (
            <Link key={s.id} href={`/service-desk/new-request?service_id=${s.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1.5rem', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', transition: 'all 0.2s',
                height: '100%', display: 'flex', flexDirection: 'column',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-primary)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
              >
                {/* Icon & Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: '2.5rem' }}>{s.icon || CAT_ICONS[s.category]}</span>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                    {CAT_ICONS[s.category]} {s.category}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: 'var(--text-primary)' }}>{s.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1, marginBottom: 12 }}>{s.description}</p>

                {/* Footer */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
                    ⏱️ {s.sla_hours}h
                  </span>
                  <span style={{
                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: `${PRIORITY_COLORS[s.default_priority] || 'var(--color-info)'}20`,
                    color: PRIORITY_COLORS[s.default_priority] || 'var(--color-info)',
                  }}>
                    {s.default_priority === 'urgent' ? '🔴' : s.default_priority === 'high' ? '🟠' : s.default_priority === 'medium' ? '🟡' : '🟢'} {s.default_priority}
                  </span>
                  <span style={{ marginRight: 'auto', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>تقديم طلب →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </ERPLayout>
  )
}
