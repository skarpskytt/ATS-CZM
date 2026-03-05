# Applicant Tracking System (ATS)

A full-stack web-based recruitment platform that lets candidates apply through a public form and gives HR teams a complete dashboard to manage, track, and communicate with applicants through every stage of the hiring pipeline.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.2) � REST API |
| Frontend | React 19 + Vite 7 |
| Styling | Tailwind CSS + DaisyUI |
| Database | MySQL |
| Auth | Laravel Sanctum (Bearer token, 8-hour expiry) |
| Charts | Recharts |
| Email | Gmail SMTP (configurable) |
| File Storage | Local storage (CV uploads) |

---

## Features

### Public Applicant Form (`/apply`)
- Submit name, contact, position, and upload a CV (PDF / DOC / DOCX, max 5 MB)
- Email confirmation sent to applicant on successful submission

### Admin / Recruiter Panel

#### Login (`/admin/login`)
- Secure login with Laravel Sanctum token authentication
- Tokens expire after 8 hours; old tokens revoked on new login
- Rate-limited to 10 attempts per minute

#### Pipeline Dashboard (`/admin`)
- Sidebar with paginated applicant list (10 per page)
- Search and status filter
- Applicant detail panel: full profile, CV download, status update, HR notes
- Inline status update triggers email notification to applicant

#### Applicants Table (`/admin/applicants`)
- Paginated table (20 per page) with sort by name, status, and date
- Filters: keyword search, status, position, date range
- Color-coded status chips with inline status dropdown
- Delete applicant with confirmation modal
- PDF export via browser print dialog
- Responsive � hides less critical columns on smaller screens

#### Analytics (`/admin/analytics`)
- **KPI cards:** Total Applicants (with 30-day sub-count), In Pipeline, Total Hired, Rejected
- **Monthly Applications** � area chart (last 12 months)
- **Pipeline Breakdown** � donut chart by status
- **Top Positions** � horizontal bar chart by application volume
- **Application Sources** � bar chart by source

#### Positions Manager (`/admin/positions`)
- Create, edit, and delete job positions
- Toggle position active/inactive status
- Paginated table with responsive column hiding

#### Users Manager (`/admin/users`)
- Create and manage admin/recruiter accounts
- Role assignment (admin / recruiter)
- Password reset with show/hide toggle

---

## Status Pipeline

```
submitted ? under_review ? shortlisted ? interview_scheduled ? offer_extended ? hired
                                                                              ? rejected
                                                                              ? withdrawn
```

Applicant is emailed on every status change.

---

## Security

- Laravel Sanctum Bearer token auth on all protected routes
- Tokens expire in 8 hours; old tokens revoked on login
- Rate limiting: login (10/min), password reset (5/min), public form (20/min)
- `APP_DEBUG=false` in production
- CORS restricted to configured frontend origin
- Role-based access control (`admin` / `recruiter`)
- Input validation on all endpoints
- File type and size validation (PDF/DOC/DOCX, 5 MB max)

---

## Installation

### Prerequisites
- PHP 8.2+, Composer
- Node.js 18+, npm
- MySQL

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your database and mail credentials:

```env
DB_DATABASE=ats
DB_USERNAME=root
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your@email.com
MAIL_PASSWORD=your_app_password
MAIL_FROM_ADDRESS=your@email.com
MAIL_FROM_NAME="ATS System"

FRONTEND_URL=http://localhost:5173
```

Run migrations and storage link:

```bash
php artisan migrate
php artisan storage:link
```

Seed demo accounts (optional):

```bash
php artisan db:seed
```

Start the backend:

```bash
php artisan serve
# ? http://127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
# ? http://localhost:5173
```

---

## Network / LAN Access

To allow access from other devices on the same network:

```bash
# Backend � bind to all interfaces
php artisan serve --host=0.0.0.0 --port=8000

# Frontend � expose on network
npm run dev -- --host
```

Update `frontend/.env` to use the host machine's LAN IP:

```env
VITE_API_BASE_URL=http://192.168.x.x:8000
```

---

## App Routes

| Route | Description |
|---|---|
| `/apply` | Public applicant submission form |
| `/admin/login` | Admin / recruiter login |
| `/admin` | Pipeline dashboard |
| `/admin/applicants` | Full applicants table |
| `/admin/analytics` | Charts and analytics |
| `/admin/positions` | Positions management |
| `/admin/users` | User account management |

---

## API Endpoints

### Public
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/public/applicants` | Submit application (multipart/form-data) |

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/login` | Login (returns Sanctum token) |
| POST | `/api/logout` | Logout (revokes token) |
| GET | `/api/me` | Get authenticated user |
| POST | `/api/forgot-password` | Send password reset link |
| POST | `/api/reset-password` | Reset password |

### Protected (Bearer token required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applicants` | List applicants (paginated, filterable) |
| GET | `/api/applicants/{id}` | Get single applicant |
| PATCH | `/api/applicants/{id}` | Update applicant |
| DELETE | `/api/applicants/{id}` | Delete applicant |
| GET | `/api/applicants/{id}/notes` | Get HR notes |
| POST | `/api/applicants/{id}/notes` | Add HR note |
| GET | `/api/positions/admin` | List positions (paginated) |
| GET | `/api/positions/all` | All positions (for dropdowns) |
| POST | `/api/positions` | Create position |
| PUT | `/api/positions/{id}` | Update position |
| DELETE | `/api/positions/{id}` | Delete position |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |
| GET | `/api/dashboard/overview` | Pipeline dashboard data |
| GET | `/api/analytics` | Analytics data |

---

## Database Tables

| Table | Description |
|---|---|
| `applicants` | Applicant data, CV path, status |
| `applicant_notes` | HR notes linked to applicants |
| `positions` | Job positions |
| `users` | Admin / recruiter accounts with roles |
| `personal_access_tokens` | Sanctum tokens |
| `jobs`, `cache`, `sessions` | Laravel defaults |

---

## Demo Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `password` |
| Recruiter | `recruiter@example.com` | `password` |

---

## Project Structure

```
ATS/
+-- backend/          # Laravel 12 REST API
�   +-- app/
�   �   +-- Http/Controllers/
�   �   +-- Models/
�   �   +-- Notifications/
�   +-- database/
�   �   +-- migrations/
�   �   +-- seeders/
�   +-- routes/
�       +-- api.php
+-- frontend/         # React 19 + Vite
    +-- src/
        +-- components/
        +-- context/
        +-- pages/
```

---

## Roadmap

- [x] Public application form with CV upload
- [x] Email notifications (submission + status changes)
- [x] Admin login with Sanctum token auth
- [x] Pipeline dashboard with HR notes
- [x] Applicants table with filters, sort, and PDF export
- [x] Analytics page with KPI cards and charts
- [x] Positions management
- [x] Users management
- [x] Responsive UI (mobile to desktop)
- [x] Rate limiting and security hardening
- [ ] Excel / CSV export
- [ ] Interview scheduling integration
- [ ] HTTPS / SSL deployment
- [ ] Docker setup
