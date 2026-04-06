'use client'

// ══════════════════════════════════════════════════════════
// PageTemplate — نموذج لأي صفحة جديدة
// ══════════════════════════════════════════════════════════
// انسخ الملف ده وغيّر:
//   1. نوع Item حسب البيانات بتاعتك
//   2. ENDPOINT → اسم الـ API endpoint
//   3. COLUMNS  → أعمدة الجدول
//   4. حقول الفورم في <Modal>
//   5. اسم الصفحة في pageTitle
//
// الـ pagination والـ search والـ sort شغالين تلقائياً ✅
// ══════════════════════════════════════════════════════════

import { useState, FormEvent } from 'react'
import ERPLayout           from '../layout/ERPLayout'
import { DataTable }       from './DataTable'
import type { DataTableColumn, SortDir } from './DataTable'
import { Modal }           from './Modal'
import { StatCard }        from './StatCard'
import { LoadingSpinner }  from './LoadingSpinner'
import { useApi, useMutation } from '../../hooks/useApi'
import { useToast }        from '../../hooks/useToast'
import { useI18n }         from '../../lib/i18n'

// ─── 1. غيّر النوع ده حسب بياناتك ─────────────────────────
type Item = {
  id: number
  name: string
  [key: string]: any
}

// ─── 2. غيّر الـ endpoint ──────────────────────────────────
const ENDPOINT = '/items'

// ─── 3. غيّر الأعمدة ───────────────────────────────────────
const COLUMNS: DataTableColumn[] = [
  { key: 'id',   label: '#',    width: '60px' },
  { key: 'name', label: 'الاسم', sortable: true },
  { key: 'actions', label: '' },
]

// ─── النموذج الافتراضي للفورم ──────────────────────────────
const EMPTY_FORM = { name: '' }

export default function TemplatePage() {
  const { t, lang } = useI18n()
  const toast = useToast()

  // ─── حالات الصفحة ────────────────────────────────────────
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState('')
  const [sortDir,  setSortDir]  = useState<SortDir>(null)
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  // ─── بناء الـ endpoint مع الـ query params ───────────────
  const sortParam = sortKey && sortDir ? `&sort=${sortKey}&dir=${sortDir}` : ''
  const query = `${ENDPOINT}?page=${page}&search=${encodeURIComponent(search)}${sortParam}`

  // ─── جلب البيانات ──────────────────────────────────────
  const { data, loading, refetch } = useApi<{ data: Item[]; total: number; per_page: number }>(query)
  const items    = data?.data      ?? []
  const total    = data?.total     ?? 0
  const perPage  = data?.per_page  ?? 20

  // ─── mutations ──────────────────────────────────────────
  const createMutation = useMutation('POST',   ENDPOINT)
  const updateMutation = useMutation('PUT',    `${ENDPOINT}/${editItem?.id}`)
  const deleteMutation = useMutation('DELETE', `${ENDPOINT}/${deleteId}`)

  // ─── فتح مودال الإضافة ──────────────────────────────────
  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setModal(true)
  }

  // ─── فتح مودال التعديل ──────────────────────────────────
  const openEdit = (item: Item) => {
    setEditItem(item)
    setForm({ name: item.name })
    setModal(true)
  }

  // ─── حفظ (إضافة أو تعديل) ───────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const mutation = editItem ? updateMutation : createMutation
    const { error } = await mutation.mutate(form)
    if (error) { toast.error(error); return }
    toast.success(editItem ? 'تم التعديل بنجاح' : 'تمت الإضافة بنجاح')
    setModal(false)
    refetch()
  }

  // ─── حذف ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    const { error } = await deleteMutation.mutate()
    if (error) { toast.error(error); return }
    toast.success('تم الحذف بنجاح')
    setDeleteId(null)
    refetch()
  }

  // ─── الـ sort ─────────────────────────────────────────────
  const handleSort = (key: string, dir: SortDir) => {
    setSortKey(key)
    setSortDir(dir)
    setPage(1)
  }

  // ─── البحث (بيرجع للصفحة الأولى) ────────────────────────
  const handleSearch = (q: string) => {
    setSearch(q)
    setPage(1)
  }

  // ─── renderCell: تخصيص خلايا معينة ─────────────────────
  const renderCell = (key: string, value: any, row: Item) => {
    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(row)}>✏️</button>
          <button className="btn btn-sm btn-danger"    onClick={() => setDeleteId(row.id)}>🗑️</button>
        </div>
      )
    }
    return value ?? '—'
  }

  return (
    <ERPLayout pageTitle={t('dashboard')}>

      {/* ── بطاقات الإحصائيات ─────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard icon="📦" label="إجمالي العناصر" value={total} />
      </div>

      {/* ── الـ Card الرئيسي ──────────────────────────────── */}
      <div className="card">
        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{t('dashboard')}</h2>
          <button className="btn btn-primary" onClick={openAdd}>
            + {lang === 'ar' ? 'إضافة' : 'Add'}
          </button>
        </div>

        {/* الجدول */}
        <DataTable
          columns={COLUMNS}
          rows={items}
          total={total}
          page={page}
          perPage={perPage}
          loading={loading}
          onPageChange={setPage}
          onSearch={handleSearch}
          onSort={handleSort}
          renderCell={renderCell}
          emptyText={lang === 'ar' ? 'لا توجد بيانات' : 'No data found'}
        />
      </div>

      {/* ── مودال الإضافة / التعديل ───────────────────────── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editItem ? 'تعديل' : 'إضافة جديد'}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setModal(false)}>
              إلغاء
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit as any}
              disabled={createMutation.loading || updateMutation.loading}
            >
              {createMutation.loading || updateMutation.loading ? '...' : 'حفظ'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* ─ مثال: حقل الاسم ─ */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>الاسم *</label>
            <input
              className="input"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="أدخل الاسم"
            />
          </div>
          {/* أضف باقي الحقول هنا */}
        </div>
      </Modal>

      {/* ── مودال تأكيد الحذف ─────────────────────────────── */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="تأكيد الحذف"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>إلغاء</button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={deleteMutation.loading}
            >
              {deleteMutation.loading ? '...' : 'حذف'}
            </button>
          </>
        }
      >
        <p>هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع.</p>
      </Modal>

    </ERPLayout>
  )
}
