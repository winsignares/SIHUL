# Eventos en tiempo real

Cuando alguien crea, edita o borra algo, las demás personas que tienen abierta una pantalla con esos datos los ven actualizados sin recargar.

## Cómo funciona

1. Al guardar o borrar un registro de un recurso registrado, el backend publica un evento pequeño en un canal de Redis, **cuando la transacción termina**: `{recurso, accion, id}`.
2. `GET /api/eventos/` mantiene abierta una conexión SSE (Server-Sent Events) por navegador, con la cookie de sesión, y le entrega los eventos que le corresponden.
3. El frontend, al recibir un evento de un recurso que muestra, **vuelve a pedir los datos por la API normal**. El evento nunca lleva datos: los permisos y la seccional los aplica la API como siempre.

```
Guardar registro ─► señal Django ─► Redis (canal sihul:eventos) ─► /api/eventos/ (SSE) ─► navegador ─► recarga por la API
```

## Quién recibe cada evento (`nucleo/eventos/audiencia.py`)
- Evento **personal** (por ejemplo una notificación): solo su dueño.
- Evento de una **seccional**: el administrador general y las personas de esa seccional.
- Evento **sin seccional** (catálogos globales como los roles): todas las personas con sesión.

- Evento con **destinatarios** (módulo financiero): quienes figuran en `usuarios`, quienes tienen alguno de los `roles` y los administradores.

El navegador solo recibe `recurso`, `accion` e `id`; la seccional y los destinatarios no salen del servidor.

### Módulo financiero (`financiero/eventos.py`)
Quién recibe cada evento replica quién ve esos datos en la API:
- **Factura** (`facturas`): quien la creó, su responsable, el proveedor dueño, quienes intervinieron en ella (historial) y los roles que revisan todas las facturas (contabilidad, tesorería, auditoría, dirección financiera, rectoría y administración financiera). Mientras está recién recibida y sin responsable, también los funcionarios. Un documento, comentario, rechazo, ítem o movimiento del historial que cambia se publica como una actualización de su factura.
- **Proveedores**: el propio proveedor y los roles internos. **Catálogos y parámetros**: quienes tienen un rol financiero.
Para otro recurso con destinatarios propios se llama a `registrar_recurso(app, modelo, recurso, audiencia=..., referencia=...)`.

## Recursos publicados
La lista está en `nucleo/eventos/registro.py` (sedes, seccionales, facultades, programas, asignaturas, grupos, periodos, horarios, espacios, recursos, préstamos, usuarios, roles, componentes, notificaciones y agentes de chatbot). Para publicar otro modelo se agrega una línea a `RECURSOS`; si su seccional no se alcanza por las rutas de `RUTAS_SECCIONAL`, se agrega la ruta. El módulo financiero se registra desde `financiero/eventos.py` con `registrar_recurso`, que admite reglas propias de destinatarios (ver más abajo).

## Frontend
- `core/eventosTiempoReal.ts`: una sola conexión para toda la aplicación, con reconexión y espera creciente.
- `hooks/useActualizacionEnVivo.ts`: `useActualizacionEnVivo(['sedes'], recargar)` llama a `recargar` cuando cambia alguno de esos recursos, y también al reconectar o al volver a ver la pestaña (por si se perdió algún evento). Agrupa eventos seguidos en una sola recarga.
- `hooks/useCacheEnVivo.ts` (montado en `AppLayout`): mantiene la conexión abierta con la sesión y vacía la caché local cuando algo cambia, para que una pantalla que se abra después pida datos frescos.
- `hooks/useActualizacionProtegida.ts` y `components/common/AvisoCambios.tsx`: para las pantallas de edición. Si la persona no tiene cambios sin guardar, los datos se vuelven a leer solos; si los tiene (un modal de edición abierto, un valor modificado, una asignación a medias), no se toca lo que escribe y aparece el aviso «Otra persona cambió estos datos» con el botón Actualizar. Al guardar o cancelar, los cambios pendientes se aplican solos.
- Pantallas con actualización en vivo: todas las que muestran datos del sistema, entre ellas sedes, espacios, préstamos, horarios, gestión académica, usuarios y roles, panel de inicio, notificaciones, reportes, chatbots (agentes, preguntas, documentos e historial), financiero (facturas, detalle, catálogos, parámetros y proveedores) y los permisos y el menú de cada persona (se sincronizan al instante con los eventos de roles y componentes).
- Se actualizan con aviso (no solas) las pantallas de edición: crear horarios, centro de horarios, asignación de espacios, configuración financiera y parametrización SLA.
- Quedan fuera, a propósito: el chat en curso (conversación abierta), el diálogo de revisión de recursos al cerrar un espacio y la página pública de préstamos, que no tiene sesión.

## Capacidad medida
Prueba local con **un solo proceso** `gunicorn` (clase `gthread`, 400 hilos): 300 conexiones SSE abiertas a la vez, sin errores; un evento llegó a las 300 en menos de 0,6 s; el proceso usó unos 400 MB y PostgreSQL tuvo 4 conexiones en total. Las claves del diseño:
- Una conexión abierta **no retiene una conexión a la base de datos**: se cierra antes de transmitir y la decisión de qué eventos recibe cada persona se calcula una sola vez al conectar.
- Cada proceso hace **una sola suscripción a Redis** y reparte los eventos a sus conexiones, así que Redis no crece con el número de personas.
- Cada conexión ocupa un hilo. Para N personas conectadas a la vez hacen falta N hilos entre todos los procesos (por ejemplo, 2 procesos de 400 hilos para unas 800 pestañas abiertas) y unos 1,3 MB por conexión.
- Si todas las pestañas se reconectan a la vez (por ejemplo, al reiniciar el servicio), el pico de consultas de sesión puede superar el límite de conexiones de PostgreSQL: conviene un agrupador de conexiones (PgBouncer) o que el reinicio del servicio de eventos se haga fuera de horas de uso.

## Garantías y límites
- No hay entrega garantizada: si la conexión se cae, al reconectar el frontend recarga.
- Sin Redis el endpoint responde 503 y todo sigue funcionando como antes, sin actualización en vivo.
- Cada conexión ocupa un hilo mientras está abierta y se cierra sola a los 30 minutos (el navegador se reconecta y se vuelve a comprobar la sesión).

## Despliegue
`/api/eventos/` debe servirse desde **un proceso aparte** del que atiende la API normal, para que las conexiones largas no ocupen los hilos de las peticiones cortas. Es el mismo código con otra orden de arranque, por ejemplo:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:8002 --workers 1 --worker-class gthread --threads 200 --timeout 0
```

y el proxy inverso envía `/api/eventos/` a ese proceso con el almacenamiento temporal de la respuesta desactivado (la respuesta ya incluye la cabecera `X-Accel-Buffering: no`). En desarrollo no hace falta: el servidor de desarrollo atiende varias conexiones a la vez.

Variables: `REDIS_URL` (la misma de la caché) o `EVENTOS_REDIS_URL` si se quiere otro Redis.
