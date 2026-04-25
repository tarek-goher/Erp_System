<?php

use Illuminate\Support\Str;

return [

    /*
    |--------------------------------------------------------------------------
    | Horizon Domain
    |--------------------------------------------------------------------------
    */
    'domain' => env('HORIZON_DOMAIN'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Path
    |--------------------------------------------------------------------------
    | /horizon — متاح للـ super admin بس
    */
    'path' => env('HORIZON_PATH', 'horizon'),

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Connection
    |--------------------------------------------------------------------------
    */
    'use' => 'default',

    /*
    |--------------------------------------------------------------------------
    | Horizon Redis Prefix
    |--------------------------------------------------------------------------
    */
    'prefix' => env(
        'HORIZON_PREFIX',
        Str::slug(env('APP_NAME', 'laravel'), '_').'_horizon:'
    ),

    /*
    |--------------------------------------------------------------------------
    | Horizon Route Middleware
    |--------------------------------------------------------------------------
    | هنا بنحمي الـ dashboard — super admin بس يدخل
    */
    'middleware' => ['web', 'auth', 'check.super.admin'],

    /*
    |--------------------------------------------------------------------------
    | Queue Wait Time Thresholds
    |--------------------------------------------------------------------------
    | لو job استنت أكتر من كده → Horizon يعتبرها مشكلة
    */
    'waits' => [
        'redis:default' => 60,
    ],

    /*
    |--------------------------------------------------------------------------
    | Job Trimming Times
    |--------------------------------------------------------------------------
    | كام دقيقة نحتفظ بـ job في الـ dashboard
    */
    'trim' => [
        'recent'        => 60,      // 1 ساعة
        'pending'       => 60,
        'completed'     => 60,
        'recent_failed' => 10080,   // 7 أيام — مهم نشوف الـ failures
        'failed'        => 10080,
        'monitored'     => 10080,
    ],

    /*
    |--------------------------------------------------------------------------
    | Silenced Jobs
    |--------------------------------------------------------------------------
    */
    'silenced' => [],

    /*
    |--------------------------------------------------------------------------
    | Metrics
    |--------------------------------------------------------------------------
    */
    'metrics' => [
        'trim_snapshots' => [
            'job'   => 24,
            'queue' => 24,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Fast Termination
    |--------------------------------------------------------------------------
    */
    'fast_termination' => false,

    /*
    |--------------------------------------------------------------------------
    | Memory Limit (MB)
    |--------------------------------------------------------------------------
    */
    'memory_limit' => 64,

    /*
    |--------------------------------------------------------------------------
    | Queue Worker Configuration
    |--------------------------------------------------------------------------
    |
    | الـ queues اللي عندنا في المشروع:
    | - default      : الشغل العادي (notifications, emails)
    | - notifications: الـ push/email notifications
    | - pdf          : توليد الـ PDFs (ثقيل — worker منفصل)
    | - campaigns    : الـ marketing campaigns (ممكن تاخد وقت)
    |
    */
    'environments' => [
        'production' => [
            'supervisor-default' => [
                'connection'          => 'redis',
                'queue'               => ['default', 'notifications'],
                'balance'             => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses'        => 10,
                'maxTime'             => 0,
                'maxJobs'             => 0,
                'memory'              => 64,
                'tries'               => 3,
                'timeout'             => 60,
                'nice'                => 0,
            ],
            'supervisor-pdf' => [
                'connection' => 'redis',
                'queue'      => ['pdf'],
                'balance'    => 'simple',
                'processes'  => 3,
                'maxTime'    => 0,
                'memory'     => 128,
                'tries'      => 3,
                'timeout'    => 120,
                'nice'       => 0,
            ],
            'supervisor-campaigns' => [
                'connection' => 'redis',
                'queue'      => ['campaigns'],
                'balance'    => 'simple',
                'processes'  => 2,
                'maxTime'    => 0,
                'memory'     => 64,
                'tries'      => 3,
                'timeout'    => 300,
                'nice'       => 10, // أولوية أقل — مش urgent
            ],
        ],

        'local' => [
            'supervisor-default' => [
                'connection' => 'redis',
                'queue'      => ['default', 'pdf', 'campaigns', 'notifications'],
                'balance'    => 'simple',
                'processes'  => 3,
                'maxTime'    => 0,
                'memory'     => 64,
                'tries'      => 3,
                'timeout'    => 60,
                'nice'       => 0,
            ],
        ],
    ],
];
