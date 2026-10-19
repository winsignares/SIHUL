import hashlib
import json
import re

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from openai import AsyncOpenAI

from app.core.cache import get_redis
from app.core.config import get_settings
from app.core.profiles import get_profile
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.services import qa_service
from app.services.embedding_service import generate_query_embeddings

_settings = get_settings()
_client = AsyncOpenAI(
    api_key=_settings.OPENAI_API_KEY,
    timeout=_settings.OPENAI_TIMEOUT_SECONDS,
    max_retries=0,
)


def _answer_cache_key(chatbot_id: int, sede: Sede, question: str, variant: str) -> str:
    # `variant` identifica el perfil y las instrucciones adicionales del agente: si el
    # administrador los cambia, las respuestas cacheadas con el comportamiento anterior
    # dejan de usarse (y caducan solas). El prefijo se mantiene para `invalidate_answers`.
    normalized = " ".join(question.strip().lower().split())
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return f"chatbot:{chatbot_id}:{sede.value}:answer:{variant}:{digest}"

# El prompt de sistema y el mensaje de «sin información» dependen del tipo de agente:
# ver app/core/profiles.py

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
            "SELECT c.id, c.document_id, c.text, c.page, 1 - (c.embedding <=> :emb) AS similarity, "
            "d.filename, d.created_at, d.prioridad, "
            "(SELECT count(*) FROM documents x WHERE x.chatbot_id = c.chatbot_id AND x.sede = c.sede) AS n_docs "
            "FROM chunks c JOIN documents d ON d.id = c.document_id "
            "WHERE c.chatbot_id = :chatbot_id AND c.sede = :sede "
            "ORDER BY c.embedding <=> :emb "
            "LIMIT :n"
        ),
        {"emb": str(q_embedding), "chatbot_id": chatbot_id, "sede": sede.value, "n": n},
    )
    return result.fetchall()


# Peso de la prioridad del documento al ordenar los candidatos: la prioridad 1 suma esto a la
# similitud y la más baja no suma nada (en medio, proporcional). Es una preferencia, no un
# filtro: un documento de baja prioridad con un fragmento claramente mejor sigue ganando.
PRIORITY_BOOST = 0.08


def _priority_bonus(row) -> float:
    n, p = row.n_docs or 1, row.prioridad
    if n <= 1 or not p:
        return 0.0
    return PRIORITY_BOOST * (n - min(p, n)) / (n - 1)


KEYWORD_FRAGMENTS = 3  # fragmentos que aporta la búsqueda por palabras clave


async def _keyword_search(question: str, chatbot_id: int, sede: Sede, db: AsyncSession, n: int) -> list:
    """
    Búsqueda léxica (texto completo de Postgres, en español) para lo que los embeddings
    recuperan mal: siglas, códigos, ISBN, nombres propios, cifras. Basta con que aparezca
    alguno de los términos de la pregunta; se ordena por cuántos coinciden.
    """
    terms = sorted({w.lower() for w in re.findall(r"\w{3,}", question)})[:12]
    if not terms:
        return []
    try:
        # Un término presente en muchos fragmentos («libro», «autor») no distingue ninguno y
        # desplaza a los raros («ISBN», una sigla, un apellido): se descarta.
        counts = (
            await db.execute(
                text(
                    "SELECT count(*) AS total, "
                    + ", ".join(
                        f"count(*) FILTER (WHERE to_tsvector('spanish', text) @@ "
                        f"plainto_tsquery('spanish', :t{i})) AS t{i}"
                        for i in range(len(terms))
                    )
                    + " FROM chunks WHERE chatbot_id = :chatbot_id AND sede = :sede"
                ),
                {"chatbot_id": chatbot_id, "sede": sede.value, **{f"t{i}": t for i, t in enumerate(terms)}},
            )
        ).one()
        limit = max(3, counts.total * 0.1)
        kept = [(i, t) for i, t in enumerate(terms) if 0 < getattr(counts, f"t{i}") <= limit]
        if not kept:
            return []
        # Puntuación: cada término presente suma más cuanto más raro es en el documento.
        score = " + ".join(
            f"(CASE WHEN to_tsvector('spanish', c.text) @@ plainto_tsquery('spanish', :t{i}) "
            f"THEN {1.0 / getattr(counts, f't{i}'):.6f} ELSE 0 END)"
            for i, _ in kept
        )
        result = await db.execute(
            text(
                "SELECT c.id, c.document_id, c.text, c.page, d.filename, d.created_at, d.prioridad, "
                "(SELECT count(*) FROM documents x WHERE x.chatbot_id = c.chatbot_id AND x.sede = c.sede) AS n_docs "
                "FROM chunks c JOIN documents d ON d.id = c.document_id "
                "WHERE c.chatbot_id = :chatbot_id AND c.sede = :sede "
                "AND to_tsvector('spanish', c.text) @@ to_tsquery('spanish', :q) "
                f"ORDER BY ({score}) DESC, c.id LIMIT :n"
            ),
            {
                "q": " | ".join(t for _, t in kept), "chatbot_id": chatbot_id,
                "sede": sede.value, "n": n, **{f"t{i}": t for i, t in kept},
            },
        )
        return result.fetchall()
    except Exception:
        await db.rollback()  # la búsqueda léxica es un refuerzo: si falla, solo vale la vectorial
        return []


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
                "SELECT id, text, page FROM chunks WHERE document_id = :doc "
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


class _KeywordHit:
    """Resultado léxico con la misma forma que una fila vectorial (similitud = el umbral)."""

    def __init__(self, row, similarity: float):
        self.id, self.document_id, self.text, self.page = row.id, row.document_id, row.text, row.page
        self.filename, self.created_at, self.similarity = row.filename, row.created_at, similarity
        self.prioridad, self.n_docs = row.prioridad, row.n_docs


def _reserve_per_document(relevant: list, rows: list, seen: set, min_sim: float, k: int, reserve: int = 2):
    """
    Con varios documentos, uno puede ocupar todos los puestos y dejar fuera a otro que
    también trata el tema. Reserva hasta `reserve` puestos para el mejor fragmento de los
    documentos que no aparecen, siempre que sea casi tan relevante como el primero. Los
    fragmentos mejor puntuados (las semillas) no se tocan: se sacrifican los últimos.
    """
    if not relevant:
        return
    threshold = max(min_sim, 0.85 * relevant[0].similarity)
    present = {r.document_id for r in relevant}
    swaps = 0
    for row in rows:
        if swaps == reserve:
            break
        if row.document_id in present or row.similarity < threshold:
            continue
        key = _normalized(row.text)
        if key in seen:
            continue
        pos = min(SEED_FRAGMENTS + swaps, len(relevant))
        if len(relevant) >= k:
            if len(relevant) <= pos:
                break
            seen.discard(_normalized(relevant.pop().text))
        seen.add(key)
        present.add(row.document_id)
        relevant.insert(pos, row)
        swaps += 1


MAX_CITED_DOCUMENTS = 2


def _cited_sources(relevant: list) -> list[tuple[str, int | None]]:
    """
    Fuente principal (documento y página del mejor fragmento) y, si otro documento aporta un
    fragmento casi igual de relevante, también la suya. Los resultados léxicos no cuentan
    como segunda fuente: su similitud es solo el umbral.
    """
    if not relevant:
        return []
    top = relevant[0]
    sources = [(top.filename, top.page)]
    for row in relevant[1:SEED_FRAGMENTS + 2]:
        if len(sources) == MAX_CITED_DOCUMENTS:
            break
        if (
            not isinstance(row, _KeywordHit)
            and row.filename not in {name for name, _ in sources}
            and row.similarity + _priority_bonus(row) >= 0.9 * (top.similarity + _priority_bonus(top))
        ):
            sources.append((row.filename, row.page))
    return sources


async def _retrieve_context(
    q_embeddings: list[list[float]],
    chatbot_id: int,
    sede: Sede,
    db: AsyncSession,
    top_k: int | None = None,
    question: str | None = None,
) -> tuple[str, float, list[tuple[str, int | None]]]:
    """
    Busca los chunks más similares FILTRANDO por chatbot y sede, con una o varias
    formulaciones de la pregunta, y completa cada sección de los mejores resultados con
    sus fragmentos vecinos.
    La primera formulación (la pregunta tal cual) conserva sus `TOP_K` resultados, igual
    que sin historial; las demás (la combinada con la pregunta anterior) solo añaden unos
    pocos candidatos extra. Mezclarlas por similitud o repartir los puestos a partes
    iguales dejaba que los fragmentos del tema anterior desplazaran a los de la pregunta
    actual cuando el usuario cambiaba de tema.
    Devuelve (contexto_concatenado, similitud_promedio de los fragmentos encontrados, fuentes
    citables): documento y página del fragmento mejor puntuado y, si otro documento aporta
    uno casi igual de relevante, también el suyo.
    """
    k = top_k or _settings.TOP_K
    min_sim = _settings.MIN_SIMILARITY

    relevant, seen = [], set()
    for n, emb in enumerate(q_embeddings):
        # Se piden más filas que `k` porque luego se descartan los fragmentos repetidos.
        rows = await _search(emb, chatbot_id, sede, db, k * 3)
        # Orden por similitud más la preferencia por la prioridad del documento
        rows = sorted(rows, key=lambda r: r.similarity + _priority_bonus(r), reverse=True)
        quota = k if n == 0 else max(2, k // 2)
        taken = 0
        for row in rows:
            if taken == quota:
                break
            if row.similarity < min_sim:
                continue
            key = _normalized(row.text)
            if key in seen:
                continue
            seen.add(key)
            relevant.append(row)
            taken += 1
        if n == 0:
            _reserve_per_document(relevant, rows, seen, min_sim, k)

    if question:
        # Los resultados léxicos van al final de la lista de destacados, sin desplazar a los
        # vectoriales; con tan pocos fragmentos relevantes, cada coincidencia exacta cuenta.
        for row in await _keyword_search(question, chatbot_id, sede, db, KEYWORD_FRAGMENTS * 3):
            key = _normalized(row.text)
            if key in seen:
                continue
            seen.add(key)
            relevant.append(_KeywordHit(row, min_sim))
            if sum(isinstance(r, _KeywordHit) for r in relevant) == KEYWORD_FRAGMENTS:
                break

    if not relevant:
        return "", 0.0, []

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
        page = f" | p. {row.page}" if row.page else ""
        prio = f" | prioridad {hit.prioridad} de {hit.n_docs}" if hit.n_docs > 1 and hit.prioridad else ""
        block = f"[Documento: {hit.filename}{prio}{page} | cargado: {hit.created_at:%Y-%m-%d}]\n{row.text}"
        size += len(block)
        parts.append(block)

    for hit in relevant[:SEED_FRAGMENTS]:
        for row in sorted([hit] + await _section_neighbors(hit, db), key=lambda r: r.id):
            add(row, hit)
    for hit in relevant[SEED_FRAGMENTS:]:
        add(hit, hit)

    avg_similarity = round(sum(r.similarity for r in relevant) / len(relevant), 4)
    return "\n---\n".join(parts), avg_similarity, _cited_sources(relevant)


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
    tipo: str | None = None,
    instrucciones: str | None = None,
) -> tuple[ChatMessage, list[dict]]:
    """
    Flujo RAG completo con contexto filtrado por chatbot y sede.
    Persiste la conversación con nombre, chatbot y sede del estudiante.

    Si llega `chat_id`, se usan los últimos intercambios de ese hilo para
    resolver preguntas de seguimiento. Solo las preguntas sin historial se
    sirven desde caché (mismo chatbot, sede y texto normalizado), porque con
    historial la respuesta depende de la conversación. Las respuestas "sin
    información" nunca se cachean.

    `tipo` e `instrucciones` son el perfil de comportamiento del agente (prompt y
    mensaje de "sin información"); sin tipo se usa el normativo.

    Devuelve el mensaje guardado y los anexos (documentos de soporte) de la
    pregunta-respuesta oficial que corresponde a lo preguntado, si la hay
    (ver app/services/qa_service.py); sin parejas registradas, la lista va vacía y el
    flujo es el de siempre.
    """
    profile = get_profile(tipo)
    history = await _load_history(chat_id, chatbot_id, sede, db) if chat_id else []
    qa_signature = await qa_service.signature(chatbot_id, sede, db)

    redis = get_redis() if not history else None
    variant = profile.variant(instrucciones) + (f"-qa{qa_signature}" if qa_signature else "")
    cache_key = _answer_cache_key(chatbot_id, sede, question, variant)

    anexos: list[dict] = []
    cached = await redis.get(cache_key) if redis else None
    if cached is not None:
        cached_data = json.loads(cached)
        answer = cached_data["answer"]
        relevance_score = cached_data["relevance_score"]
        anexos = cached_data.get("anexos", [])
    else:
        # En un seguimiento la pregunta sola ("¿y a qué hora?") no tiene contexto
        # suficiente para el embedding, pero anteponerle siempre la pregunta anterior
        # contamina las preguntas nuevas sobre otro tema: se buscan las dos formulaciones
        # y cada fragmento conserva su mejor similitud.
        texts = [question]
        if history:
            texts.append(f"{history[-1].question}\n{question}")
        q_embeddings = await generate_query_embeddings(texts)
        context, relevance_score, sources = await _retrieve_context(q_embeddings, chatbot_id, sede, db, question=question)

        # Preguntas-respuestas oficiales: van primero en el contexto y, si una corresponde
        # a lo preguntado, sus anexos acompañan la respuesta.
        # Se elige antes de generar la respuesta para decirle al LLM qué anexos se adjuntan:
        # así puede remitir a ellos («diligencia el formato adjunto»), en particular en un
        # seguimiento como «¿y qué formato lleno?».
        qa_hits = await qa_service.search(q_embeddings, chatbot_id, sede, db) if qa_signature else []
        candidates = await qa_service.candidates(qa_hits, db)
        chosen = await qa_service.choose(candidates, question, history[-1].question if history else None)
        if qa_hits:
            context = "\n---\n".join(qa_service.context_blocks(qa_hits, chosen) + ([context] if context else []))
            if not relevance_score:
                relevance_score = qa_hits[0].best_similarity

        if not context:
            answer = profile.no_info
        else:
            messages = [{"role": "system", "content": profile.system_prompt(instrucciones)}]
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
            anexos = chosen.anexos if chosen else []
            # Si la respuesta sale de una pregunta-respuesta oficial, esa es la fuente (y su
            # soporte, los anexos): citar el PDF mejor puntuado sería atribuirla a otro documento.
            if profile.cite_main_source and sources and not chosen and answer.strip() != profile.no_info:
                citas = " ".join(f"({name}{f', p. {page}' if page else ''})" for name, page in sources)
                answer = f"{answer.rstrip()}\n\n{citas}"

        # Sin respuesta no hay soporte que adjuntar
        if answer.strip() == profile.no_info:
            anexos = []

        if redis and context and answer.strip() != profile.no_info:
            await redis.set(
                cache_key,
                json.dumps({"answer": answer, "relevance_score": relevance_score, "anexos": anexos}),
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
    return msg, anexos
