# Chatbot SIHUL (`chatbot/`)

Servicio de chatbot con **recuperación aumentada por generación (RAG)**, integrado al stack de SIHUL como microservicio independiente. Permite realizar consultas en lenguaje natural sobre documentos cargados en el sistema.

> El archivo `chatbot/README.md` original tenía problemas de codificación (UTF-16 con acentos rotos); su contenido fue reconstruido y ampliado aquí.

## Tecnologías

- **FastAPI** (`chatbot/app/main.py`, servido con `uvicorn --reload`) — API REST asíncrona, independiente del backend Django.
- **PostgreSQL + pgvector** — mismo contenedor `db` que usa el backend Django, pero con conexión propia asíncrona (`asyncpg`). Es decir: chatbot y backend Django son procesos independientes que comparten la misma base de datos.
- **OpenAI** — generación de embeddings (`text-embedding-3-small`) y respuestas conversacionales (`gpt-4o-mini`).
- **Docker** — contenedor propio (`chatbot.Dockerfile`), puerto `8001`.

## Dependencias clave (`chatbot/requirements.txt`)

- `fastapi==0.115.6`, `uvicorn==0.34.0`
- `sqlalchemy==2.0.36` (async) + `asyncpg==0.30.0` (driver PostgreSQL async)
- `pgvector==0.3.6` (extensión de vectores en PostgreSQL)
- `openai==1.58.1`
- `langchain-text-splitters==0.3.4` (chunking de documentos)
- `pymupdf==1.25.3` (extracción de texto de PDFs)
- `pydantic-settings==2.7.1`

## Estructura (`chatbot/app/`)

```
core/
  config.py       → Settings (Pydantic): OPENAI_API_KEY, DATABASE_URL,
                    CHUNK_SIZE (500), CHUNK_OVERLAP (50),
                    EMBEDDING_MODEL (text-embedding-3-small),
                    CHAT_MODEL (gpt-4o-mini), MIN_SIMILARITY (0.45), TOP_K (5)
  database.py     → conexión SQLAlchemy async
  sedes.py        → utilidades relacionadas a sedes
models/
  models.py       → modelos SQLAlchemy (documentos, chunks/embeddings)
routers/
  chat.py         → endpoints de conversación
  documents.py    → endpoints de gestión de documentos (carga, listado)
schemas/
  schemas.py      → schemas Pydantic (request/response)
services/
  chat_service.py       → orquesta la conversación (retrieval + generación)
  document_service.py   → ingesta y procesamiento de documentos
  embedding_service.py  → generación y búsqueda de embeddings
```

## Flujo RAG

1. **Ingesta de documentos** (`document_service.py`): un documento (PDF u otro) se extrae con `pymupdf`, se divide en fragmentos (`CHUNK_SIZE=500`, `CHUNK_OVERLAP=50` usando `langchain-text-splitters`).
2. **Embeddings** (`embedding_service.py`): cada fragmento se convierte en un vector con el modelo `text-embedding-3-small` de OpenAI y se almacena en PostgreSQL vía `pgvector`.
3. **Consulta** (`chat_service.py`): la pregunta del usuario se embebe, se buscan los `TOP_K=5` fragmentos más similares (umbral `MIN_SIMILARITY=0.45`), y se arma un prompt de contexto para `gpt-4o-mini`, que genera la respuesta final.

## Integración con el resto del stack

- **Backend Django como proxy**: la app Django `backend/chatbot/` expone `api_views.py`/`api_urls.py`, que reenvían las peticiones del frontend al servicio FastAPI usando la variable `CHATBOT_FASTAPI_URL` (`http://chatbot:8001/api/v1` dentro de Docker, ver `backend/mysite/settings.py`). Esto permite que el frontend solo hable con el backend Django (misma sesión/autenticación) sin exponer el servicio FastAPI directamente... aunque en desarrollo el puerto `8001` también está expuesto al host (`VITE_CHATBOT_URL` en el frontend).
- **Frontend**: consume el chatbot vía `frontend/src/services/chatbot/`, con el hook `frontend/src/hooks/chatbot/useAsistentesVirtuales.ts` y la página `frontend/src/pages/chatbot/AsistentesVirtuales.tsx` (reutilizada en las rutas de admin, supervisor, docente, estudiante y la vista pública).
- **Base de datos compartida**: mismo Postgres que Django (contenedor `db`), pero el chatbot se conecta directo con `DATABASE_URL=postgresql+asyncpg://...` (ver `docker-compose.yml`), sin pasar por el ORM de Django.
- **Notificaciones relacionadas**: el modelo `Agente` (chatbot) dispara notificaciones `AGENTE_CREADO`/`AGENTE_DESACTIVADO`/`AGENTE_ELIMINADO`, y existe `PreguntaSugerida` con sus propias notificaciones — ver `backend/notificaciones/README.md`.

## Variables de entorno

El chatbot usa su **propio** archivo de entorno (`chatbot/.env`), independiente del `.env` de la raíz del proyecto. En `docker-compose.yml` se le pasa `env_file: ./chatbot/.env` y además `DATABASE_URL` está fijado directamente ahí. Claves esperadas (ver `chatbot/.env.template` o `.envtemplate`): `OPENAI_API_KEY`, `DATABASE_URL`, `CHUNK_SIZE`, `CHUNK_OVERLAP`, `EMBEDDING_MODEL`, `CHAT_MODEL`. El archivo `.env.test.example` de la raíz también trae equivalentes de estas variables para el stack de pruebas (con `OPENAI_API_KEY=test-key-not-for-production` como placeholder).

## Docker

`chatbot.Dockerfile`: `python:3.11-slim`, instala `requirements.txt`, arranca con:

```
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Sin etapa de build de producción — está orientado a desarrollo con recarga en caliente, igual que el resto de servicios del stack.
