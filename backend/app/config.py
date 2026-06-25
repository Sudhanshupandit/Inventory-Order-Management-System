from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Managed hosts (Render / Railway / Neon, ...) provide a single connection
    # string via DATABASE_URL. When present it takes priority.
    database_url: Optional[str] = None

    # Fallback parts — used by docker-compose and local development.
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_db: str = "order_management"
    postgres_host: str = "db"
    postgres_port: str = "5432"

    # Comma-separated list of allowed frontend origins ("*" allows all).
    cors_origins: str = "*"

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            url = self.database_url
            # SQLAlchemy requires the "postgresql://" scheme; some providers
            # (e.g. Render, Heroku) hand out "postgres://".
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql://", 1)
            return url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
