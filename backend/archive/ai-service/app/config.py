import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PORT: int = int(os.getenv("PORT", 8001))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://tender_user:tender_secret_pass@localhost:5432/tender_management")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "tender_management_jwt_super_secret_key_2026_production")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
