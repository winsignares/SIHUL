# Acceso directo del navegador al chatbot

Con el acceso directo, la pregunta de un usuario con sesión iniciada viaja del navegador al servicio del chatbot (FastAPI) sin pasar por Django. Django solo entrega un token firmado de pocos minutos y firma los enlaces de los anexos. Mientras el servicio espera a la IA, ningún proceso de Django queda ocupado.

Es **opcional y está apagado por defecto**: sin `CHATBOT_TOKEN_SECRET` todo sigue como antes (el frontend pregunta a Django). Activarlo o desactivarlo es solo configuración del servidor.

## Flujo

1. El frontend pide `POST /api/chatbot/token/` (con la sesión del usuario). Django responde `{token, expira_en, url}`; el token dura `CHATBOT_TOKEN_VIGENCIA` segundos (600 por defecto).
2. El frontend envía `POST {url}/preguntas` con `Authorization: Bearer <token>` y `{agente_id, pregunta, pregunta_sugerida_id?, chat_id?}`.
3. El servicio verifica el token y toma de él quién pregunta, su nombre y su seccional. Nada de eso se acepta del cuerpo de la petición.
4. Comprueba que el chatbot esté activo y disponible en la seccional del usuario, cuenta el uso de la pregunta sugerida, responde con el RAG, guarda la conversación en `chatbot_conversacion` (el mismo historial que lee Django) y devuelve la respuesta.
5. Si la respuesta trae anexos, el frontend pide sus enlaces firmados a `POST /api/chatbot/anexos/enlaces/` (Django los firma con su clave y solo entrega los de la seccional del usuario).

Si el token venció (401), el frontend pide uno nuevo y reintenta una vez. Si el acceso directo no está disponible (503, ruta sin publicar o sin red hacia el servicio), vuelve a la ruta de Django y no insiste durante diez minutos.

## Token

JWT HS256 firmado con `CHATBOT_TOKEN_SECRET`, la misma clave en backend y chatbot. Lleva `sub` (id del usuario), `nombre`, `sede` (seccional con la que se le responde), `aud` (`CHATBOT_TOKEN_AUDIENCE`, `sihul-chatbot`), `iat` y `exp`. El servicio solo acepta HS256, comprueba la firma, la audiencia y la vigencia, y exige que la seccional sea una de las que conoce.

El formato lo implementan `backend/chatbot/acceso_directo.py` (emite) y `chatbot/app/core/token.py` (verifica). Las pruebas de los dos comparten un token de referencia: un cambio de formato en uno rompe la prueba del otro.

## Límites

- Por usuario: `DIRECTO_PREGUNTAS_POR_MINUTO` (10 por defecto), contado en Redis si hay `REDIS_URL` y, si no, en memoria del proceso. Pasado el límite responde 429 con `Retry-After`.
- Tamaño: `DIRECTO_PREGUNTA_MAX_CARACTERES` (2000 por defecto, responde 413) y 16 KB de cuerpo en nginx.
- Por IP en nginx: zona `sihul_chat_directo`, generosa a propósito porque detrás del equipo de la Universidad muchos usuarios comparten IP.

## Qué se publica

nginx publica **una sola ruta** del servicio: `/chatbot-api/v1/directo/preguntas` (coincidencia exacta, ver `despliegue/nginx/sihul.conf`). El resto del servicio (documentos, preguntas-respuestas, historial interno) sigue siendo de uso interno y no se expone.

## Activarlo

En el servidor, desde `/opt/sihul-repo`:

1. Generar la clave sin escribirla en el repositorio: `openssl rand -hex 32`, y agregarla a `despliegue/env/prod.env` como `CHATBOT_TOKEN_SECRET=...` (el archivo es 600 y se respalda).
2. Actualizar nginx con `despliegue/nginx/sihul.conf` (incluye la zona de límite y la ruta) y recargarlo.
3. Recrear `backend` y `chatbot` para que lean la variable.
4. Comprobar: con una sesión iniciada, una pregunta en el chat debe responder y aparecer en el historial; en la consola del navegador se ve la llamada a `/chatbot-api/v1/directo/preguntas`.

## Desactivarlo

Vaciar `CHATBOT_TOKEN_SECRET` y recrear `backend` y `chatbot`. El frontend recibe 503 al pedir el token y vuelve a la ruta de Django; no hace falta tocar nginx.

## Qué sigue pasando por Django

El historial, la lista de chatbots, las preguntas sugeridas, la gestión de documentos y de preguntas-respuestas, la descarga de anexos y el chat público (con su desafío y sesión propios). Solo la pregunta con sesión iniciada va directo.
