## Backend del Chatbot

Servicio de chatbot con recuperación aumentada por generación (RAG) integrado al stack de SIHUL. Permite realizar consultas en lenguaje natural sobre los documentos cargados en el sistema, separados por chatbot y por sede.

## Tecnologías

- **FastAPI:** API REST asíncrona
- **PostgreSQL + pgvector:** Almacenamiento de embeddings vectoriales
- **OpenAI:** Generación de embeddings y respuestas (GPT-4o-mini)
- **Redis (opcional):** Caché de respuestas
- **Docker:** Contenedor integrado al stack SIHUL

## Configuración

En desarrollo, define `OPENAI_API_KEY` en el `.env` de la raíz del proyecto (plantilla: `.env.example`); `docker-compose.yml` solo se la entrega a este servicio. Las demás variables y sus valores por defecto están descritos en la documentación técnica.

Documentación técnica (arquitectura, ingesta, consulta, variables de entorno, operación): [`documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md`](../documentacion/documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md).
