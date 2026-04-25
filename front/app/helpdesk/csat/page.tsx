'use client'
import React, { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import ERPLayout from '@/components/layout/ERPLayout'
import { StatCard, Badge, SearchInput, LoadingSpinner } from '@/components/ui'
import './csat.css'

type CsatRating = {
  id: string | number
  ticket_id: string | number
  ticket: {
    id: string | number
    ref: string
    subject: string
    customer?: { name: string }
  }
  rating: 1 | 2 | 3 | 4 | 5
  comment?: string
  rated_at?: string
  created_at: string
}

type CsatStats = {
  total_ratings: number
  average_rating: number
  response_rate: number
  ratings_1: number
  ratings_2: number
  ratings_3: number
  ratings_4: number
  ratings_5: number
}

const RATING_LABELS = {
  1: { ar: 'سيء جداً', color: 'danger',  emoji: '😢' },
  2: { ar: 'سيء',      color: 'warning', emoji: '😞' },
  3: { ar: 'عادي',     color: 'info',    emoji: '😐' },
  4: { ar: 'جيد',      color: 'success', emoji: '😊' },
  5: { ar: 'ممتاز',    color: 'success', emoji: '😍' },
}

export default function CsatDashboardPage() {
  const { show } = useToast()

  const [activeTab, setActiveTab]       = useState<'dashboard' | 'ratings'>('dashboard')
  const [ratings,   setRatings]         = useState<CsatRating[]>([])
  const [stats,     setStats]           = useState<CsatStats>({
    total_ratings: 0, average_rating: 0, response_rate: 0,
    ratings_1: 0, ratings_2: 0, ratings_3: 0, ratings_4: 0, ratings_5: 0,
  })
  const [search,        setSearch]       = useState('')
  const [ratingFilter,  setRatingFilter] = useState<'all'|'1'|'2'|'3'|'4'|'5'>('all')
  const [selectedRating, setSelectedRating] = useState<CsatRating | null>(null)
  const [loading,       setLoading]      = useState(true)
  const [dateRange,     setDateRange]    = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to:   new Date().toISOString().split('T')[0],
  })

  useEffect(() => { loadData() }, [dateRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const [summaryRes, responsesRes] = await Promise.all([
        api.get(`/helpdesk/csat/summary?from=${dateRange.from}&to=${dateRange.to}`),
        api.get(`/helpdesk/csat/responses?from=${dateRange.from}&to=${dateRange.to}&per_page=100`),
      ])

      // summary endpoint
      if (summaryRes.data) {
        const s = summaryRes.data
        setStats({
          total_ratings:  s.total          ?? 0,
          average_rating: s.average        ?? 0,
          response_rate:  s.response_rate  ?? 0,
          ratings_1:      s.by_rating?.[1] ?? 0,
          ratings_2:      s.by_rating?.[2] ?? 0,
          ratings_3:      s.by_rating?.[3] ?? 0,
          ratings_4:      s.by_rating?.[4] ?? 0,
          ratings_5:      s.by_rating?.[5] ?? 0,
        })
      }

      // responses endpoint
      setRatings(responsesRes.data?.data || responsesRes.data || [])

    } catch {
      show('خطأ في تحميل البيانات', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filteredRatings = ratings.filter(r => {
    const ms = !search ||
      r.ticket.ref?.includes(search) ||
      r.ticket.subject?.toLowerCase().includes(search.toLowerCase()) ||
      r.ticket.customer?.name?.toLowerCase().includes(search.toLowerCase())
    const mr = ratingFilter === 'all' || r.rating.toString() === ratingFilter
    return ms && mr
  })

  const ratingPercentages = {
    1: stats.total_ratings > 0 ? (stats.ratings_1 / stats.total_ratings) * 100 : 0,
    2: stats.total_ratings > 0 ? (stats.ratings_2 / stats.total_ratings) * 100 : 0,
    3: stats.total_ratings > 0 ? (stats.ratings_3 / stats.total_ratings) * 100 : 0,
    4: stats.total_ratings > 0 ? (stats.ratings_4 / stats.total_ratings) * 100 : 0,
    5: stats.total_ratings > 0 ? (stats.ratings_5 / stats.total_ratings) * 100 : 0,
  }

  if (loading) return <LoadingSpinner />

  return (
    <ERPLayout pageTitle="تقييم رضا العملاء (CSAT)">
      <div className="csat-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">⭐ تقييم رضا العملاء</h1>
            <p className="page-subtitle">CSAT - Customer Satisfaction Score</p>
          </div>
        </div>

        <div className="tabs-container">
          <button className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            📊 لوحة التحكم
          </button>
          <button className={`tab ${activeTab === 'ratings' ? 'active' : ''}`} onClick={() => setActiveTab('ratings')}>
            📋 التقييمات ({ratings.length})
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <div className="date-range-filter">
              <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} />
              <span>إلى</span>
              <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} />
            </div>

            <div className="main-stats">
              <div className="stat-box">
                <div className="stat-value">{stats.average_rating.toFixed(1)}</div>
                <div className="stat-label">متوسط التقييم</div>
                <div className="star-display">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`star ${s <= Math.round(stats.average_rating) ? 'filled' : ''}`}>⭐</span>
                  ))}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.total_ratings}</div>
                <div className="stat-label">إجمالي التقييمات</div>
                <div className="stat-subtext">{stats.response_rate.toFixed(1)}% معدل الاستجابة</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.ratings_5}</div>
                <div className="stat-label">تقييمات ممتازة</div>
                <div className="stat-subtext">{ratingPercentages[5].toFixed(1)}%</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{stats.ratings_1}</div>
                <div className="stat-label">تقييمات سيئة</div>
                <div className="stat-subtext">{ratingPercentages[1].toFixed(1)}%</div>
              </div>
            </div>

            <div className="rating-distribution">
              <h3>توزيع التقييمات</h3>
              {[5,4,3,2,1].map(rating => {
                const count = stats[`ratings_${rating}` as keyof CsatStats] as number
                const pct   = ratingPercentages[rating as keyof typeof ratingPercentages]
                return (
                  <div key={rating} className="rating-bar">
                    <div className="rating-label">
                      <span>{RATING_LABELS[rating as 1|2|3|4|5].emoji}</span>
                      <span>{RATING_LABELS[rating as 1|2|3|4|5].ar}</span>
                    </div>
                    <div className="bar-container">
                      <div className={`bar bar-${rating}`} style={{ width:`${pct}%` }} />
                    </div>
                    <div className="rating-count">{count} ({pct.toFixed(1)}%)</div>
                  </div>
                )
              })}
            </div>

            <div className="insights-section">
              <h3>📈 الرؤى</h3>
              <div className="insights-grid">
                <div className="insight-card positive">
                  <h4>النقاط الإيجابية</h4>
                  <p>{(ratingPercentages[5] + ratingPercentages[4]).toFixed(1)}%</p>
                  <small>من العملاء راضون أو أكثر</small>
                </div>
                <div className="insight-card negative">
                  <h4>النقاط السلبية</h4>
                  <p>{(ratingPercentages[1] + ratingPercentages[2]).toFixed(1)}%</p>
                  <small>من العملاء غير راضين</small>
                </div>
                <div className="insight-card neutral">
                  <h4>تقييمات محايدة</h4>
                  <p>{ratingPercentages[3].toFixed(1)}%</p>
                  <small>تقييم عادي — يمكن تحسينه</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RATINGS TAB */}
        {activeTab === 'ratings' && (
          <div className="tab-content">
            <div className="filters-bar">
              <SearchInput value={search} onChange={setSearch} placeholder="بحث برقم التذكرة أو الموضوع..." />
              <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value as any)} className="filter-select">
                <option value="all">كل التقييمات</option>
                <option value="5">⭐⭐⭐⭐⭐ ممتاز</option>
                <option value="4">⭐⭐⭐⭐ جيد</option>
                <option value="3">⭐⭐⭐ عادي</option>
                <option value="2">⭐⭐ سيء</option>
                <option value="1">⭐ سيء جداً</option>
              </select>
            </div>

            <div className="ratings-list">
              {filteredRatings.length === 0 ? (
                <div className="empty-state"><p>📭 لا توجد تقييمات</p></div>
              ) : (
                filteredRatings.map(rating => (
                  <div
                    key={rating.id}
                    className={`rating-card ${selectedRating?.id === rating.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRating(rating)}
                  >
                    <div className="rating-card-header">
                      <div className="ticket-info">
                        <h4>#{rating.ticket.ref}</h4>
                        <p className="subject">{rating.ticket.subject}</p>
                        <p className="customer">👤 {rating.ticket.customer?.name || 'عميل بدون اسم'}</p>
                      </div>
                      <div className="rating-display">
                        <div className="stars">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className={`star ${s <= rating.rating ? 'filled' : ''}`}>⭐</span>
                          ))}
                        </div>
                        <div className="rating-text">
                          {RATING_LABELS[rating.rating].emoji} {RATING_LABELS[rating.rating].ar}
                        </div>
                      </div>
                    </div>
                    {rating.comment && (
                      <div className="comment-section">
                        <p className="comment-text">💬 "{rating.comment}"</p>
                      </div>
                    )}
                    <div className="rating-footer">
                      <span className="date">
                        📅 {new Date(rating.rated_at || rating.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ERPLayout>
  )
}