from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.sedes import Sede
from app.models.models import ChatMessage
from app.schemas.schemas import ChatRequest, ChatResponse, ChatHistoryItem
from app.services.chat_service import ask

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post(
    "/ask",
    response_model=ChatResponse,
    summary="Hacer una pregunta a Benji",
    description=(
        "Envía nombre del estudiante, sede y pregunta. "
        "El sistema recupera contexto **exclusivamente** de los documentos "
        "de la sede indicada y genera una respuesta personalizada."
    ),
)
async def ask_question(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await ask(
            nombre=body.nombre,
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
    description="Retorna conversaciones guardadas. Filtra por sede de forma opcional.",
)
async def get_history(
    sede: Sede | None = Query(None, description="Filtrar historial por sede"),
    limit: int = Query(50, ge=1, le=500, description="Cantidad máxima de mensajes"),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(ChatMessage)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    if sede:
        stmt = stmt.where(ChatMessage.sede == sede.value)

    result = await db.execute(stmt)
    return [
        ChatHistoryItem(
            id=m.id,
            nombre=m.nombre,
            sede=m.sede,
            question=m.question,
            answer=m.answer,
            relevance_score=m.relevance_score,
            fecha=m.created_at.strftime("%Y-%m-%d"),
            hora=m.created_at.strftime("%H:%M:%S"),
        )
        for m in result.scalars().all()
    ]
