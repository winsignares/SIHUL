# Informe de pruebas del sistema (13 de noviembre de 2026)

Resumen de lo que se probó antes de montar la nueva versión en el servidor: pruebas automáticas, recorridos por la API con sesiones reales, pantallas en el navegador con dos personas a la vez y una prueba de carga del tiempo real.

## Entorno
Todo en una máquina de desarrollo, con cuentas de prueba locales: PostgreSQL con pgvector, Redis real, el backend, el frontend de desarrollo y el navegador integrado. Dos sesiones al mismo tiempo desde orígenes distintos (`localhost` y `127.0.0.1`), para que no compartan cookies. No se tocó ningún dato de producción ni se consumió el servicio de IA.

## 1. Pruebas automáticas
| Qué | Resultado |
|---|---|
| Backend (`manage.py test`) | 574 pruebas, todas correctas |
| Migraciones (`makemigrations --check`) | Sin cambios pendientes |
| Frontend: `tsc`, `eslint`, `vite build` | Sin errores ni avisos |
| Integración continua de cada PR | Auditoría de dependencias, construcción de las tres imágenes y pruebas, todo en verde |

## 2. Recorridos por la API con el tiempo real activo
Sesiones reales por rol, una conexión SSE por persona, y comprobación de **quién se entera** de cada cambio.

**Sedes, espacios y horarios**
- Crear, editar y borrar una sede avisa a las personas de su seccional y al administrador general; no avisa a otra seccional.
- Un espacio nuevo aparece en la lista del docente sin recargar.
- Un horario que se traslapa en el mismo espacio y día se rechaza con un mensaje claro.

**Préstamos de espacios**
- El docente solicita un préstamo (queda Pendiente) y quien administra se entera al instante.
- Un préstamo que choca con uno existente se rechaza.
- Un supervisor solo gestiona los espacios que tiene asignados.
- Al aprobarse, el docente lo ve aprobado sin recargar.

**Notificaciones:** solo las recibe su dueño, ni siquiera el administrador.

**Financiero (factura de principio a fin)**
- Registrada, radicada, alistada, aprobada por auditoría, enviada a dirección, cargada, enviada a rectoría, autorizada, con número de confirmación y control de pago: en cada paso, los roles que corresponden se enteran al instante y **otro proveedor u otro funcionario no**.
- Los documentos que se adjuntan cuentan como cambio de su factura.
- Un rechazo exige un motivo de al menos 10 caracteres y avisa al funcionario y al proveedor.
- Si falta algún soporte obligatorio, la radicación se rechaza.
- Registrar el pago aplicado exige el comprobante y la carpeta compartida de la institución; sin ella el sistema lo rechaza en vez de perder el archivo (ver «No cubierto»).

Resultado: 35 comprobaciones del tiempo real, 63 del recorrido de la factura y 17 de espacios, horarios y préstamos; todas correctas.

## 3. Navegador, con dos personas a la vez
- Planeación (una sesión) con «Préstamos de Espacios» abierto y un docente (otra sesión) que solicita un préstamo: la lista de planeación pasó de 0 a 1 solicitud sin recargar.
- Planeación aprueba desde la interfaz y la pantalla del docente cambió de Pendiente a Aprobado sin recargar.
- **Pantallas de edición:** con el formulario de asignar una asignatura abierto, un cambio de otra persona mostró el aviso «Otra persona cambió estos datos» sin recargar ni perder el formulario; al cerrarlo, los cambios se aplicaron solos y el aviso desapareció.
- Se recorrieron Panel de inicio, Centro institucional, Centro de horarios, Estado de recursos, Periodos, Ocupación, Reportes, Asignación de espacios, Notificaciones y Asistentes virtuales (administración), y Panel del docente y Préstamos del docente: todas cargan con datos y sin errores en la consola.
- El navegador mantiene la conexión `/api/eventos/` abierta a través del servidor de desarrollo.

## 4. Prueba de carga del tiempo real
Un solo proceso `gunicorn` con 400 hilos: 300 conexiones SSE simultáneas, sin errores; un evento llegó a las 300 en menos de 0,6 s; unos 400 MB de memoria; 4 conexiones a PostgreSQL y 1 suscripción a Redis. La primera versión de esta prueba mostró que cada conexión abierta retenía una conexión a PostgreSQL; se corrigió antes de integrar (la conexión a la base se cierra antes de transmitir y cada proceso comparte una única suscripción a Redis).

## No cubierto en este entorno
- **Carpeta compartida (NAS):** guardar comprobantes y documentos en ella no existe localmente.
- **Servicio de IA (RAG):** no se hizo ninguna pregunta al chatbot para no consumir la llave del proveedor; se verificó la interfaz, los permisos y las pruebas automáticas.
- **Inicio de sesión con Microsoft** y **la carga programada de Oracle**: requieren servicios externos.
- **Comparación pantalla a pantalla con la versión anterior:** las pantallas reestructuradas se recorrieron y funcionan, pero no se comparó cada una con la versión previa.
- **Producción:** el proceso de eventos con nginx real y con las personas reales; ver `despliegue/TIEMPO_REAL_Y_COLA.md` para la verificación en el servidor.
