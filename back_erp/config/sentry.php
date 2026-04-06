<?php

// ══════════════════════════════════════════════════════════
// Sentry Configuration
// عشان تشغّله:
//   1. composer require sentry/sentry-laravel
//   2. ضيف في .env:
//      SENTRY_DSN=https://your-key@sentry.io/your-project
//   3. php artisan sentry:publish
// ══════════════════════════════════════════════════════════

return [
    'dsn' => env('SENTRY_DSN'),

    // بيحط اسم البيئة في كل error (production / staging / local)
    'environment' => env('APP_ENV', 'production'),

    // نسبة الـ performance tracing (0.1 = 10% من الـ requests)
    // زوّدها لـ 1.0 في development فقط
    'traces_sample_rate' => env('SENTRY_TRACES_SAMPLE_RATE', 0.1),

    // نسبة الـ error sampling (1.0 = كل الـ errors)
    'sample_rate' => env('SENTRY_SAMPLE_RATE', 1.0),

    // مش هيبعت errors في بيئة التطوير (اختياري)
    'send_default_pii' => false,

    // إضافة معلومات المستخدم تلقائياً للـ error

    // الـ release version — مفيد لتتبع في أي deploy حصل الـ error
    'release' => env('SENTRY_RELEASE', null),

    // ─── Performance Monitoring ──────────────
    // بيقيس response time لكل route
    'tracing' => [
        'queue_job_transactions'          => true,
        'queue_jobs'                      => true,
        'sql_queries'                     => true,
        'sql_bindings'                    => false, // حماية من تسريب بيانات
        'sql_origin'                      => true,
        'views'                           => false,
        'http_client_requests'            => true,
        'redis_commands'                  => true,
        'redis_origin'                    => true,
    ],
];
