from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import get_settings


@lru_cache
def get_redis() -> Redis | None:
    """Cliente Redis compartido, o None si no hay REDIS_URL configurada."""
    redis_url = get_settings().REDIS_URL
    if not redis_url:
        return None
    return Redis.from_url(redis_url, decode_responses=True)


async def invalidate_answers(chatbot_id: int, sede: str) -> None:
    """Borra las respuestas cacheadas de un chatbot y sede.

    Se llama al subir o eliminar documentos: las respuestas cacheadas dejan de
    reflejar el contenido real. Un fallo de Redis nunca debe romper la ingesta.
    """
    redis = get_redis()
    if redis is None:
        return
    try:
        keys = [k async for k in redis.scan_iter(match=f"chatbot:{chatbot_id}:{sede}:answer:*")]
        if keys:
            await redis.delete(*keys)
    except Exception:
        pass
