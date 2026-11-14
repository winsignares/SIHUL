"""Límite de preguntas por usuario en una ventana de tiempo (cada pregunta gasta tokens de IA).

Con Redis la cuenta se comparte entre procesos y réplicas; sin Redis (o si falla) se cuenta en memoria del proceso,
que con un solo proceso de uvicorn es exacto. Un fallo de Redis nunca debe impedir que alguien pregunte.
"""
import time
from collections import defaultdict, deque

from app.core.cache import get_redis


class LimitadorPorClave:
    def __init__(self, maximo: int, ventana_segundos: int = 60):
        self.maximo = maximo
        self.ventana = ventana_segundos
        self._memoria: dict[str, deque] = defaultdict(deque)

    async def permitir(self, clave: str) -> tuple[bool, int]:
        """(permitido, segundos que faltan para poder preguntar otra vez si no lo está)."""
        redis = get_redis()
        if redis is not None:
            try:
                return await self._con_redis(redis, clave)
            except Exception:
                pass
        return self._en_memoria(clave)

    async def _con_redis(self, redis, clave: str) -> tuple[bool, int]:
        llave = f"chatbot:limite:{clave}"
        usadas = await redis.incr(llave)
        if usadas == 1:
            await redis.expire(llave, self.ventana)
        if usadas <= self.maximo:
            return True, 0
        return False, max(int(await redis.ttl(llave)), 1)

    def _en_memoria(self, clave: str) -> tuple[bool, int]:
        ahora = time.monotonic()
        marcas = self._memoria[clave]
        while marcas and ahora - marcas[0] >= self.ventana:
            marcas.popleft()
        if len(marcas) >= self.maximo:
            return False, max(int(self.ventana - (ahora - marcas[0])) + 1, 1)
        marcas.append(ahora)
        return True, 0
