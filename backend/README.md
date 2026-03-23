# ATS Backend

Laravel 12 REST API for the Applicant Tracking System.

## Requirements
- PHP 8.2+
- Composer
- MySQL

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Configure `.env`:

```env
APP_ENV=production
APP_DEBUG=false

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ats
DB_USERNAME=root
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your@email.com

FRONTEND_URL=http://localhost:5173

# Optional: For LAN/Network access
LAN_HOST=192.168.x.x
```

```bash
php artisan migrate
php artisan storage:link
php artisan db:seed        # optional demo data
php artisan serve
```

## LAN / Network Access

To allow access from other devices on the same network, add to `.env`:

```env
LAN_HOST=192.168.x.x
```

This automatically configures:
- **CORS** in `config/cors.php` to allow requests from LAN IP on port 5173
- **Sanctum** stateful domains to accept cookies from LAN host
- Vite frontend will use `http://LAN_HOST:8000` for API requests

Start backend with:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

## Key Directories

| Path | Description |
|---|---|
| `app/Http/Controllers/` | API controllers |
| `app/Models/` | Eloquent models |
| `app/Notifications/` | Email notification classes |
| `database/migrations/` | Database schema |
| `database/seeders/` | Demo data seeders |
| `routes/api.php` | All API route definitions |
| `config/cors.php` | CORS origin and LAN configuration |
| `config/sanctum.php` | Sanctum token and stateful domain configuration |

## Features

- **RESTful API** with comprehensive endpoints for all operations
- **Email notifications** for applicant submissions and status changes
- **Role-based access control** with admin and recruiter permissions
- **File upload handling** for resume/CV storage with validation
- **Search and filtering** for applicants with multiple criteria
- **Analytics data** with KPI aggregation and trend analysis
- **Rate limiting** on sensitive routes (login, password reset, public form)
- **CORS and LAN support** for network accessibility
- **Token-based authentication** with 8-hour expiry

## Auth
- Laravel Sanctum (Bearer token)
- Tokens expire after 8 hours
- Old tokens revoked on new login
- Rate limiting on all sensitive routes

## Artisan Commands

```bash
php artisan migrate:fresh --seed   # Reset and re-seed DB
php artisan config:clear           # Clear config cache
php artisan route:list             # Show all routes
php artisan storage:link           # Link public/storage
```
