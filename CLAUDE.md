# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Applicant Tracking System (ATS)** - a full-stack recruitment platform with a Laravel 12 REST API backend and React 19 + Vite frontend.

**Tech Stack:**
- **Backend:** Laravel 12 (PHP 8.2), MySQL, Laravel Sanctum (Bearer token auth)
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, DaisyUI
- **Charts:** Recharts
- **Email:** Gmail SMTP (configurable)

## Development Commands

### Backend (Laravel)
```bash
cd backend
composer install                    # Install PHP dependencies
php artisan migrate                 # Run database migrations
php artisan migrate:fresh --seed    # Reset DB with demo data
php artisan db:seed                 # Run seeders (demo accounts)
php artisan serve                   # Start dev server (http://127.0.0.1:8000)
php artisan serve --host=0.0.0.0 --port=8000  # For LAN access
php artisan storage:link            # Create symlink for file uploads
php artisan config:clear            # Clear config cache
php artisan route:list              # Show all routes
php artisan test                    # Run PHPUnit tests
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                         # Install dependencies
npm run dev                         # Start dev server (http://localhost:5173)
npm run dev -- --host              # For LAN access
npm run build                       # Production build
npm run preview                     # Preview production build
npm run lint                        # Run ESLint
```

### Full Stack Development
```bash
# From backend directory - runs Laravel server, queue worker, logs, and Vite
composer run dev
```

## High-Level Architecture

### Backend Structure (Laravel)

**Authentication:** Laravel Sanctum with Bearer tokens (8-hour expiry). Tokens are revoked on new login.

**Roles:** `admin`, `hr_manager`, `hr_supervisor`, `recruiter`. Role-based access is enforced via:
- `CheckRole` middleware for hardcoded role checks (`admin` only)
- `CheckPermission` middleware for dynamic permissions stored in `settings` table
- Default permissions fallback if settings table is empty

**Key Models:**
- `User` - Admin/recruiter accounts with Sanctum tokens
- `Applicant` - Job applicants with soft deletes, CV uploads
- `ApplicantNote` - HR notes on applicants
- `Position` - Job positions (can be active/inactive)
- `Setting` - Dynamic permission configuration
- `AuditLog` - Activity timeline for applicants

**File Uploads:** CV files stored in `storage/app/public/cvs/` (PDF, DOC, DOCX, max 5MB). Public access via `storage:link`.

**Rate Limiting:** Applied on sensitive routes via middleware:
- Login: 10 requests/minute
- Password reset: 5 requests/minute
- Public application form: 10 requests/minute (throttle:10,1 in api.php)

**API Routes** (`routes/api.php`):
- Public: `/api/public/applicants` (POST), `/api/positions` (GET)
- Auth: `/api/login`, `/api/logout`, `/api/me`, `/api/forgot-password`, `/api/reset-password`
- Protected (require Bearer token): All other endpoints

### Frontend Structure (React)

**Routing:** React Router v7 with protected routes via `ProtectedRoute` component.

**Auth Context** (`src/context/AuthContext.jsx`):
- Manages Bearer token in localStorage (`ats_token`)
- Loads user profile on mount via `/api/me`
- Provides `useRole()` hook for permission checks
- Dynamic permissions fetched from `/api/settings/permissions`

**Route Structure:**
- `/apply` - Public applicant form
- `/admin/login` - Login page
- `/admin` - Pipeline dashboard (protected)
- `/admin/applicants` - Applicants table (protected)
- `/admin/analytics` - Analytics charts (protected, requires `canViewAnalytics`)
- `/admin/positions` - Position management (protected, requires `canManagePositions`)
- `/admin/users` - User management (protected, requires `canManageUsers`)

**API Base** (`src/utils/apiBase.js`): Configured via `VITE_API_BASE_URL` env var. Falls back to `window.location.hostname:8000`.

**Styling:** Tailwind CSS 4 + DaisyUI. Uses CSS variables from DaisyUI themes.

### Database

**Key Tables:**
- `users` - Admin/recruiter accounts (role field: admin, hr_manager, hr_supervisor, recruiter)
- `applicants` - Applicant data with soft deletes, CV path, status field
- `applicant_notes` - HR notes linked to applicants
- `positions` - Job positions with active/inactive toggle
- `settings` - JSON-stored permissions configuration
- `audit_logs` - Timeline of applicant status changes
- `personal_access_tokens` - Sanctum tokens

**Applicant Status Pipeline:**
```
submitted → under_review → shortlisted → interview_scheduled → offer_extended → hired
                                                      ↘ rejected
                                                       ↘ withdrawn
```

### LAN/Network Access

To enable access from other devices:
1. Add `LAN_HOST=192.168.x.x` to `backend/.env`
2. Start backend with `php artisan serve --host=0.0.0.0 --port=8000`
3. Start frontend with `npm run dev -- --host`
4. Update `frontend/.env` with `VITE_API_BASE_URL=http://192.168.x.x:8000`

The `LAN_HOST` env var automatically configures CORS and Sanctum stateful domains.

### Email Configuration

Configured in `backend/.env`:
```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your@email.com
MAIL_FROM_NAME="ATS System"
```

Email notifications sent on: applicant submission, status changes.

### Demo Accounts (after seeding)
- Admin: `admin@example.com` / `password`
- Recruiter: `recruiter@example.com` / `password`
