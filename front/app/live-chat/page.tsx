'use client'
import React, { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import ERPLayout from '@/components/layout/ERPLayout'
import { StatCard, Badge, Modal, SearchInput, LoadingSpinner } from '@/components/ui'
import './live-chat.css'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type LiveChatVisitor = {
  id: string | number
  session_id: string
  name: string
  email?: string
  phone?: string
  ip_address?: string
  browser?: string
  device?: string
  current_page?: string
  status: 'online' | 'idle' | 'offline'
  last_activity_at: string
}

type LiveChatSession = {
  id: string | number
  visitor_id: string | number
  visitor: LiveChatVisitor
  agent_id?: string | number
  agent?: { id: string | number; name: string; email?: string }
  session_token: string
  status: 'pending' | 'active' | 'closed' | 'transferred'
  started_at: string
  assigned_at?: string
  ended_at?: string
  wait_time_seconds?: number
  chat_duration_seconds?: number
  messages?: LiveChatMessage[]
}

type LiveChatMessage = {
  id: string | number
  session_id: string | number
  sender_id?: string | number
  sender_type: 'visitor' | 'agent' | 'bot'
  sender?: { id: string | number; name: string }
  message: string
  message_type: 'text' | 'file' | 'image'
  is_read: boolean
  read_at?: string
  created_at: string
}

type LiveChatAgent = {
  id: string | number
  user_id: string | number
  status: 'available' | 'busy' | 'away' | 'offline'
  current_chats: number
  max_concurrent_chats: number
  user?: { id: string | number; name: string; email?: string }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function LiveChatPage() {
//   const { api } = useApi()
  const { toasts, show, remove } = useToast()

  // Sessions & Messages
  const [sessions, setSessions] = useState<LiveChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<LiveChatSession | null>(null)
  const [messages, setMessages] = useState<LiveChatMessage[]>([])
  const [agents, setAgents] = useState<LiveChatAgent[]>([])

  // Form
  const [newMessage, setNewMessage] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('')

  // Status
  const [loading, setLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'active' | 'closed'>('all')

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Load Data
  useEffect(() => {
    loadData()
    // Real-time polling (في production استخدم WebSocket)
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadData = async () => {
    try {
      const [sessionsRes, agentsRes] = await Promise.all([
        api.get('/live-chat/sessions/pending'),
        api.get('/live-chat/agents/available'),
      ])

      setSessions(sessionsRes.data?.data || sessionsRes.data || [])
      setAgents(agentsRes.data?.data || agentsRes.data || [])

      if (selectedSession?.id) {
        const messagesRes = await api.get(`/live-chat/sessions/${selectedSession.id}/messages`)
        setMessages(messagesRes.data?.data || messagesRes.data || [])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      if (loading) {
        show('خطأ في تحميل البيانات', 'error')
        setLoading(false)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return

    try {
   const res = await api.post('/live-chat/messages/send', {
  session_id: selectedSession.id,
  message: newMessage,
  message_type: 'text',
})

      if (res.error) {
        show(res.error, 'error')
      } else {
        setMessages([...messages, res.data])
        setNewMessage('')
        show('تم إرسال الرسالة', 'success')
      }
    } catch (error) {
      show('خطأ في إرسال الرسالة', 'error')
    }
  }

  const assignSession = async (agentId: string) => {
    if (!selectedSession || !agentId) return

    try {
      const res = await api.post(
        `/live-chat/sessions/${selectedSession.id}/assign`,
        { agent_id: agentId }
      )

      if (res.error) {
        show(res.error, 'error')
      } else {
        setSelectedSession(res.data)
        setSessions(prev =>
          prev.map(s => s.id === selectedSession.id ? res.data : s)
        )
        setAssignedAgent('')
        show('تم تعيين الموظف', 'success')
      }
    } catch (error) {
      show('خطأ في التعيين', 'error')
    }
  }

  const closeSession = async () => {
    if (!selectedSession) return

    try {
      const res = await api.post(`/live-chat/sessions/${selectedSession.id}/close`)

      if (res.error) {
        show(res.error, 'error')
      } else {
        setSessions(prev => prev.filter(s => s.id !== selectedSession.id))
        setSelectedSession(null)
        show('تم إغلاق المحادثة', 'success')
      }
    } catch (error) {
      show('خطأ في الإغلاق', 'error')
    }
  }

  const handleTyping = () => {
    if (!selectedSession) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    setIsTyping(true)
    api.post(`/live-chat/sessions/${selectedSession.id}/typing`, {
      is_typing: true,
    })

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 3000)
  }

  const filteredSessions = sessions.filter(s => {
    const matchFilter = sessionFilter === 'all' || s.status === sessionFilter
    return matchFilter
  })

  const stats = {
    total_sessions: sessions.length,
    active_sessions: sessions.filter(s => s.status === 'active').length,
    pending_sessions: sessions.filter(s => s.status === 'pending').length,
    available_agents: agents.filter(a => a.status === 'available').length,
  }

  if (loading && sessions.length === 0) {
    return <LoadingSpinner />
  }

  return (
    <ERPLayout pageTitle="نظام الدعم المباشر - Live Chat">
      <div className="live-chat-page">
        {/* HEADER */}
        <div className="page-header">
          <div>
            <h1 className="page-title">💬 نظام الدعم المباشر</h1>
            <p className="page-subtitle">محادثات مباشرة مع العملاء</p>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-bar">
          <StatCard icon="💬" label="إجمالي المحادثات" value={stats.total_sessions} />
          <StatCard icon="🟢" label="نشطة" value={stats.active_sessions} />
          <StatCard icon="⏳" label="قيد الانتظار" value={stats.pending_sessions} />
          <StatCard icon="👤" label="موظفون متاحون" value={stats.available_agents} />
        </div>

        <div className="chat-container">
          {/* SESSIONS LIST */}
          <div className="sessions-panel">
            <div className="sessions-header">
              <h3>المحادثات</h3>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value as any)}
                className="status-filter"
              >
                <option value="all">الكل ({sessions.length})</option>
                <option value="pending">قيد الانتظار</option>
                <option value="active">نشطة</option>
                <option value="closed">مغلقة</option>
              </select>
            </div>

            <div className="sessions-list">
              {filteredSessions.length === 0 ? (
                <div className="empty-state">لا توجد محادثات</div>
              ) : (
                filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-item ${selectedSession?.id === session.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSession(session)
                      if (session.messages) {
                        setMessages(session.messages)
                      }
                    }}
                  >
                    <div className="session-info">
                      <h4>{session.visitor.name}</h4>
                      <p className="email">{session.visitor.email || 'بدون بريد'}</p>
                    </div>

                    <div className="session-status">
                   <Badge
  color={
    session.status === 'active' ? 'badge-success' :
    session.status === 'pending' ? 'badge-warning' : 'badge-danger'
  }
>
  {session.status}
</Badge>
                    </div>

                    {session.agent && (
                      <div className="assigned-agent">
                        👤 {session.agent.name}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CHAT AREA */}
          <div className="chat-panel">
            {!selectedSession ? (
              <div className="empty-state" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>اختر محادثة لبدء الدعم</p>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}
                <div className="chat-header">
                  <div className="visitor-info">
                    <h3>{selectedSession.visitor.name}</h3>
                    <p>{selectedSession.visitor.email}</p>
                  </div>

                  <div className="chat-actions">
                    {selectedSession.status === 'pending' && (
                      <select
                        value={assignedAgent}
                        onChange={(e) => assignSession(e.target.value)}
                        className="assign-select"
                      >
                        <option value="">تعيين لموظف...</option>
                        {agents
                          .filter(a => a.status === 'available')
                          .map(agent => (
                            <option key={agent.id} value={agent.user_id}>
                              {agent.user?.name} ({agent.current_chats}/{agent.max_concurrent_chats})
                            </option>
                          ))}
                      </select>
                    )}

                    {selectedSession.status !== 'closed' && (
                      <button className="btn btn-danger btn-sm" onClick={closeSession}>
                        إغلاق المحادثة
                      </button>
                    )}
                  </div>
                </div>

                {/* VISITOR INFO */}
                <div className="visitor-details">
                  <span>🌍 {selectedSession.visitor.browser || 'متصفح غير معروف'}</span>
                  <span>📱 {selectedSession.visitor.device || 'جهاز غير معروف'}</span>
                  <span>🕐 {selectedSession.wait_time_seconds ? `انتظار: ${Math.round(selectedSession.wait_time_seconds / 60)} دقائق` : 'جديد'}</span>
                </div>

                {/* MESSAGES */}
                <div className="messages-area">
                  {messages.length === 0 ? (
                    <div className="messages-empty">ابدأ المحادثة...</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className={`message ${msg.sender_type}`}>
                        <div className="message-header">
                          <span className="sender">{msg.sender?.name || msg.sender_type}</span>
                          <span className="time">
                            {new Date(msg.created_at).toLocaleTimeString('ar-EG', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="message-content">{msg.message}</div>
                      </div>
                    ))
                  )}

                  {isTyping && (
                    <div className="message typing">
                      <span className="typing-indicator">
                        <span></span><span></span><span></span>
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* INPUT */}
                {selectedSession.status !== 'closed' && (
                  <div className="message-input">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="اكتب الرسالة..."
                      rows={2}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                    >
                      إرسال
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* AGENTS PANEL */}
          <div className="agents-panel">
            <h3>الموظفون</h3>
            <div className="agents-list">
              {agents.length === 0 ? (
                <p className="empty-text">لا يوجد موظفون</p>
              ) : (
                agents.map(agent => (
                  <div key={agent.id} className={`agent-item status-${agent.status}`}>
                    <div className="status-dot" />
                    <div className="agent-details">
                      <p className="name">{agent.user?.name}</p>
                      <p className="chats">{agent.current_chats}/{agent.max_concurrent_chats}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ERPLayout>
  )
}