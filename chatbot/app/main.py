from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine, Base
from app.core.sedes import Sede
from app.routers import documents, chat, chatbots

# Tablas ya existentes antes de introducir el concepto de chatbot_id: create_all no
# altera tablas existentes, así que se agrega la columna manualmente y de forma
# idempotente. No se declara FK a chatbot_agente porque esa tabla la crea Django por
# separado y no hay garantía de orden de arranque entre los dos servicios; la
# validación de que el chatbot exista se hace a nivel de aplicación (chatbot_service).
_ADD_CHATBOT_ID_COLUMN = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '{table}' AND column_name = 'chatbot_id'
    ) THEN
        ALTER TABLE {table} ADD COLUMN chatbot_id BIGINT;
        CREATE INDEX IF NOT EXISTS ix_{table}_chatbot_id ON {table} (chatbot_id);
    END IF;
END $$;
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        for table in ("documents", "chunks", "chat_messages"):
            await conn.execute(text(_ADD_CHATBOT_ID_COLUMN.format(table=table)))
    yield


app = FastAPI(
    title="Benji – RAG API Multi-Sede",
    description=(
        "API de Retrieval-Augmented Generation para la universidad.\n\n"
        "- **Carga documentos** asociados a una sede específica.\n"
        "- **Pregunta a Benji** con tu nombre y sede — responde solo con info de tu sede.\n"
        "- **Historial** filtrable por sede.\n"
    ),
    version="2.0.0",
    root_path="/chatbot",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(chatbots.router, prefix="/api/v1")


@app.get("/health", tags=["Health"], summary="Estado del servicio")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/v1/sedes", tags=["Sedes"], summary="Sedes disponibles")
async def list_sedes():
    """Retorna la lista de sedes válidas para usar en los endpoints."""
    return {"sedes": Sede.list()}
