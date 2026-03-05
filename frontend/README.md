# ATS Frontend

React 19 + Vite 7 frontend for the Applicant Tracking System.

## Requirements
- Node.js 18+
- npm

## Setup

```bash
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

```bash
npm run dev       # development server  ? http://localhost:5173
npm run build     # production build    ? dist/
npm run preview   # preview production build
```

## LAN Access

```bash
npm run dev -- --host
```

Then update `.env`:

```env
VITE_API_BASE_URL=http://192.168.x.x:8000
```

## Pages

| Route | File | Description |
|---|---|---|
| `/apply` | `ApplyPage.jsx` | Public applicant form |
| `/admin/login` | `AdminLoginPage.jsx` | Admin login |
| `/admin` | `AdminDashboardPage.jsx` | Pipeline dashboard |
| `/admin/applicants` | `AdminApplicantsPage.jsx` | Applicants table |
| `/admin/analytics` | `AdminAnalyticsPage.jsx` | Charts & KPIs |
| `/admin/positions` | `AdminPositionsPage.jsx` | Positions manager |
| `/admin/users` | `AdminUsersPage.jsx` | Users manager |

## Key Dependencies

| Package | Purpose |
|---|---|
| react-router-dom | Client-side routing |
| recharts | Analytics charts |
| tailwindcss + daisyui | Utility CSS + components |
| axios | HTTP client |
