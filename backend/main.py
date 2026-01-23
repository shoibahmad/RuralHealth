from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os
import traceback
import logging
from backend.app.core.config import settings
from backend.app.api.api import api_router
from backend.app.db.base import Base
from backend.app.db.session import engine

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend for RuralHealthAI - Digital Health Survey & Risk Screening Tool",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = "".join(traceback.format_exception(None, exc, exc.__traceback__))
    logging.error(f"Global exception: {error_msg}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": error_msg},
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to RuralHealthAI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Serve React Frontend
# Define the path to the static folder (where frontend build lives)
# Since main.py is in backend/, static is in backend/static
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Only mount/serve if the directory exists (it will on Render after build)
if os.path.exists(STATIC_DIR):
    # Mount assets (Vite places CSS/JS in assets/)
    assets_path = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Catch-all route to serve index.html for client-side routing
    @app.get("/{full_path:path}")
    async def serve_app(full_path: str):
        # Check if the requested file exists in static (e.g. favicon.ico, logo.png)
        possible_file = os.path.join(STATIC_DIR, full_path)
        if os.path.isfile(possible_file):
            return FileResponse(possible_file)
        
        # Perform fallback to index.html for SPA routing
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
