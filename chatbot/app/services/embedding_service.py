import asyncio

from openai import AsyncOpenAI
from app.core.config import get_settings

_settings = get_settings()
_client = AsyncOpenAI(api_key=_settings.OPENAI_API_KEY)

# OpenAI limita el número de textos y de tokens por petición: un documento grande se
# envía en lotes (unos pocos en paralelo) y el orden de los resultados se conserva.
_BATCH_SIZE = 128
_MAX_PARALLEL = 3


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    semaphore = asyncio.Semaphore(_MAX_PARALLEL)

    async def embed(batch: list[str]) -> list[list[float]]:
        async with semaphore:
            response = await _client.embeddings.create(
                model=_settings.EMBEDDING_MODEL,
                input=batch,
            )
            return [item.embedding for item in response.data]

    batches = [texts[i:i + _BATCH_SIZE] for i in range(0, len(texts), _BATCH_SIZE)]
    results = await asyncio.gather(*(embed(b) for b in batches))
    return [emb for batch in results for emb in batch]


async def generate_embedding(text: str) -> list[float]:
    result = await generate_embeddings([text])
    return result[0]
