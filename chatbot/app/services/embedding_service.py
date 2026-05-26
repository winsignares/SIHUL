from openai import AsyncOpenAI
from app.core.config import get_settings

_settings = get_settings()
_client = AsyncOpenAI(api_key=_settings.OPENAI_API_KEY)


async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    response = await _client.embeddings.create(
        model=_settings.EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


async def generate_embedding(text: str) -> list[float]:
    result = await generate_embeddings([text])
    return result[0]
