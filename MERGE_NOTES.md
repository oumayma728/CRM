# `final` branch — merge notes

`final` was created from `main` and keeps main's layout:

- **`Backend/`**: the ASP.NET Core 8 project `CRM.API.csproj`, organised as `Controllers/`, `Services/<Module>/`, `Entities/`, `DTOs/<Module>/`, `Data/`, `Helpers/`.
- **`frontend/`**: the React + Vite app, organised as `src/app/{pages/<area>, components, contexts, services, hooks, types}`.

The visual design comes from **khaled-dev-v3**: its colour tokens, Inter font, glass surfaces, sidebar/navbar layout and page-title style. Main's frontend already *was* that design. Everything brought in from the other branches was restyled to match it.

## 1. What the branches actually contained

| Branch | Content | Relation to `main` |
|---|---|---|
| `main` | Khaled's frontend (`frontend/`) + the Oumayma/Zied backend (`Backend/`) | base |
| `integration/khaled-dev-v3` | Same tree as `main` **plus** Khaled's own backend `Backend/src/CrmApi`, its tests, Docker/nginx files | main = this tree minus 253 files ("cleaned code") |
| `dev` | Identical tree to `integration/khaled-dev-v3` | — |
| `feature/khaled`, `feature/khaled1` | Khaled's stand-alone project (`frontend/` + `Backend/src/CrmApi`), a few commits newer than integration | not merged |
| `feature/zied1` | Oumayma/Zied project: the flat `Backend/` + a second frontend `Frontend/` (capital F) with 9 roles | 10 commits not in main |
| `feature/security-hamza` | Older snapshot of `feature/zied1` (fully contained in it) | — |
| `ui/template` | Early UI template (subset of `feature/zied1` pages, mock data) | — |

There is **no `feature/khaled-dev-v3` branch**. `integration/khaled-dev-v3` was used as the design branch.

**Why main did not work as-is.** "cleaned code" deleted Khaled's backend. Main's pages were written against that backend's API, not the flat `Backend/`:

- login sent `{username, password}`;
- there was no `/api/auth/me`;
- `calls`, `appointments`, `messages`, `config`, `performance` and similar endpoints did not exist;
- every response was snake_case.

Main's CI, Dockerfile and `render.yaml` also still pointed at the deleted `Backend/src/CrmApi`.

## 2. Backend: what was rebuilt inside `Backend/`

### From khaled-dev-v3 (re-homed onto main's `Utilisateur` model)

| Module | Endpoints | Where |
|---|---|---|
| AI-analysed calls | `GET/POST /api/calls…`, `/api/analyze/call`, `/transcript`, `/analyze-call/{id}`, `/batch-analyze` | `Controllers/CallsController`, `CallAnalysisController`, `Services/Calls`, `Services/Ai/AiService`, `TranscriptionService` |
| CRM appointments (AI eligibility) | `/api/appointments…` | `AppointmentsController`, `Services/Appointments` |
| Internal messaging + WebSocket | `/api/messages…`, `ws /ws/messages/{userId}` | `MessagesController`, `Services/Messages`, `Services/WebSocket` |
| Analytics (calls, supervision, geo, follow-ups, live agents) | `/api/analytics/*` | `AnalyticsController`, `Services/Analytics` |
| Quality dashboard | `/api/quality/*` (13 endpoints) | `QualityController`, `Services/Quality` |
| Call performance | `/api/performance/*` | `CallPerformanceController` |
| Agent workspace | `/api/agents/{id}/performance`, `/save`, `/saved`, `/names` | `AgentWorkspaceController`, `Services/AgentWorkspace` |
| Leads import / stats | `/api/leads…` | `LeadsController`, `Services/Leads` |
| AI config, export, maintenance | `/api/config`, `/api/export/*`, `/api/maintenance/*` | respective controllers |
| Background jobs | follow-up reminders, inactivity alerts | `Services/Followups`, `Services/Alerts` |
| Auth additions | `GET /api/auth/me`, `/api/auth/permissions`, `/api/auth/agents`, `POST/PUT/DELETE /api/auth/users…` | `AuthController` |
| Login rate limiting (feature/khaled1) | 10 attempts / 2 min per IP, `429 + Retry-After` | `Program.cs` |
| DB settings from `DB_HOST`/`DB_NAME`/… (feature/khaled) | — | `Program.cs` |

New tables live in `Entities/{Call, Appointment, CrmAppointment, Followup, Message, AgentSavedData, Log, Lead, LeadFolder, Qualification}.cs`. They are created by migration `20260929120000_AddCallAnalysisModule` (idempotent) or `scripts/sql/add_call_analysis_module.sql`.

Khaled's API is snake_case and main's is camelCase, so:

- controllers carrying Khaled's contract are marked `[SnakeCaseJson]` (`Attributes/`, `Formatters/`);
- their request bodies accept both snake_case and camelCase.

### From feature/zied1 (commits never merged into main)

- `PerformanceController` (`/api/performance/crm/*`), including the global comparison.
- `GroqAiService` (cloud Whisper transcription and LLM summaries).
- Qualité drill-down endpoints: `/api/qualite/agent-performance`, `/rdv-calendrier`.
- The Groq model settings.

### Endpoints Zied's pages called but that never existed

| Endpoint | Fix |
|---|---|
| `/api/admin/leads/upload` | added `POST /api/technique/fichiers/upload` |
| `/api/confirmation1/export-contacts/{id}` | added |
| `/api/confirmation2/commerciaux/suivi` | page now calls `/api/confirmation-client/commerciaux` |
| `injectFile` | now calls `POST /api/Campaigns/{id}/source-files/{id}/inject` |
| forced password change after an admin reset | was unreachable without a token; now goes through `/first-login` (`AuthService.FirstLoginAsync` accepts `MustChangePassword`) |

## 3. Frontend: pages rebuilt in `frontend/src/app/pages`

All of these come from `feature/zied1` and were restyled to the khaled-dev-v3 design:

- **Confirmatrice 1 / 2 / Client** (`pages/confirmation/**`): dashboards; EBI, Client 1/2 and Refus agendas; agent evaluation; statistics; contact files; RDV attribution; sales-rep tracking; bank comments.
- **Commercial** (`pages/commercial/*`): dashboard and agenda.
- **Service technique** (`pages/technique/*`): dashboard, agents, contact files, team attendance, access, calendar account, evaluation.
- **Shared** (`pages/shared/*`): team chat (SignalR), my attendance history, confirmatrice contacts.
- **Super admin**: `SuperAdminDashboard`.
- **Admin**: users (all roles, agenda assignment, admin password reset), permissions, campaign file management (sources / injections / recycling), files awaiting injection, clients, AI dashboard (forecast, anomalies, contact scoring), confirmatrice agendas, attendance history, daily attendance report.
- **Agent**: campaign dialer, live call sheet (pipeline), history, my attendance, *Mes RDV (pipeline)*, *Performance CRM*.
- **Qualité**: refusals agenda, call stats, quality analytics, pipeline RDV calendar.
- **Auth**: first login / activation, change password, create contact sheet.

Shell and plumbing:

- One `AuthContext` (email + password, `/auth/me`, all 9 roles incl. confirmatrice types, `homePathFor`).
- A `Sidebar` menu per role, and guarded routes in `App.tsx`.
- `services/crmApi.ts` (axios, camelCase normalisation) for the pipeline pages.

Also brought in:

- **From `feature/khaled`**: `RateLimitError` with the login cooldown, single-flight login, the local `noise.svg`, and the nginx TLS-SNI proxy.
- **Salary page**: the pay-parameter editor from Zied's salary page (per contract type, super admin only) was added to Khaled's page.

## 4. Same feature, two implementations: which one was kept

| Feature | Kept | Why | The other one |
|---|---|---|---|
| Admin dashboard | Khaled `DashboardPage` + `RealTimePage` | original and richer; Zied's `AdminDashboard` was a port of it | Zied `AdminDashboard` **dropped** |
| Analytics page | Khaled `AnalyticsPage` (491 lines, 4 data sources) | more complete | Zied `AnalyticsPage` (136) and `AnalyticsKhaledPage` **dropped**; their RDV-based API stays at `/api/analytics/crm/*` (used by the super-admin dashboard) |
| Quality drill-down (agent detail, trends, comparison, performance, manual evaluation) | Khaled's pages + `/api/quality/*` | Zied's were ports of these | Zied's copies **dropped**; Zied's `/api/quality/*` moved to `/api/quality/crm/*` |
| Quality dashboard | Khaled `QualityDashboard` | original, more complete | Zied `QualiteDashboard` **dropped** (its agent list and evaluations are reachable from the kept pages) |
| Alerts | Khaled `AlertsPage` | original | Zied `AlertsManagePage` **dropped** (same API) |
| Salaries | Khaled `SalaryPage` (rules CRUD, PDF, details) | more complete | Zied `SalaryPage` **dropped**; its unique config editor was **merged in** |
| Leads | Khaled `LeadsPage` | original | Zied `LeadsKhaledPage` (port) **dropped** |
| AI scoring / config | Khaled `ScoringPage` + `SettingsPage` | same endpoints, richer | Zied `AIConfigPage` **dropped** |
| Map | Khaled `MapPage` (call postal codes, 381 lines) | more complete | Zied `MapPage` (contact geo-stats) **dropped**; `/api/Contact/geo-stats` still exists |
| Users | **Zied** `UsersPage` | works with main's roles (confirmatrice types, agendas, admin reset) | Khaled `UsersPage` **replaced**; its quick create/edit is still in Khaled's Agents and Dashboard pages via `/api/auth/users*` |
| Scorecards | **Zied** `ScorecardsPage` | live data (238 lines) | Khaled's static version **replaced** |
| Live call page (`/agent/contact`) | **Zied** `ContactPage` | wired to the campaign dialer and RDV pipeline that the other roles depend on | Khaled's kept as **Journal d'appel IA** (`/agent/call-log`) |
| Agent dashboard / agenda / performance / contacts | Khaled's | richer | Zied's agenda and performance kept as extra pages (*Mes RDV (pipeline)*, *Performance CRM*); Zied `AgentDashboard` and `ContactsListPage` **dropped** (dialer covers contacts-to-call) |
| Attendance admin page | Khaled `PointagePage` (live) | design branch | Zied `PointagePage` kept as **Rapport de pointage** (`/admin/pointage/rapport`, daily report by date) |
| Pending files (`FichierAcharge`) | both | different features | Zied's kept as **Fichiers en attente** |
| Quality calendar | both | Khaled's shows AI appointments, Zied's shows pipeline RDVs | both in the menu |
| AI chatbot backend | **Zied** `/api/ai-chat/message` (Groq) | multi-turn, domain prompt; Khaled's `/api/chat` was an Ollama stub without history | Khaled `ChatController`/`ChatService` **dropped**; Khaled's chatbot UI now talks to Groq with history |
| Call analysis (`/api/analyze/call`, `/transcript`) | **Khaled** | 8-criteria scoring, anonymisation, persistence, batch | Zied's two actions **dropped**; Groq is kept as the LLM backend (`LlmCompletionService`: Groq, then Ollama); Zied's `check-refusal` / `check-qualification` kept |
| Attendance / Salary / Alerts / AI-scoring APIs | **Zied's** flat controllers | faithful ports of Khaled's with extra endpoints; they now emit Khaled's snake_case contract | Khaled's versions not ported (Khaled's `PUT /attendance/update/{id}` was added) |
| Super-admin routes | admin pages open to super admin | Zied had `/superadmin/*` mirrors of every admin page | mirrors **not recreated**; super admin uses `/admin/*` plus `/superadmin/dashboard` |

## 5. Features not carried over

- **Zied** `FloatingDialer`, `ChatbotWidget` and `Chat` (floating widgets): Khaled's navbar "APPELER" dialer and the chatbot page cover them.
- **Zied** `RoleSwitcher`: a dev tool with fake tokens.
- **Zied** `agentPresenceService`: called `/Agents/me/heartbeat` and `/presence`, which never existed, and nothing imported it.
- **Zied** legacy `src/Pages/*` and `routes/AppRoutes.tsx`: older duplicates of `app/pages`. The unique `ClientsPage` *was* ported.
- **Zied** `qualite/EvaluationPage`: not routed anywhere on zied1.
- **ui/template**: mock-data template, fully superseded by both frontends.
- **Khaled** `DatabaseSeedService`, Repository/UnitOfWork, AutoMapper profiles, FluentValidation validators: main's services use `ApplicationDbContext` directly. Main's `DbSeeder` stays, and `scripts/sql/seed_e2e_users.sql` creates one account per role.
- **Khaled** `shot*.mjs` screenshot scripts and committed `test-results/`.
- Files removed from main by its own "cleaned code" commit were not restored: `deploy.sh`, `backup.sh`, `cleanup.ps1`, `fix_db.sql`, `fix_mysql.bat`, `config.json`, `db_schema.json`, `ffmpeg.exe`. The README still mentions `deploy.sh`/`backup.sh`, and they are on `integration/khaled-dev-v3` if needed.

## 6. Fixes made along the way

- **Design tokens**: `rgb(var(--primary-rgb) / a)` expanded to invalid CSS (`rgb(129, 140, 248 / 0.1)`). Every `text-primary`, `bg-primary/10`, `from-primary` etc. was silently ignored, including on the design branch's own pages. Tokens now use `rgba(var(--x-rgb), a)`, and success/warning/destructive/info/secondary support opacity.
- Super admin allowed wherever admin is (AI dashboard, scoring, agenda assignment).
- Khaled's Alerts page never sent the auth header.
- The hard-coded `localhost:8000/api/leads/*` calls now go to the .NET leads API.

## 7. Known issues and follow-ups (not changed)

- **Secrets are committed in `Backend/appsettings.json`**: a Groq API key and a PostgreSQL password. They were already on `main`. Rotate them and move them to environment variables or user-secrets.
- **The migration chain cannot bootstrap an empty database.**
  - The first migrations reference tables created by the later-dated `20260610135418_InitialCreate`.
  - The Khaled-module migrations (`AddKhaledModules`, `AddChatAndAIFields`, `AddAttendanceBreakFields`, …) have no `[Migration]` attribute, so EF never runs them. The team applied them with the scripts in `scripts/sql/`.
  - CI and a fresh local setup use `dotnet ef dbcontext script` instead (see README).
- Permission-based endpoints (`Clients`, `Suppliers`, `Permissions`, `Agents`) return 403 for `ADMIN` until the role/permission tables are filled; super admin bypasses this. This is existing behaviour.
- `render.yaml` / `cd.yml` now deploy this repository's `main`. Previously they deployed `Khaledouertani/CRM_ai_projet`. Adjust if that was intended.

## 8. Verification

- `dotnet build Backend/CRM.API.csproj` passes, and `dotnet test Backend/tests/CRM.API.Tests` passes (**100 tests**).
- `npx tsc --noEmit`, `npm run build` and `npx vitest run` pass (**27 tests**).
- `npx playwright test` against PostgreSQL + backend + Vite passes (**25 e2e tests**: every role lands on its dashboard; admin, agent, quality, confirmation, commercial and technique flows).
- A crawler logged in as each of the 9 roles and opened every sidebar link (**160+ pages**): no blank page, no JS error, and no failing API call except the permission-table 403s above.
