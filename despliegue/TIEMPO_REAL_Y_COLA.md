# Tiempo real y cola de tareas: puesta en marcha

Qué cambia en el servidor con el tiempo real (eventos SSE), la cola de tareas y la nueva estructura del backend. Los comandos los ejecuta una persona con acceso al servidor; ninguno borra datos.

## Qué se agrega
| Pieza | Qué es |
|---|---|
| Servicio `eventos` | Mismo código y misma imagen del backend, en un proceso aparte con muchos hilos. Atiende solo `/api/eventos/`. Está en `docker-compose.yml` y `deploy.sh` ya lo levanta y vigila. |
| Ruta de nginx `/api/eventos/` | Envía esa ruta al servicio `eventos` (puerto 8002 en producción, 8102 en pruebas), sin buffer y con conexiones largas. |
| Servicio `trabajador` (opcional) | Ejecuta la cola de tareas. Solo si el entorno define `TAREAS_COLA=rq`. |
| `config.wsgi:application` | El módulo de arranque del backend ya no es `mysite.wsgi`. El compose y los ejemplos de entorno ya usan el nuevo. |

Sin el servicio `eventos` (o sin Redis) todo funciona igual, sin actualización en vivo.

## Pasos, en este orden
1. **Respaldo.** El flujo normal (`deploy-ci.sh` o `deploy.sh`) ya exige y hace uno antes de desplegar.
2. **nginx del servidor.** Copiar el bloque `location = /api/eventos/ { ... }` de `despliegue/nginx/sihul.conf` a la configuración activa, **antes** del bloque `location /api/`. Comprobar y recargar:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. **Variables del entorno** (`despliegue/env/prod.env`, que no se versiona):
   - Si existe una línea `DJANGO_WSGI=mysite.wsgi:application`, borrarla o cambiarla por `DJANGO_WSGI=config.wsgi:application`.
   - Agregar, si se quiere cambiar algo de lo por defecto, las `EVENTOS_*` de `prod.env.example` (por defecto: 1 proceso, 400 hilos, 768 MB).
   - Cola de tareas (opcional): `TAREAS_COLA=rq`. Si se omite, las tareas siguen en un hilo como hasta ahora.
4. **Desplegar** con el flujo normal. `deploy.sh` ahora levanta `backend`, `eventos`, `chatbot` y `frontend` (y `trabajador` con `TAREAS_COLA=rq`), y espera a que todos estén sanos; si alguno no lo está, vuelve a la versión anterior. La migración de las tablas de asistencia corre sola en el job `release`.
5. **Verificar.**
   ```bash
   curl -s http://127.0.0.1:8002/health/
   ```
   Debe responder `{"status": "ok"}`. Después, con dos personas distintas (o dos navegadores): una crea una sede y la otra, con la lista de sedes abierta, la ve aparecer sin recargar.
   Con una sesión iniciada, la cabecera de la ruta pública debe verse así:
   ```bash
   curl -sI --cookie "sessionid=<sesión>" https://<dominio>/api/eventos/ | head -n 8
   ```
   (`content-type: text/event-stream`; la conexión queda abierta, se corta con Ctrl+C).

## Si algo sale mal
- **Sin tiempo real, pero todo lo demás funciona:** revisar que nginx tenga el bloque de `/api/eventos/` antes de `/api/` y que `docker compose ps` muestre `eventos` sano. El resto del sistema no depende de este servicio.
- **Volver a la versión anterior:** `despliegue/scripts/rollback.sh`. Es seguro: el servicio `eventos` usa la misma imagen que el backend.
- **Muchas personas conectadas:** cada pestaña abierta usa un hilo. Con `EVENTOS_WORKERS=1` y `EVENTOS_THREADS=400` caben unas 400 pestañas a la vez (unos 400 MB). Para más, subir `EVENTOS_WORKERS` y `EVENTOS_MEM_LIMIT`. Ver `documentacion/documentacion_backend/EVENTOS_TIEMPO_REAL.md`, sección «Capacidad medida».
- **Límite de conexiones a PostgreSQL:** una conexión SSE abierta no retiene una conexión a la base, pero si todas las pestañas se reconectan a la vez (al reiniciar `eventos`) hay un pico de consultas de sesión. Reiniciar ese servicio fuera de horas de uso, o poner un agrupador de conexiones.

## Después de que todos los entornos usen `config.wsgi`
Se puede borrar la carpeta `backend/mysite/` (solo contiene un `wsgi.py` y un `asgi.py` de compatibilidad).
