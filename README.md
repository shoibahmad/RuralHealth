# RuralHealthAI: Empowering Rural Healthcare with AI & Offline Connectivity

[![CI](https://github.com/shoibahmad/RuralHealth/actions/workflows/ci.yml/badge.svg)](https://github.com/shoibahmad/RuralHealth/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node 22+](https://img.shields.io/badge/node-22+-green.svg)](https://nodejs.org/)

**RuralHealthAI** is a mission-critical digital health platform designed to bring advanced diagnostic capabilities to frontline health workers in underserved rural areas. By transitioning from manual paper-based logs to a smart, AI-driven, and offline-capable system, the platform enables early identification of Non-Communicable Diseases (NCDs) like Hypertension, Diabetes, and cardiovascular risks.

---

## 🌟 Key Features

### 👩‍⚕️ For Health Workers (Frontline Screening)
- **Smart Screening Wizard**: A multi-step guided workflow for capturing:
  - **Patient Identity**: Demographics and location tracking.
  - **Vitals Check**: Blood Pressure, BMI, Heart Rate, and Oxygen levels.
  - **Lifestyle Survey**: Capturing habits like smoking, alcohol usage, and physical activity.
  - **Lab Report OCR**: Uploading lab reports for automatic blood profile extraction.
- **AI-Powered Risk Assessment**: Localized risk calculation combined with **Google Gemini Pro** analysis for instant medical insights.
- **Patient History**: Complete digital timeline of a patient's screening history and risk trends.

### 👮‍♂️ For Health Officers (Regional Monitoring)
- **Centralized Dashboard**: Real-time view of regional health metrics, total screenings, and worker performance.
- **High-Risk Surveillance**: Targeted tracking of patients flagged as "High Risk" to ensure timely secondary intervention.
- **Worker Management**: Monitoring active health workers and their regional coverage.
- **System Analytics**: In-depth visualization of disease prevalence and demographic trends across villages.

### 👤 For Patients
- **Self-Screening Portal**: Secure access for patients to perform basic self-assessments.
- **Personal Health Records**: Instant access to previous screening results and AI-generated wellness recommendations.

---

## 🛡️ Technological Foundation

### Frontend: Modern & Resilient
- **Framework**: React 18 with Vite for lightning-fast development and optimized bundles.
- **State Management**: React Context API for Global Auth and Offline state.
- **Offline Core**: Specialized `DatabaseService` using **IndexedDB** for local storage and a robust **SyncQueue** for background data reconciliation.
- **Styling**: Tailwind CSS for a premium "Glassmorphism" aesthetic, Lucide React for iconography, and Framer Motion for smooth micro-animations.

### Backend: Scalable & Intelligent
- **Framework**: Django 5.x with Django REST Framework (DRF) for structured API endpoints.
- **AI Engine**: Deep integration with **Google Gemini Pro** for analyzing structured screening data and generating personalized health insights.
- **Security**: CORS headers, secret-key protection, and environment-based configuration for production readiness.

### Cloud & Database
- **Primary Data**: **Firebase Firestore** for real-time document-based clinical data.
- **Identity Provider**: **Firebase Authentication** for secure, role-based login (Health Worker vs. Officer vs. Patient).
- **Secondary Data**: **PostgreSQL/SQLite** for backend-specific logging and audit trails.

---

## 📡 Advanced Capabilities: Offline Connectivity

RuralHealthAI is built with a "Local-First" philosophy to handle the intermittent connectivity of remote villages:
1. **Background Sync**: Screenings are saved locally in IndexedDB when the network is unavailable.
2. **Persistence**: A specialized `SyncQueue` manages retry attempts and data conflict resolution.
3. **Auto-Reconciliation**: The system automatically detects when the device returns online and pushes pending data to the cloud without user intervention.
4. **Visual Indicators**: Real-time "Offline" vs "Online" status badges keep health workers informed.

---

## 🚀 Quick Start

The fastest path from a fresh clone to a running system is Docker, which brings
up PostgreSQL and the combined API/SPA container together and applies
migrations on startup:

```bash
git clone https://github.com/shoibahmad/RuralHealth.git
cd RuralHealth
docker compose up --build
```

The application is then served on <http://localhost:8000>.

AI features need a Google AI Studio key. Without one the app runs normally and
each AI endpoint reports itself unavailable rather than failing:

```bash
export GEMINI_API_KEY=your-key-here   # read by docker compose
```

---

## 🛠️ Local Development

### Prerequisites
- **Node.js** v22 or higher
- **Python** v3.12 or higher
- **Firebase Account** with a Firestore database and Auth enabled
- **Google AI Studio API Key** (optional; AI features degrade cleanly without one)

### Step 1: Backend Setup
1. Navigate to the backend and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies. Use `requirements-dev.txt` for the test and lint
   toolchain, or `requirements.txt` for runtime only:
   ```bash
   pip install -r requirements-dev.txt
   ```
3. Create your environment file from the template and fill it in:
   ```bash
   cp .env.example .env
   ```
4. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

### Step 2: Frontend Setup
1. Navigate to the frontend directory and install packages:
   ```bash
   cd frontend
   npm ci
   ```
2. Create your environment file from the template and fill it in:
   ```bash
   cp .env.example .env
   ```
3. Launch the development server, which proxies `/api` to the backend:
   ```bash
   npm run dev
   ```

---

## ✅ Testing & Quality

Every command below runs in CI on each push and pull request.

### Backend

```bash
cd backend
pytest                  # 248 tests
pytest --cov            # with a coverage report (currently 92%)
ruff check .            # lint and import ordering
ruff format .           # apply formatting
```

### Frontend

```bash
cd frontend
npm run test            # 213 tests
npm run test:coverage   # with a coverage report
npm run lint            # ESLint, under a warning budget
npm run typecheck       # TypeScript, no emit
npm run build           # type check plus production bundle
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for conventions, and
[CHANGELOG.md](CHANGELOG.md) for the change history.

---

## ⚙️ Configuration Reference

Copy the templates rather than writing these by hand:
`backend/.env.example` and `frontend/.env.example`.

### Backend `.env`
| Variable | Required | Description |
| :--- | :--- | :--- |
| `SECRET_KEY` | Yes | Django signing key. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"`. |
| `DEBUG` | No | `True` for development, `False` for production. Defaults to `True`. |
| `ALLOWED_HOSTS` | No | Comma-separated list of hostnames. Defaults to `*`. |
| `DATABASE_URL` | No | Postgres URL. Falls back to a local SQLite file when unset. |
| `GEMINI_API_KEY` | No | Google AI Studio key. AI features are disabled when absent. |
| `LOG_LEVEL` | No | Logger level for the `api` namespace. Defaults to `DEBUG` when `DEBUG` is on. |

### Frontend `.env`
| Variable | Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Project Auth Domain. |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID. |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID. |

---

## 📖 API Documentation

The backend exposes several key endpoints for core functionality:

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
- **Dashboards**: `GET /api/officer/dashboard`, `GET /api/patient/dashboard`
- **AI Analytics**: `POST /api/ai/analyze` (Sends screening data to Gemini)
- **Data Management**: `GET /api/screening/patients`, `POST /api/screening/screenings`

For interactive documentation, use the built-in **API Docs** page within the application (accessible via the footer).

---

## 🧭 Project Layout

```
backend/
  api/
    views/            # Endpoints split by domain (auth, patients, screenings, ...)
    risk.py           # Deterministic screening risk scoring
    serializers.py    # Request validation and response shaping
    ai_service.py     # Gemini client wrapper, lazily configured
    tests/            # pytest suite, one module per domain area
  ruralhealth/        # Django project settings and URL configuration
frontend/
  src/
    lib/              # Pure logic: schemas, risk scoring, OCR mapping
    services/         # Firestore and offline sync layers
    pages/            # Route components
    components/       # Shared and feature-specific UI
```

---

## 🗺️ Future Roadmap
- [ ] **Multi-lingual Support**: Localization into Hindi and regional vernaculars.
- [ ] **Voice-Based Vitals**: AI-powered voice capture for elderly patients.
- [ ] **WhatsApp/SMS Integration**: Automatic PDF health reports sent to patient mobiles.
- [ ] **Predictive Modeling**: Long-term risk prediction based on historical screening trends.

---

## 📄 License & Ownership
Distributed under the **MIT License**. Created and maintained by **Alisha Shad**.

For inquiries or contributions, contact: **[alishasshad@gmail.com](mailto:alishasshad@gmail.com)**
