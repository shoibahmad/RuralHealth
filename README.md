# RuralHealthAI

RuralHealthAI is a production-ready "Digital Health Survey & Risk Screening Tool" designed for community health workers to screen rural populations for health risks using WHO algorithms.

## Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, ShadCN UI, Lucide React, React Query, Firebase (Auth & Firestore)
- **Backend:** Python Django, Django REST Framework, SQLite (Dev) / PostgreSQL (Prod)
- **Authentication:** Firebase Auth (Identity Platform) & Django REST Framework
- **AI/ML:** Google Gemini AI, OpenAI Whisper, Tesseract/PaddleOCR, Scikit-Learn

## Project Structure

```
├── frontend/          # React application (Vite + TypeScript)
│   ├── .env.example   # Template for environment variables
│   └── src/           # Source code
├── backend/           # Django REST API
│   ├── api/           # API app (models, views, serializers)
│   ├── ruralhealth/   # Django project settings
│   └── manage.py      # Django management script
├── render-build.sh    # Deployment build script
└── DEPLOYMENT_GUIDE.md# Detailed deployment instructions
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies (including dj-database-url for prod)
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup

First, configure your environment variables:
1.  Copy `.env.example` to `.env` in the `frontend` directory.
2.  Fill in your Firebase API keys (see `DEPLOYMENT_GUIDE.md` for security best practices).

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints & Features

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | JWT token login (Backend) |
| `/api/auth/me` | GET | Get current user |
| `/api/screening/patients` | GET, POST | List/create patients (Syncs with Firestore) |
| `/api/screening/screenings` | GET, POST | List/create screenings |
| `/health` | GET | Health check |

## Environment Variables

### Backend (`backend/.env` or OS Environment)
- `SECRET_KEY`: Django secret key
- `DEBUG`: `True` for dev, `False` for prod
- `ALLOWED_HOSTS`: Comma-separated list of hosts
- `GEMINI_API_KEY`: Google Gemini API Key

### Frontend (`frontend/.env`)
All variables must start with `VITE_`.
- `VITE_FIREBASE_API_KEY`: Firebase API Key
- `VITE_FIREBASE_AUTH_DOMAIN`: Auth Domain
- ... (see `.env.example`)

## Deployment

The project is configured for deployment on **Render**. 

👉 **Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for step-by-step instructions.**

The `render-build.sh` script handles the full build process:
1.  Installs Python dependencies.
2.  Builds the React frontend.
3.  Copies the frontend build to `backend/static/` for serving via Django.
4.  Runs migrations and collects static files.

## License

MIT License
