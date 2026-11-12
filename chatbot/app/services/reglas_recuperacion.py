"""Reglas puras de la recuperación de contexto: clave de la caché, modelo según la pregunta, prioridad de los
documentos, reserva de puestos por documento y fuentes citadas. No usan la base de datos ni OpenAI."""
import hashlib
import re

from app.core.config import get_settings
from app.core.sedes import Sede

_settings = get_settings()


def _answer_cache_key(chatbot_id: int, sede: Sede, question: str, variant: str) -> str:
    # `variant` identifica el perfil y las instrucciones adicionales del agente: si el
    # administrador los cambia, las respuestas cacheadas con el comportamiento anterior
    # dejan de usarse (y caducan solas). El prefijo se mantiene para `invalidate_answers`.
    normalized = " ".join(question.strip().lower().split())
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return f"chatbot:{chatbot_id}:{sede.value}:answer:{variant}:{digest}"


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


SEED_FRAGMENTS = 5    # fragmentos mejor puntuados a los que se les añaden vecinos de sección
NEIGHBOR_REACH = 2    # cuántos fragmentos hacia cada lado
MAX_CONTEXT_CHARS = 14000


def _normalized(chunk_text: str) -> str:
    return " ".join(chunk_text.split()).lower()


def _section(chunk_text: str) -> str | None:
    """Ruta de sección con que se troceó el fragmento («[TÍTULO > CAPÍTULO > ARTÍCULO]»)."""
    first = chunk_text.split("\n", 1)[0]
    return first if first.startswith("[") and " > " in first else None


# Peso de la prioridad del documento al ordenar los candidatos: la prioridad 1 suma esto a la
# similitud y la más baja no suma nada (en medio, proporcional). Es una preferencia, no un
# filtro: un documento de baja prioridad con un fragmento claramente mejor sigue ganando.
PRIORITY_BOOST = 0.08


def _priority_bonus(row) -> float:
    n, p = row.n_docs or 1, row.prioridad
    if n <= 1 or not p:
        return 0.0
    return PRIORITY_BOOST * (n - min(p, n)) / (n - 1)


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
