# Applicant Tracking System (ATS)

## Project Overview
A web-based recruitment system that allows applicants to submit information through a public form and enables HR (admin/recruiter) users to manage and track applications through a full pipeline dashboard.

**Stack**
- Backend: Laravel (REST API, Laravel Sanctum)
- Frontend: React + Vite + Tailwind CSS + DaisyUI
- Database: MySQL
- Charts: Recharts
- File storage: Local storage (CV uploads)

---

## Current Features

### Public Applicant Module
- Public application form at `/apply`
- Submit applicant details and upload CV (PDF/DOC/DOCX)
- Email confirmation sent to applicant on submission

### Admin/Recruiter Module
- Secure login at `/admin/login` with JWT-style token via Laravel Sanctum
- Auth context (`AuthContext`) with protected routes
- Persistent login via `localStorage` token

### Dashboard (`/admin`)
- Applicant pipeline sidebar with search + status filter
- Paginated list (10 per page) with prev/next controls
- Applicant detail panel — view full profile, CV download, update status
- HR notes — add and view recruiter notes per applicant
- Inline status update with email notification to applicant

### Applicants Table (`/admin/applicants`)
- Full paginated table (20 per page) with sort by name, status, date
- Filters: search, status, position, date range
- Clickable rows — navigate directly to pipeline detail
- Inline status dropdown per row (live PATCH update)
- PDF export of current page via browser print dialog
- "Showing X–Y of N" count with active filter indicator

### Analytics (`/admin/analytics`)
- KPI summary bar: Total Applicants, Last 30 Days, Total Hired, Hire Rate
- Donut chart — pipeline breakdown by status (Recharts)
- Horizontal bar chart — top positions by application volume (Recharts)
- Skeletons while loading

### Status Pipeline
- `submitted` → `under_review` → `shortlisted` → `interview_scheduled` → `offer_extended` → `hired`
- Also: `rejected`, `withdrawn`
- Email sent to applicant on every status change

---

## Database Structure
Core tables:
- `applicants` — all applicant data + CV path + status
- `applicant_notes` — HR notes linked to applicants
- `positions` — job positions for filtering
- `users` — admin/recruiter accounts with roles
- `personal_access_tokens` — Sanctum tokens
- `jobs`, `cache`, `sessions` (Laravel defaults)

---

## Security Features
- API authentication via Laravel Sanctum (Bearer token)
- Input validation on all endpoints
- File type validation (PDF/DOC/DOCX only)
- File size restriction (5MB)
- Role-based access (`admin` / `recruiter`)
- Protected frontend routes (redirect to login if unauthenticated)

---

## Installation Guide

### 1) Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ats
DB_USERNAME=root
DB_PASSWORD=your_password
```

Run migrations and storage link:
```bash
php artisan migrate
php artisan storage:link
```

(Optional) seed test data:
```bash
php artisan db:seed
```

Start backend:
```bash
php artisan serve
# → http://127.0.0.1:8000
```

### 2) Frontend Setup (React)
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start frontend:
```bash
npm run dev
# → http://localhost:5173
```

---

## App Routes
| Route | Description |
|---|---|
| `/apply` | Public applicant submission form |
| `/admin/login` | Admin/recruiter login |
| `/admin` | Pipeline dashboard |
| `/admin/applicants` | Full applicants table |
| `/admin/analytics` | Charts & analytics |

---

## API Endpoints

**Public**
- `POST /api/public/applicants` — submit application (multipart/form-data, CV field: `upload_cv`)

**Auth**
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

**Protected (Bearer token required)**
- `GET /api/applicants?search=&status=&position=&start_date=&end_date=&sort=&direction=&page=&per_page=`
- `GET /api/applicants/{id}`
- `PATCH /api/applicants/{id}`
- `DELETE /api/applicants/{id}`
- `GET /api/applicants/{id}/notes`
- `POST /api/applicants/{id}/notes`
- `GET /api/positions`
- `GET /api/dashboard/overview`

---

## Seeded Accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password` |
| Recruiter | `recruiter@example.com` | `password` |

---

## Roadmap

### Phase 1 ✅
- Public application form
- Applicant storage + CV upload
- Admin login (Sanctum)
- Applicant listing and detail view
- Status update with email notifications

### Phase 2 ✅
- Auth refactor (AuthContext, ProtectedRoute, AdminLayout)
- Pipeline sidebar with pagination + search/filter
- HR notes per applicant
- Full applicants table with sort, filter, inline status, PDF export
- Analytics page with KPI cards, donut chart, bar chart
- Backend `per_page` support

### Phase 3 (Planned)
- Email automation enhancements
- Excel/CSV reporting
- Job posting management
- Performance optimization & deployment


## Project Overview
The Applicant Tracking System (ATS) is a web-based recruitment system that allows applicants to submit information through a public form and enables HR (admin/recruiter) users to manage and track applications.

**Stack**
- Backend: Laravel (API)
- Frontend: React (Vite)
- Database: MySQL
- Authentication: Laravel Sanctum
- File storage: Local storage (CV uploads)

## Current Features
### Public Applicant Module
- Public application form at `/apply`
- Submit applicant details and upload CV (PDF/DOC/DOCX)
- Email confirmation to applicant

### Admin/Recruiter Module
- Secure login at `/admin`
- View applicants list
- View applicant details
- Download or view CV
- Update applicant status (emails applicant on status change)

### Status Pipeline (Current)
- submitted
- under_review
- shortlisted
- rejected
- hired

## System Modules (Planned)
- Job position management
- Applicant notes
- Filtering and search
- Dashboard analytics

## Database Structure (Current)
Core tables:
- `applicants`
- `users`
- `personal_access_tokens`
- `jobs`, `cache`, `sessions` (Laravel defaults)

## Security Features
- API authentication via Laravel Sanctum
- Input validation
- File type validation (PDF/DOC/DOCX)
- File size restriction (5MB)
- Role-based access (admin/recruiter)

## Installation Guide
### 1) Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Update `.env`:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ats
DB_USERNAME=root
DB_PASSWORD=your_password
```

Run migrations and storage link:
```bash
php artisan migrate
php artisan storage:link
```

(Optional) seed test data:
```bash
php artisan db:seed
```

Start backend:
```bash
php artisan serve
```

### 2) Frontend Setup (React)
```bash
cd frontend
npm install
```

Set API base URL (create `frontend/.env`):
```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start frontend:
```bash
npm run dev
```

## App Routes
- Public form: `http://localhost:5174/apply`
- Admin/recruiter UI: `http://localhost:5174/admin`

## API Endpoints (Current)
Public:
- `POST /api/public/applicants` (multipart/form-data, CV file field `upload_cv`)

Auth:
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

Protected (Admin/Recruiter):
- `GET /api/applicants`
- `GET /api/applicants/{id}`
- `PATCH /api/applicants/{id}`
- `DELETE /api/applicants/{id}`

## Seeded Accounts (If DB Seed Run)
- Admin: `admin@example.com` / `password`
- Recruiter: `recruiter@example.com` / `password`

## Developer Notes
- Do not store plaintext passwords (Laravel uses hashing by default).
- Validate all uploaded files.
- Configure SMTP in `.env` for real email delivery.

## Roadmap
### Phase 1 (Done)
- Public application form
- Applicant storage
- Admin login
- Applicant listing and detail view

### Phase 2 (Planned)
- Status pipeline enhancements
- Filtering and search
- HR notes
- Dashboard analytics

### Phase 3 (Planned)
- Email automation enhancements
- Reporting (Excel/PDF)
- Performance optimization
- Deployment
