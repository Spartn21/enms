# E-NMS — Electronic Nursery Management System

A web-based, mobile-installable platform that digitizes the day-to-day
operations of nursery and early-childhood schools: child records,
attendance, fees, daily activities, parent–teacher messaging, and
role-based reporting.

E-NMS replaces paper registers and disconnected WhatsApp groups with a
single secure system used by three audiences:

- **Administrators** — manage children, classes, fees, staff, and approve
  parent access requests.
- **Teachers** — log attendance and daily activities for the classes
  they are assigned to, and message parents.
- **Parents/Guardians** — request access to their child, then view
  attendance, activities, fees, and message teachers.

The app is responsive, installable on mobile (Add to Home Screen), and
runs as a Progressive Web App with an animated splash on sign-in.

---

## Table of contents

1. [Feature overview](#feature-overview)
2. [How the system works](#how-the-system-works)
3. [Architecture](#architecture)
4. [Project structure](#project-structure)
5. [Data model](#data-model)
6. [Authentication & authorization](#authentication--authorization)
7. [Core flows](#core-flows)
8. [Mobile / PWA](#mobile--pwa)
9. [Local development](#local-development)
10. [Deployment](#deployment)
11. [Security](#security)

---

## Feature overview

| Module | Admin | Teacher | Parent |
| --- | :---: | :---: | :---: |
| Children management (CRUD) | ✓ | view assigned | view linked only |
| Classes & teacher assignment | ✓ | view own class | — |
| Attendance | ✓ | ✓ (own class) | view |
| Daily activity logs | ✓ | ✓ (own class) | view |
| Fee management | ✓ | — | view & pay |
| Messaging | ✓ | ✓ | ✓ |
| Access requests (parent → child) | approve/reject | — | submit |
| Reports & analytics | ✓ | — | — |
| Settings | ✓ | — | — |
| **View-as preview** (read-only) | ✓ | — | — |

Cross-cutting capabilities: role-based dashboards, realtime
notifications for pending requests, audit-friendly RLS, mobile bottom
nav + desktop sidebar, installable PWA, and a login splash screen.

---

## How the system works

### 1. Sign-up & roles

A new user signs up and picks one of three roles: **Administrator,
Teacher, Parent**. The role is stored separately from the user profile
(in a dedicated `user_roles` table) to prevent privilege escalation.
Email confirmation is required before sign-in.

### 2. Routing by role

After login, the splash screen plays briefly while the app resolves the
user's role and redirects:

- `admin` → `/admin`
- `teacher` → `/teacher`
- `parent` with linked child → `/parent`
- `parent` with **no** linked child → `/parent/request-access`

### 3. Linking parents to children

Children are created by the admin. Parents do **not** create children.
Instead, an unlinked parent searches a privacy-safe directory (first
name + last initial + class only) and submits an *access request*. The
admin gets a realtime badge on the Requests page. On approval a
database trigger inserts the parent into `guardians`, after which the
parent can see only that child's data.

### 4. Linking teachers to classes

The admin assigns one teacher per class. RLS uses helper
`SECURITY DEFINER` functions (`is_teacher_of_child`,
`is_guardian_of_child`) so a teacher only sees children in classes they
own, and a parent only sees children they're a guardian of.

### 5. Daily operations

- Teachers tap **Attendance** to mark present / absent / late.
- Teachers add **Activity logs** with category, title, notes, optional
  media — parents see them in real time.
- Admins record **Fees**, mark payments, and parents view balances.
- All three roles use **Messages** for direct communication.

### 6. Admin "View as" mode

An administrator can switch the UI to view the app exactly as a teacher
or parent would. While in view-as mode the UI is **read-only** — write
buttons are disabled and a banner is shown. The admin's database JWT
is unchanged, so RLS still permits admin reads; the read-only guard is
enforced at the UI layer to prevent accidental parent-side writes.

---

## Architecture

```text
┌─────────────────────────────────────────────────┐
│             React 18 + Vite SPA (PWA)           │
│  React Router · TanStack Query · shadcn/ui      │
│  Tailwind CSS · react-hook-form + zod           │
└──────────────────┬──────────────────────────────┘
                   │  HTTPS (JWT in header)
                   ▼
┌─────────────────────────────────────────────────┐
│                  Backend (BaaS)                 │
│  PostgreSQL · Row Level Security · Auth         │
│  Realtime (postgres_changes) · Storage          │
│  SECURITY DEFINER RPCs · Edge functions         │
└─────────────────────────────────────────────────┘
```

- **Frontend**: Vite + React 18, TypeScript, Tailwind CSS v3,
  shadcn/ui components, TanStack Query for server state,
  react-hook-form + zod for forms, sonner for toasts.
- **Backend**: PostgreSQL with Row Level Security; auth, realtime,
  storage, and edge functions managed by the BaaS layer.
- **Auth**: email + password with HIBP breach checks, email
  confirmation, optional Google OAuth.
- **Hosting**: any static host (Vercel, Netlify, etc.). SPA fallback
  via `vercel.json` rewrites.

---

## Project structure

```text
src/
├── App.tsx                  # Route table (admin/teacher/parent)
├── main.tsx
├── index.css                # Design tokens + utilities
├── components/
│   ├── DashboardLayout.tsx  # Sidebar (desktop) + bottom nav (mobile)
│   ├── ProtectedRoute.tsx   # Role-gated routes
│   ├── RoleSwitcher.tsx     # Admin "view as" pills
│   ├── ReadOnlyBanner.tsx   # Shown while admin previews as parent/teacher
│   ├── SplashScreen.tsx     # Post-login animated splash
│   ├── StatCard.tsx
│   └── ui/                  # shadcn primitives
├── hooks/
│   └── useAuth.tsx          # Session, role, effectiveRole, isReadOnly
├── integrations/supabase/   # Auto-generated client & types
├── pages/
│   ├── Login.tsx            # zod-validated, HIBP, caps-lock hint
│   ├── Register.tsx         # Role selection + strength meter + honeypot
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── admin/               # Dashboard, Children, Classes, Requests,
│   │                        # Attendance, Fees, Messages, Reports, Settings
│   ├── teacher/             # Dashboard, Attendance, Activities, Messages
│   └── parent/              # Dashboard, RequestAccess, Activities,
│                            # Fees, Messages
└── lib/utils.ts

public/
├── manifest.webmanifest     # PWA manifest
├── icon-192.png · icon-512.png · apple-touch-icon.png
└── favicon.ico

supabase/
├── config.toml              # Auth & function config
└── migrations/              # SQL migrations (RLS, RPCs, triggers)
```

---

## Data model

Core tables (simplified):

```text
profiles(id PK → auth.users.id, full_name, phone_number, ...)
user_roles(user_id, role enum:'admin'|'teacher'|'parent')   -- never on profiles
classes(id, name, teacher_id → profiles.id)
children(id, first_name, last_name, dob, class_id → classes.id, ...)
guardians(id, child_id, profile_id, relationship)           -- parent↔child link
child_access_requests(id, child_id, parent_id, status, note,
                      reviewed_by, reviewed_at)
attendance(id, child_id, date, status, recorded_by)
activity_logs(id, child_id, category, title, notes, created_by)
fees(id, child_id, amount, due_date, status, paid_at)
messages(id, sender_id, recipient_id, body, read_at, created_at)
```

Key SQL helpers (`SECURITY DEFINER`, fixed `search_path`):

- `public.has_role(uuid, app_role) → boolean`
- `public.get_user_role(uuid) → app_role`
- `public.is_teacher_of_child(uuid, uuid) → boolean`
- `public.is_guardian_of_child(uuid, uuid) → boolean`
- `public.get_children_directory(search text) → table(...)`
  *(returns first name + last initial + class — no PII)*

A trigger on `child_access_requests` inserts into `guardians` whenever
an admin sets `status = 'approved'`.

---

## Authentication & authorization

- **Sign-up**: zod schema, password strength meter, confirm-password,
  honeypot field, mount-time bot check, HIBP breach check enforced
  server-side.
- **Sign-in**: email + password, "Remember me", caps-lock hint,
  resend-confirmation flow.
- **Roles** are read via the `get_user_role` RPC; never trust
  client-side state for authorization.
- **RLS** is enabled on every public table. Every policy is written in
  terms of `auth.uid()` and the helper functions above. Tables are
  granted to `authenticated` and `service_role` only.

---

## Core flows

### Parent access-request flow

```text
Parent signs up ──► /parent/request-access
   │                       │
   │                       ▼
   │              Searches directory ──► submits request
   │                                            │
   │                                            ▼
   │                            child_access_requests.status = 'pending'
   │                                            │   realtime
   │                                            ▼
   │                            Admin badge increments + email-style toast
   │                                            │
   │                                            ▼
   │                            Admin approves ──► trigger inserts guardian
   │                                            │
   ▼                                            ▼
Next login ─────────────────────► sees child dashboard
```

### Attendance flow

Admin assigns class → teacher → child. Teacher opens
`/teacher/attendance`, sees only their class, taps status per child;
each row writes one `attendance` row. Parents (and admin) see the
result on their respective dashboards.

---

## Mobile / PWA

- Responsive layout: **sidebar** on `lg+`, **bottom tab bar** on
  smaller screens with active-state scale animation and safe-area
  padding for iOS home indicators.
- Splash screen plays for ~1.2s right after successful sign-in,
  triggered via `sessionStorage` and rendered by `SplashScreen`.
- Manifest at `public/manifest.webmanifest` (`display: standalone`,
  192/512 maskable icons, theme color `#2563eb`).
- Head tags include `apple-touch-icon`, `apple-mobile-web-app-capable`,
  and `theme-color` for iOS / Android install banners.
- Animations: `animate-fade-in`, `animate-scale-in`, `active:scale-95`
  on tap targets.

To install on a phone: open the deployed URL in Chrome/Safari →
*Add to Home Screen*. On Android, eligible browsers show an install
banner automatically.

> Offline mode is **not** enabled by default to avoid stale caches.
> Add a guarded service worker only if true offline support is needed.

---

## Local development

Prerequisites: Node 18+ and a package manager (`bun`, `pnpm`, or `npm`).

```bash
bun install        # or: pnpm install / npm install
bun run dev        # http://localhost:8080
```

Environment variables (`.env`):

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

Run tests:

```bash
bun run test       # vitest
```

---

## Deployment

The project is a static SPA. `vercel.json` rewrites all unknown paths
to `/` so React Router handles deep links and refreshes:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

Backend migrations live in `supabase/migrations/` and are applied
automatically when pushed to the connected backend project.

---

## Security

- **Roles** stored in a dedicated `user_roles` table, never on
  `profiles` — eliminates the classic "user updates own role" exploit.
- **RLS** enforced on every public table; helper functions are
  `SECURITY DEFINER` with `set search_path = public` to prevent search
  path attacks.
- **Auth**: HIBP password breach checking, email confirmation,
  rate-limit-aware error messages.
- **Anti-bot**: honeypot field + minimum form-fill time on sign-up.
- **Realtime**: scoped channels per table, filtered server-side via RLS.
- **No service-role key** is ever shipped to the client.

---

## License

Proprietary — all rights reserved unless explicitly licensed.
