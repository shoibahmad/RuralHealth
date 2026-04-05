# RuralHealthAI: Empowering Rural Healthcare with AI & Offline Connectivity

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

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18.0 or higher)
- **Python** (v3.10 or higher)
- **Firebase Account** with a Firestore database and Auth enabled.
- **Google AI Studio API Key** (for Gemini Pro).

### Step 1: Backend Setup
1. Clone the repository and navigate to the backend:
   ```bash
   cd backend
   ```
2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in a `.env` file (see [Configuration](#-configuration)).
5. Run migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

### Step 2: Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file (see [Configuration](#-configuration)).
4. Launch the development server:
   ```bash
   npm run dev
   ```

---

## ⚙️ Configuration Reference

### Backend `.env`
| Variable | Description |
| :--- | :--- |
| `SECRET_KEY` | Django standard security key. |
| `DEBUG` | Set to `True` for development, `False` for production. |
| `GEMINI_API_KEY` | API Key from Google AI Studio. |
| `ALLOWED_HOSTS` | Comma-separated list of domains. |

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

## 🗺️ Future Roadmap
- [ ] **Multi-lingual Support**: Localization into Hindi and regional vernaculars.
- [ ] **Voice-Based Vitals**: AI-powered voice capture for elderly patients.
- [ ] **WhatsApp/SMS Integration**: Automatic PDF health reports sent to patient mobiles.
- [ ] **Predictive Modeling**: Long-term risk prediction based on historical screening trends.

---

## 📄 License & Ownership
Distributed under the **MIT License**. Created and maintained by **Alisha Shad**.

For inquiries or contributions, contact: **[alishasshad@gmail.com](mailto:alishasshad@gmail.com)**
