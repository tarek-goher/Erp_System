<?php

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => array_filter(array_unique(array_merge(
        // من ملف .env: FRONTEND_URL=https://erp.yourcompany.com
        // يمكن تحديد أكثر من URL مفصولة بفاصلة: FRONTEND_URL=https://a.com,https://b.com
        array_map('trim', explode(',', env('FRONTEND_URL', 'http://localhost:3000'))),
        [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
        ]
    ))),
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => ['Authorization'],
    'max_age'                  => 86400,
    'supports_credentials'     => true,
];
