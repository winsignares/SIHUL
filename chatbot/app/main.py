from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from sqlalchemy import text

from app.core.database import engine, Base
from app.core.sedes import Sede
from app.routers import documents, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
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


@app.get("/health", tags=["Health"], summary="Estado del servicio")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/api/v1/sedes", tags=["Sedes"], summary="Sedes disponibles")
async def list_sedes():
    """Retorna la lista de sedes válidas para usar en los endpoints."""
    return {"sedes": Sede.list()}
