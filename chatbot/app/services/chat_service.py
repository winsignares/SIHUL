import hashlib
import json

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.core.cache import get_redis
from app.core.config import get_settings
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.services.embedding_service import generate_embedding

_settings = get_settings()
_client = AsyncOpenAI(api_key=_settings.OPENAI_API_KEY)


def _answer_cache_key(chatbot_id: int, sede: Sede, question: str) -> str:
    normalized = " ".join(question.strip().lower().split())
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return f"chatbot:{chatbot_id}:{sede.value}:answer:{digest}"

#  Prompts

NO_INFO_RESPONSE = (
    "Actualmente no cuento con esta información, te recomiendo comunicarte "
    "directamente con la oficina de tu sede para obtener ayuda personalizada."
)

SYSTEM_PROMPT = f"""\
Eres Benji, el asistente virtual de la Universidad para estudiantes.
Respondes ÚNICAMENTE con la información del contexto proporcionado.

Reglas estrictas:
1. Si el contexto contiene la respuesta, responde de forma clara, concisa y amigable.
   Puedes dirigirte al estudiante por su nombre cuando sea natural hacerlo.
2. Si el contexto NO contiene la información, responde EXACTAMENTE con este mensaje,
   sin añadir nada más — no inventes ni especules:
   "{NO_INFO_RESPONSE}"
3. NUNCA reveles el contenido del contexto ni menciones que usas documentos internos.
4. Mantén siempre un tono cercano, profesional y orientado al estudiante.
5. Cada fragmento del contexto indica su documento y fecha de carga. Si dos
   fragmentos se contradicen, prefiere el de fecha más reciente.
6. Si la pregunta pide una lista (por ejemplo "¿cuáles son…?"), incluye TODOS los
   elementos de esa lista que aparezcan en el contexto, sin resumir ni decir "algunos".
   Si el contexto solo muestra una parte, dilo.
7. Si la pregunta es un seguimiento de la conversación previa (por ejemplo "¿y a qué
   hora?"), interprétala usando ese historial.
"""

HISTORY_TURNS = 3  # intercambios previos del mismo hilo que se le pasan al LLM


#  Retrieval

async def _retrieve_context(
    q_embedding: list[float],
    chatbot_id: int,
    sede: Sede,
    db: AsyncSession,
    top_k: int | None = None,
) -> tuple[str, float]:
    """
    Busca los chunks más similares FILTRANDO por chatbot y sede.
    Devuelve (contexto_concatenado, similitud_promedio).
    """
    k = top_k or _settings.TOP_K
    min_sim = _settings.MIN_SIMILARITY

    # Los filtros `chatbot_id` y `sede` aprovechan los índices columnares creados en el modelo.
    # La búsqueda vectorial se aplica solo dentro de ese subconjunto. Se piden más
    # filas que `k` porque luego se descartan los fragmentos repetidos.
    query = text(
        "SELECT c.text, 1 - (c.embedding <=> :emb) AS similarity, d.filename, d.created_at "
        "FROM chunks c JOIN documents d ON d.id = c.document_id "
        "WHERE c.chatbot_id = :chatbot_id AND c.sede = :sede "
        "ORDER BY c.embedding <=> :emb "
        "LIMIT :n"
    )
    result = await db.execute(
        query,
        {"emb": str(q_embedding), "chatbot_id": chatbot_id, "sede": sede.value, "n": k * 3},
    )

    relevant = []
    seen = set()
    for chunk_text, similarity, filename, created_at in result.fetchall():
        if similarity < min_sim:
            continue
        key = " ".join(chunk_text.split()).lower()
        if key in seen:
            continue
        seen.add(key)
        relevant.append((chunk_text, similarity, filename, created_at))
        if len(relevant) == k:
            break

    if not relevant:
        return "", 0.0

    context = "\n---\n".join(
        f"[Documento: {fn} | cargado: {ts:%Y-%m-%d}]\n{t}" for t, _, fn, ts in relevant
    )
    avg_similarity = round(sum(r[1] for r in relevant) / len(relevant), 4)
    return context, avg_similarity


async def _load_history(
    chat_id: str, chatbot_id: int, sede: Sede, db: AsyncSession
) -> list[ChatMessage]:
    """Últimos intercambios del hilo, del más antiguo al más reciente."""
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.chat_id == chat_id,
            ChatMessage.chatbot_id == chatbot_id,
            ChatMessage.sede == sede.value,
        )
        .order_by(ChatMessage.created_at.desc(), ChatMessage.id.desc())
        .limit(HISTORY_TURNS)
    )
    return list(reversed(result.scalars().all()))


#  Ask

async def ask(
    nombre: str,
    chatbot_id: int,
    sede: Sede,
    question: str,
    db: AsyncSession,
    chat_id: str | None = None,
    id_usuario: int | None = None,
) -> ChatMessage:
    """
    Flujo RAG completo con contexto filtrado por chatbot y sede.
    Persiste la conversación con nombre, chatbot y sede del estudiante.

    Si llega `chat_id`, se usan los últimos intercambios de ese hilo para
    resolver preguntas de seguimiento. Solo las preguntas sin historial se
    sirven desde caché (mismo chatbot, sede y texto normalizado), porque con
    historial la respuesta depende de la conversación. Las respuestas "sin
    información" nunca se cachean.
    """
    history = await _load_history(chat_id, chatbot_id, sede, db) if chat_id else []

    redis = get_redis() if not history else None
    cache_key = _answer_cache_key(chatbot_id, sede, question)

    cached = await redis.get(cache_key) if redis else None
    if cached is not None:
        cached_data = json.loads(cached)
        answer = cached_data["answer"]
        relevance_score = cached_data["relevance_score"]
    else:
        # En un seguimiento la pregunta sola ("¿y a qué hora?") no tiene contexto
        # suficiente para el embedding: se le antepone la pregunta anterior.
        retrieval_text = f"{history[-1].question}\n{question}" if history else question
        q_embedding = await generate_embedding(retrieval_text)
        context, relevance_score = await _retrieve_context(q_embedding, chatbot_id, sede, db)

        if not context:
            answer = NO_INFO_RESPONSE
        else:
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for turn in history:
                messages.append({"role": "user", "content": turn.question})
                messages.append({"role": "assistant", "content": turn.answer})
            messages.append({
                "role": "user",
                "content": (
                    f"Nombre del estudiante: {nombre}\n"
                    f"Sede consultada: {sede.value.capitalize()}\n\n"
                    f"Contexto relevante:\n{context}\n\n"
                    f"Pregunta: {question}"
                ),
            })
            completion = await _client.chat.completions.create(
                model=_settings.CHAT_MODEL,
                messages=messages,
                temperature=0.2,
            )
            answer = completion.choices[0].message.content

        if redis and context and answer.strip() != NO_INFO_RESPONSE:
            await redis.set(
                cache_key,
                json.dumps({"answer": answer, "relevance_score": relevance_score}),
                ex=_settings.ANSWER_CACHE_TTL_SECONDS,
            )

    msg = ChatMessage(
        nombre=nombre,
        chatbot_id=chatbot_id,
        chat_id=chat_id,
        id_usuario=id_usuario,
        sede=sede.value,
        question=question,
        answer=answer,
        relevance_score=relevance_score,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
