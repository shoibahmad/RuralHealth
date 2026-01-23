from fastapi import APIRouter
from backend.app.api.endpoints import auth, screening

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(screening.router, prefix="/screening", tags=["screening"])
