# EcoSchedule — Retake Action Plan (2026-08)

Source: [../Retake_plan.txt](../Retake_plan.txt)
Status: **Planning document** — no code changed yet. Each section maps the raw note to the actual codebase, gives a concrete solution, and flags what needs your decision before implementation starts.

---

## 0. Codebase facts that affect this plan

- Two near-identical frontends exist: `.src/frontend` (port 5001 API) and `.src/admin-frontend` (port 5002 API in some services). Any shared feature (auth, payment, schedule) touched below likely needs to be mirrored in both unless one is being retired.
- Manager's AI assistant (`aiController.js`) already reads **directly from Firestore** via backend services (`invoiceService`, `complaintService`, `notificationService`, `collection_schedules` query) — it does **not** rely on data pushed from the frontend. This answers item 8 below: no change needed, just confirmed.
- Manager dashboard is currently one monolithic page: [.src/frontend/src/pages/Dashboard/index.jsx](../.src/frontend/src/pages/Dashboard/index.jsx) (schedule creation, route/team management, complaints, feedback reports, completion approvals all in one file).
- Maps run on **Google Maps JS API** via a backend proxy (`/api/maps/*`), not Leaflet — see [CollectionRouteMap.jsx](../.src/frontend/src/components/CollectionRouteMap.jsx).

---

## 1. Signup — verification email not sent

**Current flow** ([authController.js](../.src/backend/controllers/authController.js) `register()`): calls Firebase Auth REST `accounts:sendOobCode` with `requestType: VERIFY_EMAIL`. This relies on Firebase's own mail relay — you cannot set a custom "from" host/email on the free path, and delivery silently fails/warns without blocking signup (`console.warn`, not surfaced to user).

**Root cause**: Firebase-managed verification emails depend on Firebase Auth email templates/sender config in the Firebase Console (default sender, rate-limited, often lands in spam or is blocked entirely on unconfigured projects). It cannot be pointed at an arbitrary SMTP/host email.

**Proposed fix**: Replace Firebase's `sendOobCode` verification with a **self-hosted email verification** using Nodemailer + your own SMTP (e.g. Gmail with an App Password, or any SMTP host):
- New `emailService.js` (backend) using `nodemailer`, credentials from `.env` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`).
- On register: generate a 6-digit code, store `{ code (hashed), expiresAt }` on the user doc or a `email_verifications` collection, send via Nodemailer.
- New endpoints: `POST /api/auth/verify-email` (check code, set `emailVerified: true` in Firestore + Firebase Auth via Admin SDK `auth.updateUser`), `POST /api/auth/resend-code`.
- Frontend: after register, show a code-entry screen instead of "check your inbox for a link".

**Needs your confirmation**: which email account to use as sender (Gmail app password vs a transactional provider like Resend/SendGrid) — Gmail is simplest for a class project but has sending limits (~500/day).

---

## 2. Resident — search schedule by area + edit own area + missing profile edit

**Current state**:
- [ResidentSchedules.jsx](../.src/frontend/src/resident/ResidentSchedules.jsx) already supports manual province/ward/neighborhood search (`/api/schedules`) and auto-shows upcoming schedules for the logged-in resident's stored `area` ([residentController.js](../.src/backend/controllers/residentController.js) `getUpcomingSchedules`).
- There is **no** profile-edit page/endpoint anywhere in `.src/frontend` or `.src/admin-frontend`.

**Proposed fix**:
- Add `PATCH /api/resident/profile` (backend `residentController.js`) allowing a resident to update `fullName`, `phone`, `address`, `area` (validate ownership via `req.uid`, no role field allowed).
- Extend `ResidentSchedules.jsx` (or a new small section on the same page, per your request "1 form") with an editable "My area" form pre-filled from `authService.getCurrentUser()`, submitting to the new endpoint and refreshing `upcomingSchedules` after save.
- Keep it on the same page (no separate "Edit Profile" route) since the resident's only editable data is address/area/name/phone.

---

## 3. Manager dashboard — split into Dashboard + work pages, add charts

**Current state**: [Dashboard/index.jsx](../.src/frontend/src/pages/Dashboard/index.jsx) does everything (schedule create, route/team mgmt, complaints, feedback reports, completion approvals) in one file — confirmed pain point.

**Proposed restructuring** (new routes under manager area):
| Route | Purpose | Source material |
|---|---|---|
| `/dashboard` | Overview only: KPI cards + charts | new |
| `/dashboard/schedule-create` | Create/manage schedules & routes/teams | moved from current Dashboard |
| `/dashboard/complaints` | Complaint management + AI summary | moved (`AIComplaintSummary.jsx`) |
| `/dashboard/reports` | Collector feedback reports + completion approvals | moved |
| `/manager/invoices` | Payment/invoice creation | already separate (`ManagerInvoice.jsx`) |
| `/manager/payroll` | Collector payload/pay calculation (new, see item 8) | new |

**Chart recommendations** (using existing data: `invoices`, `complaints`, `collection_schedules`):
- **Line chart** — Revenue collected per month (sum of `paid` invoices grouped by `billingMonth/billingYear`) → tracks cash flow trend.
- **Line chart (alt/second tab)** — Complaints received vs resolved per week → operational health trend.
- **Pie chart** — Invoice status breakdown this month: `paid` / `unpaid` / `overdue`.
- **Pie chart** — Complaint status breakdown: `Open` / `in_resolve` / `resolved` / `rejected`.
- **Bar chart** — Schedules completed per collector this week (for the payload feature in item 8).

Suggested library: `recharts` (lightweight, React-native, no extra CSS framework conflicts with Tailwind).

**New backend endpoint(s)**: `GET /api/manager/dashboard/stats?range=...` aggregating the above from `invoices`, `complaints`, `collection_schedules` collections (server-side aggregation to avoid shipping raw data to the client).

---

## 4. Collector schedule as calendar (weekly/monthly) + payload tracking + deny flow

**Current state**: Collector sees a flat list per single day ([Collector/index.jsx](../.src/admin-frontend/src/pages/Collector/index.jsx), `collectorService.getDailySchedules`). Manager creates one-off schedules ([managerController.js](../.src/backend/controllers/managerController.js) `createSchedule`) — no recurrence concept exists yet.

**Proposed fix**:
- **Manager side**: extend `createSchedule` to optionally take a `recurrence: { frequency: 'weekly'|'monthly', daysOfWeek: [...], endDate }` and generate multiple `collection_schedules` docs (or a lightweight `schedule_templates` collection + a resolver that expands them per week) — reuse `assigned_collectors`/`team_id` already present.
- **Collector side**: replace the flat daily list with a calendar view (week/month) — recommend `react-big-calendar` (works with Tailwind, minimal setup) rendering each schedule as an event.
- **Confirm → "Confirm week route work"**: change per-route confirm to a per-week batch confirm (aggregate all schedules assigned to the collector in that ISO week), backed by a new `POST /api/collector/confirm-week` that marks all of that week's schedules `collector_confirmed: true`.
- **Deny flow (recommendation, since you asked)**: add a `status: 'denied_by_collector'` + `denial_reason` field set via `POST /api/collector/deny-week`. This creates/updates entries in the **same** `manager/schedules/completion-pending`-style queue (reuse the existing pending-approval UI pattern from `managerScheduleService.js`) so managers see denied weeks alongside completion approvals, can view the reason, and either (a) reassign the week to another collector/team, or (b) edit the schedule and re-publish (clearing the denied flag, notifying the collector). This avoids inventing a brand-new workflow — it piggybacks on the approval queue that already exists for completions.
- **Payload chart for collector**: bar/line chart on the collector dashboard showing completed schedules count (or `estimatedLoad` sum, see item 8) per day/week, using existing `collectorService.getAllSchedules`.

---

## 5. Payment — reusable templates + payment window + reminder timing

**Current state**: [ManagerInvoice.jsx](../.src/frontend/src/pages/ManagerInvoice.jsx) creates a single one-off invoice per submit; no template/recurrence concept; no automated reminder scheduling (see item 6).

**Proposed fix**:
- New Firestore collection `invoice_templates`: `{ feeType, amount, recurrence: 'monthly'|'weekly', dueOffsetDays, scope: 'all'|'area', area?, createdBy }`.
- Manager UI: "Save as template" checkbox on invoice creation form; a "Templates" list to pick-and-reuse (pre-fills the form) or "Run now" (generates invoices for the matching resident scope immediately).
- Payment window: `dueOffsetDays` on the template (or per-invoice `dueDate`) drives when the reminder email fires (item 6) — 2–3 days before `dueDate` by default, configurable.

---

## 6. Automated payment emails (new invoice + overdue)

**Current state**: No scheduled jobs exist in the backend; emails aren't sent for invoices at all today.

**Proposed fix**:
- Add `node-cron` (or Firebase Scheduled Functions if you prefer serverless) running daily:
  - **New invoice**: send immediately on `createOrUpdateInvoice` (reuse the Nodemailer service from item 1).
  - **Reminder**: query `invoices` where `status == 'unpaid' && dueDate` is 2–3 days out → send reminder.
  - **Overdue**: query `invoices` where `status == 'unpaid' && dueDate < now` → send overdue notice + mark `status: 'overdue'` (new status value, currently only `paid`/`unpaid` exist — verify this doesn't break `Payment.jsx` status badges).
- Reuse `notificationService` to also create an in-app notification alongside the email.

---

## 7. Map blinking route issue

You explicitly asked to **investigate before fixing**. From a first read of [CollectionRouteMap.jsx](../.src/frontend/src/components/CollectionRouteMap.jsx), a likely cause is the `useEffect` that re-attaches the map's click listener whenever `points` changes (`[points, readOnly, mapReady, updatePoints]`), combined with `normalizeRoutePoints(routePoints)` recomputing a **new array reference on every render** — if a parent re-renders frequently (e.g. a polling interval), this could cause polyline/marker redraw loops that look like blinking.

**I will not change this yet.** To confirm the real cause I need:
1. Where does it blink — manager's route editor, collector's calendar/map, or resident's schedule map?
2. Does it happen constantly, or only while dragging/adding points, or only when a polling/auto-refresh (e.g. Payment page's 3s polling pattern) is active nearby?
3. Browser/OS and roughly how long after opening the page it starts.

---

## 8. Collector payload (payroll) calculation

**Manager AI data source — answered**: confirmed above, AI reads from Firestore directly server-side; no change required.

**Proposed fix**:
- Define a "payload" metric per completed schedule/assignment — simplest viable metric given current data: **count of confirmed-complete routes/assignments per collector per pay period** (weight/bin-count isn't tracked anywhere today, would require a new field on schedules if you want it later).
- New backend service `payrollService.js`: `computeCollectorPayload(collectorId, from, to)` → counts completed+confirmed schedules/assignments in range.
- New manager page `/manager/payroll`: lists collectors with computed payload + an editable rate/multiplier, "Generate payslip" button that creates a payout record (new `payouts` collection) — mirrors the existing invoice-creation UX pattern in `ManagerInvoice.jsx`.
- Chart: bar chart of payload by collector for the selected period (same `recharts` dependency as item 3).

---

## Suggested build order (phases)

1. **Phase 1 – Foundations**: custom email service (Nodemailer) → fixes signup (item 1) and unblocks payment emails (item 6).
2. **Phase 2 – Resident**: area edit + profile form on `ResidentSchedules.jsx` (item 2) — small, low-risk.
3. **Phase 3 – Manager dashboard split + charts** (item 3) — structural but isolated to manager routes.
4. **Phase 4 – Payment templates + reminders** (items 5 & 6) — depends on Phase 1.
5. **Phase 5 – Collector calendar + recurring schedules + deny flow + payload** (items 4 & 8) — largest, touches manager schedule creation, collector UI, and a new payroll module.
6. **Phase 6 – Map investigation** (item 7) — can start anytime once you answer the repro questions above; independent of other phases.

---

## Open decisions needed before implementation

- Email sending: Gmail app-password vs a transactional provider (Resend/SendGrid/SES)?
- Is `.src/admin-frontend` still active, or can new manager/collector work target `.src/frontend` only?
- Chart library: OK to add `recharts` as a new dependency?
- Calendar library: OK to add `react-big-calendar` (or a preference for a custom lightweight calendar)?
- Map bug repro details (see item 7 questions).
