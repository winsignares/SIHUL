import fitz
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings
from app.core.sedes import Sede
from app.models.models import Document, Chunk
from app.services.embedding_service import generate_embeddings

_settings = get_settings()
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=_settings.CHUNK_SIZE,
    chunk_overlap=_settings.CHUNK_OVERLAP,
)


async def _extract_text(file: UploadFile) -> str:
    raw = await file.read()
    if file.filename.endswith(".pdf"):
        doc = fitz.open(stream=raw, filetype="pdf")
        return "\n".join(page.get_text() for page in doc)
    return raw.decode("utf-8")


async def process_document(file: UploadFile, sede: Sede, db: AsyncSession) -> Document:
    """
    Extrae texto, genera embeddings y persiste el documento
    asociado a una sede específica.
    """
    content = await _extract_text(file)

    doc = Document(filename=file.filename, content=content, sede=sede.value)
    db.add(doc)
    await db.flush()  # obtiene doc.id sin cerrar la transacción

    texts = _splitter.split_text(content)
    if not texts:
        await db.commit()
        await db.refresh(doc)
        return doc

    embeddings = await generate_embeddings(texts)

    chunks = [
        Chunk(
            document_id=doc.id,
            text=text,
            embedding=emb,
            sede=sede.value,   # desnormalizado para filtrado rápido
        )
        for text, emb in zip(texts, embeddings)
    ]
    db.add_all(chunks)

    await db.commit()
    await db.refresh(doc)
    return doc
