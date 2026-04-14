ESPECIFICACIÓN DETALLADA DE
REQUERIMIENTOS
🔷RF01 – Registro de solicitud de cuentas por pagar
🎯Descripción
Permitir la recepción formal de facturas y documentos soporte para iniciar el proceso de cuentas por pagar. En esta primera fase, el registro inicial lo realiza el funcionario que recibe la documentación del proveedor.

👤Actores
• Funcionario

📥Entradas
• Número de factura
• Fecha de factura
• Proveedor
• Valor total
• Área solicitante
• Tipo de documento
• Archivos adjuntos
• Observaciones iniciales

⚙️Procesamiento
• Validar campos obligatorios
• Validar formato y tamaño de archivos
• Verificar duplicidad de factura por número y proveedor
• Registrar fecha de recepción
• Asociar proveedor existente o crearlo
• Generar identificador interno del trámite

📤Salidas
• Registro creado
• Estado: Recibida
• ID del trámite
• Notificación interna a contabilidad

❗Reglas de negocio
• No se permite factura duplicada
• Debe existir al menos un documento soporte
• El proveedor debe existir o crearse
• Solo usuarios autorizados del rol Funcionario pueden registrar

🔷RF02 – Consulta operativa del funcionario
🎯Descripción
Permitir al funcionario consultar las facturas recibidas y visualizar el estado del trámite para hacer seguimiento inicial. En la reunión se indicó que el funcionario debe ver ID, proveedor, monto, estado y fecha, y poder aislar/registrar una nueva factura según lo enviado por el proveedor.

👤Actor
• Funcionario

📥Entradas
• Filtros por ID
• Filtros por proveedor
• Filtros por estado
• Filtros por fecha
• Filtros por valor

⚙️Procesamiento
• Consultar trámites asociados
• Mostrar estados del proceso
• Mostrar resumen de cada factura
• Permitir acceso a documentos cargados

📤Salidas
• Listado de facturas
• Visualización de detalle
• Acceso a histórico del trámite

❗Reglas de negocio
• El funcionario solo puede editar mientras la factura no haya avanzado a etapas restringidas
• La consulta debe ser rápida y filtrable

🔷RF03 – Radicación automática
🎯Descripción
Formalizar la entrada del documento al sistema institucional.

👤Actor
• Contabilidad / Oficina de radicación

📥Entradas
• Solicitud previamente registrada
• Documentos soporte

⚙️Procesamiento
• Generar número único de radicado
• Registrar fecha y hora
• Cambiar estado
• Registrar usuario responsable
• Validar integridad documental

📤Salidas
• Número de radicado
• Estado: Radicada

❗Reglas de negocio
• El radicado debe ser único por vigencia
• No se puede radicar sin documentos completos
• No se puede radicar una solicitud anulada o duplicada

🔷RF04 – Causación en contabilidad
🎯Descripción
Registrar el reconocimiento contable de la obligación.

👤Actor
• Contabilidad

📥Entradas
• Factura radicada
• Documentos soporte
• Cuenta contable
• Fecha de causación
• Observaciones

⚙️Procesamiento
• Validar requisitos contables
• Registrar cuenta contable
• Registrar fecha de causación
• Permitir aprobar o devolver

📤Salidas
Estados posibles:
• Causada
• Devuelta a origen

❗Reglas de negocio
• Solo facturas radicadas pueden causarse
• Si se devuelve, debe existir observación obligatoria
• La devolución debe quedar trazada

🔷RF05 – Alistamiento en Tesorería
🎯Descripción
Preparar el pago verificando requisitos.

👤Actor
• Tesorería

📥Entradas
• Factura causada
• Soportes contables
• Datos para egreso
• Información presupuestal

⚙️Procesamiento
• Validar requisitos de pago
• Validar disponibilidad presupuestal
• Generar comprobante de egreso
• Generar planilla
• Marcar lista para auditoría

📤Salidas
• Comprobante de egreso
• Estado: Alistada

❗Reglas de negocio
• No se puede alistar sin causación previa
• Debe existir disponibilidad presupuestal
• Debe quedar el comprobante asociado al trámite

🔷RF06 – Control previo (Auditoría)
🎯Descripción
Revisión de control interno antes del pago.

👤Actor
• Auditoría

📥Entradas
• Factura alistada
• Comprobante
• Documentos soporte
• Observaciones de etapas previas

⚙️Procesamiento
• Revisar documentos
• Validar cumplimiento
• Aprobar o rechazar
• Registrar hallazgos

📤Salidas
Estados:
• Aprobada auditoría
• Rechazada auditoría

❗Reglas de negocio
• Rechazo requiere observación obligatoria
• Si se rechaza, retorna a Tesorería
• Todo hallazgo debe quedar en trazabilidad

🔷RF07 – Cargue en Sindicatura
🎯Descripción
Registro formal para autorización superior.

👤Actor
• Sindicatura

📥Entradas
• Factura aprobada por auditoría
• Soportes del proceso

⚙️Procesamiento
• Validar aprobación previa
• Registrar cargue
• Preparar para presidencia

📤Salidas
• Estado: Cargada

❗Reglas de negocio
• No se puede cargar sin aprobación de auditoría
• El cargue debe conservar evidencia documental

🔷RF08 – Aprobación final (Presidencia/Rectoría)
🎯Descripción
Autorización institucional del pago.

👤Actor
• Presidencia / Rectoría

📥Entradas
• Factura cargada
• Resumen del trámite
• Soportes y observaciones

⚙️Procesamiento
• Revisar información
• Aprobar o rechazar
• Registrar firma o validación final

📤Salidas
Estados:
• Autorizada para pago
• Rechazada presidencia

❗Reglas de negocio
• Rechazo debe registrar motivo
• Solo usuarios autorizados pueden aprobar
• Debe existir aprobación previa de auditoría y sindicatura

🔷RF09 – Ejecución del pago
🎯Descripción
Registrar el pago efectivo al proveedor.

👤Actor
• Tesorería

📥Entradas
• Factura autorizada
• Medio de pago
• Número de transacción
• Fecha de pago
• Soporte de pago

⚙️Procesamiento
• Registrar medio de pago
• Registrar número de transacción
• Registrar fecha de pago
• Cerrar proceso

📤Salidas
• Estado: Pagada

❗Reglas de negocio
• No se puede pagar sin autorización final
• Debe registrarse soporte de pago
• El cierre debe quedar con trazabilidad completa

🔷RF10 – Gestión de cuentas de excepción
🎯Descripción
Manejar facturas fuera del cronograma o con tratamiento especial.

⚙️Procesamiento
• Detectar fecha posterior al cierre
• Marcar como excepción
• Reprogramar vigencia
• Registrar justificación

📤Salidas
• Estado: Excepción

❗Reglas de negocio
• Toda excepción debe quedar justificada
• La excepción no elimina la trazabilidad del flujo normal

🔷RF11 – Seguimiento de tiempos
🎯Descripción
Control del SLA de 17 días hábiles.

⚙️Funcionalidades
• Cálculo automático por etapa
• Semáforo de cumplimiento
• Alertas de vencimiento
• Dashboard de tiempos

❗Reglas
• Debe usar días hábiles
• Debe excluir festivos, idealmente parametrizables
• Debe calcular tiempo total y tiempo por dependencia

🔷RF12 – Trazabilidad completa
🎯Descripción
Registro histórico de todas las acciones del trámite.

Debe almacenar
• Usuario
• Rol
• Acción
• Fecha/hora
• Estado anterior
• Estado nuevo
• Observaciones
• Dependencia responsable

❗Reglas
• Ninguna transición crítica puede ejecutarse sin quedar registrada
• Debe consultarse antes de capacitación y pruebas, porque el evaluador indicó que conoce la trazabilidad y que la revisión interna debe hacerse primero.

🔷RF13 – Gestión documental
🎯Descripción
Administrar todos los soportes del proceso de cuentas por pagar.

Funcionalidades
• Subida múltiple de archivos
• Validación de tipos
• Versionamiento
• Descarga
• Visualización
• Asociación de documentos por etapa
• Carga y consulta de PDF y soportes anexos

❗Reglas
• Documentos obligatorios por etapa
• Tamaño máximo configurable
• Los documentos deben permanecer accesibles mientras su política de retención esté vigente

🔷RF14 – Conservación documental e histórico
🎯Descripción
Permitir definir el tiempo de almacenamiento del histórico de facturas y documentos, así como reglas de eliminación automática o manual de acuerdo con la fecha y la política institucional. En la reunión se preguntó expresamente por cuánto tiempo se guarda el histórico, se indicó que existe almacenamiento inicial de 200 GB ampliable y que los tiempos deben definirse con gestión documental y la normativa aplicable.

👤Actores
• Administrador
• Gestión documental
• Director financiero

⚙️Funcionalidades
• Definir tiempo de retención por tipo documental
• Configurar conservación mínima
• Programar eliminación por fecha
• Mantener histórico consultable
• Parametrizar reglas futuras una vez entre en producción

❗Reglas
• No se deben eliminar documentos antes del tiempo mínimo legal o institucional
• La eliminación debe quedar auditada
• Los tiempos deben ser configurables

🔷RF15 – Notificaciones
🎯Descripción
Enviar alertas automáticas del sistema a los usuarios del proceso.

Eventos que disparan alertas
• Radicación
• Devoluciones
• Rechazos
• Próximo vencimiento
• Pago realizado
• Pruebas programadas
• Activación de usuario

Canales
• Correo electrónico
• Notificación interna

❗Reglas
• Debe poder configurarse por evento y rol
• Debe registrarse si la notificación fue generada

🔷RF16 – Reportes y vista ejecutiva
🎯Descripción
Generar reportes operativos y ejecutivos del proceso. El requerimiento original ya contemplaba reportes y además en la demo se mencionó explícitamente el rol Director financiero con una vista ejecutiva.

👤Actor
• Director financiero
• Administrador
• Usuarios autorizados

Reportes mínimos
• Cuentas por pagar pendientes
• Pagadas por periodo
• Tiempos por dependencia
• Facturas en riesgo
• Cumplimiento del SLA
• Facturas por estado
• Reporte de excepciones
• Histórico documental
• Reporte de productividad por rol

❗Reglas
• La vista ejecutiva no debe alterar el flujo
• Debe permitir filtros por fecha, estado, dependencia y proveedor

🔷RF17 – Gestión de usuarios
🎯Descripción
Permitir la creación y administración de usuarios del sistema. En la reunión se mencionó la necesidad de “ir creando el usuario” y posteriormente la sensibilización con proveedores.

👤Actor
• Administrador

📥Entradas
• Nombre
• Correo institucional o externo
• Dependencia
• Estado del usuario
• Roles asignados

⚙️Procesamiento
• Crear usuario
• Editar usuario
• Activar/Inactivar usuario
• Restablecer acceso
• Asignar rol o múltiples roles
• Crear usuarios para pruebas y para futura sensibilización de proveedores

📤Salidas
• Usuario creado
• Usuario actualizado
• Usuario activo/inactivo

❗Reglas de negocio
• No debe existir duplicidad de correo
• Todo usuario debe tener al menos un rol
• Debe permitirse creación de usuario antes de salida a producción

🔷RF18 – Gestión de correos del proceso
🎯Descripción
Permitir registrar y administrar correos asociados al flujo, ya que en la reunión se mencionó la creación del correo como parte previa a la socialización del sistema.

👤Actor
• Administrador

⚙️Funcionalidades
• Registrar correos por usuario
• Registrar correos genéricos por dependencia
• Configurar destinatarios de notificaciones
• Validar correos activos

❗Reglas
• No se deben enviar notificaciones a correos inactivos
• Debe permitirse actualización de correo sin perder histórico

🔷RF19 – Interfaz por rol
🎯Descripción
Mostrar una interfaz llamativa, clara y entendible para cada uno de los usuarios que intervienen en el proceso. Esto fue pedido expresamente por el evaluador, junto con la intención de reducir papel y facilitar adopción.

👤Actores
• Funcionario
• Contabilidad
• Tesorería
• Auditoría
• Sindicatura
• Presidencia / Rectoría
• Director financiero
• Administrador
• Proveedor en fase 2

⚙️Funcionalidades
• Dashboard personalizado por rol
• Menú según permisos
• Acciones visibles por etapa
• Flujo visual del trámite
• Estados fáciles de interpretar

❗Reglas
• La interfaz debe cambiar según el rol activo
• No deben mostrarse acciones sin permiso
• Debe favorecer la transición del proceso físico al digital

🔷RF20 – Ambiente de pruebas
🎯Descripción
Permitir una etapa de validación interna del sistema antes de capacitar o socializar con los usuarios finales. En la reunión se pidió incluir pruebas lo más pronto posible y revisar el funcionamiento antes de capacitar a la gente.

👤Actores
• Equipo de desarrollo
• Director del proceso
• Usuarios validadadores

⚙️Funcionalidades
• Ambiente de pruebas separado
• Datos de prueba
• Simulación de flujo completo
• Validación funcional por etapa
• Validación de trazabilidad y documentos

❗Reglas
• No se debe capacitar primero y probar después
• Debe existir revisión del flujo por quienes conocen la trazabilidad del proceso

🔷RF21 – Capacitación y socialización del sistema
🎯Descripción
Preparar el sistema para posterior capacitación de usuarios internos y, en una segunda fase, para sensibilización con proveedores. La reunión distingue claramente entre primero poner a usar la primera parte internamente y después trabajar la del proveedor.

👤Actores
• Administrador
• Director financiero
• Equipo funcional

⚙️Funcionalidades
• Preparar usuarios habilitados
• Preparar manual básico por rol
• Definir fecha de demostración
• Usar resultados de pruebas previas para la capacitación

❗Reglas
• La capacitación debe hacerse después de las pruebas
• Debe existir al menos una validación interna previa

🔷RF22 – Portal del proveedor (Fase 2)
🎯Descripción
Permitir que el proveedor cargue directamente sus facturas y soportes y haga seguimiento al trámite. En la reunión se indicó que esta es la segunda parte del proyecto, posterior a la puesta en uso de la primera parte para financiera.

👤Actor
• Proveedor

📥Entradas
• Número de factura
• Fecha
• Valor
• Archivos soporte
• Datos del proveedor

⚙️Procesamiento
• Registrar factura del proveedor
• Cargar soportes
• Enviar a revisión inicial
• Permitir consulta de estado

📤Salidas
• Registro enviado
• Confirmación de recepción
• Estado visible para proveedor

❗Reglas de negocio
• Este módulo corresponde a fase 2
• Su salida no reemplaza las validaciones internas del flujo financiero
• Debe integrarse con el flujo ya existente

🔷RF23 – Asignación múltiple de roles por usuario
🎯Descripción
Permitir que un mismo usuario tenga uno o varios roles dentro del sistema, cuando la operación institucional así lo requiera.

👤Actor
• Administrador

📥Entradas
• Usuario
• Lista de roles asignables

⚙️Procesamiento
• Asignar uno o varios roles a un usuario
• Permitir modificar roles
• Validar permisos según combinación de roles

📤Salidas
• Usuario con múltiples roles activos

❗Reglas de negocio
• Un usuario puede tener más de un rol
• Las acciones deben quedar registradas con el rol utilizado
• La interfaz debe responder al rol activo

🔷RF24 – Selección de rol activo
🎯Descripción
Permitir que un usuario con múltiples roles seleccione con cuál desea operar en el sistema.

👤Actor
• Usuario con múltiples roles

⚙️Procesamiento
• Mostrar lista de roles asignados
• Permitir selección de rol activo
• Cargar interfaz según rol
• Registrar el rol con el que se ejecuta cada acción

📤Salidas
• Interfaz personalizada según rol activo

❗Reglas de negocio
• Solo se puede operar con un rol activo a la vez
• Toda acción debe quedar trazada con el rol correspondiente

🔐REQUERIMIENTOS NO FUNCIONALES DETALLADOS

RNF01 – Seguridad
• Autenticación JWT o SSO
• Control RBAC por rol
• Soporte para múltiples roles por usuario
• Logs de auditoría
• Cifrado en tránsito (HTTPS)
• Protección contra duplicidad de facturas
• Gestión segura de sesiones

RNF02 – Rendimiento
• Respuesta < 3 segundos
• Soportar mínimo 200 usuarios concurrentes
• Procesamiento asíncrono de archivos pesados
• Carga rápida de listados y filtros

RNF03 – Disponibilidad
• Uptime ≥ 99%
• Backups diarios
• Recuperación ante fallos
• Tolerancia a crecimiento documental

RNF04 – Usabilidad
• UI por rol
• Workflow visual
• Búsqueda avanzada
• Filtros por estado y fechas
• Diseño llamativo y entendible por usuario, como pidió el evaluador

RNF05 – Escalabilidad
• Arquitectura modular o hexagonal
• Contenedores Docker
• API REST desacoplada
• Preparado para nube
• Escalable para fase 2 con proveedor

RNF06 – Gestión documental
• Almacenamiento inicial amplio y ampliable
• Políticas configurables de retención
• Eliminación automática por fecha configurable
• Conservación legal mínima obligatoria cuando aplique

RNF07 – Adopción organizacional
• El sistema debe facilitar el cambio de cultura del papel al flujo digital
• La salida a operación debe incluir pruebas previas antes de socialización general

RNF08 – Ambientes
• Debe existir al menos ambiente de desarrollo/pruebas y ambiente de producción
• La información de pruebas no debe contaminar producción

ÉPICA 1 — Gestión interna de Cuentas por Pagar (Fase 1)

🟢HU01 — Registrar solicitud de cuenta por pagar
Como funcionario
Quiero registrar una factura con sus documentos soporte
Para iniciar el proceso de cuentas por pagar

🎯Prioridad: Alta
📌Valor de negocio: Alto

✅Criterios de aceptación
Escenario 1: Registro exitoso
• Dado que el usuario está autenticado
• Cuando registra una factura con todos los campos obligatorios
• Entonces el sistema debe guardar la solicitud
• Y asignar estado “Recibida”

Escenario 2: Validación de campos
• Dado que falta un campo obligatorio
• Cuando se intenta guardar
• Entonces el sistema debe mostrar validación
• Y no permitir guardar

Escenario 3: Factura duplicada
• Dado que ya existe una factura con el mismo número y proveedor
• Cuando el usuario intenta registrarla
• Entonces el sistema debe bloquear el registro
• Y mostrar advertencia

🟢HU02 — Consultar facturas registradas
Como funcionario
Quiero consultar las facturas recibidas
Para hacer seguimiento del trámite inicial

🎯Prioridad: Alta

✅Criterios de aceptación
• Mostrar ID
• Mostrar proveedor
• Mostrar monto
• Mostrar estado
• Mostrar fecha
• Permitir filtros por estado y fecha

🟢HU03 — Radicar factura
Como usuario de contabilidad
Quiero radicar formalmente la factura
Para iniciar el flujo institucional

🎯Prioridad: Alta

✅Criterios de aceptación
Escenario 1: Radicación correcta
• Dado una factura en estado “Recibida”
• Cuando el usuario la radica
• Entonces el sistema debe generar número único
• Y cambiar estado a “Radicada”

Escenario 2: Intento sin documentos
• Dado que la factura no tiene documentos completos
• Cuando se intenta radicar
• Entonces el sistema debe impedir la acción

🟢HU04 — Causar factura
Como contador
Quiero registrar la causación contable
Para reconocer la obligación financiera

🎯Prioridad: Alta

✅Criterios de aceptación
Escenario 1: Causación aprobada
• Dado una factura radicada
• Cuando el contador aprueba la causación
• Entonces el estado debe cambiar a “Causada”

Escenario 2: Devolución
• Dado una factura radicada
• Cuando el contador la devuelve
• Entonces el sistema debe exigir observación
• Y cambiar estado a “Devuelta”

🟡HU05 — Alistar pago
Como tesorero
Quiero preparar el comprobante de egreso
Para dejar lista la factura para auditoría

🎯Prioridad: Alta

✅Criterios de aceptación
Escenario 1: Alistamiento exitoso
• Dado una factura causada
• Cuando tesorería completa el alistamiento
• Entonces el sistema debe generar comprobante
• Y cambiar estado a “Alistada”

Escenario 2: Sin causación
• Dado una factura no causada
• Cuando se intenta alistar
• Entonces el sistema debe bloquear la acción

🟡HU06 — Realizar control previo
Como auditor
Quiero revisar los documentos
Para garantizar el control interno

🎯Prioridad: Alta

✅Criterios de aceptación
Escenario 1: Auditoría aprobada
• Dado una factura alistada
• Cuando el auditor aprueba
• Entonces el estado debe ser “Aprobada auditoría”

Escenario 2: Auditoría rechazada
• Dado una factura alistada
• Cuando el auditor rechaza
• Entonces debe registrar observación obligatoria
• Y el estado debe ser “Rechazada auditoría”

🟡HU07 — Cargar en sindicatura
Como funcionario de sindicatura
Quiero registrar el cargue del pago
Para enviarlo a aprobación final

🎯Prioridad: Media

✅Criterios de aceptación
• Dado una factura aprobada por auditoría
• Cuando sindicatura realiza el cargue
• Entonces el estado debe cambiar a “Cargada”

🟡HU08 — Aprobar pago
Como presidencia / rectoría
Quiero autorizar el pago
Para permitir su ejecución

🎯Prioridad: Alta

✅Criterios de aceptación
Escenario 1: Aprobación
• Dado una factura cargada
• Cuando la autoridad aprueba
• Entonces el estado debe ser “Autorizada para pago”

Escenario 2: Rechazo
• Dado una factura cargada
• Cuando se rechaza
• Entonces debe registrar motivo obligatorio

🟢HU09 — Registrar pago
Como tesorero
Quiero registrar el pago realizado
Para cerrar el proceso

🎯Prioridad: Alta

✅Criterios de aceptación
• Dado una factura autorizada
• Cuando se registra el pago
• Entonces el estado debe cambiar a “Pagada”
• Y guardar soporte de pago

🟡HU10 — Monitorear tiempos del proceso
Como director financiero
Quiero ver el cumplimiento de los tiempos
Para controlar el SLA de 17 días

🎯Prioridad: Alta

✅Criterios de aceptación
• Mostrar días por etapa
• Mostrar semáforo
• Alertar vencimientos
• Calcular días hábiles

🟡HU11 — Consultar trazabilidad
Como usuario autorizado
Quiero ver el historial completo
Para auditar el proceso

✅Criterios
• Mostrar línea de tiempo
• Mostrar usuario responsable
• Mostrar fechas
• Mostrar observaciones

🟢HU12 — Gestionar documentos
Como usuario
Quiero adjuntar y consultar soportes
Para mantener evidencia del proceso

✅Criterios
• Subida múltiple
• Validación de formato
• Descarga
• Versionamiento
• Visualización

🟡HU13 — Recibir notificaciones
Como usuario del proceso
Quiero recibir alertas automáticas
Para actuar oportunamente

✅Criterios
• Notificar cambios de estado
• Notificar rechazos
• Notificar vencimientos
• Notificar pago realizado

🟡HU14 — Administrar usuarios
Como administrador
Quiero crear y gestionar usuarios
Para controlar el acceso al sistema

✅Criterios
• Crear usuario
• Editar usuario
• Activar/Inactivar
• Asignar roles
• Validar correo único

🟡HU15 — Configurar conservación documental
Como administrador / gestión documental
Quiero definir tiempos de retención y eliminación
Para controlar el histórico de facturas y soportes

✅Criterios
• Configurar meses o años de conservación
• Programar eliminación por fecha
• Auditar eliminación
• Respetar tiempos mínimos definidos

🟡HU16 — Probar el flujo completo antes de capacitar
Como equipo funcional
Quiero validar el sistema internamente
Para revisar su funcionamiento antes de socializarlo

✅Criterios
• Debe existir ambiente de prueba
• Debe probarse la trazabilidad completa
• Deben revisarse roles, estados y documentos
• La capacitación ocurre después de validar

ÉPICA 2 — Portal del Proveedor (Fase 2)

🟡HU17 — Cargar factura como proveedor
Como proveedor
Quiero cargar mi factura y soportes
Para iniciar mi trámite sin depender del papel

🎯Prioridad: Media

✅Criterios de aceptación
• Permitir cargar factura
• Permitir adjuntar documentos
• Confirmar recepción
• Mostrar estado inicial

🟡HU18 — Consultar estado del trámite como proveedor
Como proveedor
Quiero ver el estado de mi factura
Para hacer seguimiento

✅Criterios
• Ver ID
• Ver estado
• Ver fecha de registro
• Ver observaciones si fue devuelta

🟡HU19 — Operar con varios roles
Como usuario con múltiples roles
Quiero escoger con cuál rol ingresar
Para ejecutar acciones según mi responsabilidad

✅Criterios
• Mostrar roles asignados
• Permitir seleccionar rol activo
• Cargar interfaz según rol
• Registrar cada acción con el rol usado
