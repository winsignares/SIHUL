from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.sedes import Sede
from app.models.models import Document
from app.schemas.schemas import DocumentOut
from app.services.document_service import process_document

router = APIRouter(prefix="/documents", tags=["Documentos"])

ALLOWED_EXTENSIONS = (".pdf", ".txt", ".md", ".csv")


@router.post(
    "/upload",
    response_model=DocumentOut,
    summary="Cargar documento asociado a una sede",
    description=(
        "Sube un archivo (.pdf, .txt, .md, .csv), extrae el texto, genera embeddings "
        "y lo almacena **asociado a la sede indicada**. "
        "Solo los chunks de esa sede se usarán al responder preguntas de esa sede."
    ),
)
async def upload_document(
    sede: Sede = Query(..., description="Sede a la que pertenece el documento"),
    file: UploadFile = File(..., description="Archivo a procesar"),
    db: AsyncSession = Depends(get_db),
):
    if not any(file.filename.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Acepta: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    try:
        return await process_document(file, sede, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/",
    response_model=list[DocumentOut],
    summary="Listar documentos",
    description="Retorna los documentos cargados. Filtra por sede de forma opcional.",
)
async def list_documents(
    sede: Sede | None = Query(None, description="Filtrar por sede (opcional)"),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).order_by(Document.created_at.desc()).limit(limit)
    if sede:
        stmt = stmt.where(Document.sede == sede.value)
    result = await db.execute(stmt)
    return result.scalars().all()
