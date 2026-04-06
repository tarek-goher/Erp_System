// ══════════════════════════════════════════════════════════
// hooks/useToast.ts — re-export من ToastContext للتوافق
//
// لو كنت بتستخدم useToast من هنا قبل كده، مش محتاج تغير أي حاجة.
// الفرق: دلوقتي الـ toasts بتظهر في مكان واحد (مش كل صفحة لوحدها)
//
// شرط: لازم يكون في <ToastProvider> في layout.tsx الرئيسي
// ══════════════════════════════════════════════════════════

export { useToast } from '../context/ToastContext'
export type { Toast, ToastType } from '../context/ToastContext'
