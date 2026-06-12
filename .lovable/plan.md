# Fix Core Flows: Student Assignment, Admin View-As, Parent Access Requests, and Auth Hardening

## 1. Student Assignment Flow (Admin → Teacher → Parent)

**Problem:** Admin registers children but there is no explicit link from children → teacher (via class) or children → parent. Teachers can't filter "their" students; parents can't see "their" child.

**Fix:**
- Add `teacher_id` column to `classes` so admin assigns the class teacher (one class → one teacher).
- Re-use the existing `guardians` table (child ↔ parent profile) as the canonical link for parent access. Admin will populate this when approving a parent's request (see §3) or directly from the child page.
- In `ChildrenManagement`, add an "Assign Parent" action (search profile by email) and ensure "Class" assignment writes `class_id` (already in place).
- Update RLS:
  - `children`: teachers can `SELECT` rows where `class_id` is in classes they teach; parents can `SELECT` rows linked via `guardians`.
  - `attendance`, `activity_logs`, `fees`: same scoping (teachers see their class's children; parents see only their guardian-linked children).
  - Helper SECURITY DEFINER functions: `is_teacher_of_child(uuid)`, `is_guardian_of_child(uuid)` to avoid recursive RLS.

## 2. Admin "View As" Toggle

**Goal:** Admin can preview Teacher or Parent UI without losing admin privileges, but cannot perform parent-only mutations while in parent mode.

**Logic (client-only, no role escalation needed since admin already has full DB access):**
- Add `viewAsRole` state to `useAuth` (persisted in `sessionStorage`), with `setViewAsRole('teacher' | 'parent' | null)`.
- Expose `effectiveRole = viewAsRole ?? role`.
- `ProtectedRoute` and `DashboardLayout` use `effectiveRole` for navigation/routing decisions.
- Add a header switcher (visible only when `role === 'admin'`) with three pills: Admin / Teacher / Parent.
- **Read-only guard in parent mode:** a `useIsReadOnly()` hook returns true when `role === 'admin' && viewAsRole === 'parent'`. Forms/buttons in parent pages check this and disable submit + show a banner: "Preview mode — changes disabled."
- RLS unaffected: admin's JWT still has admin role, so queries succeed. The "preview" is purely UI shape + read-only guard.

## 3. Parent Access Request Flow

**New table:** `child_access_requests`
- Columns: `id`, `parent_id` (auth user), `child_id`, `status` (`pending`|`approved`|`rejected`), `relationship` (text — e.g., "Mother"), `note`, `reviewed_by`, `reviewed_at`, timestamps.
- RLS: parent can insert/select their own requests; admin can select/update all.
- On approval, a trigger inserts into `guardians` (child_id, profile_id, relationship) and marks request approved.

**New parent pages:**
- `ParentNoChild.tsx` — shown when parent has zero guardian rows. Lists children (first + last initial only, class name) with a "Request Access" button → opens dialog (select relationship, optional note).
- Update `ParentDashboard` to redirect to `/parent/request-access` when no children linked.

**Restricted child directory for parents:**
- Create `public.children_directory` view (security_invoker=on) exposing only `id, first_name, last_initial, class_name`. Grant `SELECT` to authenticated. Parents query this view for the request list — they never see PII for other children.

**Admin notifications:**
- New `/admin/access-requests` page listing pending requests with Approve/Reject. Badge with count in sidebar.
- Realtime subscription on `child_access_requests` so the count updates live.

## 4. Auth Page Hardening

**Validation (zod + react-hook-form):**
- Email: trimmed, RFC email, ≤255 chars.
- Password: ≥8 chars, must include upper, lower, digit; live strength meter.
- Full name: trimmed, 2–100 chars.
- Phone: optional, E.164-ish regex.

**Security:**
- Enable HIBP leaked-password protection via `configure_auth`.
- Confirm-password field on signup.
- Generic error messages on login ("Invalid email or password") — don't leak which field is wrong.
- Rate-limit feedback: surface Supabase "too many requests" cleanly.
- Honeypot field + minimum-time-on-page check to deter bots.
- `autocomplete` attrs (`email`, `current-password`, `new-password`), `inputMode`, proper `<label htmlFor>`.

**Design / UX:**
- Single-column responsive card, brand gradient header, clear primary CTA.
- Show/hide password toggle (already present), caps-lock warning, remember-me checkbox.
- Inline field errors under inputs, not just toast.
- "Resend confirmation email" link on login when email unconfirmed.
- Google sign-in button (per Lovable Cloud default) — wired but configurable later.
- Loading skeletons, disabled state during submit, success toast routing to correct dashboard by role.

**Signup flow update:**
- After signup, if role is `parent`, route to `/parent/request-access` instead of dashboard.
- Email redirect already points to `enms-nu.vercel.app`; verify `/login` handles `?confirmed=true` query.

## Technical Plan / Order of Work

1. **Migration A** — schema:
   - `ALTER TABLE classes ADD COLUMN teacher_id uuid REFERENCES profiles(id)`.
   - `CREATE TABLE child_access_requests (...)` + GRANT + RLS.
   - `CREATE VIEW children_directory` + grant SELECT to authenticated; deny direct anon access.
   - SECURITY DEFINER helpers `is_teacher_of_child`, `is_guardian_of_child`, `get_pending_request_count`.
   - Trigger: on `child_access_requests` UPDATE to approved → insert into `guardians`.
   - Tighten RLS on `children`, `attendance`, `activity_logs`, `fees` to use the new helpers (admin always allowed).
   - Add `child_access_requests` to `supabase_realtime` publication.

2. **Auth refactor**
   - Rewrite `Login.tsx` and `Register.tsx` with zod + react-hook-form, confirm-password, HIBP, better errors.
   - Call `supabase--configure_auth` with `password_hibp_enabled: true`.
   - Update redirect logic post-signup for parents.

3. **useAuth + view-as**
   - Extend `useAuth` with `viewAsRole`, `effectiveRole`, `setViewAsRole`, `isReadOnly`.
   - Update `ProtectedRoute` to use `effectiveRole`.
   - Add `RoleSwitcher` component in `DashboardLayout` header (admin only).
   - Add `<ReadOnlyBanner />` shown on parent pages when in preview.

4. **Children management**
   - In `ChildrenManagement`, add "Assign Parent" + class-teacher selector when creating/editing a class.
   - Add a minimal `ClassesManagement` page (admin) to set teacher per class.

5. **Parent access flow**
   - `ParentRequestAccess.tsx` (lists directory, submits request).
   - `ParentDashboard` gating: query guardians; if empty → redirect to request page.
   - `AdminAccessRequests.tsx` with approve/reject + realtime badge.

6. **Wiring & QA**
   - Update `App.tsx` routes (`/admin/access-requests`, `/admin/classes`, `/parent/request-access`).
   - Update sidebar nav with new entries and pending-count badge.
   - Smoke test: register parent → sees request page → admin approves → parent sees only their child's data; teacher only sees their class.

## Out of Scope (for this round)
- Bulk import of children.
- Push/email notifications for approvals (in-app realtime + toast only).
- Two-factor auth.
