# RuralHealthAI

RuralHealthAI is a production-ready "Digital Health Survey & Risk Screening Tool" designed for community health workers to screen rural populations for health risks using WHO algorithms.

## Tech Stack

- **Frontend:** React (Vite), TypeScript, Tailwind CSS, ShadCN UI, Lucide React, React Query
- **Backend:** Python Django, Django REST Framework, SQLite/PostgreSQL
- **Authentication:** JWT (djangorestframework-simplejwt)
- **AI/ML:** OpenAI Whisper, Tesseract/PaddleOCR, Scikit-Learn

## Project Structure

```
├── frontend/          # React application (Vite + TypeScript)
├── backend/           # Django REST API
│   ├── api/           # API app (models, views, serializers)
│   ├── ruralhealth/   # Django project settings
│   └── manage.py      # Django management script
├── render-build.sh    # Deployment build script
└── start_backend.bat  # Windows dev server script
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | JWT token login |
| `/api/auth/me` | GET | Get current user |
| `/api/screening/patients` | GET, POST | List/create patients |
| `/api/screening/screenings` | GET, POST | List/create screenings |
| `/health` | GET | Health check |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Development key |
| `DEBUG` | Debug mode | `True` |
| `DATABASE_URL` | PostgreSQL URL (production) | SQLite |

## Deployment

The project is configured for deployment on Render. The `render-build.sh` script:

1. Installs Python dependencies
2. Builds the React frontend
3. Copies frontend build to `backend/static/`
4. Runs Django migrations
5. Collects static files

## License

MIT License
