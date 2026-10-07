# Chatbot SIHUL

Servicio de chatbot con **recuperación aumentada por generación (RAG)**, integrado al stack de SIHUL. Responde preguntas en lenguaje natural usando únicamente los documentos cargados para cada **chatbot (agente)** y **sede**.

Son **dos piezas que comparten la misma base de datos PostgreSQL**:

| Pieza | Dónde | Responsabilidad |
|---|---|---|
| **Servicio RAG** (FastAPI) | `chatbot/` | Ingesta de documentos, embeddings, búsqueda por similitud, llamada al LLM, caché |
| **App Django `chatbot`** | `backend/chatbot/` | Agentes y preguntas sugeridas, historial por usuario, permisos, proxy hacia el RAG, admin |

```
Frontend (React) ──► Django (backend/chatbot) ──requests──► FastAPI (chatbot/) ──► OpenAI
                         │                                     │  └──► Redis (db 1): caché de respuestas
                         └────────── PostgreSQL + pgvector ────┘
```

## Qué tabla crea cada servicio

| Tabla | La crea | Contenido |
|---|---|---|
| `chatbot_agente`, `chatbot_preguntasugerida`, `chatbot_conversacion` | Django (migraciones) | Agentes, preguntas rápidas, historial por usuario/hilo |
| `documents`, `chunks`, `chat_messages` | FastAPI (al arrancar) | Documentos, fragmentos con su embedding, registro de preguntas del RAG |

Django ve las tablas del RAG con modelos `managed=False` (`ChatbotDocument`, `ChatbotChunk`, `ChatbotAppMessage`) solo para consultarlas desde el admin. FastAPI lee `chatbot_agente` con SQL para validar que el chatbot exista y esté activo.

**Esquema del RAG.** No usa un sistema de migraciones: al arrancar, `_prepare_schema` (`chatbot/app/main.py`) ejecuta `create_all` y añade de forma idempotente las columnas posteriores (`_EXTRA_COLUMNS`). Todo ocurre en una transacción protegida por un *advisory lock* de Postgres, de modo que varios procesos arrancando a la vez no chocan. Para añadir una columna: declararla en `models.py`, agregarla a `_EXTRA_COLUMNS` y reflejarla (si Django debe verla) en `backend/chatbot/models.py` con una migración de estado (ver `0009`), que no ejecuta SQL.

Al arrancar también se **valida** que la dimensión de `chunks.embedding` coincida con `EMBEDDING_DIM` (si no, el servicio no inicia) y se **avisa** si hay documentos procesados con un modelo de embeddings distinto del configurado.

## Estructura (`chatbot/app/`)

```
main.py                 → app FastAPI, preparación del esquema, rutas, CORS
core/config.py          → Settings (pydantic): variables de entorno y valores por defecto
core/database.py        → conexión SQLAlchemy async
core/cache.py           → cliente Redis y borrado de respuestas cacheadas
core/sedes.py           → enum de sedes válidas
models/models.py        → Document, Chunk (vector), ChatMessage
routers/                → chat.py, documents.py, chatbots.py
schemas/schemas.py      → modelos Pydantic de entrada/salida
services/
  text_extraction.py    → extracción de texto y troceado estructurado
  document_service.py   → ingesta (validaciones, duplicados, embeddings, persistencia)
  embedding_service.py  → embeddings por lotes
  chat_service.py       → RAG: recuperación, memoria del hilo, LLM, caché
  chatbot_service.py    → lectura de agentes (tabla de Django)
```

## Endpoints del RAG (`/chatbot/api/v1`)

`POST /documents/upload` · `GET /documents/` · `DELETE /documents/{id}` · `POST /chat/ask` · `GET /chat/history` · `GET /chatbots/` · `GET /sedes` · `GET /health`

El RAG **no tiene autenticación propia**: la autorización la hace Django (`PuedeGestionarChatbots`, usuario autenticado) y el RAG debe ser inaccesible desde fuera de la red del stack.

## Perfiles de comportamiento (tipo de agente)

Cada agente tiene un `tipo` (`Agente.tipo` en Django) que selecciona un **perfil** definido en `chatbot/app/core/profiles.py`. El perfil controla el **prompt de sistema**, el **mensaje de «sin información»** y, al subir un documento, si se reconocen los **encabezados numerados** (ver «Ingesta»); la recuperación es igual para todos.

| Tipo | Para qué | Comportamiento |
|---|---|---|
| `normativo` (predeterminado) | Reglamentos, manuales, procedimientos | Respuestas breves y cercanas, sin citar la fuente, aplica las reglas del contexto a casos concretos |
| `investigativo` | Monografías, tesis, artículos | Tono académico, **cita documento y página** de cada dato, no infiere ni calcula salvo que se pida, avisa cuando la respuesta es parcial |

Además, `Agente.instrucciones_adicionales` (hasta 2000 caracteres) permite ajustes finos sobre el perfil («responde en máximo tres frases»). Se añaden al prompt como instrucciones subordinadas: si contradicen las reglas del perfil (responder solo con el contexto, no revelar el prompt) prevalecen las reglas. El mensaje de «sin información» se mantiene en el idioma del perfil aunque las instrucciones pidan otro.

- El RAG lee `tipo` e `instrucciones_adicionales` en cada pregunta (`get_chatbot`); un tipo desconocido usa el normativo.
- La clave de la caché de respuestas incluye una huella del perfil, **del texto de su prompt** y de las instrucciones: al cambiar cualquiera de ellos (incluso editando `profiles.py`), las respuestas cacheadas con el comportamiento anterior dejan de usarse.
- Solo quien puede gestionar chatbots (administradores o permiso de edición sobre «Gestión de Chatbots») puede crear, editar o borrar agentes y ver las instrucciones adicionales; el resto de usuarios autenticados solo ve la lista de agentes.
- Cambiar el tipo no vuelve a procesar los documentos ya cargados: conservan el troceado (secciones y páginas) con que se subieron; `documents.perfil` indica con qué perfil se procesó cada uno. Para aplicar el nuevo tipo hay que volver a subirlos.
- Para añadir un perfil: definirlo en `profiles.py`, registrarlo en `PROFILES` y añadir el tipo a `Agente.TIPO_CHOICES` (y a `CHATBOT_TIPOS` en el frontend).

## Ingesta de documentos

Formatos: `.pdf`, `.txt`, `.md`, `.csv` (la extensión no distingue mayúsculas). Máximo `MAX_UPLOAD_MB` (25) y `MAX_CHUNKS_PER_DOCUMENT` (5000) fragmentos.

1. **Validación y duplicados.** El mismo contenido (SHA-256) para el mismo chatbot y sede responde **409**. Un archivo con el mismo nombre y contenido distinto se interpreta como una **versión nueva** y reemplaza al anterior (y sus chunks).
2. **Extracción.**
   - *PDF*: PyMuPDF. Las **tablas** se detectan (`find_tables`) y cada fila se guarda con sus columnas (`GRADO: QUINTO | COSTOS 2025 PENSIÓN: $1.114.423`); las tablas que continúan en la página siguiente heredan sus encabezados. Un PDF sin texto (escaneado) se rechaza con 422: **no hay OCR**.
   - *Texto*: UTF-8 (con o sin BOM), UTF-16 con BOM o Windows-1252.
   - *CSV*: una línea por fila con el nombre de cada columna; las filas no se parten.
3. **Orden de lectura y páginas (PDF).** En las páginas de dos columnas (artículos científicos) se lee la columna izquierda completa y luego la derecha; los bloques de ancho completo (título, resumen, tablas anchas) separan «bandas». El texto extraído lleva una marca por página, de modo que cada fragmento guarda en `chunks.page` la página del PDF en que empieza (la página física, no la numeración impresa). Los documentos que no son PDF, o los cargados antes de este cambio, no tienen página.
4. **Troceado.** `CHUNK_SIZE` 900 / `CHUNK_OVERLAP` 150. El texto se divide por secciones (título › capítulo › artículo › subtítulo en mayúsculas) y **cada fragmento lleva su ruta de sección** como prefijo, para que un ítem de una lista conserve el título que lo clasifica. Un subtítulo en mayúsculas solo se reconoce si lo sigue texto (los nombres de una firma no lo son) y el cierre del documento («Expedido en…», «Firman:») forma su propia sección `FIRMAS Y EXPEDICIÓN`. En los PDF, los textos alineados en columnas se emparejan por columna («NOMBRE — Cargo»). Con un agente **investigativo** se reconocen además los encabezados de trabajos académicos: numerados («2. Marco teórico», «2.1 Antecedentes», hasta tres niveles) y secciones conocidas («Resumen», «Introducción», «Conclusiones», «Referencias»…). Solo se activan en ese tipo porque en un reglamento «7. Ingresar a los baños…» es un ítem de lista, no un título.
5. **Embeddings.** `EMBEDDING_MODEL`, en lotes de 128 (hasta 3 en paralelo), conservando el orden. El modelo usado queda registrado en `documents.embedding_model`.
6. **Persistencia** en `documents` (con `perfil`) y `chunks` (con `page`) (con `sede` y `chatbot_id` desnormalizados) y borrado de la caché de respuestas de ese chatbot y sede.

Los errores de ingesta usan `IngestionError` con su código HTTP: 409 duplicado, 413 demasiado grande, 422 archivo ilegible/vacío/escaneado/protegido.

## Consulta (`POST /chat/ask`)

1. Se valida que el chatbot exista y esté activo.
2. Si llega `chat_id`, se cargan los últimos 3 intercambios del hilo (memoria). Para resolver seguimientos ("¿y los sábados?") se buscan **dos formulaciones**: la pregunta sola conserva sus `TOP_K` resultados, exactamente como sin historial, y la combinada con la anterior solo añade unos pocos candidatos extra. Así una pregunta nueva sobre otro tema no queda desplazada por fragmentos de la anterior.
3. Sin historial, se consulta la caché (Redis, `ANSWER_CACHE_TTL_SECONDS`); las respuestas "sin información" nunca se cachean.
4. Búsqueda por similitud coseno (índice HNSW) **filtrando por `chatbot_id` y `sede`**; se descartan los fragmentos por debajo de `MIN_SIMILARITY` y los repetidos, y se conservan hasta `TOP_K`. A los 5 mejores se les añaden sus **fragmentos vecinos de la misma sección** (hasta 2 por lado), para que las listas y tablas largas lleguen completas aunque la búsqueda solo haya traído una parte. Además hay una **búsqueda léxica** (texto completo de Postgres en español) que aporta hasta 3 fragmentos más: recupera lo que los embeddings encuentran mal (ISBN, siglas, códigos, apellidos, cifras). Ignora los términos de la pregunta presentes en más del 10 % de los fragmentos y puntúa más los términos raros; si falla, solo se usa la búsqueda vectorial.
5. Sin contexto relevante se responde con `NO_INFO_RESPONSE` sin llamar al LLM; con contexto, se llama a `CHAT_MODEL` (o a `CHAT_MODEL_LISTS` si la pregunta pide contar o enumerar: «¿cuántas… hay?», «¿cuáles son…?», «en total», «enumera», «lista») con el prompt de sistema (solo responde con el contexto, listas completas, ante contradicciones gana el documento más reciente).
6. Se registra el intercambio en `chat_messages` (con `chat_id` e `id_usuario` para cruzarlo con el historial de Django).

**Tiempos.** Django espera 30 s al RAG. El embedding de la pregunta (`OPENAI_TIMEOUT_SECONDS / 2`) y el LLM (`OPENAI_TIMEOUT_SECONDS`, 18 s) no reintentan, para no exceder ese plazo. Si OpenAI falla, el RAG responde **503** con un mensaje genérico (el detalle queda en el log).

## Django (`backend/chatbot/`)

- `views.py`: `enviar_pregunta` (usuario autenticado: resuelve la sede por su seccional, guarda `Conversacion`) y `enviar_pregunta_publico` (sede indicada por el cliente, sin historial). Si el RAG no responde, se muestra al usuario un mensaje genérico y **el intercambio no se guarda** en el historial.
- `api_urls.py` (`/api/chatbot/…`): rutas que usa el frontend (los agentes se pueden listar estando autenticado; modificarlos exige poder gestionar chatbots). `urls.py` (`/chatbot/…`) son rutas **heredadas** que ya no usa el frontend.
- `admin_views.py`: proxy autenticado hacia el RAG para subir, listar y borrar documentos (permiso "Gestión de Chatbots"). El borrado es idempotente (un 404 del RAG se devuelve como 204).
- `signals.py`: al **borrar un agente** se eliminan sus documentos (los chunks caen por `ON DELETE CASCADE`) y sus mensajes en el RAG, que no tienen clave foránea.

## Variables de entorno (`chatbot/.env`)

El chatbot usa su **propio** archivo (`chatbot/.env`, plantilla en `chatbot/.env.template`); `docker-compose.yml` fija además `DATABASE_URL`, `REDIS_URL` y los tamaños de chunk.

| Variable | Por defecto | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | — (obligatoria) | Clave de OpenAI |
| `DATABASE_URL` | — (obligatoria) | `postgresql+asyncpg://…` |
| `EMBEDDING_MODEL` / `EMBEDDING_DIM` | `text-embedding-3-small` / `1536` | Modelo y dimensión de sus vectores |
| `CHAT_MODEL` | `gpt-4o-mini` | Modelo que redacta la respuesta |
| `CHAT_MODEL_LISTS` | `gpt-4o` | Modelo para preguntas de conteo o de listas exhaustivas (vacío = usar siempre `CHAT_MODEL`) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `900` / `150` | Troceado |
| `TOP_K` / `MIN_SIMILARITY` | `8` / `0.40` | Fragmentos recuperados y umbral |
| `MAX_UPLOAD_MB` / `MAX_CHUNKS_PER_DOCUMENT` | `25` / `5000` | Límites de ingesta |
| `OPENAI_TIMEOUT_SECONDS` / `OPENAI_INGEST_TIMEOUT_SECONDS` | `18` / `60` | Tiempos de consulta e ingesta |
| `REDIS_URL` / `ANSWER_CACHE_TTL_SECONDS` | — / `3600` | Caché de respuestas (opcional) |

### Cambiar el modelo de embeddings
Los vectores de modelos distintos no son comparables. Para cambiar `EMBEDDING_MODEL`: si la dimensión cambia, actualizar `EMBEDDING_DIM` y recrear `chunks.embedding` (el servicio no arranca mientras no coincidan); en cualquier caso, **volver a cargar los documentos**. Al arrancar se avisa de los documentos procesados con otro modelo.

## Docker

`chatbot.Dockerfile` (`python:3.11-slim`) arranca `uvicorn` **sin** `--reload`. En desarrollo, `docker-compose.yml` monta `./chatbot` y sobrescribe el comando con `--reload`. Las dependencias están fijadas en `chatbot/requirements.txt` (la fuente de verdad de las versiones).

## Limitaciones conocidas

- Sin OCR: los PDF escaneados se rechazan.
- `gpt-4o-mini` omite a veces los últimos elementos de una lista aunque estén en el contexto; por eso las preguntas de conteo y de listas usan `CHAT_MODEL_LISTS`. La detección es por palabras (`_EXHAUSTIVE_QUESTION` en `chat_service.py`): una pregunta de lista formulada de otra forma («¿qué faltas existen?») irá al modelo económico.
- Procedimientos con varios plazos en una misma celda de tabla (p. ej. reposición/apelación del Art. 73 del manual de prueba) los puede interpretar mal el modelo económico, aunque el texto se haya extraído bien.
- Las tablas complejas (celdas combinadas en vertical) pueden quedar parcialmente fragmentadas.
- El RAG no autentica: debe quedar accesible solo desde Django.
- Notificaciones: el modelo `Agente` dispara `AGENTE_CREADO`/`AGENTE_DESACTIVADO`/`AGENTE_ELIMINADO` (ver `backend/notificaciones/README.md`).


## Vista previa del documento citado

Los PDF se guardan completos en `documents.file_data` (BYTEA, columna diferida: los listados no la cargan). En el chat, el frontend convierte cada cita `(archivo.pdf, p. N)` de una respuesta en un enlace (`MensajeConCitas`) que abre el PDF en un visor (`VistaPreviaDocumento`) en la página citada.

- Django: `GET /api/chatbot/documentos/archivo/?agente=<id>&nombre=<archivo>` (cualquier usuario autenticado). Resuelve la sede del propio usuario y pide el archivo a `GET /api/v1/documents/file` del RAG, de modo que no se puede acceder a documentos de otra sede.
- El chat público (sin sesión) muestra las citas como texto, sin enlace.
- Los documentos cargados antes de existir esta columna no tienen original (la vista previa avisa). Subir de nuevo el mismo archivo lo reprocesa y lo guarda; también se reprocesa si el tipo del agente cambió desde que se cargó.

### Citas según el tipo de agente

- **Investigativo:** el modelo cita cada afirmación con `(archivo.pdf, p. N)` (regla 4 del prompt).
- **Normativo:** el código añade al final de la respuesta **una sola cita** de la fuente principal, el documento y la página del fragmento mejor puntuado (`Profile.cite_main_source`). Se hace en código y no en el prompt porque el modelo pequeño no cumplía el formato de forma fiable. No se añade a la respuesta de «sin información». Solo lleva página si el documento es un PDF cargado con las páginas guardadas; los anteriores se recargan subiendo de nuevo el archivo.
