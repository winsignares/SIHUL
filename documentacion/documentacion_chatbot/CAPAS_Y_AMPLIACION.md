# Chatbot: las ocho capas y cómo ampliarlo al resto del sistema

Este documento compara el chatbot actual con las ocho capas de un asistente de IA completo y propone cómo ampliarlo a los demás recursos de SIHUL (horarios, espacios, préstamos, facturas, asistencia). No cambia código: es la base para decidir y planear.

Descripción del servicio actual: [ARQUITECTURA_RAG_CHATBOT.md](ARQUITECTURA_RAG_CHATBOT.md).

## 1. Resumen

| # | Capa | Estado | Dónde está |
|---|---|---|---|
| 1 | Prompt | Cumple | `chatbot/app/core/profiles.py` |
| 2 | RAG | Cumple (es lo más sólido) | `chatbot/app/services/chat_service.py`, `qa_service.py`, `reglas_recuperacion.py` |
| 3 | Herramientas | **No existe** | — |
| 4 | Accesos | Cumple en lo básico | `backend/chatbot/`, `chatbot/app/core/token.py`, `routers/directo.py` |
| 5 | Guardrails | Parcial | prompt, límites de uso |
| 6 | Caché | Cumple | `chatbot/app/core/cache.py`, `reglas_recuperacion.py` |
| 7 | Router | Parcial (solo elige modelo) | `reglas_recuperacion.py::_model_for` |
| 8 | Observabilidad | Parcial (solo guarda conversaciones) | tabla `chat_messages` |

Hoy el chatbot responde **solo con documentos cargados** (reglamentos, manuales, tesis). No puede consultar datos vivos del sistema, como "¿qué espacios están libres mañana?". Para eso falta la capa 3.

## 2. Capa por capa

### 1. Prompt: cumple
- Cada agente tiene un tipo (`normativo`, `investigativo`) que fija el prompt de sistema y el mensaje de "sin información".
- El administrador añade `instrucciones_adicionales` (hasta 2000 caracteres) sin poder anular las reglas base.
- El prompt forma parte de la clave de caché (`variant`): al cambiarlo no se sirven respuestas viejas.

**Brechas:** solo hay dos perfiles; los prompts viven en el código (no hay versiones ni historial de cambios); no hay pruebas que detecten que un cambio de prompt empeora las respuestas.

### 2. RAG: cumple
- Búsqueda por similitud con índice HNSW (pgvector), más búsqueda por palabras clave y fragmentos vecinos de la misma sección.
- Prioridad entre documentos, límite de documentos por agente y sede, citas con página.
- Preguntas-respuestas oficiales con anexos, validadas por un verificador.
- El servicio no arranca si la dimensión de los embeddings no coincide con el modelo.

**Brechas:** solo recupera documentos subidos; no hay reescritura de la pregunta ni reordenamiento de resultados (*rerank*).

### 3. Herramientas: no existe
El modelo no puede llamar funciones: recibe contexto y devuelve texto. Esta es la capa que hace falta para ampliar el chatbot al resto de recursos (sección 3).

### 4. Accesos: cumple en lo básico
- Cada agente se limita a las seccionales donde está disponible; los responsables solo gestionan sus agentes.
- Acceso directo desde el navegador con token firmado que entrega el backend e indica usuario y seccional.
- Chat público con desafío de verificación, sesión limitada y topes por sesión e IP.
- Permisos de gestión por componente.

**Brechas:** el RAG filtra por agente y seccional, no por rol ni por documento; cuando haya herramientas, el acceso debe decidirse por los permisos del usuario que pregunta (sección 3).

### 5. Guardrails: parcial
Existe: el prompt obliga a responder solo con el contexto y a no revelar instrucciones; hay mensaje fijo de "sin información", longitud máxima de pregunta y límites de preguntas por usuario, sesión e IP.

**Faltan:**
- Detección de intentos de manipular al modelo ("ignora tus instrucciones") en la pregunta y en el texto de los documentos.
- Revisión de la respuesta antes de entregarla (datos personales, contenido fuera de tema).
- Tope de gasto diario por usuario autenticado.
- Un error interno hoy puede devolver su mensaje técnico al cliente; debe responder un texto genérico y guardar el detalle en el registro.
- Pruebas automáticas con preguntas hostiles.

### 6. Caché: cumple
- Respuestas por chatbot, seccional, pregunta normalizada y variante del prompt; caducan solas y se borran al cambiar documentos.
- No se cachean respuestas "sin información" ni conversaciones con historial.

**Brechas:** no hay caché semántica (preguntas parecidas con otras palabras), ni se mide la tasa de aciertos.

### 7. Router: parcial
Hoy solo elige el modelo: las preguntas de lista o conteo usan uno más potente. No decide *qué hacer* con la pregunta. Con herramientas hará falta clasificar la intención: documento, dato del sistema, saludo o fuera de alcance. Tampoco hay modelo alterno si el proveedor falla.

### 8. Observabilidad: parcial
Se guarda cada pregunta y respuesta con su puntaje de relevancia, y hay registros de errores.

**Faltan:**
- Latencia por etapa (búsqueda, modelo).
- Tokens y costo por pregunta, usuario y agente.
- Tasa de "sin información" (indica qué documentos faltan).
- Valoración del usuario (me sirvió o no).
- Una identificación por pregunta para seguirla de punta a punta (navegador, backend, servicio, proveedor).

## 3. Cómo ampliarlo a los demás recursos

"Ampliar" puede significar dos cosas distintas:

| Meta | Qué hace falta |
|---|---|
| **Más conocimiento** (nuevos agentes y documentos para otras áreas) | Nada nuevo: ya se crean agentes y se cargan documentos desde la administración. |
| **Datos vivos del sistema** (horarios, espacios, préstamos, facturas) | Herramientas (capa 3), con router y guardrails. |

### Principio: el modelo nunca toca la base de datos
El modelo solo pide una herramienta por nombre y con parámetros. El backend la ejecuta **con la sesión del usuario que pregunta**, así que aplican los mismos permisos y la misma seccional que en la API normal. Lo que el usuario no puede ver en pantalla, el chatbot tampoco se lo cuenta.

```
Pregunta ─► Router ─┬─► RAG (documentos)
                    ├─► Herramienta de solo lectura ─► API del backend (permisos del usuario)
                    └─► Fuera de alcance / saludo
          Guardrails de entrada y de salida, caché y observabilidad en todo el recorrido
```

### Registro de herramientas
Cada herramienta se declara con: nombre, descripción para el modelo, esquema de parámetros, permiso requerido y si es de lectura o escritura. Se apoya en la capa HTTP que ya existe en `api/` de cada app.

| Recurso | Herramientas de solo lectura | Escritura (con confirmación del usuario) |
|---|---|---|
| Espacios | espacios disponibles por fecha y hora; estado de un espacio | — |
| Horarios | mi horario; horarios de un docente o grupo | — |
| Préstamos | mis préstamos y su estado; reglas de préstamo | solicitar un préstamo |
| Facturas (financiero) | estado de mi factura; qué falta para pagarla | — |
| Asistencia | mi práctica y mis registros | registrar entrada o salida (solo desde el celular con ubicación) |
| Notificaciones | mis notificaciones pendientes | marcar como leídas |

### Reglas para las herramientas
- Primero solo lectura. Las acciones que cambian datos piden una confirmación explícita ("¿Confirmas que quieres solicitar el salón X?") antes de ejecutarse.
- El modelo redacta la respuesta con los datos devueltos y no inventa lo que la herramienta no entregó; si devuelve vacío, lo dice.
- Mínimos datos personales hacia el proveedor de IA: se envía solo lo necesario para responder (Ley 1581 de 2012).
- Cada llamada a una herramienta queda registrada: quién, cuál, con qué parámetros y qué resultado.

## 4. Plan sugerido

Un PR por paso, en este orden, porque cada capa protege a la siguiente:

1. **Observabilidad:** identificador por pregunta, latencia, tokens, tasa de "sin información" y valoración del usuario.
2. **Guardrails:** errores genéricos hacia el cliente, detección de manipulación, revisión de salida, tope diario y pruebas con preguntas hostiles.
3. **Router de intención:** documento, dato del sistema o fuera de alcance, y modelo alterno ante fallos.
4. **Registro de herramientas** y la primera de solo lectura (espacios disponibles u horarios).
5. **Resto de herramientas de lectura**, un recurso por PR.
6. **Escrituras con confirmación**, empezando por préstamos.
7. **Mejoras de RAG:** caché semántica y reordenamiento de resultados.

## 5. Decisiones pendientes

- ¿Qué recursos se consultan primero? Propongo espacios disponibles y mi horario: son lectura simple y los usan todos.
- ¿El chatbot podrá ejecutar acciones (por ejemplo, solicitar un préstamo) o solo consultar?
- ¿Qué roles lo usan con herramientas: estudiantes, docentes, funcionarios?
- ¿Se acepta enviar al proveedor de IA datos del usuario como nombre o programa, o solo los datos de la consulta?
- ¿Presupuesto o tope mensual de gasto en IA?
