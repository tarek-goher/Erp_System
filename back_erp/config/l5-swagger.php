<?php

// ══════════════════════════════════════════════════════════════
// L5-Swagger Configuration
// عشان تشتغل:
//   1. composer require darkaonline/l5-swagger
//   2. php artisan vendor:publish --provider "L5Swagger\L5SwaggerServiceProvider"
//   3. php artisan l5-swagger:generate
//   4. افتح: /api/documentation
// ══════════════════════════════════════════════════════════════

return [
    'default' => 'default',

    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'ERP System API',
            ],

            'routes' => [
                // رابط الـ Swagger UI
                'api'         => 'api/documentation',
                // رابط الـ JSON spec
                'docs'        => 'api/docs',
                'oauth2_callback' => 'api/oauth2-callback',
                'middleware' => [
                    'api'        => [],
                    'asset'      => [],
                    'docs'       => [],
                    'oauth2_callback' => [],
                ],
                'group_options' => [],
            ],

            'paths' => [
                // مكان حفظ الـ generated docs
                'docs'          => storage_path('api-docs'),
                'docs_json'     => 'api-docs.json',
                'docs_yaml'     => 'api-docs.yaml',
                'annotations'   => [
                    base_path('app'),
                ],
                'base'          => env('L5_SWAGGER_BASE_PATH', null),
                'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/swagger-api/swagger-ui/dist/'),
                'excludes'      => [],
            ],

            'scanOptions' => [
                'default_processors_configuration' => [],
                'analyser'    => null,
                'analysis'    => null,
                'processors'  => [],
                'pattern'     => null,
                'exclude'     => [],
                'open_api_spec_version' => env('L5_SWAGGER_OPEN_API_SPEC_VERSION', \L5Swagger\Generator::OPEN_API_DEFAULT_SPEC_VERSION),
            ],

            'securityDefinitions' => [
                'securitySchemes' => [
                    // نوع الـ auth: Bearer Token (Sanctum)
                    'bearerAuth' => [
                        'type'        => 'http',
                        'scheme'      => 'bearer',
                        'bearerFormat'=> 'JWT',
                    ],
                ],
                'security' => [
                    ['bearerAuth' => []],
                ],
            ],

            'generate_always'          => env('L5_SWAGGER_GENERATE_ALWAYS', false),
            'generate_yaml_copy'       => env('L5_SWAGGER_GENERATE_YAML_COPY', false),
            'proxy'                    => false,
            'additional_config_url'    => null,
            'operations_sort'          => env('L5_SWAGGER_OPERATIONS_SORT', null),
            'validator_url'            => null,
            'ui' => [
                'display' => [
                    'doc_expansion'     => env('L5_SWAGGER_UI_DOC_EXPANSION', 'none'),
                    'filter'            => env('L5_SWAGGER_UI_FILTERS', true),
                    'show_extensions'   => env('L5_SWAGGER_UI_SHOW_EXTENSIONS', false),
                    'show_common_extensions' => env('L5_SWAGGER_UI_SHOW_COMMON_EXTENSIONS', false),
                    'try_it_out_enabled' => env('L5_SWAGGER_UI_TRY_IT_OUT_ENABLED', true),
                ],
                'authorization' => [
                    'persist_authorization' => env('L5_SWAGGER_UI_PERSIST_AUTHORIZATION', true),
                    'oauth2'               => [
                        'use_pkce_with_authorization_code_grant' => false,
                    ],
                ],
            ],

            'constants' => [
                'L5_SWAGGER_CONST_HOST' => env('L5_SWAGGER_CONST_HOST', 'http://localhost:8000'),
            ],
        ],
    ],

    'defaults' => [
        'routes' => [
            'docs'       => 'docs',
            'oauth2_callback' => 'api/oauth2-callback',
            'middleware' => [
                'api'  => [],
                'asset'=> [],
                'docs' => [],
                'oauth2_callback' => [],
            ],
            'group_options' => [],
        ],
        'paths' => [
            'docs'         => storage_path('api-docs'),
            'views'        => base_path('resources/views/vendor/l5-swagger'),
            'base'         => env('L5_SWAGGER_BASE_PATH', null),
            'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/swagger-api/swagger-ui/dist/'),
            'excludes'     => [],
        ],
        'scanOptions' => [
            'default_processors_configuration' => [],
            'analyser'   => null,
            'analysis'   => null,
            'processors' => [],
            'pattern'    => null,
            'exclude'    => [],
            'open_api_spec_version' => \L5Swagger\Generator::OPEN_API_DEFAULT_SPEC_VERSION ?? '3.0.0',
        ],
        'securityDefinitions' => [
            'securitySchemes' => [],
            'security'        => [],
        ],
        'generate_always'       => false,
        'generate_yaml_copy'    => false,
        'proxy'                 => false,
        'additional_config_url' => null,
        'operations_sort'       => null,
        'validator_url'         => null,
        'ui' => [
            'display' => [
                'doc_expansion'  => 'none',
                'filter'         => true,
                'show_extensions'=> false,
                'show_common_extensions' => false,
                'try_it_out_enabled' => false,
            ],
            'authorization' => [
                'persist_authorization' => false,
                'oauth2' => [
                    'use_pkce_with_authorization_code_grant' => false,
                ],
            ],
        ],
        'constants' => [
            'L5_SWAGGER_CONST_HOST' => env('L5_SWAGGER_CONST_HOST', 'http://my-default-host.com'),
        ],
    ],
];
