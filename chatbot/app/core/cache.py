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
