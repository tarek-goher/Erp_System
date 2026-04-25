'use client'

// ══════════════════════════════════════════════════════════
// app/ai-assistant/page.tsx — المساعد الذكي
// ══════════════════════════════════════════════════════════
// API endpoints:
//   POST /api/ai/chat     → إرسال رسالة للمساعد الذكي
//   POST /api/ai/analyze  → تحليل بيانات المبيعات/المخزون
//   GET  /api/ai/insights → إحصائيات ورؤى تلقائية
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useRef, FormEvent } from 'react'
import ERPLayout from '../../components/layout/ERPLayout'
import { api } from '../../lib/api'
import { useI18n } from '../../lib/i18n'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type Insight = {
  title: string
  value: string | number
  icon: string
  type: 'info' | 'warning' | 'success' | 'danger'
  description?: string
}

type AnalyzeResult = {
  summary: string
  recommendations: string[]
  data?: any
}

const QUICK_PROMPTS = [
  { ar: 'كيف حال المبيعات هذا الشهر؟',   en: "How are sales this month?" },
  { ar: 'أي المنتجات الأكثر مبيعاً؟',      en: "Which products sell most?" },
  { ar: 'هل فيه عملاء معرضون للانسحاب؟',  en: "Are there at-risk customers?" },
  { ar: 'أعطني ملخصاً للمخزون',             en: "Give me inventory summary" },
]

const ANALYZE_TYPES = [
  { key: 'sales',     ar: 'تحليل المبيعات',   en: 'Analyze Sales' },
  { key: 'inventory', ar: 'تحليل المخزون',    en: 'Analyze Inventory' },
  { key: 'hr',        ar: 'تحليل الموارد البشرية', en: 'Analyze HR' },
  { key: 'finance',   ar: 'تحليل مالي',       en: 'Analyze Finance' },
]

let msgCounter = 0
const genId = () => `msg-${++msgCounter}-${Date.now()}`

export default function AIAssistantPage() {
  const { t, lang } = useI18n()
  const ar = (a: string, e: string) => lang === 'ar' ? a : e

  const [tab,       setTab]       = useState<'chat' | 'insights' | 'analyze'>('chat')
  const [messages,  setMessages]  = useState<ChatMessage[]>([
    {
      id: genId(),
      role: 'assistant',
      content: ar(
        'مرحباً! أنا مساعدك الذكي في نظام ERP. يمكنني مساعدتك في تحليل البيانات، والإجابة على استفساراتك حول المبيعات والمخزون والموارد البشرية.',
        "Hello! I'm your ERP AI assistant. I can help you analyze data and answer questions about sales, inventory, and HR."
      ),
      timestamp: new Date(),
    }
  ])
  const [input,     setInput]     = useState('')
  const [sending,   setSending]   = useState(false)

  const [insights,      setInsights]      = useState<Insight[]>([])
  const [insightsLoad,  setInsightsLoad]  = useState(false)

  const [analyzeType,   setAnalyzeType]   = useState('sales')
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)
  const [analyzing,     setAnalyzing]     = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(scrollToBottom, [messages])

  const fetchInsights = async () => {
    setInsightsLoad(true)
    const res = await api.get<{ insights: Insight[] } | Insight[]>('/ai/insights')
    if (res.data) {
      const data = Array.isArray(res.data) ? res.data : (res.data as any).insights || []
      setInsights(data)
    }
    setInsightsLoad(false)
  }

  useEffect(() => {
    if (tab === 'insights') fetchInsights()
  }, [tab])

  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSending(true)

    const res = await api.post<{ reply?: string; message?: string; response?: string }>('/ai/chat', { message: text })
    const reply = res.data?.reply || res.data?.message || res.data?.response || ar('حدث خطأ في الاستجابة', 'An error occurred')

    const botMsg: ChatMessage = { id: genId(), role: 'assistant', content: reply, timestamp: new Date() }
    setMessages(prev => [...prev, botMsg])
    setSending(false)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeResult(null)
    const res = await api.post<AnalyzeResult>('/ai/analyze', { type: analyzeType })
    if (res.data) setAnalyzeResult(res.data)
    else if (res.error) setAnalyzeResult({ summary: res.error, recommendations: [] })
    setAnalyzing(false)
  }

  const insightBg = (type: string) => ({
    info:    'var(--color-primary)',
    warning: 'var(--color-warning)',
    success: 'var(--color-success)',
    danger:  'var(--color-danger)',
  }[type] || 'var(--color-primary)')

  return (
    <ERPLayout pageTitle={ar('المساعد الذكي', 'AI Assistant')}>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { id: 'chat',     label: ar('💬 المحادثة', '💬 Chat') },
          { id: 'insights', label: ar('📊 الرؤى',    '📊 Insights') },
          { id: 'analyze',  label: ar('🔍 تحليل',    '🔍 Analyze') },
        ].map(tab_ => (
          <button
            key={tab_.id}
            className={`btn ${tab === tab_.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(tab_.id as any)}
          >
            {tab_.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* Tab 1: Chat                                         */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 240px)', minHeight: 480 }}>

          {/* Quick Prompts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                className="btn btn-secondary btn-sm"
                onClick={() => { setInput(lang === 'ar' ? p.ar : p.en); }}
                style={{ fontSize: '0.8rem' }}
              >
                {lang === 'ar' ? p.ar : p.en}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="card" style={{ flex: 1, overflow: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '78%',
                  padding: '0.65rem 1rem',
                  borderRadius: msg.role === 'user'
                    ? 'var(--radius) var(--radius) 4px var(--radius)'
                    : 'var(--radius) var(--radius) var(--radius) 4px',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', opacity: 0.65, textAlign: msg.role === 'user' ? 'end' : 'start' }}>
                    {msg.timestamp.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.65rem 1rem', borderRadius: 'var(--radius)', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `pulse 1s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.65rem', marginTop: '0.75rem' }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder={ar('اكتب سؤالك هنا...', 'Type your question here...')}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !input.trim()}
              style={{ minWidth: 80 }}
            >
              {sending ? '...' : ar('إرسال', 'Send')}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* Tab 2: Insights                                      */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === 'insights' && (
        <div>
          <div className="toolbar" style={{ marginBottom: '1rem' }}>
            <div />
            <button className="btn btn-secondary" onClick={fetchInsights} disabled={insightsLoad}>
              🔄 {ar('تحديث', 'Refresh')}
            </button>
          </div>

          {insightsLoad ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1rem' }}>
              {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
            </div>
          ) : insights.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🤖</div>
              <p className="empty-state-text">{ar('لا توجد رؤى متاحة', 'No insights available')}</p>
              <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={fetchInsights}>
                {ar('تحميل الرؤى', 'Load Insights')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
              {insights.map((insight, i) => (
                <div key={i} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius)',
                    background: `${insightBg(insight.type)}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.35rem', flexShrink: 0,
                  }}>
                    {insight.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: insightBg(insight.type) }}>
                      {insight.value}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontWeight: 600, fontSize: '0.875rem' }}>{insight.title}</p>
                    {insight.description && (
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{insight.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* Tab 3: Analyze                                       */}
      {/* ════════════════════════════════════════════════════ */}
      {tab === 'analyze' && (
        <div>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="input-group" style={{ margin: 0, flex: '0 0 220px' }}>
                <label className="input-label">{ar('نوع التحليل', 'Analysis Type')}</label>
                <select className="input" value={analyzeType} onChange={e => setAnalyzeType(e.target.value)}>
                  {ANALYZE_TYPES.map(a => (
                    <option key={a.key} value={a.key}>{lang === 'ar' ? a.ar : a.en}</option>
                  ))}
                </select>
              </div>
              <div style={{ paddingTop: '1.4rem' }}>
                <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? '...' : ar('🔍 تحليل', '🔍 Analyze')}
                </button>
              </div>
            </div>
          </div>

          {analyzing && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
            </div>
          )}

          {!analyzing && analyzeResult && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* الملخص */}
              <div>
                <h4 className="fw-semibold" style={{ marginBottom: '0.5rem' }}>
                  {ar('📋 الملخص', '📋 Summary')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {analyzeResult.summary}
                </p>
              </div>

              {/* التوصيات */}
              {analyzeResult.recommendations?.length > 0 && (
                <div>
                  <h4 className="fw-semibold" style={{ marginBottom: '0.5rem' }}>
                    {ar('💡 التوصيات', '💡 Recommendations')}
                  </h4>
                  <ul style={{ margin: 0, paddingInlineStart: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {analyzeResult.recommendations.map((rec, i) => (
                      <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.65 }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* بيانات إضافية */}
              {analyzeResult.data && (
                <div>
                  <h4 className="fw-semibold" style={{ marginBottom: '0.5rem' }}>
                    {ar('📈 البيانات', '📈 Data')}
                  </h4>
                  <pre style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: 300,
                    margin: 0,
                  }}>
                    {JSON.stringify(analyzeResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {!analyzing && !analyzeResult && (
            <div className="empty-state">
              <div className="empty-state-icon">🤖</div>
              <p className="empty-state-text">{ar('اختر نوع التحليل واضغط "تحليل"', 'Select analysis type and click "Analyze"')}</p>
            </div>
          )}
        </div>
      )}

    </ERPLayout>
  )
}
