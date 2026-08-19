# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Backend test suite: 248 pytest specs covering authentication, patients,
  screenings, dashboards, officer oversight, the patient portal and the AI
  service wrapper, at 92% statement coverage.
- Frontend test suite: 184 vitest specs covering the validation schemas, risk
  scoring, OCR field mapping, name reconciliation, screening payload assembly,
  the Firestore service layer and the name-verification banner.
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
  `DashboardStats`, `HealthWorkerWithStats` and `AiInsights`.
- Replaced `print()` diagnostics with the `logging` module across the backend.
- Settings now load `backend/.env` through python-dotenv, so a fresh clone only
  needs `cp .env.example .env`.
- Docker image runs as a non-root user on Python 3.13, applies migrations via
  an entrypoint, and declares a healthcheck.
- Removed scikit-learn, pandas, numpy, bcrypt and httpx from the runtime
  requirements - nothing in the codebase imported them.

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
- Removed two committed SQLite databases from version control and added
  `*.db` / `*.sqlite3` to `.gitignore`.

### Known limitations

- `POST /api/ai/analyze`, `/api/ai/lab-extract` and `/api/ai/text-vitals`
  remain unauthenticated, matching how the SPA currently calls them. They are
  now size- and type-limited, but should be moved behind authentication.
- 99 pre-existing `any` annotations remain in the page components. `npm run
  lint` pins the count via `--max-warnings` so it can only shrink.
- `google-generativeai` is deprecated upstream in favour of `google-genai`;
  migrating is not yet scheduled.
