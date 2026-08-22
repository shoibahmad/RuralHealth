# Dependency Inventory & Governance

This document records the direct runtime and development dependencies for RuralHealthAI, their license compliance, update cadences, and security audit policies across both frontend and backend workspaces.

---

## Frontend Workspace (`frontend/`)

### Runtime Dependencies

| Package | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `react` | `^19.2.0` | Core UI library | MIT |
| `react-dom` | `^19.2.0` | React DOM renderer | MIT |
| `react-router-dom` | `^7.12.0` | Client-side routing and navigation | MIT |
| `@tanstack/react-query` | `^5.90.19` | Server state management and caching | MIT |
| `zod` | `^4.4.3` | Schema validation and runtime type assertion | MIT |
| `framer-motion` | `^12.29.0` | Animation and transition primitives | MIT |
| `lucide-react` | `^0.562.0` | Accessible iconography | ISC |
| `recharts` | `^3.7.0` | Data visualization charts | MIT |
| `@radix-ui/react-label` | `^2.1.8` | Accessible form label primitive | MIT |
| `@radix-ui/react-select`| `^2.2.6` | Accessible dropdown select primitive | MIT |
| `@radix-ui/react-slot`  | `^1.2.4` | Component composition slot primitive | MIT |
| `class-variance-authority` | `^0.7.1` | Type-safe component variant styles | Apache-2.0 |
| `clsx` | `^2.1.1` | Conditional className utility | MIT |
| `tailwind-merge` | `^3.4.0` | Tailwind CSS conflict resolution | MIT |
| `firebase` | `^12.9.0` | Cloud database client and auth integration | Apache-2.0 |
| `jwt-decode` | `^4.0.0` | JWT token parsing utility | MIT |

### Development & Test Tooling

| Package | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `typescript` | `~5.9.3` | Static type checking and compiler | Apache-2.0 |
| `vite` | `^7.2.4` | Development server and bundle builder | MIT |
| `vitest` | `^4.1.11` | Unit test runner with native ESM & JSDOM | MIT |
| `@vitest/coverage-v8` | `^4.1.11` | V8 code coverage provider | MIT |
| `@testing-library/react` | `^16.3.2` | Component rendering and user interaction testing | MIT |
| `@testing-library/jest-dom` | `^7.0.1` | Custom DOM matchers for assertions | MIT |
| `@testing-library/user-event` | `^14.6.5` | High-fidelity DOM event simulation | MIT |
| `eslint` | `^9.39.1` | Static code analysis and linting | MIT |
| `prettier` | `^3.9.6` | Opinionated code formatter | MIT |
| `tailwindcss` | `^3.4.17` | Utility-first CSS framework | MIT |
| `postcss` | `^8.5.6` | CSS transformation tooling | MIT |
| `autoprefixer` | `^10.4.23` | CSS vendor prefix generator | MIT |

---

## Backend Workspace (`backend/`)

### Runtime Dependencies (`backend/requirements.txt`)

| Package | Range | Lock Version | Purpose | License |
| :--- | :--- | :--- | :--- | :--- |
| `Django` | `>=5.2,<7.0` | `6.0.1` | Web framework, ORM, and admin | BSD-3-Clause |
| `djangorestframework` | `>=3.16,<4.0` | `3.16.1` | REST API framework and serializers | BSD-3-Clause |
| `djangorestframework-simplejwt` | `>=5.5,<6.0` | `5.5.1` | JWT authentication backend | MIT |
| `django-cors-headers` | `>=4.9,<5.0` | `4.9.0` | Cross-Origin Resource Sharing middleware | MIT |
| `drf-spectacular` | `>=0.28,<1.0` | `0.28.0` | OpenAPI 3.0 schema generation | BSD-3-Clause |
| `whitenoise` | `>=6.11,<7.0` | `6.11.1` | Static file serving for WSGI | MIT |
| `gunicorn` | `>=23.0,<26.0` | `23.0.0` | Production WSGI HTTP server | MIT |
| `dj-database-url` | `>=3.0,<4.0` | `3.0.1` | Database URL parser for `DATABASE_URL` | BSD-2-Clause |
| `psycopg2-binary` | `>=2.9,<3.0` | `2.9.11` | PostgreSQL database adapter | LGPL-3.0 |
| `python-dotenv` | `>=1.1,<2.0` | `1.1.1` | Environment variable loader from `.env` | BSD-3-Clause |
| `google-generativeai` | `>=0.8,<1.0` | `0.8.6` | Gemini AI API SDK | Apache-2.0 |

### Development & Test Tooling (`backend/requirements-dev.txt`)

| Package | Range | Lock Version | Purpose | License |
| :--- | :--- | :--- | :--- | :--- |
| `pytest` | `>=8.4,<10.0` | `9.0.2` | Test runner and assertion framework | MIT |
| `pytest-django` | `>=4.11,<5.0` | `4.14.0` | Django test fixtures and database integration | BSD-3-Clause |
| `pytest-cov` | `>=6.0,<8.0` | `7.1.0` | Pytest coverage reporting plugin | MIT |
| `ruff` | `>=0.9,<1.0` | `0.9.10` | High-performance Python linter and formatter | MIT |
| `pip-audit` | `>=2.7,<3.0` | `2.8.0` | Dependency vulnerability auditing tool | Apache-2.0 |
| `bandit` | `*` | `1.8.3` | Static Application Security Testing (SAST) | Apache-2.0 |

---

## Lockfile Discipline & Vulnerability Auditing

1. **Deterministic Installs**:
   - Frontend locks exact versions in `frontend/package-lock.json` and root `package-lock.json`. CI uses `npm ci`.
   - Backend locks exact versions and hashes in `backend/requirements.lock.txt`. CI installs strictly from this lockfile.

2. **Automated Vulnerability Scanning**:
   - CI runs `npm audit --audit-level=high` on every PR/push.
   - CI runs `pip-audit -r backend/requirements.lock.txt` and `bandit -r backend/api` on every PR/push.
   - Scheduled weekly checks run via `.github/workflows/dependency-check.yml`.

3. **Dependency Upgrades**:
   - Dependabot alerts and version bumps are tracked in GitHub.
   - Upgrades follow semantic versioning with regression test verification.
