from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def list_chatbots(db: AsyncSession, solo_activos: bool = True) -> list[dict]:
    """Lista los chatbots (Agentes) definidos en el panel de Django."""
    query = "SELECT id, nombre, activo FROM chatbot_agente"
    if solo_activos:
        query += " WHERE activo = true"
    query += " ORDER BY orden, nombre"
    result = await db.execute(text(query))
    return [dict(row) for row in result.mappings().all()]


async def get_chatbot(chatbot_id: int, db: AsyncSession) -> dict | None:
    """Obtiene un chatbot (Agente) por id, o None si no existe."""
    result = await db.execute(
        text("SELECT id, nombre, activo FROM chatbot_agente WHERE id = :id"),
        {"id": chatbot_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None
