from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.schemas.schemas import ChatRequest, ChatResponse, ChatHistoryItem
from app.services.chat_service import ask
from app.services.chatbot_service import get_chatbot

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "/ask",
    response_model=ChatResponse,
    summary="Hacer una pregunta a un chatbot",
    description=(
        "Envía nombre del estudiante, chatbot, sede y pregunta. "
        "El sistema recupera contexto **exclusivamente** de los documentos "
        "de ese chatbot y esa sede, y genera una respuesta personalizada."
    ),
)
async def ask_question(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    chatbot = await get_chatbot(body.chatbot_id, db)
    if not chatbot:
        raise HTTPException(status_code=404, detail=f"No existe el chatbot con id {body.chatbot_id}")
    if not chatbot["activo"]:
        raise HTTPException(status_code=400, detail=f"El chatbot '{chatbot['nombre']}' está inactivo")
    try:
        return await ask(
            nombre=body.nombre,
            chatbot_id=body.chatbot_id,
            sede=body.sede,
            question=body.question,
            db=db,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/history",
    response_model=list[ChatHistoryItem],
    summary="Historial de chat",
    description="Retorna conversaciones guardadas. Filtra por chatbot y/o sede de forma opcional.",
)
async def get_history(
    chatbot_id: int | None = Query(None, description="Filtrar historial por chatbot"),
    sede: Sede | None = Query(None, description="Filtrar historial por sede"),
    limit: int = Query(50, ge=1, le=500, description="Cantidad máxima de mensajes"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ChatMessage)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    if chatbot_id is not None:
        stmt = stmt.where(ChatMessage.chatbot_id == chatbot_id)
    if sede:
        stmt = stmt.where(ChatMessage.sede == sede.value)

    result = await db.execute(stmt)
    return [
        ChatHistoryItem(
            id=m.id,
            nombre=m.nombre,
            chatbot_id=m.chatbot_id,
            sede=m.sede,
            question=m.question,
            answer=m.answer,
            relevance_score=m.relevance_score,
            fecha=m.created_at.strftime("%Y-%m-%d"),
            hora=m.created_at.strftime("%H:%M:%S"),
        )
        for m in result.scalars().all()
    ]
