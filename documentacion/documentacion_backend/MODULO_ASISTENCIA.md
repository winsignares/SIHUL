# Módulo de asistencia con ubicación (backend)

App `asistencia`, independiente del resto. Esta primera entrega es solo backend; la pantalla del estudiante y del responsable queda para un paso posterior.

## Modelos
- `LugarPractica`: nombre, coordenadas, radio permitido y precisión máxima aceptada.
- `AsignacionPractica`: estudiante, lugar, responsable, fechas y horario en que se puede registrar la ubicación.
- `ConsentimientoUbicacion`: autorización del usuario (se puede revocar).
- `RegistroAsistencia`: entrada, salida o posición, con distancia al lugar y si estaba dentro del radio.

Los lugares y las asignaciones se cargan desde el panel de administración de Django.

## API (`/api/asistencia/`)
| Ruta | Método | Qué hace |
|---|---|---|
| `consentimiento/` | GET, POST `{otorgar}` | Consulta, otorga o revoca el consentimiento. |
| `mis-practicas/` | GET | Prácticas activas del estudiante. |
| `registrar/` | POST | Entrada, salida o posición. |
| `practicas/<id>/registros/` | GET | Registros; los ve el estudiante, su responsable y el administrador general. |

## Reglas (`asistencia/servicios/registro.py`)
- Sin consentimiento vigente no se guarda nada.
- La ubicación solo se acepta dentro de las fechas y el horario de la práctica; fuera de ellos se rechaza sin guardarla.
- Se rechaza la lectura cuya precisión supere la máxima del lugar.
- La entrada y la salida deben estar dentro del radio; la posición y la salida exigen una entrada previa del día.
- Si una posición pasa de dentro a fuera del radio, se crea una notificación al responsable (una sola por salida).
- `python manage.py purgar_asistencia --dias 90` borra los registros más antiguos que el plazo.

## Límite de la versión web
El navegador solo entrega la ubicación mientras la página está abierta. Para seguimiento con la pantalla apagada hace falta una aplicación instalada; la API ya sirve para ambos casos.

## Pendiente
Pantallas, texto legal del consentimiento y plazo de conservación definitivo (decisiones de la institución).
