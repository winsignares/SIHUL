import logging
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import text

from app.core.config import get_settings
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
        {create_index}
    END IF;
END $$;
"""

# (tabla, columna, tipo SQL, con índice)
_EXTRA_COLUMNS = (
    ("documents", "chatbot_id", "BIGINT", True),
    ("chunks", "chatbot_id", "BIGINT", True),
    ("chat_messages", "chatbot_id", "BIGINT", True),
    ("documents", "content_hash", "VARCHAR(64)", True),
    ("documents", "embedding_model", "VARCHAR(100)", False),
    ("documents", "perfil", "VARCHAR(20)", False),
    ("chunks", "page", "INTEGER", False),
    ("chat_messages", "chat_id", "VARCHAR(64)", True),
    ("chat_messages", "id_usuario", "BIGINT", True),
)

# Identificador del bloqueo de aplicación que serializa la preparación del esquema
_SCHEMA_LOCK_ID = 74210001

logger = logging.getLogger("uvicorn.error")


async def _prepare_schema(conn):
    # Con varios procesos arrancando a la vez (--workers, varias réplicas) el DDL
    # concurrente puede chocar. El bloqueo es de transacción: se libera al terminar
    # y el resto de procesos espera y encuentra todo ya creado.
    await conn.execute(text("SELECT pg_advisory_xact_lock(:id)"), {"id": _SCHEMA_LOCK_ID})
    await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    await conn.run_sync(Base.metadata.create_all)
    for table, column, sql_type, indexed in _EXTRA_COLUMNS:
        create_index = (
            f"CREATE INDEX IF NOT EXISTS ix_{table}_{column} ON {table} ({column});"
            if indexed else ""
        )
        await conn.execute(text(
            _ADD_COLUMN.format(table=table, column=column, sql_type=sql_type, create_index=create_index)
        ))

    settings = get_settings()
    # Si cambia el modelo de embeddings y su dimensión, las inserciones y las
    # búsquedas fallarían una a una; es mejor no arrancar y decir por qué.
    dim = (await conn.execute(text(
        "SELECT atttypmod FROM pg_attribute "
        "WHERE attrelid = 'chunks'::regclass AND attname = 'embedding'"
    ))).scalar()
    if dim != settings.EMBEDDING_DIM:
        raise RuntimeError(
            f"chunks.embedding tiene dimensión {dim} pero EMBEDDING_DIM={settings.EMBEDDING_DIM} "
            f"(modelo {settings.EMBEDDING_MODEL}). Para cambiar de modelo hay que recrear la "
            "columna y volver a cargar los documentos."
        )
    stale = (await conn.execute(text(
        "SELECT embedding_model, count(*) FROM documents "
        "WHERE embedding_model IS NOT NULL AND embedding_model <> :m GROUP BY embedding_model"
    ), {"m": settings.EMBEDDING_MODEL})).all()
    for model, count in stale:
        logger.warning(
            "%s documento(s) fueron procesados con el modelo '%s' y no con '%s': sus "
            "similitudes no son comparables. Vuelve a cargarlos.", count, model, settings.EMBEDDING_MODEL,
        )

    # Índice ANN: sin esto, la búsqueda por similitud en chunks.embedding
    # (ORDER BY embedding <=> :emb) es un escaneo secuencial completo de la
    # tabla en cada pregunta al chatbot. HNSW no requiere afinar un
    # parámetro "lists" según el volumen de filas, a diferencia de ivfflat.
    await conn.execute(text(
        "CREATE INDEX IF NOT EXISTS ix_chunks_embedding_hnsw ON chunks "
        "USING hnsw (embedding vector_cosine_ops)"
    ))


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await _prepare_schema(conn)
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
