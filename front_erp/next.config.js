/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── السماح بالصور من أي domain ──────────────────────────
  images: {
    remotePatterns: [
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
    ],
  },

  // ── Security & PWA Headers ───────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // منع XSS
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // PWA theme color
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
        ],
      },
      // Service Worker — يجب أن يُقدَّم بـ Content-Type صح
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      // manifest.json
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type',  value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // Static assets — cache طويل
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ── Rewrites: API proxy (لو احتجنا نوجّه الطلبات) ────────
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api-proxy/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
  //     },
  //   ]
  // },

  // ── Performance ──────────────────────────────────────────
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // ── Output standalone لـ Docker/production ───────────────
  // output: 'standalone',
}

module.exports = nextConfig
