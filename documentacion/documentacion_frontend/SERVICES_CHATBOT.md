# Services: Chatbot (`frontend/src/services/chatbot/chatbotAPI.ts`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md).

`chatbotAPI` expone:

- `listarAgentes()`: combina en paralelo `/chatbot/agentes/` + `/chatbot/preguntas/` y agrupa las preguntas sugeridas por agente.
- `enviarPregunta(data)`: POST `/chatbot/pregunta/`, guarda historial — requiere `id_usuario` + `nombre_usuario` obligatorios.
- `obtenerHistorial(params)`: GET `/chatbot/historial/`.
- `listarConversaciones(params)`: GET `/chatbot/conversaciones/`.
- Variantes públicas (sin historial persistido por usuario): `listarAgentesPublico()` (GET `/chatbot/public/agentes/`) y `enviarPreguntaPublico(data)` (POST `/chatbot/public/pregunta/`, requiere `seccional`).

## Cómo llega al proxy Django → FastAPI

El frontend **no sabe ni le importa** que exista un servicio FastAPI detrás — solo llama a `/api/chatbot/...` vía `apiClient` (Django). Toda la lógica de decidir si reenviar la petición al servicio RAG externo (FastAPI) vive en el backend Django (app `chatbot`, ver [../documentacion_backend/APPS_DJANGO.md](../documentacion_backend/APPS_DJANGO.md) y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md)).

## Normalización en el frontend

`normalizarAgenteAPI` mapea alias de iconos (ej. `bookopen→BookOpen`, `door_open→DoorOpen`) y aplica un gradiente por defecto (`from-blue-500 via-blue-600 to-indigo-600`) si el backend no envía uno. Separa además las preguntas sugeridas "directas" (embebidas en el agente) de las que vienen de la tabla `PreguntaSugeridaAPI` aparte.
