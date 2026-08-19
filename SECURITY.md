# Security Policy

RuralHealthAI handles patient health records. This document states how the
project protects them and how to report a problem.

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue.
Email the maintainer at <alishasshad@gmail.com> with:

- what the issue is and where in the codebase it lives,
- the steps to reproduce it,
- the impact you believe it has.

You can expect an acknowledgement within five working days.

## Supported versions

The project is pre-1.0. Only the `main` branch receives security fixes.

| Version | Supported |
| :--- | :--- |
| `main` | Yes |
| Tagged releases before `v0.1.0` | No |

## What is enforced automatically

Every push and pull request runs these checks; see
[.github/workflows/ci.yml](.github/workflows/ci.yml).

| Check | Tool |
| :--- | :--- |
| Known vulnerabilities in npm dependencies | `npm audit --audit-level=high` |
| Known vulnerabilities in Python dependencies | `pip-audit` against the lockfile |
| Reproducible installs | `backend/requirements.lock.txt`, `frontend/package-lock.json` |
| Dependency updates | Dependabot, weekly for npm and pip |
| Input validation at the API boundary | DRF serializers, exercised by the test suite |
| Input validation before persistence | zod schemas, exercised by the test suite |

## Handling secrets

- No `.env` file is committed. `.gitignore` covers `.env`, `*.db` and
  `*.sqlite3`; `.env.example` documents every variable with placeholders.
- The test suite generates its credentials at runtime rather than embedding
  literals, so no credential-shaped string appears in the repository.
- `GEMINI_API_KEY` is optional. When absent the AI endpoints report themselves
  unavailable rather than failing, so a key is never required to run or test.
- The `VITE_FIREBASE_*` values are public client identifiers, not secrets.
  Firestore security rules, not obscurity, are what protect the data.

## Application security posture

**Authentication.** The Django API issues JWTs via `djangorestframework-simplejwt`;
the SPA authenticates against Firebase Auth. Role checks live in
[backend/api/permissions.py](backend/api/permissions.py) and are covered by
tests asserting that health workers, officers and patients each reach only
their own data.

**Authorisation.** Health workers are scoped to their own caseload at the
queryset level. The patient portal derives `patient_id` from the session rather
than the request body, so a patient cannot file or read records against another
patient; there is a regression test for this.

**Input validation.** Vitals and lab values are range-checked server-side
against physiologically plausible bounds before they reach the risk scorer, and
the same bounds are enforced client-side. Uploads to the AI endpoints are
size-capped and restricted to an allowlist of file types.

## Known gaps

These are tracked, not fixed:

- `POST /api/ai/analyze`, `/api/ai/lab-extract` and `/api/ai/text-vitals` accept
  unauthenticated requests, matching how the SPA currently calls them. They are
  size- and type-limited, but should move behind authentication; doing so
  requires a corresponding frontend change.
- There is no rate limiting on the API. A deployment should place one in front
  of the AI endpoints in particular, since they forward to a paid service.
- `google-generativeai` is deprecated upstream in favour of `google-genai`.

## Deploying safely

- Set `DEBUG=False` and a real `SECRET_KEY`.
- Set `ALLOWED_HOSTS` to your hostnames; the `*` default is for local use only.
- Terminate TLS in front of the application.
- Review the Firestore security rules for your project. Client-side role checks
  are a usability affordance, not an access control boundary.
