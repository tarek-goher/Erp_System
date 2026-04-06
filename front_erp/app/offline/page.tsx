'use client'

// صفحة Offline — تظهر لما المستخدم يكون غير متصل
export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Cairo, sans-serif',
      background: '#f1f5f9',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📡</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
        أنت غير متصل بالإنترنت
      </h1>
      <p style={{ color: '#475569', fontSize: '1rem', marginBottom: '2rem', maxWidth: 400 }}>
        تحقق من اتصالك بالإنترنت وحاول مرة أخرى. بعض الصفحات متاحة بدون إنترنت من الـ cache.
      </p>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#2563eb', color: '#fff', border: 'none',
          borderRadius: 10, padding: '0.75rem 2rem',
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
        }}
      >
        إعادة المحاولة
      </button>
      <p style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
        CodeSphere ERP
      </p>
    </div>
  )
}
