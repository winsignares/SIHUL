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

El navegador solo recibe `recurso`, `accion` e `id`; la seccional y el destinatario no salen del servidor.

## Recursos publicados
La lista está en `nucleo/eventos/registro.py` (sedes, seccionales, facultades, programas, asignaturas, grupos, periodos, horarios, espacios, recursos, préstamos, usuarios, roles, componentes, notificaciones y agentes de chatbot). Para publicar otro modelo se agrega una línea a `RECURSOS`; si su seccional no se alcanza por las rutas de `RUTAS_SECCIONAL`, se agrega la ruta. El módulo financiero queda fuera de esta primera entrega: sus eventos necesitan reglas de audiencia por rol.

## Frontend
- `core/eventosTiempoReal.ts`: una sola conexión para toda la aplicación, con reconexión y espera creciente.
- `hooks/useActualizacionEnVivo.ts`: `useActualizacionEnVivo(['sedes'], recargar)` llama a `recargar` cuando cambia alguno de esos recursos, y también al reconectar o al volver a ver la pestaña (por si se perdió algún evento). Agrupa eventos seguidos en una sola recarga.
- `hooks/useCacheEnVivo.ts` (montado en `AppLayout`): mantiene la conexión abierta con la sesión y vacía la caché local cuando algo cambia, para que una pantalla que se abra después pida datos frescos.
- Pantallas con esta actualización: sedes y seccionales; espacios, estado de recursos, recursos, apertura y cierre, y consulta de espacios. El resto se agrega pantalla por pantalla con el mismo hook.

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
