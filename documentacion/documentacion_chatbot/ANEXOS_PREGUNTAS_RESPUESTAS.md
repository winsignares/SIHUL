# Preguntas-respuestas con anexos (documentos de soporte)

Permite registrar, para cada chatbot (investigación, admisiones, biblioteca…) y seccional, **preguntas con su respuesta oficial y uno o varios anexos** (Word, PDF o Excel). Cuando un usuario hace esa pregunta, aunque la formule distinto, el chatbot responde con la explicación y **adjunta los anexos como enlaces de descarga**.

> Ejemplo: «¿Cómo hago para cancelar una matrícula?» → explicación del trámite + `Formato_cancelacion_matricula.docx` e `Instructivo_cancelacion_matricula.pdf` para descargar.

Es opcional y compatible con lo existente: una pregunta sin anexos, o un chatbot sin preguntas-respuestas registradas, se comporta exactamente como antes (documentos RAG, citas al PDF, caché).

## Uso

**Gestión** (`/admin/chatbots`, pestaña **Preguntas y respuestas**; requiere poder gestionar chatbots):

- Tabla de dos columnas **Pregunta | Respuesta**; los anexos aparecen dentro de la columna de respuesta («Anexo / soporte») y se pueden descargar.
- «Nueva pregunta» / editar: chatbot, pregunta, respuesta, anexos (selección múltiple) y estado activo. Al editar se pueden quitar anexos existentes y agregar nuevos.
- Una pregunta **inactiva** deja de usarse en el chat y sus enlaces del chat dejan de funcionar; desde la gestión sigue descargable.

**Chat** (autenticado y público): debajo del texto de la respuesta aparece «Documentos de soporte» con un botón por anexo (icono según tipo, nombre, tamaño). El historial conserva los anexos de cada respuesta y genera enlaces nuevos al abrirlo.

## Formatos y límites

| Formato | Extensión | Tipo MIME | Comprobación del contenido |
|---|---|---|---|
| Word | `.doc` | `application/msword` | Firma OLE2 (`D0 CF 11 E0 A1 B1 1A E1`) |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | ZIP con carpeta `word/` |
| PDF | `.pdf` | `application/pdf` | Empieza por `%PDF-` |
| Excel | `.xls` | `application/vnd.ms-excel` | Firma OLE2 |
| Excel | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | ZIP con carpeta `xl/` |

Se valida la **extensión y el contenido real** (no el tipo que declara el navegador): un `.exe` renombrado a `.pdf` o un Excel renombrado a `.docx` se rechazan. Máximo **15 MB** por archivo y **5 anexos** por respuesta; pregunta hasta 1000 caracteres y respuesta hasta 5000. Si un archivo es inválido no se guarda nada.

## Modelo de datos (Django, migración `chatbot/0014_preguntas_respuestas_anexos`)

| Tabla | Campos | Notas |
|---|---|---|
| `chatbot_preguntarespuesta` | `agente` (FK, CASCADE), `sede`, `pregunta`, `respuesta`, `activo`, `creado`, `actualizado` | Índice `(agente, sede, activo)` |
| `chatbot_anexorespuesta` | `pregunta_respuesta` (FK, CASCADE), `archivo`, `nombre`, `tipo_mime`, `tamano`, `creado` | El archivo se guarda en `MEDIA_ROOT/chatbot/anexos/AAAA/MM/<uuid>.<ext>`: el nombre original solo se usa al descargar |
| `chatbot_conversacion_anexos` | M2M `Conversacion.anexos` | Qué anexos acompañaron cada respuesta del historial |

La migración solo **crea** tablas; no altera las existentes. Al borrar un anexo (o su pregunta, o el agente) la señal `post_delete` borra el archivo del disco al confirmar la transacción.

En el servicio RAG se añade la tabla `qa_embeddings` (la crea FastAPI al arrancar, como `documents`/`chunks`): embedding de cada pregunta registrada, con un hash del modelo y del texto para recalcularlo solo cuando cambia.

## API

### Gestión (Django, `PuedeGestionarChatbots`, sesión)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/chatbot/admin/preguntas-respuestas/?agente=&sede=` | Lista de la seccional (propia; admin global/sistema puede indicar otra) |
| `POST` | `/api/chatbot/admin/preguntas-respuestas/` | Crear (multipart: `agente`, `pregunta`, `respuesta`, `activo`, `anexos`×N, `sede` opcional) |
| `GET` | `/api/chatbot/admin/preguntas-respuestas/<id>/` | Detalle |
| `PATCH` | `/api/chatbot/admin/preguntas-respuestas/<id>/` | Editar (multipart; `anexos` agrega, `anexos_eliminar` = ids a quitar) |
| `DELETE` | `/api/chatbot/admin/preguntas-respuestas/<id>/` | Eliminar con sus anexos |

Quien gestiona una seccional no ve ni modifica las de otra (404/403).

### Chat (respuesta JSON)

`POST /api/chatbot/pregunta/`, `POST /api/chatbot/public/pregunta/` y `GET /api/chatbot/historial/` (mensajes del bot) incluyen:

```json
"anexos": [
  {
    "id": 12,
    "nombre": "Formato_cancelacion_matricula.docx",
    "url": "http://…/api/chatbot/anexos/12/descargar/?token=…",
    "tipo": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "extension": "docx",
    "tamano": 13322
  }
]
```

Siempre está presente (lista vacía si no hay anexos o si el RAG falló). Django **no confía** en los ids que indica el RAG: vuelve a consultarlos y solo entrega anexos del mismo agente y seccional, de preguntas activas.

### Descarga segura

`GET /api/chatbot/anexos/<id>/descargar/?token=<firmado>`

- El token lo firma Django (`django.core.signing`, `SECRET_KEY`, sal propia) para **ese** anexo y caduca a los 7 días (`CHATBOT_ANEXO_URL_MAX_AGE`). Sin token, con un token alterado, vencido o de otro anexo: **403**.
- No exige sesión, porque el chat público también entrega anexos y un enlace `<a href>` no envía cabeceras: la autorización es el token, que solo emite el sistema al responder.
- Los enlaces del chat dejan de servir (**404**) si la pregunta o el agente se desactivan; los de la gestión no.
- Respuesta: el archivo real con `Content-Disposition: attachment; filename="<nombre original>"`, su tipo MIME, `X-Content-Type-Options: nosniff` y `Cache-Control: private, no-store`. La ruta en disco nunca se expone (tampoco en el admin de Django).
- Con `DJANGO_DEBUG=True` el proyecto sirve todo `MEDIA_ROOT` en `/media/` (comportamiento previo, `mysite/urls.py`). Los anexos quedan fuera de alcance por esa vía porque su nombre en disco es un UUID aleatorio que no se publica; en producción (`DEBUG=False`) esa ruta no sirve archivos.

### RAG (FastAPI, interno)

- `POST /api/v1/chat/ask` → la respuesta incluye `anexos: [{id, pregunta_respuesta_id, nombre, tipo_mime, tamano}]`.
- `POST /api/v1/qa/sync?chatbot_id=&sede=` → recalcula los embeddings de las preguntas e invalida la caché de respuestas. Django lo llama al confirmar cada alta, edición o borrado; si falla, el RAG se pone al día solo en la siguiente pregunta.

## Cómo decide el chatbot qué anexos entregar (`chatbot/app/services/qa_service.py`)

1. **Búsqueda.** Se compara la pregunta del usuario (y, en un seguimiento, la combinada con la anterior) con las preguntas registradas del chatbot y seccional. Las que superan `QA_MIN_SIMILARITY` (0,45) entran **primero** al contexto del LLM como «Pregunta frecuente oficial, prioridad máxima», antes que los fragmentos de los documentos.
2. **Candidatas.** Las que superan `QA_ANEXO_MIN_SIMILARITY` (0,55), máximo 3.
3. **Elección.** Si la pregunta es casi idéntica (`QA_ANEXO_AUTO_SIMILARITY`, 0,92) se elige directamente. Si no, un **verificador** (llamada breve a `CHAT_MODEL`, temperatura 0, 3 tokens, 8 s máx.) decide si el usuario pide lo mismo que alguna registrada. Si el verificador falla, no se adjunta nada.
4. **Respuesta.** Solo la pareja elegida lleva sus anexos al contexto (por nombre), de modo que el LLM pueda remitir a ellos («descarga el formato en los documentos de soporte»), y se devuelven sus anexos. Su respuesta oficial es la fuente: no se añade la cita automática del PDF del perfil normativo. Si la respuesta final es «sin información», no se entregan anexos.

**Por qué hay verificador.** La similitud sola no distingue intención. Medido con `text-embedding-3-small` (ver `pruebas_anexos/calibrar_umbral.py`):

| Caso | Similitud |
|---|---|
| Misma intención, otra redacción | 0,67 – 0,96 |
| Mismo tema, otra pregunta («¿Cómo pago la matrícula?» frente a cancelarla) | 0,48 – 0,75 |
| Otro tema | 0,21 – 0,28 |

Los rangos se solapan: con un solo umbral, quien pregunta cómo **pagar** recibiría el formato de **cancelación**. Con el verificador, las 16 decisiones de la calibración (incluidos seguimientos como «¿y qué formato tengo que llenar?») son correctas.

**Caché.** La clave de la caché de respuestas incluye una firma de las preguntas-respuestas del chatbot y seccional (cantidad y última modificación): cualquier cambio invalida las respuestas anteriores. Sin preguntas registradas la clave es la misma de antes.

## Configuración

| Variable | Dónde | Por defecto |
|---|---|---|
| `CHATBOT_ANEXO_MAX_MB` | Django (entorno) | `15` |
| `CHATBOT_ANEXO_MAX_POR_RESPUESTA` | Django (entorno) | `5` |
| `CHATBOT_ANEXO_URL_MAX_AGE` | Django (entorno), segundos | `604800` (7 días) |
| `QA_MIN_SIMILARITY` / `QA_ANEXO_MIN_SIMILARITY` / `QA_ANEXO_AUTO_SIMILARITY` / `QA_TOP_K` | RAG (`chatbot/.env`) | `0.45` / `0.55` / `0.92` / `3` |

Los límites del frontend (`ANEXO_MAX_MB`, `ANEXO_MAX_POR_RESPUESTA` en `chatbotAdmin.model.ts`) son solo una ayuda: la validación que cuenta es la de Django. Si se cambian en el servidor, conviene actualizarlos también.

Los archivos van a `MEDIA_ROOT` (volumen del backend): debe incluirse en las copias de seguridad.

## Archivos

| Capa | Archivo | Qué hace |
|---|---|---|
| Django | `backend/chatbot/models.py` | `PreguntaRespuesta`, `AnexoRespuesta`, `Conversacion.anexos` |
| | `backend/chatbot/migrations/0014_preguntas_respuestas_anexos.py` | Migración |
| | `backend/chatbot/anexos.py` | Validación de archivos, tokens y URL de descarga, JSON, aviso al RAG |
| | `backend/chatbot/preguntas_respuestas_views.py` | CRUD de gestión y descarga |
| | `backend/chatbot/views.py` | Anexos en el chat autenticado, público e historial |
| | `backend/chatbot/signals.py` | Borrado del archivo al borrar el anexo |
| | `backend/chatbot/admin.py` | Admin de Django (solo lectura de anexos) |
| | `backend/chatbot/tests.py` | Pruebas unitarias (27) |
| RAG | `chatbot/app/services/qa_service.py` | Búsqueda, candidatas, verificador, contexto |
| | `chatbot/app/services/chat_service.py` | Integración en `ask` (contexto, caché, cita) |
| | `chatbot/app/routers/qa.py`, `routers/chat.py`, `schemas/schemas.py`, `models/models.py`, `core/config.py`, `main.py` | Endpoint de sincronización, `anexos` en la respuesta, tabla `qa_embeddings`, umbrales |
| Frontend | `components/chatbot/PreguntasRespuestasTab.tsx`, `hooks/chatbot/useGestionPreguntasRespuestas.ts` | Pestaña de gestión |
| | `components/chatbot/AnexosRespuesta.tsx` | Botones de descarga en el chat |
| | `pages/chatbot/AsistentesVirtuales.tsx`, `hooks/chatbot/useAsistentesVirtuales.ts` | Anexos en los mensajes del chat |
| | `services/chatbot/*.ts`, `models/chatbot/*.ts`, `core/apiClient.ts` | Tipos y llamadas (`patchFormData`) |

## Pruebas

Ver `pruebas_anexos/` (scripts) y `pruebas_anexos/evidencias/` (resultados y capturas).

| Prueba | Cómo | Resultado |
|---|---|---|
| Unitarias Django | `docker exec sihul-backend python manage.py test chatbot` | 27/27 |
| Suite completa Django | `docker exec sihul-backend python manage.py test` | 42 pruebas; los 3 errores son previos y ajenos (dos scripts sueltos `test_*.py` de la raíz del backend que no importan, y una prueba de préstamos que depende de que exista un periodo activo en la fecha actual) |
| Extremo a extremo (stack real, OpenAI real) | `e2e_anexos.py` | 62/62: carga y descarga byte a byte de los 5 formatos, rechazos, permisos, chat autenticado y público, seguimiento, mismo tema con otra intención sin anexos, historial, otra seccional, token alterado, edición, desactivación, borrado y limpieza del disco |
| Calibración de la decisión | `calibrar_umbral.py` (en el contenedor del RAG) | 16/16 decisiones correctas |
| Regresión de otros módulos | `regresion_modulos.py` | 39/39: login/logout, horarios, espacios, préstamos, notificaciones, periodos, reportes (incl. PDF), usuarios, roles, chatbot |
| Interfaz | `capturas_ui.py` (Playwright + Edge) | Capturas del chat con anexos, pregunta sin anexo, tabla y diálogo de gestión; descarga por clic idéntica al original |
| TypeScript / ESLint | `tsc -p tsconfig.app.json`, `eslint` | Sin errores en archivos nuevos o modificados (los 57 de `tsc` son previos, en otros archivos) |

## Limitaciones conocidas

- La decisión depende de un LLM: en un caso límite podría no adjuntar el anexo (respuesta igualmente correcta, sin soporte) o, más raramente, adjuntarlo a una pregunta parecida. La respuesta oficial sigue en el contexto del LLM en ambos casos.
- El verificador añade una llamada breve (fracción de segundo) solo cuando hay candidatas no idénticas.
- Un enlace de descarga copiado funciona para quien lo tenga hasta que caduque (7 días) o se desactive la pregunta; así funciona también el chat público. Para invalidarlos todos de inmediato basta con desactivar la pregunta.
