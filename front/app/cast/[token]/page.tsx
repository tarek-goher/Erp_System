'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import './csat-form.css'

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

type TicketData = {
  id: string | number
  ref: string
  subject: string
  description?: string
  customer_name?: string
  resolved_at?: string
  created_at?: string
}

type PageState = 'loading' | 'form' | 'success' | 'error' | 'expired'

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const RATING_LABELS = {
  1: { ar: 'سيء جداً', emoji: '😢', desc: 'لم تحل المشكلة على الإطلاق' },
  2: { ar: 'سيء', emoji: '😞', desc: 'تم حل جزء من المشكلة' },
  3: { ar: 'عادي', emoji: '😐', desc: 'حل مقبول لكن ليس مثالياً' },
  4: { ar: 'جيد', emoji: '😊', desc: 'تم حل المشكلة بشكل جيد' },
  5: { ar: 'ممتاز', emoji: '😍', desc: 'خدمة استثنائية وحل مثالي' },
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function CsatPublicFormPage() {
  const params = useParams()
  const token = params?.token as string

  const [pageState, setPageState] = useState<PageState>('loading')
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // ─ LOAD TICKET DATA
  useEffect(() => {
    loadTicketData()
  }, [token])

  const loadTicketData = async () => {
    try {
      setPageState('loading')

      // تحميل بيانات التذكرة من الرابط
      const response = await fetch(`/api/csat/token/${token}`)

      if (!response.ok) {
        if (response.status === 404) {
          setPageState('expired')
          setErrorMessage('الرابط منتهي الصلاحية أو غير صحيح')
        } else {
          setPageState('error')
          setErrorMessage('حدث خطأ في تحميل البيانات')
        }
        return
      }

      const data = await response.json()
      setTicket(data.data || data)
      setPageState('form')
    } catch (error) {
      console.error('Error loading ticket:', error)
      setPageState('error')
      setErrorMessage('فشل في الاتصال بالخادم')
    }
  }

  const submitRating = async () => {
    if (!rating) {
      setErrorMessage('يرجى تحديد تقييم')
      return
    }

    if (!token) {
      setErrorMessage('رابط التقييم غير صحيح')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/csat/token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setErrorMessage(error.message || 'حدث خطأ في الإرسال')
        setPageState('error')
        return
      }

      setPageState('success')
    } catch (error) {
      console.error('Error submitting rating:', error)
      setErrorMessage('فشل في إرسال التقييم')
      setPageState('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER STATES
  // ═══════════════════════════════════════════════════════════════════════

  if (pageState === 'loading') {
    return (
      <div className="csat-form-page loading">
        <div className="spinner" />
        <p>جاري تحميل البيانات...</p>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="csat-form-page expired">
        <div className="error-container">
          <div className="error-icon">⏰</div>
          <h1>الرابط منتهي الصلاحية</h1>
          <p>أعتذر، لكن هذا الرابط لم يعد صالحاً للاستخدام.</p>
          <p className="info-text">
            إذا كنت تريد تقييم الخدمة، يرجى الاتصال بنا مباشرة أو طلب رابط جديد.
          </p>
          <Link href="/" className="btn btn-primary">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="csat-form-page success">
        <div className="success-container">
          <div className="success-icon">✅</div>
          <h1>شكراً لك!</h1>
          <p>تم استقبال تقييمك بنجاح</p>
          <p className="info-text">
            آراؤك وملاحظاتك مهمة جداً لنا ونستخدمها لتحسين خدماتنا باستمرار.
          </p>
          <Link href="/" className="btn btn-primary">
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'error' || !ticket) {
    return (
      <div className="csat-form-page error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h1>حدث خطأ</h1>
          <p>{errorMessage}</p>
          <button onClick={loadTicketData} className="btn btn-secondary">
            حاول مجدداً
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FORM RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="csat-form-page">
      <div className="csat-container">
        {/* HEADER */}
        <div className="csat-header">
          <h1>⭐ قيّم تجربتك</h1>
          <p>رأيك يساعدنا على تحسين الخدمة</p>
        </div>

        {/* TICKET INFO */}
        <div className="ticket-info-box">
          <div className="ticket-ref">#{ticket.ref}</div>
          <div className="ticket-subject">{ticket.subject}</div>
          {ticket.customer_name && (
            <div className="ticket-customer">👤 {ticket.customer_name}</div>
          )}
          {ticket.description && (
            <div className="ticket-description">{ticket.description}</div>
          )}
        </div>

        {/* RATING SELECTION */}
        <div className="rating-selection">
          <h3>كيف تقيّم الخدمة التي تلقيتها؟</h3>

          <div className="rating-options">
            {[1, 2, 3, 4, 5].map((value) => (
              <div
                key={value}
                className={`rating-option ${rating === value ? 'selected' : ''}`}
                onClick={() => setRating(value as 1 | 2 | 3 | 4 | 5)}
              >
                <div className="rating-emoji">
                  {RATING_LABELS[value as 1 | 2 | 3 | 4 | 5].emoji}
                </div>
                <div className="rating-label">
                  {RATING_LABELS[value as 1 | 2 | 3 | 4 | 5].ar}
                </div>
                <div className="rating-desc">
                  {RATING_LABELS[value as 1 | 2 | 3 | 4 | 5].desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STARS DISPLAY */}
        {rating && (
          <div className="stars-preview">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className={`star ${star <= rating ? 'filled' : 'empty'}`}>
                ⭐
              </span>
            ))}
          </div>
        )}

        {/* COMMENT */}
        <div className="comment-section">
          <h3>هل لديك ملاحظات أو اقتراحات؟ (اختياري)</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب رأيك وملاحظاتك هنا..."
            rows={4}
            maxLength={500}
          />
          <div className="char-count">{comment.length}/500</div>
        </div>

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="error-message">
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <button
          onClick={submitRating}
          disabled={!rating || isSubmitting}
          className="btn btn-primary btn-submit"
        >
          {isSubmitting ? '⏳ جاري الإرسال...' : '✅ إرسال التقييم'}
        </button>

        {/* FOOTER */}
        <div className="csat-footer">
          <p>شكراً لوقتك وملاحظاتك 🙏</p>
          <p className="privacy-notice">
            📋 تُستخدم البيانات لتحسين الخدمات فقط وفقاً لسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  )
}