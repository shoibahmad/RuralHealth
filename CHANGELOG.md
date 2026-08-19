# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Backend test suite: 248 pytest specs covering authentication, patients,
  screenings, dashboards, officer oversight, the patient portal and the AI
  service wrapper, at 92% statement coverage.
- Frontend test suite: 323 vitest specs covering the validation schemas, risk
  scoring, OCR field mapping, name reconciliation, screening payload assembly,
  dashboard aggregation, the offline sync queue, structured logging, error
  and date handling, the Firestore service layer and the name-verification
  banner.
- GitHub Actions CI running lint, type checks, tests and a production build on
  every push and pull request, across Python 3.12 and 3.13, plus a Docker build
  that smoke-tests the container's health endpoint.
- `docker compose up --build` brings up PostgreSQL and the application
  together, applying migrations on startup.
- Input validation at both API boundaries: DRF serializers range-check every
  vital and lab value server-side, and matching zod schemas
  (`frontend/src/lib/schemas.ts`) validate before any Firestore write.
- Upload validation on the AI endpoints: size cap and file-type allowlist
  before a Gemini call is made.
- `backend/.env.example`, `backend/requirements-dev.txt`,
  `backend/requirements.lock`, `backend/pyproject.toml` (pytest, coverage and
  ruff configuration), `.github/dependabot.yml`, `CONTRIBUTING.md` and this
  changelog.
- Prettier configuration and `format` / `format:check` scripts.
- Root `package.json` and `Makefile` driving both stacks from one place, plus a
  root `.env.example`, `eslint.config.js` and `.prettierrc`, so a fresh clone
  has a single obvious entry point.
- `SECURITY.md` documenting the security posture, the automated checks, and
  the known gaps.
- Enforced coverage gates: CI fails below 85% on either stack.
- Dependency auditing in CI via `npm audit` and `pip-audit`.
- `frontend/src/lib/logger.ts`, a structured logger with pluggable sinks;
  `lib/errors.ts` for narrowing unknown throwables; `lib/dates.ts` for values
  that may be an ISO string or a Firestore Timestamp.

### Changed

- Split `backend/api/views.py` (1524 lines) into eight domain modules under
  `backend/api/views/`, each under 300 lines, re-exported so existing imports
  keep working.
- Extracted the screening risk algorithm into `backend/api/risk.py` as pure
  functions.
- Split `frontend/src/pages/ScreeningWizard.tsx` (694 lines) into a
  `useScreeningWizard` hook, three pure modules (`ocrMapping`, `nameMatching`,
  `screeningPayload`) and a `NameVerificationBanner` component.
- Typed `firestoreService` end to end, replacing its `any` usage with the
  exported `Patient` / `Screening` / `Appointment` interfaces and adding
  `DashboardStats`, `HealthWorkerWithStats` and `AiInsights`. Split its
  domain types into `services/types.ts` and its aggregation into
  `services/dashboardStats.ts`, so no source file now exceeds 500 lines.
- Replaced `print()` diagnostics with the `logging` module across the backend.
- Settings now load `backend/.env` through python-dotenv, so a fresh clone only
  needs `cp .env.example .env`.
- Docker image runs as a non-root user on Python 3.13, applies migrations via
  an entrypoint, and declares a healthcheck.
- Removed scikit-learn, pandas, numpy, bcrypt and httpx from the runtime
  requirements - nothing in the codebase imported them.
- Application code now carries zero `any` annotations, down from 99 lint
  warnings; `npm run lint` runs at `--max-warnings 0`.
- Context objects and `buttonVariants` moved into their own modules so every
  component file exports only components, restoring fast refresh.
- Fetch-on-mount helpers wrapped in `useCallback` and declared in their effect
  dependencies, removing eleven stale-closure warnings.
- Backend dependencies pinned in `backend/requirements.lock.txt`, which is what
  CI installs.
- Applied prettier and `ruff format` across the codebase as a single isolated
  pass, so `format:check` can be enforced going forward.

### Fixed

- **The frontend did not build.** `npm run build` failed with eight TypeScript
  unused-declaration errors across `InitialScanStep`, `VoiceEntryBanner` and
  `ScreeningWizard`.
- **The backend could not be imported without a Gemini API key.**
  `ai_service.py` raised `ValueError` at import time, so a fresh clone could
  not run migrations or tests. The client is now configured lazily and every
  entry point degrades to an explicit "unavailable" result.
- **Screening creation silently discarded lab results.** The serializer
  accepted the hematology, metabolic and liver panels but the view never saved
  them.
- **Self-registered patients were locked out of their own dashboard.** Patient
  profile setup never linked the new `Patient` row to its `User`.
- **Patient self-screening always failed validation** - it sent `patient`
  where the serializer expected `patient_id` - and skipped risk scoring
  entirely. Both screening paths now share one `record_screening()` helper, and
  `patient_id` comes from the session so it cannot be spoofed.
- The analytics smoking tally counted every screening in the system rather than
  only those in the caller's scope.
- Monthly trend windows stepped back in fixed 30-day jumps, repeating or
  skipping months; they now walk calendar months.
- Empty wizard inputs parsed to `0`, so an untaken vital could be stored as a
  real reading of zero. They are now omitted.
- Resolved all 18 npm audit advisories, including 2 critical and 12 high.
- `ScreeningDetailPage` called `.split()` on `ai_insights`, which is a markdown
  string when the Django endpoint writes it but the full analysis object when
  the wizard writes it, so the page threw for any wizard-recorded screening.
- `new Date()` on a Firestore Timestamp yields an Invalid Date, which rendered
  as the literal text "Invalid Date" in the patient, appointment and history
  tables. All such call sites now go through `lib/dates.ts`.
- `PatientDashboard` declared its records with numeric ids left over from the
  Django REST endpoints; Firestore ids are strings, so the shape had been wrong
  since the migration.
- `.dockerignore` patterns were matched against the context root only, so
  `backend/venv` and `frontend/node_modules` were both being sent to the
  daemon; the build context went from 446 MB to 1.3 MB.
- Removed two committed SQLite databases from version control and added
  `*.db` / `*.sqlite3` to `.gitignore`.
- Added `.gitattributes` pinning shell scripts to LF. Without it a Windows
  checkout gave `docker-entrypoint.sh` CRLF endings and the container died at
  startup with `env: 'bash
': No such file or directory`.

### Known limitations

- `POST /api/ai/analyze`, `/api/ai/lab-extract` and `/api/ai/text-vitals`
  remain unauthenticated, matching how the SPA currently calls them. They are
  now size- and type-limited, but should be moved behind authentication.
- Route components and layouts have no unit tests; they are covered end to end
  by the container smoke test in CI rather than in jsdom.
- The IndexedDB wrappers (`lib/db.ts`, `services/db.ts`) are excluded from the
  coverage gate, since testing them against a mock would measure the mock.
- `google-generativeai` is deprecated upstream in favour of `google-genai`;
  migrating is not yet scheduled.
