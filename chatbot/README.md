## Backend del Chatbot

Servicio de chatbot con recuperación aumentada por generación (RAG) integrado al stack de SIHUL. Permite realizar consultas en lenguaje natural sobre los documentos cargados en el sistema, separados por chatbot y por sede.

## Tecnologías

- **FastAPI:** API REST asíncrona
- **PostgreSQL + pgvector:** Almacenamiento de embeddings vectoriales
- **OpenAI:** Generación de embeddings y respuestas (GPT-4o-mini)
- **Redis (opcional):** Caché de respuestas
- **Docker:** Contenedor integrado al stack SIHUL

## Configuración

Copia `.env.template` a `.env` y completa `OPENAI_API_KEY`. El resto de variables y sus valores por defecto están descritos en la documentación técnica.

Documentación técnica (arquitectura, ingesta, consulta, variables de entorno, operación): [`documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md`](../documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md).
