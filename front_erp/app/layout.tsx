// ══════════════════════════════════════════════════════════
// app/layout.tsx — الـ Root Layout
// ══════════════════════════════════════════════════════════

import type { Metadata, Viewport } from 'next'
import { AuthProvider }    from '../lib/auth'
import { ThemeProvider }   from '../lib/theme'
import { I18nProvider }    from '../lib/i18n'
import { ToastProvider }   from '../context/ToastContext'
import { ConfirmProvider } from '../components/ui/ConfirmDialog'
import '../styles/globals.css'

// ── PWA + SEO Metadata ────────────────────────────────────
export const metadata: Metadata = {
  title:       'CodeSphere ERP',
  description: 'نظام متكامل لإدارة موارد الشركات — مبيعات، مشتريات، مخزون، موارد بشرية، محاسبة',
  keywords:    ['ERP', 'نظام إدارة', 'مبيعات', 'مخزون', 'موارد بشرية'],
  authors:     [{ name: 'CodeSphere' }],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'CodeSphere ERP',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png',  sizes: '32x32',  type: 'image/png' },
      { url: '/icons/icon-96x96.png',  sizes: '96x96',  type: 'image/png' },
      { url: '/icons/icon-192x192.png',sizes: '192x192',type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  },
  openGraph: {
    title:       'CodeSphere ERP',
    description: 'نظام متكامل لإدارة موارد الشركات',
    type:        'website',
    locale:      'ar_EG',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)',  color: '#1e40af' },
  ],
  width:           'device-width',
  initialScale:    1,
  maximumScale:    5,
  userScalable:    true,
}

// ── Service Worker Registration ───────────────────────────
const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(function(reg) { console.log('[PWA] SW registered:', reg.scope) })
      .catch(function(err) { console.warn('[PWA] SW failed:', err) })
  })
}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable"         content="yes" />
        <meta name="apple-mobile-web-app-capable"   content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title"     content="CodeSphere ERP" />
        <meta name="msapplication-TileColor"        content="#2563eb" />
        <meta name="msapplication-tap-highlight"    content="no" />

        {/* Preconnect للـ fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <ToastProvider>
                <ConfirmProvider>
                  {children}
                </ConfirmProvider>
              </ToastProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>

        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </body>
    </html>
  )
}
