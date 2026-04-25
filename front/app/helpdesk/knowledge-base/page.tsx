'use client'
import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import ERPLayout from '@/components/layout/ERPLayout'
import { StatCard, Badge, Modal, SearchInput, LoadingSpinner } from '@/components/ui'
// import './knowledge-base.css'

type KnowledgeArticle = {
  id: string | number
  title: string
  content: string
  category?: string
  tags?: string[]
  is_published: boolean
  views: number
  created_at: string
  updated_at: string
}

// الـ API بيستخدم title/content/tags مش name/body
type CannedResponse = {
  id: string | number
  title: string
  content: string
  tags?: string[]
  created_at: string
}

type KBStats = {
  total_articles: number
  published_articles: number
  total_views: number
  average_views: number
  categories_count: number
}

export default function KnowledgeBasePage() {
  const { show } = useToast()

  const [activeTab, setActiveTab] = useState<'articles' | 'canned' | 'stats'>('articles')

  const [articles,        setArticles]        = useState<KnowledgeArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [articleForm,     setArticleForm]     = useState({ title:'', content:'', category:'', tags:'', is_published:false })

  const [canned,        setCanned]        = useState<CannedResponse[]>([])
  const [selectedCanned, setSelectedCanned] = useState<CannedResponse | null>(null)
  const [showCannedForm, setShowCannedForm] = useState(false)
  const [cannedForm,     setCannedForm]    = useState({ title:'', content:'', tags:'' })

  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter,   setStatusFilter]   = useState('all')  // ← جديد: الكل / منشورة / مسودة
  const [stats,          setStats]          = useState<KBStats>({ total_articles:0, published_articles:0, total_views:0, average_views:0, categories_count:0 })
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [articlesRes, cannedRes] = await Promise.all([
        api.get('/knowledge?per_page=100'),
        api.get('/canned-responses?per_page=100'),
      ])
      const articlesList = (articlesRes.data?.data || articlesRes.data || []).map((a: any) => ({
        ...a,
        content: String(a.content || ''),
        title: String(a.title || ''),
      }))
      const cannedList   = cannedRes.data?.data   || cannedRes.data   || []
      setArticles(articlesList)
      setCanned(cannedList)
      setStats({
        total_articles:     articlesList.length,
        published_articles: articlesList.filter((a: any) => a.is_published).length,
        total_views:        articlesList.reduce((s: number, a: any) => s + (a.views || 0), 0),
        average_views:      articlesList.length > 0
          ? Math.round(articlesList.reduce((s: number, a: any) => s + (a.views || 0), 0) / articlesList.length) : 0,
        categories_count: new Set(articlesList.map((a: any) => a.category).filter(Boolean)).size,
      })
    } catch (error) { 
      show('خطأ في تحميل البيانات', 'error') 
    }
    finally { setLoading(false) }
  }

  // ── Articles CRUD ──────────────────────────────────────────────
  const createArticle = async () => {
    if (!articleForm.title || !articleForm.content) { show('العنوان والمحتوى مطلوبان', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...articleForm,
        tags: articleForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      const res = await api.post('/knowledge', payload)
      if (res.error) { 
        show(res.error, 'error') 
      }
      else { 
        show('تم إنشاء المقالة بنجاح', 'success')
        setShowArticleForm(false)
        setArticleForm({ title:'', content:'', category:'', tags:'', is_published:false })
        setTimeout(() => loadData(), 500)
      }
    } catch (error) { 
      show('خطأ في إنشاء المقالة', 'error') 
    }
    finally { setSaving(false) }
  }

  const updateArticle = async () => {
    if (!selectedArticle) return
    setSaving(true)
    try {
      const res = await api.put(`/knowledge/${selectedArticle.id}`, {
        ...articleForm,
        tags: articleForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      if (res.error) { show(res.error, 'error') }
      else { 
        show('تم التحديث', 'success')
        setShowArticleForm(false)
        setSelectedArticle(null)
        setTimeout(() => loadData(), 500)
      }
    } catch (error) { 
      show('خطأ في التحديث', 'error') 
    }
    finally { setSaving(false) }
  }

  const deleteArticle = async (id: string | number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المقالة؟')) return
    try {
      const res = await api.delete(`/knowledge/${id}`)
      if (res.error) { show(res.error, 'error') } else { show('تم الحذف', 'success'); loadData() }
    } catch { show('خطأ في الحذف', 'error') }
  }

  // ── Canned Responses CRUD (title/content/tags) ────────────────
  const createCanned = async () => {
    if (!cannedForm.title || !cannedForm.content) { show('العنوان والمحتوى مطلوبان', 'error'); return }
    setSaving(true)
    try {
      const res = await api.post('/canned-responses', {
        title:   cannedForm.title,
        content: cannedForm.content,
        tags:    cannedForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      if (res.error) { show(res.error, 'error') }
      else { show('تم إنشاء الرد الجاهز', 'success'); setShowCannedForm(false); setCannedForm({ title:'', content:'', tags:'' }); loadData() }
    } catch { show('خطأ في الإنشاء', 'error') }
    finally { setSaving(false) }
  }

  const updateCanned = async () => {
    if (!selectedCanned) return
    setSaving(true)
    try {
      const res = await api.put(`/canned-responses/${selectedCanned.id}`, {
        title:   cannedForm.title,
        content: cannedForm.content,
        tags:    cannedForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      if (res.error) { show(res.error, 'error') }
      else { show('تم التحديث', 'success'); setShowCannedForm(false); setSelectedCanned(null); loadData() }
    } catch { show('خطأ في التحديث', 'error') }
    finally { setSaving(false) }
  }

  const deleteCanned = async (id: string | number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الرد؟')) return
    try {
      const res = await api.delete(`/canned-responses/${id}`)
      if (res.error) { show(res.error, 'error') }
      else { show('تم الحذف', 'success'); setCanned(p => p.filter(c => c.id !== id)) }
    } catch { show('خطأ في الحذف', 'error') }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text); show('تم النسخ إلى الحافظة', 'success')
  }

  const filteredArticles = articles.filter(a => {
    const ms = !search || String(a.title || '').toLowerCase().includes(search.toLowerCase()) || String(a.content || '').toLowerCase().includes(search.toLowerCase())
    const mc = categoryFilter === 'all' || a.category === categoryFilter
    const ms_status = statusFilter === 'all' || 
                      (statusFilter === 'published' && a.is_published) || 
                      (statusFilter === 'draft' && !a.is_published)
    return ms && mc && ms_status
  })

  const categories = articles.map(a => a.category).filter((c): c is string => Boolean(c)).filter((c,i,arr) => arr.indexOf(c) === i)

  if (loading) return <LoadingSpinner />

  return (
    <ERPLayout pageTitle="قاعدة المعرفة والردود الجاهزة">
      <div className="kb-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📚 قاعدة المعرفة</h1>
            <p className="page-subtitle">المقالات • الردود الجاهزة</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => {
            if (activeTab === 'articles') { setShowArticleForm(true); setSelectedArticle(null); setArticleForm({ title:'', content:'', category:'', tags:'', is_published:false }) }
            else if (activeTab === 'canned') { setShowCannedForm(true); setSelectedCanned(null); setCannedForm({ title:'', content:'', tags:'' }) }
          }}>
            {activeTab === 'articles' ? '+ مقالة جديدة' : activeTab === 'canned' ? '+ رد جاهز جديد' : ''}
          </button>
        </div>

        <div className="tabs-container">
          <button className={`tab ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')}>📖 المقالات ({articles.length})</button>
          <button className={`tab ${activeTab === 'canned'   ? 'active' : ''}`} onClick={() => setActiveTab('canned')}>💬 الردود الجاهزة ({canned.length})</button>
          <button className={`tab ${activeTab === 'stats'    ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>📊 الإحصائيات</button>
        </div>

        {/* ARTICLES */}
        {activeTab === 'articles' && (
          <div className="tab-content">
            <div className="filters-bar">
              <SearchInput value={search} onChange={setSearch} placeholder="بحث في المقالات..." />
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
                <option value="all">كل الفئات</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                <option value="all">الكل</option>
                <option value="published">منشورة</option>
                <option value="draft">مسودة</option>
              </select>
            </div>
            <div className="articles-grid">
              {filteredArticles.length === 0 ? (
                <div className="empty-state">📭 لا توجد مقالات</div>
              ) : (
                filteredArticles.map(article => (
                  <div key={article.id} className="article-card">
                    <div className="article-header">
                      <h3>{article.title}</h3>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {article.category && <Badge color="badge-info">{article.category}</Badge>}
                        {article.is_published ? <Badge color="success">منشورة</Badge> : <Badge color="gray">مسودة</Badge>}
                      </div>
                    </div>
                    <p className="article-excerpt">{String(article.content || 'بدون محتوى').substring(0, 150)}...</p>
                    <div className="article-meta">
                      <span>👁️ {article.views} عرض</span>
                      <span>📅 {new Date(article.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="article-tags">
                      {article.tags?.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                    </div>
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => {
                        setSelectedArticle(article)
                        setArticleForm({ title:article.title, content:article.content, category:article.category||'', tags:article.tags?.join(', ')||'', is_published:article.is_published })
                        setShowArticleForm(true)
                      }}>✏️ تعديل</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteArticle(article.id)}>🗑️ حذف</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CANNED RESPONSES */}
        {activeTab === 'canned' && (
          <div className="tab-content">
            <div className="canned-list">
              {canned.length === 0 ? (
                <div className="empty-state">📭 لا توجد ردود جاهزة</div>
              ) : (
                canned.map(response => (
                  <div key={response.id} className="canned-card">
                    <div className="canned-header">
                      <h4>{response.title}</h4>
                      {response.tags && response.tags.length > 0 && (
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {response.tags.map(tag => <Badge key={tag} color="badge-warning">#{tag}</Badge>)}
                        </div>
                      )}
                    </div>
                    <p className="canned-body">{response.content}</p>
                    <div className="canned-actions">
                      <button onClick={() => copyToClipboard(response.content)} className="btn btn-secondary btn-sm">📋 نسخ</button>
                      <button onClick={() => {
                        setSelectedCanned(response)
                        setCannedForm({ title:response.title, content:response.content, tags:response.tags?.join(', ')||'' })
                        setShowCannedForm(true)
                      }} className="btn btn-info btn-sm">✏️ تعديل</button>
                      <button onClick={() => deleteCanned(response.id)} className="btn btn-danger btn-sm">🗑️ حذف</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="tab-content">
            <div className="stats-grid">
              <StatCard icon="📄" label="إجمالي المقالات"   value={stats.total_articles} />
              <StatCard icon="✅" label="مقالات منشورة"     value={stats.published_articles} />
              <StatCard icon="👁️" label="إجمالي المشاهدات" value={stats.total_views} />
              <StatCard icon="📊" label="متوسط المشاهدات"  value={stats.average_views} />
            </div>
            <div className="insight-box">
              <h3>📈 الرؤى</h3>
              <p>عدد الفئات: <strong>{stats.categories_count}</strong></p>
              <p>نسبة النشر: <strong>{stats.total_articles > 0 ? ((stats.published_articles / stats.total_articles) * 100).toFixed(1) : 0}%</strong></p>
              <p>الردود الجاهزة: <strong>{canned.length}</strong></p>
            </div>
          </div>
        )}
      </div>

      {/* ARTICLE MODAL */}
      <Modal 
        isOpen={showArticleForm} 
        onClose={() => { setShowArticleForm(false); setSelectedArticle(null) }}
        title={selectedArticle ? 'تعديل المقالة' : 'مقالة جديدة'}
        footer={<><button className="btn btn-secondary" onClick={() => { setShowArticleForm(false); setSelectedArticle(null) }}>إغلاق</button><button className="btn btn-primary" onClick={selectedArticle ? updateArticle : createArticle} disabled={saving}>{saving ? 'جاري...' : selectedArticle ? 'تحديث' : 'إنشاء'}</button></>}
      >
        <form className="form">
          <div className="form-group"><label>العنوان</label><input type="text" value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title:e.target.value })} /></div>
          <div className="form-group"><label>الفئة</label><input type="text" value={articleForm.category} onChange={e => setArticleForm({ ...articleForm, category:e.target.value })} placeholder="مثال: المبيعات، الفواتير" /></div>
          <div className="form-group"><label>الكلمات المفتاحية (مفصولة بفواصل)</label><input type="text" value={articleForm.tags} onChange={e => setArticleForm({ ...articleForm, tags:e.target.value })} /></div>
          <div className="form-group"><label>المحتوى</label><textarea value={articleForm.content} onChange={e => setArticleForm({ ...articleForm, content:e.target.value })} rows={10} /></div>
          <div className="form-group checkbox">
            <input type="checkbox" checked={articleForm.is_published} onChange={e => setArticleForm({ ...articleForm, is_published:e.target.checked })} />
            <label>نشر المقالة</label>
          </div>
        </form>
      </Modal>

      {/* CANNED MODAL */}
      <Modal 
        isOpen={showCannedForm} 
        onClose={() => { setShowCannedForm(false); setSelectedCanned(null) }}
        title={selectedCanned ? 'تعديل الرد الجاهز' : 'رد جاهز جديد'}
        footer={<><button className="btn btn-secondary" onClick={() => { setShowCannedForm(false); setSelectedCanned(null) }}>إغلاق</button><button className="btn btn-primary" onClick={selectedCanned ? updateCanned : createCanned} disabled={saving}>{saving ? 'جاري...' : selectedCanned ? 'تحديث' : 'حفظ'}</button></>}
      >
        <form className="form">
          <div className="form-group"><label>عنوان الرد *</label><input type="text" value={cannedForm.title} onChange={e => setCannedForm({ ...cannedForm, title:e.target.value })} placeholder="مثال: شكراً على تواصلك" /></div>
          <div className="form-group"><label>الكلمات المفتاحية (اختياري، مفصولة بفواصل)</label><input type="text" value={cannedForm.tags} onChange={e => setCannedForm({ ...cannedForm, tags:e.target.value })} placeholder="ترحيب، شكر، متابعة" /></div>
          <div className="form-group"><label>محتوى الرد *</label><textarea value={cannedForm.content} onChange={e => setCannedForm({ ...cannedForm, content:e.target.value })} rows={6} /></div>
        </form>
      </Modal>
    </ERPLayout>
  )
}