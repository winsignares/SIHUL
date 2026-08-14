from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.chatbot_service import list_chatbots

router = APIRouter(prefix="/chatbots", tags=["Chatbots"])


@router.get(
    "/",
    summary="Listar chatbots disponibles",
    description=(
        "Retorna los chatbots (Agentes) activos configurados en el panel. "
        "Úsalo para escoger el `chatbot_id` al subir documentos o hacer una pregunta."
    ),
)
async def get_chatbots(db: AsyncSession = Depends(get_db)):
    return await list_chatbots(db)
