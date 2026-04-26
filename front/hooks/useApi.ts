'use client'

// ══════════════════════════════════════════════════════════
// useApi — hook موحّد لجلب البيانات من الـ API
//
// بيحل محل الـ useEffect + fetch المتكرر في كل صفحة
// وبيضيف: loading state + error handling + إعادة التحميل
//
// الاستخدام:
//   const { data, loading, error, refetch } = useApi<Customer[]>('/customers')
//
//   // مع query params ديناميكية:
//   const { data } = useApi<CustomerList>(`/customers?page=${page}&search=${search}`)
//
// ملاحظة: لما يتغير الـ endpoint (مثلاً تغيرت الـ page) بيعمل fetch تلقائي
//
// Fix #5: إصلاح AbortController — كان يُنشأ لكن signal لم يُمرَّر لـ fetch
// الآن api.get يقبل signal مباشرة ويُمرَّر لـ fetch فعلياً.
// النتيجة: عند تغيير الـ endpoint أو unmount الـ component، الطلب القديم
// يُلغى فعلياً ولا يُحدَّث state الـ component بعد التدمير (يمنع memory leak).
// ══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api'

interface UseApiOptions {
  enabled?: boolean  // لو false مش هيعمل fetch (مفيد لـ conditional queries)
}

interface UseApiResult<T> {
  data:    T | null
  loading: boolean
  error:   string | null
  refetch: () => void   // اعمل fetch يدوي
}

export function useApi<T = any>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { enabled = true } = options

  const [data,    setData]    = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Fix #5: نستخدم ref للـ AbortController عشان نتجنب race conditions
  // لو الـ endpoint اتغير بسرعة، نلغي الطلب القديم قبل ما نبدأ الجديد
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled || !endpoint) return

    // إلغاء الطلب القديم لو لسه شغال (abort فعلي الآن)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    // Fix #5: تمرير signal لـ api.get — الآن الإلغاء يعمل فعلياً
    const res = await api.get<T>(endpoint, abortRef.current.signal)

    // لو الطلب اتلغى (abort) → res.error = null وres.status = 0
    // في الحالة دي نوقف هنا بدون تحديث state
    if (res.status === 0 && res.error === null) return

    setLoading(false)

    if (res.error) {
      setError(res.error)
      return
    }

    setData(res.data)
  }, [endpoint, enabled])

  // اعمل fetch لما يتغير الـ endpoint أو enabled
  useEffect(() => {
    fetchData()
    // Cleanup: إلغاء الطلب عند unmount الـ component أو تغيير الـ endpoint
    return () => abortRef.current?.abort()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// ══════════════════════════════════════════════════════════
// useMutation — hook لعمليات الكتابة (POST / PUT / DELETE)
//
// الاستخدام:
//   const { mutate, loading, error } = useMutation('POST', '/customers')
//   await mutate({ name: 'أحمد', email: '...' })
// ══════════════════════════════════════════════════════════

type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface UseMutationResult<T> {
  mutate:  (body?: any) => Promise<{ data: T | null; error: string | null }>
  loading: boolean
  error:   string | null
  reset:   () => void
}

export function useMutation<T = any>(
  method: MutationMethod,
  endpoint: string
): UseMutationResult<T> {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const mutate = useCallback(async (body?: any) => {
    setLoading(true)
    setError(null)

    let res
    if (method === 'POST')        res = await api.post<T>(endpoint, body)
    else if (method === 'PUT')    res = await api.put<T>(endpoint, body)
    else if (method === 'PATCH')  res = await api.patch<T>(endpoint, body)
    else                          res = await api.delete<T>(endpoint)

    setLoading(false)

    if (res.error) setError(res.error)

    return { data: res.data, error: res.error }
  }, [method, endpoint])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return { mutate, loading, error, reset }
}
