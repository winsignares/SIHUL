from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_answers
from app.core.database import get_db
from app.core.sedes import Sede
from app.schemas.schemas import QASyncOut
from app.services import qa_service
from app.services.chatbot_service import get_chatbot

router = APIRouter(prefix="/qa", tags=["Preguntas-respuestas"])


@router.post(
    "/sync",
    response_model=QASyncOut,
    summary="Sincronizar las preguntas-respuestas de un chatbot y una sede",
    description=(
        "Django lo llama al crear, editar o borrar preguntas-respuestas (con sus anexos). "
        "Calcula los embeddings que falten y descarta las respuestas cacheadas del chatbot "
        "en la sede. Si no se llama, el chatbot igualmente se pone al día en la siguiente pregunta."
    ),
)
async def sync_qa(
    chatbot_id: int = Query(..., description="ID del chatbot (agente)"),
    sede: Sede = Query(..., description="Sede de las preguntas-respuestas"),
    db: AsyncSession = Depends(get_db),
):
    if not await get_chatbot(chatbot_id, db):
        raise HTTPException(status_code=404, detail=f"No existe el chatbot con id {chatbot_id}")
    result = await qa_service.sync(chatbot_id, sede, db)
    await invalidate_answers(chatbot_id, sede.value)
    return result
