from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    DATABASE_URL: str
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    CHAT_MODEL: str = "gpt-4o-mini"
    MIN_SIMILARITY: float = 0.45
    TOP_K: int = 5

    class Config:
        env_file = ".env"
        extra = "ignore"  


@lru_cache
def get_settings() -> Settings:
    return Settings()