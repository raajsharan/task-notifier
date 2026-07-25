"""
Central configuration, loaded from environment variables (.env in local dev).
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # --- Database: PostgreSQL ---
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://taskuser:taskpass@localhost:5432/tasknotifier",
    )

    # --- Auth / JWT ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE-ME-TO-A-LONG-RANDOM-VALUE")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24h

    # --- CORS (frontend origin) ---
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


settings = Settings()
