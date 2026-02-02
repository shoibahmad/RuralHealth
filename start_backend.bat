@echo off
echo Starting RuralHealthAI Backend (Django)...
echo.
cd /d "%~dp0"
call backend\venv\Scripts\activate
cd backend
python manage.py runserver 0.0.0.0:8000
