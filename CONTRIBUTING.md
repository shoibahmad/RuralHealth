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
request.

### Backend

| Command | What it checks |
| :--- | :--- |
| `pytest` | The full test suite |
| `pytest --cov` | Tests plus a coverage report |
| `ruff check .` | Lint and import ordering |
| `ruff format .` | Apply formatting |
| `python manage.py check` | Django system checks |
| `python manage.py makemigrations --check --dry-run` | Model changes have migrations |

### Frontend

| Command | What it checks |
| :--- | :--- |
| `npm run test` | The full vitest suite |
| `npm run test:coverage` | Tests plus a coverage report |
| `npm run lint` | ESLint, under a warning budget |
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

New code should be typed. `@typescript-eslint/no-explicit-any` is a warning
rather than an error only because of pre-existing usages in the page
components; `npm run lint` pins the current count via `--max-warnings`, so the
number can go down but never up. When you touch a file carrying `any`, please
type it and lower the budget in `package.json`.

### Python

`ruff` enforces lint and import order; its configuration lives in
`backend/pyproject.toml`. Use the `logging` module rather than `print` - the
`api` logger is configured in `backend/ruralhealth/settings.py`.

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
