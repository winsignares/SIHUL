from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.sedes import Sede
from app.models.models import Document
from app.schemas.schemas import DocumentOut
from app.services.chatbot_service import get_chatbot
from app.services.document_service import process_document

router = APIRouter(prefix="/documents", tags=["Documentos"])

ALLOWED_EXTENSIONS = (".pdf", ".txt", ".md", ".csv")


@router.post(
    "/upload",
    response_model=DocumentOut,
    summary="Cargar documento asociado a un chatbot y una sede",
    description=(
        "Sube un archivo (.pdf, .txt, .md, .csv), extrae el texto, genera embeddings "
        "y lo almacena **asociado al chatbot y a la sede indicados**. "
        "Solo los chunks de ese chatbot y esa sede se usarán al responder preguntas "
        "de esa combinación. Usa `GET /chatbots` para ver los chatbots disponibles."
    ),
)
async def upload_document(
    chatbot_id: int = Query(..., description="ID del chatbot (agente) al que pertenece el documento"),
    sede: Sede = Query(..., description="Sede a la que pertenece el documento"),
    file: UploadFile = File(..., description="Archivo a procesar"),
    db: AsyncSession = Depends(get_db),
):
    if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Acepta: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    chatbot = await get_chatbot(chatbot_id, db)
    if not chatbot:
        raise HTTPException(status_code=404, detail=f"No existe el chatbot con id {chatbot_id}")
    if not chatbot["activo"]:
        raise HTTPException(status_code=400, detail=f"El chatbot '{chatbot['nombre']}' está inactivo")
    try:
        return await process_document(file, sede, chatbot_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/",
    response_model=list[DocumentOut],
    summary="Listar documentos",
    description="Retorna los documentos cargados. Filtra por chatbot y/o sede de forma opcional.",
)
async def list_documents(
    chatbot_id: int | None = Query(None, description="Filtrar por chatbot (opcional)"),
    sede: Sede | None = Query(None, description="Filtrar por sede (opcional)"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).order_by(Document.created_at.desc()).limit(limit)
    if chatbot_id is not None:
        stmt = stmt.where(Document.chatbot_id == chatbot_id)
    if sede:
        stmt = stmt.where(Document.sede == sede.value)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete(
    "/{document_id}",
    status_code=204,
    summary="Eliminar documento",
    description="Elimina un documento y sus chunks asociados (cascade a nivel de base de datos).",
)
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    await db.delete(doc)
    await db.commit()
