ESPECIFICACIÓN DETALLADA DE REQUERIMIENTOS
Aplicativo de Manejo de Facturas - Financiera
🔷 Alcance general del sistema

🎯Descripción
Automatizar el proceso interno de cuentas por pagar de la dirección financiera, permitiendo registrar, radicar, causar, alistar, auditar, remitir a dirección financiera/sindicatura, autorizar en rectoría, aplicar pago y generar comprobante final, con trazabilidad, control de tiempos, alertas, histórico documental y paneles por rol.

📌 Alcance por fases
• Fase 1: flujo interno desde recepción por funcionario/Henry hasta autorización y pago
• Fase 2: portal del proveedor para cargue directo de factura y soportes

❗Aclaraciones funcionales obligatorias
• En fase 1 el proveedor no carga directamente en el sistema
• En fase 1 Henry/funcionario recibe por correo y monta los soportes
• El sistema debe ajustarse al procedimiento definido bajo sistema de gestión de calidad
• La fecha base del proceso es la fecha de recibido / recepción, no la fecha de emisión de la factura

🔷 USUARIOS / ROLES DEL SISTEMA

👤Roles funcionales
• Funcionario
• Contabilidad
• Tesorería
• Auditoría
• Dirección financiera / Sindicatura
• Rectoría
• Administrador
• Proveedor (fase 2)

❗Aclaraciones
• Sindicatura y dirección financiera se manejan como el mismo usuario funcional
• Rectoría reemplaza presidencia
• Administrador queda aparte como rol de permisos, usuarios y configuración del sistema

🔷RF01 – Recepción y registro inicial de factura

🎯Descripción
Permitir al funcionario registrar en el sistema la factura recibida por correo junto con sus soportes, iniciando el flujo interno.

👤Actor
• Funcionario

📥Entradas
• Número de factura
• Fecha de recepción / fecha de recibido
• Proveedor
• Valor total
• Usuario solicitante / área solicitante
• Tipo de documento
• Observaciones
• Archivos adjuntos

⚙️Procesamiento
• Validar campos obligatorios
• Validar formatos de archivo
• Validar que la factura no esté duplicada
• Registrar fecha de recepción institucional
• Asociar proveedor
• Cargar documentos soporte

📤Salidas
• Registro creado
• Estado: Recibida
• ID del trámite

❗Reglas de negocio
• La fecha visible en esta etapa debe ser fecha de recibido / recepción
• No debe llamarse “fecha de factura” en esta etapa
• Debe permitir registrar facturas cuya fecha de emisión sea anterior a la recepción
• No se permite guardar sin soportes mínimos

🔷RF02 – Consulta y seguimiento del funcionario

🎯Descripción
Permitir al funcionario ver las facturas registradas, su estado y las devoluciones u observaciones recibidas.

👤Actor
• Funcionario

📥Entradas
• Filtros por ID
• Proveedor
• Estado
• Fecha
• Valor

⚙️Procesamiento
• Mostrar listado de facturas
• Mostrar detalle del trámite
• Mostrar trazabilidad
• Mostrar observaciones y rechazos
• Mostrar documentos cargados

📤Salidas
• Bandeja de facturas
• Detalle completo
• Alertas de tareas pendientes

❗Reglas de negocio
• Si otra área devuelve o rechaza, el funcionario debe verlo claramente en panel/estado
• Debe indicarse qué acción debe realizar el funcionario para reactivar el flujo

🔷RF03 – Radicación de factura

🎯Descripción
Permitir a contabilidad formalizar la entrada del documento al sistema.

👤Actor
• Contabilidad

📥Entradas
• Factura en estado Recibida
• Soportes cargados

⚙️Procesamiento
• Generar número único de radicado
• Registrar fecha de radicación
• Registrar usuario responsable
• Validar completitud documental

📤Salidas
• Número de radicado
• Estado: Radicada

❗Reglas de negocio
• No se puede radicar sin documentos completos
• La fecha de recibido debe seguir visible en esta etapa
• Contabilidad debe ver cuándo fue recibida la factura por la universidad

🔷RF04 – Causación contable

🎯Descripción
Permitir a contabilidad realizar la causación contable y dejar trazada la fecha de causado.

👤Actor
• Contabilidad

📥Entradas
• Factura radicada
• Cuenta contable / clasificación
• Observaciones

⚙️Procesamiento
• Validar causación
• Registrar cuenta contable
• Registrar fecha de causación
• Aprobar o devolver

📤Salidas
• Estado: Causada
• Estado: Devuelta

❗Reglas de negocio
• Debe almacenarse y mostrarse la fecha de causado
• La fecha de causado debe quedar visible para tesorería y etapas posteriores
• Si se devuelve, la observación es obligatoria

🔷RF05 – Alistamiento de pago en tesorería

🎯Descripción
Preparar el pago antes del portal bancario.

👤Actor
• Tesorería

📥Entradas
• Factura causada
• Soportes
• Información bancaria / proceso de pago

⚙️Procesamiento
• Revisar cuenta y soportes
• Generar archivo plano para el aplicativo financiero
• Preparar proceso de pago
• Registrar número de proceso de pago
• Marcar como lista para auditoría

📤Salidas
• Estado: Alistada
• Número de proceso de pago

❗Reglas de negocio
• En esta etapa no existe comprobante de egreso
• En esta etapa intervienen 2 perfiles operativos de tesorería: asistente y tesorera
• No se puede alistar una factura no causada

🔷RF06 – Control previo de auditoría

🎯Descripción
Permitir a auditoría revisar el cumplimiento documental y contable antes del siguiente paso del flujo.

👤Actor
• Auditoría

📥Entradas
• Factura alistada
• Factura original
• Causación contable
• Documento soporte
• Contrato / orden / cuenta de cobro según aplique

⚙️Procesamiento
• Revisar soportes
• Revisar causación contable
• Revisar adecuada distribución contable
• Aprobar o rechazar
• Registrar observaciones

📤Salidas
• Estado: Aprobada auditoría
• Estado: Rechazada auditoría

❗Reglas de negocio
• Auditoría no valida disponibilidad presupuestal
• La disponibilidad/rubro se valida antes, en orden de compra/contrato
• Si rechaza, retorna a tesorería
• El rechazo exige observación obligatoria

🔷RF07 – Retorno de auditoría a tesorería

🎯Descripción
Permitir que la aprobación de auditoría vuelva a tesorería para continuar el procedimiento correcto.

👤Actor
• Tesorería

📥Entradas
• Factura aprobada por auditoría

⚙️Procesamiento
• Recibir validación de auditoría
• Confirmar continuidad del proceso
• Remitir a dirección financiera / sindicatura

📤Salidas
• Estado: Enviado a dirección financiera

❗Reglas de negocio
• Auditoría no envía directamente a pago
• Auditoría no envía directamente a rectoría
• El flujo correcto es: Auditoría → Tesorería → Dirección financiera/Sindicatura

🔷RF08 – Cargue formal de pago en dirección financiera / sindicatura

🎯Descripción
Permitir a dirección financiera, que hace las veces de sindicatura, realizar el cargue formal previo a autorización final.

👤Actor
• Dirección financiera / Sindicatura

📥Entradas
• Factura aprobada por auditoría y remitida por tesorería
• Soportes del trámite
• Proceso de pago validado

⚙️Procesamiento
• Revisar trámite validado
• Actualizar proceso de pago
• Cargar formalmente el pago para firma/autorización
• Remitir a rectoría

📤Salidas
• Estado: Cargada para autorización

❗Reglas de negocio
• Este rol no valida disponibilidad presupuestal
• Este rol no carga presupuesto
• Este rol corresponde al mismo usuario funcional de dirección financiera
• Aquí se actualiza el pago antes del portal bancario

🔷RF09 – Autorización final en rectoría

🎯Descripción
Permitir a rectoría aprobar o rechazar el pago.

👤Actor
• Rectoría

📥Entradas
• Factura cargada
• Soportes del trámite
• Observaciones previas

⚙️Procesamiento
• Revisar documentación
• Aprobar o rechazar
• Registrar motivo del rechazo
• Participar en la firma/autorización del pago

📤Salidas
• Estado: Autorizada para pago
• Estado: Rechazada por rectoría

❗Reglas de negocio
• El rol correcto es Rectoría, no Presidencia
• Rectoría debe poder ver los soportes
• El rechazo exige motivo obligatorio

🔷RF10 – Aplicación del pago

🎯Descripción
Permitir registrar que el pago fue efectivamente aplicado.

👤Actor
• Tesorería
• Dirección financiera / Sindicatura
• Rectoría

📥Entradas
• Pago autorizado
• Validación en portal bancario

⚙️Procesamiento
• Aplicar el pago
• Registrar fecha de pago
• Confirmar ejecución

📤Salidas
• Estado: Pago aplicado

❗Reglas de negocio
• Hay dos firmas en portal bancario: dirección financiera/sindicatura y rectoría
• El pago no puede aplicarse sin autorización previa

🔷RF11 – Generación de comprobante de egreso

🎯Descripción
Generar el comprobante de egreso únicamente después de aplicado el pago.

👤Actor
• Tesorería

📥Entradas
• Pago aplicado
• Datos de transacción

⚙️Procesamiento
• Generar comprobante de egreso
• Asociarlo al trámite
• Registrar fecha de generación

📤Salidas
• Comprobante de egreso
• Estado: Pagada

❗Reglas de negocio
• El comprobante de egreso no va en alistamiento
• El comprobante de egreso va al final del proceso

🔷RF12 – Trazabilidad completa

🎯Descripción
Registrar todo el recorrido del trámite y el responsable de cada etapa.

Debe almacenar
• Usuario
• Rol
• Acción
• Fecha/hora
• Estado anterior
• Estado nuevo
• Observaciones
• Fecha de recibido
• Fecha de radicación
• Fecha de causado
• Fecha de pago

❗Reglas
• Debe soportar medición por tiempos estipulados de cada área
• Debe permitir identificar dónde se detuvo el proceso
• Debe ser visible para seguimiento y pruebas previas

🔷RF13 – Seguimiento de tiempos y SLA

🎯Descripción
Medir los 17 días hábiles de pago y los tiempos por área.

⚙️Funcionalidades
• Calcular SLA total
• Calcular tiempo por etapa
• Mostrar semáforo
• Mostrar vencidos
• Mostrar alertas

❗Reglas
• El conteo inicia desde la fecha de recibido / recepción
• Debe soportar indicadores de calidad
• Debe servir para medir cumplimiento del acuerdo de servicio

🔷RF14 – Gestión documental

🎯Descripción
Administrar la carga, consulta y visualización de soportes de factura.

⚙️Funcionalidades
• Subida múltiple
• Visualización de detalle
• Descarga
• Asociación por trámite
• Consulta de documentos rechazados/enviados

❗Reglas
• Debe aceptar PDF
• Debe considerar soportes enviados comprimidos por correo en fase 1
• Debe mantener visibles los soportes en todo el flujo

🔷RF15 – Correo institucional de facturación

🎯Descripción
Crear y usar un correo exclusivo para recepción de facturas mientras se habilita el portal del proveedor.

👤Actor
• Administrador
• Dirección financiera

⚙️Funcionalidades
• Crear buzón de facturación
• Recibir facturas y soportes
• Permitir recepción de PDF y archivos comprimidos
• Gestionar capacidad del buzón

❗Reglas
• Debe solicitarse una cuenta con espacio aproximado de 100 GB
• En fase 1 este correo es obligatorio para operación inicial

🔷RF16 – Histórico documental y retención

🎯Descripción
Gestionar la permanencia del repositorio de facturas y soportes.

👤Actor
• Administrador
• Dirección financiera
• Gestión documental

⚙️Funcionalidades
• Configurar tiempo de conservación
• Consultar histórico
• Eliminar por fecha
• Registrar eliminación

❗Reglas
• El tiempo de retención debe definirse con gestión documental y conforme a ley
• Inicialmente debe existir repositorio en servidor de 200 GB ampliable
• La eliminación automática por fecha se parametriza en producción

🔷RF17 – Reportes y dashboard ejecutivo

🎯Descripción
Permitir a dirección financiera monitorear todo el flujo desde una vista ejecutiva.

👤Actor
• Dirección financiera / Sindicatura

⚙️Funcionalidades
• Dashboard de montos procesados
• Tablero Kanban por estados
• Reportes por semana, mes, trimestre y año
• Principales proveedores
• Seguimiento de tiempos
• Semáforo de alertas

❗Reglas
• Debe incluir tiempos promedio por etapa
• Debe consolidar funciones de dirección financiera y sindicatura en el mismo usuario funcional

🔷RF18 – Administración del sistema

🎯Descripción
Gestionar usuarios, permisos y configuraciones generales.

👤Actor
• Administrador

⚙️Funcionalidades
• Crear usuarios
• Editar usuarios
• Activar/Inactivar
• Asignar permisos
• Cambiar usuarios
• Configurar notificaciones
• Gestionar seguridad y respaldos

❗Reglas
• Administrador queda separado del usuario funcional de dirección financiera
• Debe permitir creación de usuarios de prueba y usuarios operativos

🔷RF19 – Interfaz por rol y usabilidad

🎯Descripción
Mostrar una interfaz clara, llamativa y entendible para cada usuario que interviene.

⚙️Funcionalidades
• Panel por rol
• Acciones visibles según rol
• Estados fáciles de entender
• Alertas y paneles de seguimiento
• Navegación clara del proceso

❗Reglas
• Debe apoyar el cambio de cultura del papel a digital
• Debe ser entendible antes de socializar con todas las áreas

🔷RF20 – Pruebas previas a capacitación

🎯Descripción
Realizar pruebas funcionales con usuarios de prueba antes de capacitar a los usuarios finales.

👤Actores
• Equipo de desarrollo
• Juan Carlos
• Elvis
• Usuarios de prueba

⚙️Funcionalidades
• Crear usuarios de prueba
• Ejecutar una o dos pruebas completas
• Validar trazabilidad
• Validar flujo por rol
• Corregir antes de socializar

❗Reglas
• Primero se prueba, después se capacita
• Las pruebas deben hacerse con quienes conocen la trazabilidad real del proceso

🔷RF21 – Sensibilización y salida a uso interno

🎯Descripción
Preparar la primera salida a uso para financiera, comenzando por Henry y continuando por los demás usuarios hasta rectoría.

❗Reglas
• La primera salida es solo para el flujo interno
• Debe definirse fecha de entrega y cronograma
• La capacitación va después de pruebas y ajustes

🔷RF22 – Portal del proveedor (Fase 2)

🎯Descripción
Permitir que el proveedor cargue directamente sus facturas y soportes, sin depender del correo ni del cargue manual del funcionario.

👤Actor
• Proveedor

⚙️Funcionalidades
• Cargar factura
• Adjuntar soportes
• Consultar estado
• Consultar observaciones

❗Reglas
• No hace parte de la primera salida a producción
• Debe desarrollarse después de estabilizar el flujo interno

🔐 REQUERIMIENTOS NO FUNCIONALES DETALLADOS
RNF01 – Seguridad

• Acceso autenticado por usuario
• Control por rol
• Trazabilidad completa
• Respaldo de información

RNF02 – Usabilidad

• Interfaz clara y entendible por cada rol
• Flujo visual del proceso
• Alertas visibles de devoluciones y pendientes

RNF03 – Rendimiento

• Respuesta rápida en consultas de bandejas, detalle y reportes

RNF04 – Disponibilidad

• Repositorio disponible para consulta del flujo y del histórico

RNF05 – Almacenamiento

• Repositorio inicial de aproximadamente 200 GB
• Posibilidad de ampliación
• Manejo de PDF y archivos adjuntos pesados

RNF06 – Cumplimiento procedimental

• El sistema debe reflejar el procedimiento real bajo sistema de gestión de calidad
• No debe inventar pasos presupuestales donde no corresponden

RNF07 – Adopción organizacional

• Debe facilitar el paso del proceso físico al digital
• Debe reducir papel y soportes físicos en circulación