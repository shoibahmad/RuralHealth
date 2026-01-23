from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RuralHealthAI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_CHANGE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    # Database
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./ruralhealth.db"
    # For Postgres in prod: "postgresql://user:password@postgresserver/db"

    class Config:
        case_sensitive = True

settings = Settings()
