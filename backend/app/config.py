from pathlib import Path

from pydantic_settings import BaseSettings

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DATABASE_URL = f"sqlite:///{(_BACKEND_DIR / 'bingomundial.db').as_posix()}"


class Settings(BaseSettings):
    database_url: str = _DEFAULT_DATABASE_URL
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 480
    algorithm: str = "HS256"

    class Config:
        env_file = ".env"


settings = Settings()
