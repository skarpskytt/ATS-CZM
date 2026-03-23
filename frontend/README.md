# ATS Frontend

React 19 + Vite 7 frontend for the Applicant Tracking System with Tailwind CSS and DaisyUI.

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
npm run dev       # development server  → http://localhost:5173
npm run build     # production build    → dist/
npm run preview   # preview production build
```

## LAN Access

Option 1 - Using Vite host flag:

```bash
npm run dev -- --host
```

Then update `.env`:

```env
VITE_API_BASE_URL=http://192.168.x.x:8000
```

Option 2 - Using configuration:

Vite is pre-configured with `host: true` in `vite.config.js` for automatic network accessibility.

## Features

- **Multi-step applicant form** with progress tracking and auto-scroll between steps
- **Drag-and-drop resume upload** with file preview and detailed file information
- **Organized application review** section with editable segments
- **Auto-scroll modal interactions** for smooth user experience
- **Responsive design** optimized for mobile and desktop
- **Real-time email notifications** for status changes
- **Analytics dashboard** with KPI cards and interactive charts
- **Role-based access control** with admin and recruiter permissions

## Pages

| Route | File | Description |
|---|---|---|
| `/apply` | `ApplyPage.jsx` | Public multi-step applicant form with drag-drop resume |
| `/admin/login` | `AdminLoginPage.jsx` | Admin login with token authentication |
| `/admin` | `AdminPage.jsx` | Dashboard with applicant pipeline and HR notes |
| `/admin/applicants` | `AdminApplicantsPage.jsx` | Searchable applicants table with bulk actions |
| `/admin/analytics` | `AdminAnalyticsPage.jsx` | Analytics charts, KPIs, and reports |
| `/admin/positions` | `AdminPositionsPage.jsx` | Job positions management |
| `/admin/users` | `AdminUsersPage.jsx` | User account and role management |
| `/terms` | `TermsPage.jsx` | Application terms and conditions |

## Styling

- **Tailwind CSS** for utility-first styling
- **DaisyUI** components for consistent UI
- **Custom CSS animations** for smooth transitions
- **Responsive design** with mobile-first approach
- **Blurred modal backdrops** for better UX

## Key Dependencies

| Package | Purpose |
|---|---|
| react-router-dom | Client-side routing |
| recharts | Analytics charts |
| tailwindcss + daisyui | Utility CSS + components |
| axios | HTTP client |
