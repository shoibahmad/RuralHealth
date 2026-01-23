@echo off
echo Starting RuralHealthAI Backend...
echo.
cd /d "%~dp0"
call backend\venv\Scripts\activate
set PYTHONPATH=%~dp0
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
