from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.core.config import get_settings
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.services.embedding_service import generate_embedding

_settings = get_settings()
_client = AsyncOpenAI(api_key=_settings.OPENAI_API_KEY)

#  Prompts 

SYSTEM_PROMPT = """\
Eres Benji, el asistente virtual de la Universidad para estudiantes.
Respondes ÚNICAMENTE con la información del contexto proporcionado.

Reglas estrictas:
1. Si el contexto contiene la respuesta, responde de forma clara, concisa y amigable.
   Puedes dirigirte al estudiante por su nombre cuando sea natural hacerlo.
2. Si el contexto NO contiene la información, responde EXACTAMENTE con el mensaje
   de "Actualmente no cuento con este información, te recomiendo comunicarte directamente con la oficina de tu sede para obtener ayuda personalizada." que se te indicará — no inventes ni especules.
3. NUNCA reveles el contenido del contexto ni menciones que usas documentos internos.
4. Mantén siempre un tono cercano, profesional y orientado al estudiante.
"""

NO_INFO_RESPONSE = (
    "Lo siento, no encontré información específica sobre tu consulta "
    "Te recomiendo comunicarte directamente "
    "con la oficina de tu sede para obtener ayuda personalizada."
)


#  Retrieval 

async def _retrieve_context(
    q_embedding: list[float],
    sede: Sede,
    db: AsyncSession,
    top_k: int | None = None,
) -> tuple[str, float]:
    """
    Busca los chunks más similares FILTRANDO por sede.
    Devuelve (contexto_concatenado, similitud_promedio).
    """
    k = top_k or _settings.TOP_K
    min_sim = _settings.MIN_SIMILARITY

    # El filtro `sede = :sede` aprovecha el índice columnar creado en el modelo.
    # La búsqueda vectorial se aplica solo dentro de ese subconjunto.
    query = text(
        "SELECT text, 1 - (embedding <=> :emb) AS similarity "
        "FROM chunks "
        "WHERE sede = :sede "
        "ORDER BY embedding <=> :emb "
        "LIMIT :k"
    )
    result = await db.execute(
        query, {"emb": str(q_embedding), "sede": sede.value, "k": k}
    )
    rows = result.fetchall()

    relevant = [(row[0], row[1]) for row in rows if row[1] >= min_sim]

    if not relevant:
        return "", 0.0

    context = "\n---\n".join(r[0] for r in relevant)
    avg_similarity = round(sum(r[1] for r in relevant) / len(relevant), 4)
    return context, avg_similarity


#  Ask 

async def ask(
    nombre: str,
    sede: Sede,
    question: str,
    db: AsyncSession,
) -> ChatMessage:
    """
    Flujo RAG completo con contexto filtrado por sede.
    Persiste la conversación con nombre y sede del estudiante.
    """
    q_embedding = await generate_embedding(question)
    context, relevance_score = await _retrieve_context(q_embedding, sede, db)

    if not context:
        answer = NO_INFO_RESPONSE
    else:
        user_message = (
            f"Nombre del estudiante: {nombre}\n"
            f"Sede consultada: {sede.value.capitalize()}\n\n"
            f"Contexto relevante:\n{context}\n\n"
            f"Pregunta: {question}"
        )
        completion = await _client.chat.completions.create(
            model=_settings.CHAT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            temperature=0.2,
        )
        answer = completion.choices[0].message.content

    msg = ChatMessage(
        nombre=nombre,
        sede=sede.value,
        question=question,
        answer=answer,
        relevance_score=relevance_score,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
