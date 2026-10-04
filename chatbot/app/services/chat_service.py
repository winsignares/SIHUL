import hashlib
import json
import re

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.core.cache import get_redis
from app.core.config import get_settings
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.services.embedding_service import generate_query_embeddings

_settings = get_settings()
_client = AsyncOpenAI(
    api_key=_settings.OPENAI_API_KEY,
    timeout=_settings.OPENAI_TIMEOUT_SECONDS,
    max_retries=0,
)


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
7. Si el contexto establece una regla, requisito o prohibición que responde a la pregunta,
   aplícala aunque no mencione el caso exacto (por ejemplo, si exige "tenis totalmente
   blancos" y preguntan si pueden ir con tenis de colores, la respuesta es que no). Usa
   el mensaje de "sin información" solo cuando el contexto no trate el tema.
8. Si la pregunta es un seguimiento de la conversación previa (por ejemplo "¿y a qué
   hora?"), interprétala usando ese historial.
"""

HISTORY_TURNS = 3  # intercambios previos del mismo hilo que se le pasan al LLM


#  Modelo según el tipo de pregunta

# «¿Cuántas faltas graves hay (en total)?», «¿Cuáles son los requisitos…?», «enumera…».
# No incluye «¿cuántas horas…?»: pide una cifra, no recorrer una lista.
_EXHAUSTIVE_QUESTION = re.compile(
    r"\bcu[aá]les\s+son\b|\bcu[aá]nt[oa]s\b.{0,40}\b(hay|existen|son|total)\b|"
    r"\ben\s+total\b|\benum[eé]ra|\blista(r|me)?\b|\btod[oa]s\s+(los|las)\b",
    re.IGNORECASE,
)


def _model_for(question: str) -> str:
    if _settings.CHAT_MODEL_LISTS and _EXHAUSTIVE_QUESTION.search(question):
        return _settings.CHAT_MODEL_LISTS
    return _settings.CHAT_MODEL


#  Retrieval

SEED_FRAGMENTS = 5    # fragmentos mejor puntuados a los que se les añaden vecinos de sección
NEIGHBOR_REACH = 2    # cuántos fragmentos hacia cada lado
MAX_CONTEXT_CHARS = 14000


def _normalized(chunk_text: str) -> str:
    return " ".join(chunk_text.split()).lower()


def _section(chunk_text: str) -> str | None:
    """Ruta de sección con que se troceó el fragmento («[TÍTULO > CAPÍTULO > ARTÍCULO]»)."""
    first = chunk_text.split("\n", 1)[0]
    return first if first.startswith("[") and " > " in first else None


async def _search(
    q_embedding: list[float], chatbot_id: int, sede: Sede, db: AsyncSession, n: int
) -> list:
    # Los filtros `chatbot_id` y `sede` aprovechan los índices columnares creados en el modelo.
    # La búsqueda vectorial se aplica solo dentro de ese subconjunto.
    result = await db.execute(
        text(
            "SELECT c.id, c.document_id, c.text, 1 - (c.embedding <=> :emb) AS similarity, "
            "d.filename, d.created_at "
            "FROM chunks c JOIN documents d ON d.id = c.document_id "
            "WHERE c.chatbot_id = :chatbot_id AND c.sede = :sede "
            "ORDER BY c.embedding <=> :emb "
            "LIMIT :n"
        ),
        {"emb": str(q_embedding), "chatbot_id": chatbot_id, "sede": sede.value, "n": n},
    )
    return result.fetchall()


async def _section_neighbors(hit, db: AsyncSession) -> list:
    """
    Fragmentos contiguos de la MISMA sección que `hit`. Una lista o una tabla larga se
    reparte en varios fragmentos y la búsqueda por similitud puede traer solo algunos;
    esto completa la sección.
    """
    section = _section(hit.text)
    if section is None:
        return []
    rows = (
        await db.execute(
            text(
                "SELECT id, text FROM chunks WHERE document_id = :doc "
                "AND id BETWEEN :lo AND :hi ORDER BY id"
            ),
            {"doc": hit.document_id, "lo": hit.id - NEIGHBOR_REACH, "hi": hit.id + NEIGHBOR_REACH},
        )
    ).fetchall()
    before = [r for r in rows if r.id < hit.id]
    after = [r for r in rows if r.id > hit.id]
    keep = []
    for r in reversed(before):  # hacia atrás hasta que cambie de sección
        if _section(r.text) != section:
            break
        keep.append(r)
    for r in after:
        if _section(r.text) != section:
            break
        keep.append(r)
    return keep


async def _retrieve_context(
    q_embeddings: list[list[float]],
    chatbot_id: int,
    sede: Sede,
    db: AsyncSession,
    top_k: int | None = None,
) -> tuple[str, float]:
    """
    Busca los chunks más similares FILTRANDO por chatbot y sede, con una o varias
    formulaciones de la pregunta, y completa cada sección de los mejores resultados con
    sus fragmentos vecinos.
    La primera formulación (la pregunta tal cual) conserva sus `TOP_K` resultados, igual
    que sin historial; las demás (la combinada con la pregunta anterior) solo añaden unos
    pocos candidatos extra. Mezclarlas por similitud o repartir los puestos a partes
    iguales dejaba que los fragmentos del tema anterior desplazaran a los de la pregunta
    actual cuando el usuario cambiaba de tema.
    Devuelve (contexto_concatenado, similitud_promedio de los fragmentos encontrados).
    """
    k = top_k or _settings.TOP_K
    min_sim = _settings.MIN_SIMILARITY

    relevant, seen = [], set()
    for n, emb in enumerate(q_embeddings):
        # Se piden más filas que `k` porque luego se descartan los fragmentos repetidos.
        rows = await _search(emb, chatbot_id, sede, db, k * 3)
        quota = k if n == 0 else max(2, k // 2)
        taken = 0
        for row in rows:  # ya vienen ordenadas por similitud
            if taken == quota or row.similarity < min_sim:
                break
            key = _normalized(row.text)
            if key in seen:
                continue
            seen.add(key)
            relevant.append(row)
            taken += 1

    if not relevant:
        return "", 0.0

    # Orden del contexto: cada fragmento destacado junto a sus vecinos de sección, en el
    # orden del documento; después el resto de resultados.
    relevant_ids = {r.id for r in relevant}
    emitted, parts, size = set(), [], 0

    def add(row, hit):
        nonlocal size
        if row.id in emitted or size >= MAX_CONTEXT_CHARS:
            return
        key = _normalized(row.text)
        if row.id not in relevant_ids and key in seen:
            return  # vecino con el mismo texto que otro fragmento ya incluido
        emitted.add(row.id)
        seen.add(key)
        block = f"[Documento: {hit.filename} | cargado: {hit.created_at:%Y-%m-%d}]\n{row.text}"
        size += len(block)
        parts.append(block)

    for hit in relevant[:SEED_FRAGMENTS]:
        for row in sorted([hit] + await _section_neighbors(hit, db), key=lambda r: r.id):
            add(row, hit)
    for hit in relevant[SEED_FRAGMENTS:]:
        add(hit, hit)

    avg_similarity = round(sum(r.similarity for r in relevant) / len(relevant), 4)
    return "\n---\n".join(parts), avg_similarity


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
        # suficiente para el embedding, pero anteponerle siempre la pregunta anterior
        # contamina las preguntas nuevas sobre otro tema: se buscan las dos formulaciones
        # y cada fragmento conserva su mejor similitud.
        texts = [question]
        if history:
            texts.append(f"{history[-1].question}\n{question}")
        q_embeddings = await generate_query_embeddings(texts)
        context, relevance_score = await _retrieve_context(q_embeddings, chatbot_id, sede, db)

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
                model=_model_for(question),
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
