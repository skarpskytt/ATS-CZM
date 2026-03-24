<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    | Restricts which origins can call the API. Only the known frontend URL
    | (set via FRONTEND_URL in .env) is permitted.
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
    ]),

    // Allow Vite dev ports (517x) for localhost and common LAN ranges.
    'allowed_origins_patterns' => [
        '#^http://localhost:517\d$#',
        '#^http://127\.0\.0\.1:517\d$#',
        '#^http://192\.168\.\d+\.\d+:517\d$#',
        '#^http://10\.\d+\.\d+\.\d+:517\d$#',
    ],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 86400,  // 24 h preflight cache

    'supports_credentials' => false,

];
