# Applicant Tracking System (ATS)

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
