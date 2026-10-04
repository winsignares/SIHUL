import hashlib

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_answers
from app.core.sedes import Sede
from app.models.models import Document, Chunk
from app.services.embedding_service import generate_embeddings
from app.core.config import get_settings
from app.services.text_extraction import IngestionError, chunk_text, extract_text

_settings = get_settings()


class DuplicateDocumentError(IngestionError):
    """Ya existe un documento con el mismo contenido para ese chatbot y sede."""

    def __init__(self, existing: Document):
        self.existing = existing
        super().__init__(
            f"El archivo ya fue cargado como '{existing.filename}' (id {existing.id}) "
            "para este chatbot y sede.",
            status_code=409,
        )


async def process_document(file: UploadFile, sede: Sede, chatbot_id: int, db: AsyncSession) -> Document:
    """
    Extrae texto, genera embeddings y persiste el documento
    asociado a un chatbot y una sede específicos.

    - Mismo contenido (hash) ya cargado para el chatbot y la sede: DuplicateDocumentError.
    - Mismo nombre de archivo con contenido distinto: se interpreta como una
      versión nueva y reemplaza al documento anterior (y sus chunks).
    """
    raw = await file.read()
    if len(raw) > _settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise IngestionError(
            f"El archivo supera el máximo de {_settings.MAX_UPLOAD_MB} MB.", status_code=413
        )
    content_hash = hashlib.sha256(raw).hexdigest()

    existing = (
        await db.execute(
            select(Document).where(
                Document.chatbot_id == chatbot_id, Document.sede == sede.value
            )
        )
    ).scalars().all()
    for prev in existing:
        if prev.content_hash == content_hash:
            raise DuplicateDocumentError(prev)

    content = extract_text(raw, file.filename)
    texts = chunk_text(content, file.filename)
    if len(texts) > _settings.MAX_CHUNKS_PER_DOCUMENT:
        raise IngestionError(
            f"El documento es demasiado extenso ({len(texts)} fragmentos; el máximo es "
            f"{_settings.MAX_CHUNKS_PER_DOCUMENT}). Divídelo en varios archivos.",
            status_code=413,
        )
    embeddings = await generate_embeddings(texts) if texts else []

    # Se reemplaza solo cuando lo nuevo ya se procesó con éxito, para no perder
    # la versión anterior si falla la extracción o el embedding.
    for prev in existing:
        if prev.filename.lower() == file.filename.lower():
            await db.delete(prev)

    doc = Document(
        filename=file.filename,
        content=content,
        content_hash=content_hash,
        sede=sede.value,
        chatbot_id=chatbot_id,
    )
    db.add(doc)
    await db.flush()  # obtiene doc.id sin cerrar la transacción

    db.add_all(
        Chunk(
            document_id=doc.id,
            text=text,
            embedding=emb,
            sede=sede.value,   # desnormalizado para filtrado rápido
            chatbot_id=chatbot_id,   # desnormalizado para filtrado rápido
        )
        for text, emb in zip(texts, embeddings)
    )

    await db.commit()
    await db.refresh(doc)
    await invalidate_answers(chatbot_id, sede.value)
    return doc
