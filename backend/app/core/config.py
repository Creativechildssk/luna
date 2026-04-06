import os
from dotenv import load_dotenv

load_dotenv()


def _parse_origins(raw_value: str | None) -> list[str]:
    if not raw_value:
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    return [origin.strip() for origin in raw_value.split(",") if origin.strip()]


class Settings:
    APP_NAME = "LUNA"
    VERSION = "1.0"
    CORS_ORIGINS = _parse_origins(os.getenv("CORS_ORIGINS"))

    @property
    def cors_allow_credentials(self) -> bool:
        return "*" not in self.CORS_ORIGINS


settings = Settings()