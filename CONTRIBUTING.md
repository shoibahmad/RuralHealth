# Contributing to RuralHealthAI

Thanks for working on RuralHealthAI. This document covers how to get the
project running, how to run the checks CI runs, and the conventions the
codebase follows.

---

## Quick start

The fastest way to a running system is Docker, which brings up PostgreSQL and
the combined API/SPA container together:

```bash
git clone <repository-url>
cd "Rural Health AI"
docker compose up --build
```

The application is served on <http://localhost:8000>. Migrations are applied
automatically on startup, so a clean volume needs no manual setup.

AI features need a Google AI Studio key. Without one the app runs normally and
every AI endpoint reports itself unavailable rather than failing:

```bash
export GEMINI_API_KEY=your-key-here   # picked up by docker compose
```

---

## Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                # then fill in SECRET_KEY and GEMINI_API_KEY
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Requires Python 3.12 or newer, matching the CI matrix.

### Frontend

```bash
cd frontend
npm ci
cp .env.example .env                # Firebase client configuration
npm run dev
```

Requires Node 22 or newer. The dev server proxies `/api` to
`http://localhost:8000`, so run the backend alongside it.

---

## Running the checks

CI runs exactly these commands; run them locally before opening a pull
request. From the repository root:

```bash
npm run verify     # lint + typecheck + tests + build, both stacks
make verify        # the same, via make
```

### Backend

| Command | What it checks |
| :--- | :--- |
| `pytest` | The full test suite (251 tests) |
| `pytest --cov --cov-fail-under=85` | Tests plus the enforced coverage gate |
| `ruff check .` | Lint and import ordering |
| `ruff format .` | Apply formatting |
| `python manage.py check` | Django system checks |
| `python manage.py makemigrations --check --dry-run` | Model changes have migrations |

### Frontend

| Command | What it checks |
| :--- | :--- |
| `npm run test` | The full vitest suite (408 tests across 44 test files) |
| `npm run test:coverage` | Tests plus the enforced coverage gate |
| `npm run lint` | ESLint, zero warnings tolerated |
| `npm run typecheck` | TypeScript, with no emit |
| `npm run build` | Type check plus a production bundle |
| `npm run format` | Apply Prettier |

---

## Conventions

### Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add appointment reminders to the patient dashboard
fix: stop the wizard writing untaken vitals as zero
test: cover the officer analytics scoping rules
refactor: split the screening views out of the god module
docs: document the docker compose quick start
chore: bump the pinned Django version
```

Keep each commit to one change, and land behaviour changes together with the
tests that pin them. Avoid commits that mix formatting, refactors and features
- they make the change genuinely hard to review.

### Tests

Every behaviour change needs a test. Tests are colocated by concern:

- Backend: `backend/api/tests/`, one module per domain area.
- Frontend: `*.test.ts` / `*.test.tsx` next to the module under test.

Prefer testing pure functions directly. Where logic sat inside a component or a
view, extracting it - as with `api/risk.py` and `src/lib/ocrMapping.ts` - is
usually the right first move.

Tests must not reach the network. The backend suite clears `GEMINI_API_KEY` for
every test, and the frontend suite mocks the Firestore SDK wholesale.

### TypeScript

Application code carries no `any`. `@typescript-eslint/no-explicit-any` is an
error and `npm run lint` runs with `--max-warnings 0`, so a single new warning
fails the build. Test files may stub partial third-party shapes; the rule is
disabled for them.

Shared domain types live in `frontend/src/services/types.ts`. Prefer widening
one of those over declaring a local shape, and never reach for `any` to get
past a type error - the error is usually pointing at a real mismatch.

### Coverage

Both suites are gated. The backend must stay above 85% (currently 92.4%); the
frontend must stay above 85% lines (currently 94.2%).

The frontend gate measures `src/lib`, `src/services` and the wizard hook. Route
components, layouts, thin wrappers over IndexedDB and the Firebase SDK, and
static translation data are excluded, with the reasons recorded in
`frontend/vitest.config.ts`. If you add a module to those directories, it is in
the denominator - write the test alongside it.

### Python

`ruff` enforces lint, import order and formatting; its configuration lives in
`backend/pyproject.toml`. Use the `logging` module rather than `print` - the
`api` logger is configured in `backend/ruralhealth/settings.py`.

Runtime dependencies go in `backend/requirements.txt` with a compatible range;
tooling goes in `requirements-dev.txt`. After changing either, regenerate the
lockfile from a clean virtualenv:

```bash
python -m venv .lockenv
.lockenv/bin/pip install -r requirements-dev.txt
.lockenv/bin/pip freeze > requirements.lock.txt
```

### Logging

The frontend has a structured logger at `frontend/src/lib/logger.ts`. Use
`createLogger('ModuleName')` rather than `console.*` so records carry a level,
module, timestamp and context, and so an error-tracking transport can be added
by registering a sink instead of editing call sites.

### Validation

Input is validated at both boundaries, and the two are kept in agreement:

- Server: DRF serializers in `backend/api/serializers.py`.
- Client: zod schemas in `frontend/src/lib/schemas.ts`.

If you change a bound on one side, change it on the other.

---

## Secrets

Never commit a `.env` file, an API key, or a database containing real patient
data. `.gitignore` covers `.env`, `*.db` and `*.sqlite3`. Both
`backend/.env.example` and `frontend/.env.example` document the variables each
side needs.
