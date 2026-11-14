# Pendientes de SIHUL

Lo que queda **fuera** del trabajo actual de reestructuración, tiempo real, limpieza y pruebas. Son tres frentes que se dejan para después: asistencia, Oracle y chatbot. Todo lo demás se hace antes de montar el sistema en el servidor.

## 1. Asistencia con ubicación

**Hecho:** backend completo (`backend/asistencia/`): lugares de práctica, asignaciones, consentimiento, entrada, salida y posición, aviso al responsable y comando de purga. Ver [MODULO_ASISTENCIA.md](../documentacion_backend/MODULO_ASISTENCIA.md).

**Pendiente (previsto para el próximo año):**
- Pantalla del estudiante: consentimiento, mis prácticas, botones de entrada y salida y envío de la posición mientras la página está abierta.
- Pantalla del responsable: prácticas a su cargo, registros y avisos de salida del lugar.
- Pantalla de administración para crear lugares y asignaciones (hoy se hace desde el panel de Django).
- Texto legal del consentimiento (Ley 1581 de 2012) y plazo definitivo de conservación de datos (hoy 90 días en el comando de purga).
- Seguimiento con la pantalla apagada: exige una aplicación instalada; la API ya sirve para ese caso.
- Publicar sus eventos en tiempo real cuando existan las pantallas (`nucleo/eventos/registro.py`).

## 2. Oracle

Estrategia completa en [INVENTARIO_VISTAS_Y_ESTRATEGIA.md](../documentacion_oracle/INVENTARIO_VISTAS_Y_ESTRATEGIA.md). Es el último paso de la hoja de ruta.

**Pendiente:**
1. Comando de solo lectura que lista las columnas reales de las vistas (sin datos personales). Lo corre una persona de la institución donde Oracle sea accesible.
2. Interfaz de la fuente académica con dos adaptadores (local y Oracle) detrás de un interruptor.
3. Lectura bajo demanda de docentes y estudiantes; después horarios, grupos y espacios.
4. Retiro de la carga programada y de las tablas `Stg*`.

**Preguntas para la institución:**
- ¿Existe una vista de matrículas (estudiante–grupo)? Hoy no se conoce.
- ¿Hay índices por identificación en las vistas de docentes y estudiantes?
- ¿Cuenta de solo lectura para producción y para pruebas?
- ¿Cada cuánto cambian los horarios en la fuente?
- ¿Dónde se guarda el documento de identidad? `Usuario` no tiene ese campo.

## 3. Chatbot

Evaluación por capas y plan en [CAPAS_Y_AMPLIACION.md](../documentacion_chatbot/CAPAS_Y_AMPLIACION.md). El chatbot actual (RAG sobre documentos) se deja como está.

**Pendiente, en este orden:**
1. Observabilidad: identificador por pregunta, latencia, tokens, tasa de «sin información» y valoración.
2. Guardrails: errores genéricos al cliente, detección de manipulación, revisión de salida, tope diario y pruebas con preguntas hostiles.
3. Router de intención y modelo alterno ante fallos.
4. Registro de herramientas y la primera de solo lectura.
5. Resto de herramientas de lectura, un recurso por PR.
6. Escrituras con confirmación del usuario.
7. Caché semántica y reordenamiento de resultados.

**Decisiones tuyas:** qué recursos van primero, si solo consulta o también ejecuta acciones, qué roles lo usan, qué datos del usuario se envían al proveedor de IA y qué tope mensual de gasto en IA.

La sincronización con el RAG sigue ejecutándose en línea al confirmar la transacción; moverla a la cola de tareas se decide junto con este frente.

## 4. Infraestructura que se decide después

- Archivos subidos compartidos entre réplicas: depende del almacenamiento disponible en el servidor.
- Agrupador de conexiones a la base (PgBouncer) cuando haya varias réplicas.
