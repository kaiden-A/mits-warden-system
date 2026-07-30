from urllib.parse import urlencode, urlparse, urlunparse

from pydantic_settings import BaseSettings


def _clean_url_for_asyncpg(url: str) -> str:
    url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parsed = urlparse(url)
    query_params = parsed.query.split("&") if parsed.query else []
    cleaned_params = [
        p
        for p in query_params
        if not p.startswith("sslmode=") and not p.startswith("channel_binding=")
    ]
    if cleaned_params:
        new_query = "&".join(cleaned_params)
        parsed = parsed._replace(query=new_query)
    else:
        parsed = parsed._replace(query="")
    return urlunparse(parsed)


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MOTIONU_API_URL: str = "https://api.motionukict.com/"
    MOTIONU_API_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def async_database_url(self) -> str:
        return _clean_url_for_asyncpg(self.DATABASE_URL)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
