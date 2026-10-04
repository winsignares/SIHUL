from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    OPENAI_API_KEY: str
    DATABASE_URL: str
    CHUNK_SIZE: int = 900
    CHUNK_OVERLAP: int = 150
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    # Dimensión del vector que produce EMBEDDING_MODEL; debe coincidir con la columna
    # chunks.embedding (se valida al arrancar). Si se cambia de modelo con otra
    # dimensión hay que recrear la columna y volver a cargar los documentos.
    EMBEDDING_DIM: int = 1536
    CHAT_MODEL: str = "gpt-4o-mini"
    # Modelo para preguntas de conteo o de listas exhaustivas ("¿cuántas faltas hay?",
    # "¿cuáles son…?"): el modelo económico suele omitir los últimos elementos aunque
    # estén en el contexto. Vacío = usar siempre CHAT_MODEL.
    CHAT_MODEL_LISTS: str = "gpt-4o"
    MIN_SIMILARITY: float = 0.40
    TOP_K: int = 8
    MAX_UPLOAD_MB: int = 25
    MAX_CHUNKS_PER_DOCUMENT: int = 5000
    REDIS_URL: str | None = None
    ANSWER_CACHE_TTL_SECONDS: int = 3600
    # Django espera 30 s al RAG: embedding (mitad de este tiempo) + LLM, sin reintentos,
    # deben sumar menos para poder responder con un error limpio.
    OPENAI_TIMEOUT_SECONDS: float = 18
    OPENAI_INGEST_TIMEOUT_SECONDS: float = 60

    class Config:
        env_file = ".env"
        extra = "ignore"  


@lru_cache
def get_settings() -> Settings:
    return Settings()