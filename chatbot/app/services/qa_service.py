"""
Preguntas-respuestas oficiales con anexos (documentos de soporte).

Las parejas pregunta | respuesta y sus anexos (Word, PDF, Excel) se administran en Django
(tablas `chatbot_preguntarespuesta` y `chatbot_anexorespuesta`); aquí solo se leen. Al
responder una pregunta:

1. `search`: se buscan las parejas del chatbot y la sede cuya pregunta se parece a la del
   usuario (similitud de embeddings, tabla propia `qa_embeddings`). Las que superan
   QA_MIN_SIMILARITY entran primero al contexto del LLM como respuesta oficial.
2. `candidates`: de esas, las que superan QA_ANEXO_MIN_SIMILARITY podrían ser la
   pregunta que se hizo.
3. `choose`: se elige la candidata que pide lo mismo que el usuario. Si la pregunta es
   casi idéntica (QA_ANEXO_AUTO_SIMILARITY) se elige sin más; si no, lo decide un
   verificador (una llamada breve al LLM, solo en ese caso). Sus anexos acompañan la
   respuesta, se mencionan en el contexto para que el LLM pueda remitir a ellos y, como
   su respuesta oficial es la fuente, no se añade la cita del PDF. La
   similitud sola no basta: «¿cómo pago la matrícula?» se parece a «¿cómo cancelo la
   matrícula?» tanto como una reformulación legítima, y entregarle el formato de
   cancelación a quien quiere pagar sería un error.

Si las tablas de Django aún no existen o el chatbot no tiene parejas, todo esto no hace
nada y el chatbot responde exactamente como antes.
"""
import hashlib
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime

from openai import AsyncOpenAI
from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.sedes import Sede
from app.services.embedding_service import generate_embeddings, generate_query_embeddings

_settings = get_settings()
logger = logging.getLogger("uvicorn.error")

QA_TABLE = "chatbot_preguntarespuesta"
ANEXO_TABLE = "chatbot_anexorespuesta"
MAX_CANDIDATES = 3

# Pide 3 tokens: responde en una fracción de segundo. El tope deja margen al resto de la
# pregunta dentro de los 30 s que espera Django.
_verifier = AsyncOpenAI(
    api_key=_settings.OPENAI_API_KEY,
    timeout=min(8.0, _settings.OPENAI_TIMEOUT_SECONDS),
    max_retries=0,
)


@dataclass
class QAHit:
    id: int
    pregunta: str
    respuesta: str
    actualizado: datetime
    # Similitud con la pregunta tal cual
    similarity: float
    # Mejor similitud entre la pregunta tal cual y la combinada con la anterior (seguimientos)
    best_similarity: float
    anexos: list[dict] = field(default_factory=list)


def _hash(pregunta: str) -> str:
    # Incluye el modelo: si cambia EMBEDDING_MODEL, todos los embeddings se recalculan.
    normalized = " ".join(pregunta.split()).lower()
    return hashlib.sha256(f"{_settings.EMBEDDING_MODEL}\n{normalized}".encode("utf-8")).hexdigest()


async def _tables_ready(db: AsyncSession) -> bool:
    """Las tablas las crea la migración 0014 de Django, que puede no haber corrido aún."""
    row = (await db.execute(text(
        f"SELECT to_regclass('{QA_TABLE}') IS NOT NULL AND to_regclass('{ANEXO_TABLE}') IS NOT NULL"
    ))).scalar()
    return bool(row)


async def signature(chatbot_id: int, sede: Sede, db: AsyncSession) -> str:
    """
    Huella de las parejas activas del chatbot y la sede (cantidad y última modificación).
    Forma parte de la clave de caché de respuestas: al crear, editar (incluidos sus anexos)
    o borrar una pareja, las respuestas cacheadas dejan de usarse. Vacía si no hay parejas,
    de modo que la clave de caché de los chatbots sin parejas no cambia.
    """
    if not await _tables_ready(db):
        return ""
    count, last = (await db.execute(
        text(
            f"SELECT count(*), max(actualizado) FROM {QA_TABLE} "
            "WHERE agente_id = :c AND sede = :s AND activo"
        ),
        {"c": chatbot_id, "s": sede.value},
    )).one()
    if not count:
        return ""
    return hashlib.sha256(f"{count}|{last.isoformat() if last else ''}".encode()).hexdigest()[:8]


async def sync(chatbot_id: int, sede: Sede, db: AsyncSession, for_query: bool = False) -> dict:
    """
    Pone al día los embeddings de las parejas activas del chatbot y la sede: calcula los
    que faltan o cuya pregunta cambió y borra los de parejas eliminadas, desactivadas o
    movidas a otro chatbot o sede. `for_query` usa el cliente de consulta (sin reintentos),
    pues corre dentro de una pregunta del usuario.
    """
    if not await _tables_ready(db):
        return {"preguntas": 0, "actualizadas": 0}
    rows = (await db.execute(
        text(
            f"SELECT p.id, p.pregunta, e.content_hash FROM {QA_TABLE} p "
            "LEFT JOIN qa_embeddings e ON e.pregunta_respuesta_id = p.id "
            "WHERE p.agente_id = :c AND p.sede = :s AND p.activo"
        ),
        {"c": chatbot_id, "s": sede.value},
    )).all()
    stale = [r for r in rows if r.content_hash != _hash(r.pregunta)]
    if stale:
        texts = [r.pregunta for r in stale]
        embeddings = await (generate_query_embeddings(texts) if for_query else generate_embeddings(texts))
        for r, emb in zip(stale, embeddings):
            await db.execute(
                text(
                    "INSERT INTO qa_embeddings (pregunta_respuesta_id, chatbot_id, sede, content_hash, embedding) "
                    "VALUES (:id, :c, :s, :h, :emb) "
                    "ON CONFLICT (pregunta_respuesta_id) DO UPDATE SET chatbot_id = EXCLUDED.chatbot_id, "
                    "sede = EXCLUDED.sede, content_hash = EXCLUDED.content_hash, embedding = EXCLUDED.embedding"
                ),
                {"id": r.id, "c": chatbot_id, "s": sede.value, "h": _hash(r.pregunta), "emb": str(emb)},
            )
    await db.execute(
        text(
            "DELETE FROM qa_embeddings e WHERE e.chatbot_id = :c AND e.sede = :s AND NOT EXISTS ("
            f"  SELECT 1 FROM {QA_TABLE} p WHERE p.id = e.pregunta_respuesta_id "
            "   AND p.agente_id = :c AND p.sede = :s AND p.activo)"
        ),
        {"c": chatbot_id, "s": sede.value},
    )
    await db.commit()
    return {"preguntas": len(rows), "actualizadas": len(stale)}


async def search(
    q_embeddings: list[list[float]], chatbot_id: int, sede: Sede, db: AsyncSession
) -> list[QAHit]:
    """
    Parejas más parecidas a la pregunta, ordenadas por su mejor similitud. La primera
    formulación de `q_embeddings` es la pregunta tal cual; las demás, la combinada con la
    anterior en un seguimiento.

    Quien llama debe comprobar antes que hay parejas (`signature` no vacía).
    """
    await sync(chatbot_id, sede, db, for_query=True)

    best: dict[int, tuple] = {}
    direct: dict[int, float] = {}
    for n, emb in enumerate(q_embeddings):
        rows = (await db.execute(
            text(
                "SELECT p.id, p.pregunta, p.respuesta, p.actualizado, "
                "1 - (e.embedding <=> :emb) AS similarity "
                f"FROM qa_embeddings e JOIN {QA_TABLE} p ON p.id = e.pregunta_respuesta_id "
                "WHERE p.agente_id = :c AND p.sede = :s AND p.activo "
                "ORDER BY e.embedding <=> :emb LIMIT :k"
            ),
            {"emb": str(emb), "c": chatbot_id, "s": sede.value, "k": _settings.QA_TOP_K},
        )).all()
        for r in rows:
            if n == 0:
                direct[r.id] = r.similarity
            if r.id not in best or r.similarity > best[r.id].similarity:
                best[r.id] = r

    hits = [
        QAHit(r.id, r.pregunta, r.respuesta, r.actualizado,
              round(direct.get(r.id, 0.0), 4), round(r.similarity, 4))
        for r in best.values()
        if r.similarity >= _settings.QA_MIN_SIMILARITY
    ]
    hits.sort(key=lambda h: h.best_similarity, reverse=True)
    return hits


async def candidates(hits: list[QAHit], db: AsyncSession) -> list[QAHit]:
    """
    Parejas que podrían ser la pregunta que se hizo: las que alcanzan
    QA_ANEXO_MIN_SIMILARITY. Deja sus anexos (si tienen) en `hit.anexos`.
    """
    near = [h for h in hits if h.best_similarity >= _settings.QA_ANEXO_MIN_SIMILARITY][:MAX_CANDIDATES]
    if not near:
        return []
    rows = (await db.execute(
        text(
            f"SELECT id, pregunta_respuesta_id, nombre, tipo_mime, tamano FROM {ANEXO_TABLE} "
            "WHERE pregunta_respuesta_id IN :ids ORDER BY id"
        ).bindparams(bindparam("ids", expanding=True)),
        {"ids": [h.id for h in near]},
    )).mappings().all()
    by_pair: dict[int, list[dict]] = {}
    for r in rows:
        by_pair.setdefault(r["pregunta_respuesta_id"], []).append(dict(r))
    for h in near:
        h.anexos = by_pair.get(h.id, [])
    return near


_VERIFIER_PROMPT = """\
Decides si la consulta de un usuario pide lo mismo que alguna de las preguntas frecuentes
registradas por la universidad, para entregarle los documentos de soporte de esa pregunta.

Responde únicamente con el número de la pregunta registrada que corresponde a la consulta,
o 0 si ninguna corresponde.

Corresponde cuando la consulta busca el mismo trámite, procedimiento o información, aunque
esté redactada de otra forma o sea un seguimiento de la conversación ("¿y qué formato
lleno?"). NO corresponde si trata del mismo tema pero pide otra cosa: por ejemplo, pagar,
costos o fechas de la matrícula frente a cancelar la matrícula.
"""


async def choose(
    candidates: list[QAHit], question: str, previous_question: str | None = None
) -> QAHit | None:
    """
    La candidata que pide lo mismo que el usuario, o None. Sus anexos acompañan la
    respuesta y su respuesta oficial es la fuente principal. Si el verificador falla, solo
    se elige una pregunta casi idéntica.
    """
    if not candidates:
        return None
    top = max(candidates, key=lambda h: h.similarity)
    if top.similarity >= _settings.QA_ANEXO_AUTO_SIMILARITY:
        return top

    registered = "\n".join(f"{i}. {h.pregunta}" for i, h in enumerate(candidates, start=1))
    previous = f"Pregunta anterior del usuario en la conversación: {previous_question}\n" if previous_question else ""
    try:
        completion = await _verifier.chat.completions.create(
            model=_settings.CHAT_MODEL,
            temperature=0,
            max_tokens=3,
            messages=[
                {"role": "system", "content": _VERIFIER_PROMPT},
                {"role": "user", "content": f"{previous}Consulta: {question}\n\nPreguntas registradas:\n{registered}"},
            ],
        )
    except Exception:
        logger.warning("Falló la verificación de la pregunta-respuesta; no se adjuntan anexos", exc_info=True)
        return None
    match = re.search(r"\d+", completion.choices[0].message.content or "")
    choice = int(match.group()) if match else 0
    if 1 <= choice <= len(candidates):
        return candidates[choice - 1]
    return None


def context_blocks(hits: list[QAHit], chosen: QAHit | None = None) -> list[str]:
    """
    Bloques de contexto para el LLM: van antes que los fragmentos de los documentos, con
    la pareja elegida primero. Solo la elegida menciona sus anexos, que son los únicos que
    de verdad se adjuntan a la respuesta.
    """
    ordered = sorted(hits, key=lambda h: h is not chosen)
    blocks = []
    for h in ordered:
        anexos = ""
        if h is chosen and h.anexos:
            nombres = ", ".join(a["nombre"] for a in h.anexos)
            anexos = (
                "\nDocumentos de soporte que se adjuntan a tu respuesta: el sistema los muestra "
                "como botones de descarga debajo de ella. Remite a ellos en una frase breve "
                "(«descarga el formato en los documentos de soporte de esta respuesta»), sin "
                f"enumerarlos ni escribir enlaces: {nombres}"
            )
        blocks.append(
            f"[Pregunta frecuente oficial | prioridad máxima | actualizada: {h.actualizado:%Y-%m-%d}]\n"
            f"Pregunta: {h.pregunta}\nRespuesta: {h.respuesta}{anexos}"
        )
    return blocks
