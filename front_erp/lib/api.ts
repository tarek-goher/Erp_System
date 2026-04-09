// ══════════════════════════════════════════════════════════
// lib/api.ts — المصدر الوحيد لكل طلبات HTTP للـ Backend
// ══════════════════════════════════════════════════════════
// كيف يشتغل:
//   - api.get('/sales')        → GET /api/sales
//   - api.post('/sales', data) → POST /api/sales
//   - api.put('/sales/1', data)→ PUT /api/sales/1
//   - api.delete('/sales/1')   → DELETE /api/sales/1
//
// الـ token بياخده تلقائي من localStorage
// لو حصل 401 → بيودي المستخدم لصفحة /login
//
// Fix #5: إضافة AbortSignal — الآن api.get يقبل signal اختياري
// يُمرَّر من useApi hook لإلغاء الطلبات القديمة عند تغيير الـ endpoint
// ══════════════════════════════════════════════════════════

// ─── عنوان الـ API من ملف .env.local ────────────────────
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api')
  .replace(/\/api\/?$/, '') + '/api'

// ─── نوع الرد القياسي لكل request ───────────────────────
export interface ApiResponse<T = any> {
  data: T | null       // البيانات لو نجح الطلب
  error: string | null // رسالة الخطأ لو فشل
  status: number       // كود الـ HTTP (200, 404, 422...)
}

// ─── جيب الـ token من localStorage ─────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('erp_token')
}

// ─── الـ redirect لصفحة login لو الـ session انتهت ──────
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('erp_token')
    localStorage.removeItem('erp_user')
    window.location.href = '/login'
  }
}

// ══════════════════════════════════════════════════════════
// الـ function الأساسية اللي بتعمل كل الطلبات
//
// Fix #5: إضافة دعم AbortSignal لإلغاء الطلبات
// الـ useApi hook كان يُنشئ AbortController لكن signal
// لم يكن يُمرَّر لـ fetch، فكان abort() بدون تأثير حقيقي.
// الآن request() تقبل signal اختياري ويُمرَّر مباشرة لـ fetch.
// ══════════════════════════════════════════════════════════
async function request<T = any>(
  method: string,
  endpoint: string,
  body?: any,
  customHeaders?: Record<string, string>,
  signal?: AbortSignal        // Fix #5: AbortSignal لإلغاء الطلب
): Promise<ApiResponse<T>> {
  // تأكد إن الـ endpoint يبدأ بـ /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${BASE_URL}${path}`

  // بناء الـ headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  }

  // أضف الـ token لو موجود
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  // إعداد الـ options للـ fetch
  const options: RequestInit = {
    method,
    headers,
    signal,                   // Fix #5: تمرير signal لـ fetch عشان abort يشتغل فعلياً
  }

  // أضف الـ body لو مش GET أو DELETE
  if (body && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(url, options)

    // ─── 401 = انتهت الجلسة → روح login (بس مش أثناء login نفسه) ───────
    if (res.status === 401) {
      const existingToken = getToken()
      const isAuthEndpoint =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/forgot-password') ||
        endpoint.includes('/auth/reset-password')

      // لو ده endpoint للـ auth (login/forgot/reset) → متعملش redirect أبداً
      // حتى لو في token قديم محفوظ — رجّع رسالة الـ API كما هي
      if (!isAuthEndpoint && existingToken) {
        redirectToLogin()
        return { data: null, error: 'انتهت جلستك. جاري إعادة التوجيه...', status: 401 }
      }
      // لو مفيش token أو ده endpoint للـ auth → اكمل وخلّي الـ error يتعرض للمستخدم
    }

    // ─── حاول تقرأ الـ JSON دايماً ─────────────────────
    let json: any = null
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      json = await res.json()
    }

    // ─── لو الطلب نجح (2xx) ─────────────────────────────
    if (res.ok) {
      // 💡 إذا كان الرد من Laravel (success: true, data: ...), نرجع الـ data مباشرة
      // هذا يبسط التعامل مع البيانات في الصفحات ويجعلها متوافقة مع الـ Pagination والـ Simple lists
      if (json && typeof json === 'object' && json.success === true && 'data' in json) {
        return { data: json.data, error: null, status: res.status }
      }
      return { data: json, error: null, status: res.status }
    }

    // ─── لو فيه خطأ → استخرج رسالة الخطأ ──────────────
    let errorMessage = json?.message || json?.error || `خطأ ${res.status}`

    if (json?.errors) {
      // Laravel validation errors → خذ أول رسالة
      const msgs = Object.values(json.errors as Record<string, string[]>).flat()
      errorMessage = msgs[0] || errorMessage
    }

    // رسائل واضحة لكل كود خطأ
    if (res.status === 403) errorMessage = 'ليس لديك صلاحية الوصول لهذه البيانات'
    if (res.status === 429) errorMessage = 'طلبات كثيرة جداً، انتظر لحظة'
    // 500: use API message if available, fallback only if empty
    if (res.status === 500 && !json?.message && !json?.error) errorMessage = 'خطأ في الخادم'

    // رسائل خاصة بـ login (401 / 404 / 422) — لا نعمل override بـ generic
    const isLoginEndpoint = endpoint.includes('/auth/login')
    if (isLoginEndpoint) {
      if (res.status === 401 || res.status === 404) {
        const apiMsg = (json?.message || json?.error || '').toLowerCase()
        if (apiMsg.includes('password') || apiMsg.includes('كلمة') || apiMsg.includes('مرور')) {
          errorMessage = 'كلمة المرور خاطئة'
        } else if (apiMsg.includes('email') || apiMsg.includes('بريد') || apiMsg.includes('not found') || apiMsg.includes('exist')) {
          errorMessage = 'البريد الإلكتروني غير موجود'
        } else {
          errorMessage = 'لم يتم العثور على هذا الحساب'
        }
      }
    }

    return { data: null, error: errorMessage, status: res.status }

  } catch (err: any) {
    // ─── خطأ في الشبكة (offline, timeout, CORS...) ──────
    // Fix #5: AbortError يحدث عند abort() — نتجاهله بصمت (ليس خطأ حقيقي)
    if (err?.name === 'AbortError') {
      return { data: null, error: null, status: 0 }  // silent cancel — no error message
    }
    return {
      data: null,
      error: 'لا يمكن الاتصال بالخادم، تأكد من تشغيل Laravel',
      status: 0
    }
  }
}

/**
 * 💡 وظيفة مساعدة لاستخراج المصفوفة من رد الـ API
 * تتعامل مع الردود المباشرة والردود المقسمة (Paginated)
 */
export function extractArray<T = any>(resData: any): T[] {
  if (!resData) return []
  if (Array.isArray(resData)) return resData
  if (Array.isArray(resData.data)) return resData.data
  return []
}

// ══════════════════════════════════════════════════════════
// الـ API Object — ده اللي بتستخدمه في كل الصفحات
// ══════════════════════════════════════════════════════════
export const api = {
  // GET  → جيب بيانات (يقبل signal اختياري للـ abort)
  get: <T = any>(endpoint: string, signal?: AbortSignal) =>
    request<T>('GET', endpoint, undefined, undefined, signal),

  // POST → أضف بيانات جديدة
  post: <T = any>(endpoint: string, body?: any) =>
    request<T>('POST', endpoint, body),

  // PUT  → عدّل بيانات كاملة
  put: <T = any>(endpoint: string, body?: any) =>
    request<T>('PUT', endpoint, body),

  // PATCH → عدّل بيانات جزئية
  patch: <T = any>(endpoint: string, body?: any) =>
    request<T>('PATCH', endpoint, body),

  // DELETE → احذف بيانات
  delete: <T = any>(endpoint: string) =>
    request<T>('DELETE', endpoint),
}

// ─── Export مباشر للـ BASE_URL لو احتجته ────────────────
export { BASE_URL }
