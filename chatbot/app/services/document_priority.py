"""
Prioridad de los documentos de un chatbot en una sede: 1 = la más alta, N = la más baja,
sin huecos ni repetidos (N = cuántos documentos tiene ese chatbot en esa sede).

Por defecto funciona como una pila: el último documento cargado es el de prioridad 1 y el
primero, el de la más baja. Cargar una versión nueva de un documento (mismo nombre) conserva
su prioridad. Las operaciones que cambian el conjunto o el orden toman un bloqueo por
(chatbot, sede) para que dos cargas simultáneas no se pisen.
"""
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def lock(db: AsyncSession, chatbot_id: int, sede: str) -> None:
    """Bloqueo de transacción por (chatbot, sede); se libera al confirmar o revertir."""
    await db.execute(
        text("SELECT pg_advisory_xact_lock(CAST(:c AS int), hashtext(:s))"),
        {"c": int(chatbot_id), "s": sede},
    )


async def _ordered_ids(db: AsyncSession, chatbot_id: int, sede: str) -> list[int]:
    rows = await db.execute(
        text(
            "SELECT id FROM documents WHERE chatbot_id = :c AND sede = :s "
            "ORDER BY prioridad NULLS LAST, created_at DESC, id DESC"
        ),
        {"c": chatbot_id, "s": sede},
    )
    return [r[0] for r in rows.fetchall()]


async def _assign(db: AsyncSession, ids: list[int]) -> None:
    for position, doc_id in enumerate(ids, start=1):
        await db.execute(
            text("UPDATE documents SET prioridad = :p WHERE id = :id"),
            {"p": position, "id": doc_id},
        )


async def renumber(db: AsyncSession, chatbot_id: int, sede: str) -> None:
    """Deja las prioridades como 1..N respetando el orden actual (cierra huecos)."""
    await _assign(db, await _ordered_ids(db, chatbot_id, sede))


async def push_down(db: AsyncSession, chatbot_id: int, sede: str) -> None:
    """Hace sitio para un documento nuevo en la prioridad 1: el resto baja un puesto."""
    await db.execute(
        text(
            "UPDATE documents SET prioridad = COALESCE(prioridad, 0) + 1 "
            "WHERE chatbot_id = :c AND sede = :s"
        ),
        {"c": chatbot_id, "s": sede},
    )


async def move(db: AsyncSession, doc_id: int, chatbot_id: int, sede: str, new_priority: int) -> None:
    """Lleva el documento a `new_priority`; los demás se desplazan. ValueError si no cabe."""
    ids = await _ordered_ids(db, chatbot_id, sede)
    if doc_id not in ids:
        raise ValueError("El documento no pertenece a ese chatbot y sede.")
    if not 1 <= new_priority <= len(ids):
        raise ValueError(
            f"La prioridad debe estar entre 1 y {len(ids)} (los documentos de este chatbot en esta sede)."
        )
    ids.remove(doc_id)
    ids.insert(new_priority - 1, doc_id)
    await _assign(db, ids)
