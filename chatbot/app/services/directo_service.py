"""Consultas y escrituras que el acceso directo hace sobre las tablas de Django (chatbots, conversaciones y anexos).

Hace lo que hacía la vista de Django antes de llamar al RAG y después de recibir la respuesta: comprobar que el chatbot
está activo y disponible en la seccional del usuario, contar el uso de la pregunta sugerida, validar los anexos de la
respuesta y guardar la conversación en el mismo historial que lee Django.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.sedes import normalizar_sede


async def seccionales_del_chatbot(db: AsyncSession, chatbot_id: int) -> set[str]:
    """Seccionales donde está disponible el chatbot, con el nombre que usa el RAG (vacío = todas)."""
    filas = await db.execute(
        text(
            "SELECT s.ciudad FROM chatbot_agente_seccionales x "
            "JOIN sedes_seccional s ON s.id = x.seccional_id WHERE x.agente_id = :id"
        ),
        {"id": chatbot_id},
    )
    return {normalizar_sede(ciudad) for (ciudad,) in filas.all()} - {None}


def disponible_en(seccionales: set[str], sede: str) -> bool:
    return not seccionales or sede in seccionales


async def registrar_uso_pregunta_sugerida(db: AsyncSession, pregunta_sugerida_id: int | None, chatbot_id: int) -> None:
    # UPDATE atómico: con «leer, sumar y guardar» dos usos simultáneos contarían uno
    if not pregunta_sugerida_id:
        return
    await db.execute(
        text(
            "UPDATE chatbot_preguntasugerida SET contador_uso = contador_uso + 1 "
            "WHERE id = :id AND agente_id = :agente"
        ),
        {"id": pregunta_sugerida_id, "agente": chatbot_id},
    )


async def anexos_validos(db: AsyncSession, ids: list[int], chatbot_id: int, sede: str) -> list[dict]:
    """Anexos que el RAG indicó, vueltos a consultar: deben ser del mismo chatbot y sede y estar activos."""
    if not ids:
        return []
    consulta = text(
        "SELECT a.id, a.nombre, a.tipo_mime, a.tamano FROM chatbot_anexorespuesta a "
        "JOIN chatbot_preguntarespuesta p ON p.id = a.pregunta_respuesta_id "
        "WHERE a.id IN :ids AND p.agente_id = :agente AND p.sede = :sede AND p.activo = true "
        "ORDER BY a.id"
    ).bindparams(bindparam("ids", expanding=True))
    filas = await db.execute(consulta, {"ids": ids, "agente": chatbot_id, "sede": sede})
    return [dict(fila) for fila in filas.mappings().all()]


async def guardar_conversacion(
    db: AsyncSession, *, chat_id: str, chatbot_id: int, id_usuario: int, usuario: str, mensaje: str,
    respuesta: str, anexos: list[dict],
) -> tuple[int, datetime]:
    """Guarda pregunta y respuesta en `chatbot_conversacion` (el historial de Django) y sus anexos."""
    fecha = datetime.now(timezone.utc)
    resultado = await db.execute(
        text(
            "INSERT INTO chatbot_conversacion (chat_id, chatbot_id, id_usuario, usuario, mensaje, respuesta, fecha) "
            "VALUES (:chat_id, :chatbot, :id_usuario, :usuario, :mensaje, :respuesta, :fecha) RETURNING id"
        ),
        {
            "chat_id": uuid.UUID(chat_id), "chatbot": chatbot_id, "id_usuario": id_usuario, "usuario": usuario,
            "mensaje": mensaje, "respuesta": respuesta, "fecha": fecha,
        },
    )
    conversacion_id = resultado.scalar_one()
    for anexo in anexos:
        await db.execute(
            text(
                "INSERT INTO chatbot_conversacion_anexos (conversacion_id, anexorespuesta_id) "
                "VALUES (:conversacion, :anexo)"
            ),
            {"conversacion": conversacion_id, "anexo": anexo["id"]},
        )
    return conversacion_id, fecha
