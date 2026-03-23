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
        // Allow localhost variants during development
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]),

    // Allow LAN access (e.g. http://192.168.x.x:5173)
    'allowed_origins_patterns' => ['#^http://192\.168\.\d+\.\d+:5173$#'],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],

    'exposed_headers' => [],

    'max_age' => 86400,  // 24 h preflight cache

    'supports_credentials' => false,

];
