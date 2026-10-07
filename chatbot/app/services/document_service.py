import hashlib

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import invalidate_answers
from app.core.sedes import Sede
from app.models.models import Document, Chunk
from app.services.embedding_service import generate_embeddings
from app.core.config import get_settings
from app.core.profiles import get_profile
from app.services.text_extraction import (
    IngestionError,
    chunk_text_with_pages,
    extract_text,
    strip_page_markers,
)

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


async def process_document(
    file: UploadFile, sede: Sede, chatbot_id: int, db: AsyncSession, tipo: str | None = None
) -> Document:
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

    is_pdf = file.filename.lower().endswith(".pdf")
    perfil = get_profile(tipo).tipo
    rows = (
        await db.execute(
            select(Document, Document.file_data.is_not(None).label("has_file")).where(
                Document.chatbot_id == chatbot_id, Document.sede == sede.value
            )
        )
    ).all()
    existing = [doc for doc, _ in rows]
    stale_ids = set()  # mismo contenido, pero procesado de otra forma: se rehace
    for prev, has_file in rows:
        if prev.content_hash == content_hash:
            # Mismo archivo: es un duplicado salvo que falte el original (cargado antes de
            # guardarlo) o que el tipo del agente haya cambiado desde entonces; en esos
            # casos volver a subirlo lo reprocesa y reemplaza al anterior.
            if (has_file or not is_pdf) and prev.perfil == perfil:
                raise DuplicateDocumentError(prev)
            stale_ids.add(prev.id)

    content = extract_text(raw, file.filename)
    # El tipo de agente influye en el troceado: el investigativo reconoce los encabezados
    # numerados («2.1 Antecedentes») de los trabajos académicos.
    chunks_with_pages = chunk_text_with_pages(
        content, file.filename, numbered_headings=perfil == "investigativo"
    )
    texts = [text for text, _ in chunks_with_pages]
    pages = [page for _, page in chunks_with_pages]
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
        if prev.id in stale_ids or prev.filename.lower() == file.filename.lower():
            await db.delete(prev)

    doc = Document(
        filename=file.filename,
        content=strip_page_markers(content),
        content_hash=content_hash,
        perfil=perfil,
        file_data=raw if is_pdf else None,
        embedding_model=_settings.EMBEDDING_MODEL,
        sede=sede.value,
        chatbot_id=chatbot_id,
    )
    db.add(doc)
    await db.flush()  # obtiene doc.id sin cerrar la transacción

    db.add_all(
        Chunk(
            document_id=doc.id,
            text=text,
            page=page,
            embedding=emb,
            sede=sede.value,   # desnormalizado para filtrado rápido
            chatbot_id=chatbot_id,   # desnormalizado para filtrado rápido
        )
        for text, page, emb in zip(texts, pages, embeddings)
    )

    await db.commit()
    await db.refresh(doc)
    await invalidate_answers(chatbot_id, sede.value)
    return doc
