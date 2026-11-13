# Tareas en segundo plano

`mysite/tareas.py` expone `encolar(funcion, *args)` para ejecutar trabajo fuera de la petición HTTP.

| Variable | Efecto |
|---|---|
| `TAREAS_COLA` vacía o `hilo` (por defecto) | La tarea corre en un hilo del mismo proceso, como hasta ahora. |
| `TAREAS_COLA=rq` | La tarea se encola en Redis (cola `sihul`) y la ejecuta el proceso `python manage.py trabajador_tareas`. |
| `TAREAS_REDIS_URL` | Redis de la cola; si no está, usa `REDIS_URL`. |

Si la cola no responde, `encolar` recurre al hilo para no perder la tarea.

## Requisitos de una tarea
- Función de módulo (importable por su ruta) con argumentos simples (ids, textos).
- Debe abrir y cerrar sus propias conexiones a la base de datos.

## Uso actual
- Sincronización de documentos con el NAS (`financiero/api/expediente_nas.py`).

## Desarrollo
El servicio `trabajador` del `docker-compose.yml` es opcional: `docker compose --profile cola up -d` y `TAREAS_COLA=rq` en el backend.
