from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine, Base
from app.core.sedes import Sede
from app.routers import documents, chat, chatbots

# Tablas ya existentes antes de introducir nuevas columnas: create_all no altera
# tablas existentes, así que se agregan manualmente y de forma idempotente. No se
# declara FK a chatbot_agente porque esa tabla la crea Django por separado y no hay
# garantía de orden de arranque entre los dos servicios; la validación de que el
# chatbot exista se hace a nivel de aplicación (chatbot_service).
_ADD_COLUMN = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '{table}' AND column_name = '{column}'
    ) THEN
        ALTER TABLE {table} ADD COLUMN {column} {sql_type};
        CREATE INDEX IF NOT EXISTS ix_{table}_{column} ON {table} ({column});
    END IF;
END $$;
"""

# (tabla, columna, tipo SQL)
_EXTRA_COLUMNS = (
    ("documents", "chatbot_id", "BIGINT"),
    ("chunks", "chatbot_id", "BIGINT"),
    ("chat_messages", "chatbot_id", "BIGINT"),
    ("documents", "content_hash", "VARCHAR(64)"),
    ("chat_messages", "chat_id", "VARCHAR(64)"),
    ("chat_messages", "id_usuario", "BIGINT"),
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
        for table, column, sql_type in _EXTRA_COLUMNS:
            await conn.execute(
                text(_ADD_COLUMN.format(table=table, column=column, sql_type=sql_type))
            )
        # Índice ANN: sin esto, la búsqueda por similitud en chunks.embedding
        # (ORDER BY embedding <=> :emb) es un escaneo secuencial completo de la
        # tabla en cada pregunta al chatbot. HNSW no requiere afinar un
        # parámetro "lists" según el volumen de filas, a diferencia de ivfflat.
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw ON chunks "
            "USING hnsw (embedding vector_cosine_ops)"
        ))
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
