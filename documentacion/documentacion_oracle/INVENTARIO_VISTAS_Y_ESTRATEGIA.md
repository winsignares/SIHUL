# Oracle: inventario de vistas y estrategia de lectura

Complementa [INTEGRACION_ETL_ORACLE.md](INTEGRACION_ETL_ORACLE.md) (cómo funciona hoy la carga) y
[../general/ARQUITECTURA_OBJETIVO.md](../general/ARQUITECTURA_OBJETIVO.md) (hacia dónde va el sistema).

**Meta:** dejar de depender de una carga programada y leer los datos académicos desde las vistas de Oracle en el momento en que
se necesitan, de modo que al buscar o registrar un estudiante o un docente se complete su información y su horario sin copiar
toda la base a PostgreSQL. SIHUL solo **lee** Oracle; nunca escribe en él.

> Los nombres de columna de esta página salen del código de los comandos ETL y de los modelos de *staging*. Las columnas reales
> de cada vista solo existen en Oracle; el paso 2 de la hoja de ruta agrega un comando de solo lectura para confirmarlas sin
> traer datos personales.

## 1. Hallazgo principal: casi nada es de "solo lectura" dentro de SIHUL

Los datos que vienen de Oracle no se quedan quietos: SIHUL les cuelga información propia y otras tablas apuntan a ellos con
claves foráneas. Por eso no se puede reemplazar todo por una consulta directa a Oracle.

| Dato de Oracle | Qué le agrega o hace SIHUL | Tablas de SIHUL que lo referencian |
|---|---|---|
| Horario | Asigna el espacio, fusiona grupos, cambia o mueve clases, recibe solicitudes de espacio, inscribe estudiantes | `Horario`, `HorarioFusionado`, `SolicitudEspacio`, `HorarioEstudiante` |
| Espacio físico | Apertura y cierre, recursos, permisos de supervisores, préstamos | `EspacioFisico`, `EspacioPermitido`, `EspacioRecurso`, préstamos |
| Usuario (docente / estudiante) | Rol, acceso, componentes, chatbots asignados, préstamos solicitados, aprobaciones | Al menos 13 relaciones directas hacia `Usuario` desde 5 apps (chatbot, componentes, espacios, horario, préstamos) |
| Grupo, programa, asignatura | Relaciones entre ellos y activación | `Grupo`, `Programa`, `Asignatura`, `AsignaturaPrograma` |
| Sede, facultad | Mapa a las seccionales de SIHUL | `MapOracleSedeSeccional`, `Seccional`, `Sede`, `Facultad` |

Casi todos los modelos reales ya tienen un campo `origen` que distingue lo que llegó de Oracle de lo creado a mano, y las tablas
de *staging* (`Stg*`) guardan `external_id`, el `row_hash` y el JSON crudo de cada fila.

## 2. Inventario de vistas (esquema `UHORARIOS`)

| Vista | Qué trae (según el código) | Se guarda hoy en | Tabla real |
|---|---|---|---|
| `VW_SEDES` | `id_sede`, `cod_sede`, `nombre_sede` | `StgOracleSede` | `Sede` / `Seccional` (por `MapOracleSedeSeccional`) |
| `VW_FACULTAD` | sede y nombre de la facultad | `StgOracleFacultad` | `Facultad` |
| `VW_PROGRAMAS_ACADEMICOS` | `id_programa`, sede, facultad, nombre del programa, período | `StgOraclePrograma` | `Programa` |
| `VW_ASIGNATURA` | `id_asignatura`, `cod_periodo`, `uni_teorica`, `uni_practica`, `uni_asesoria` | (directo) | `Asignatura` |
| `VW_ASIGNATURA_PROGRAMA` | relación asignatura – programa | (directo) | `AsignaturaPrograma` |
| `VW_GRUPOS_ACADEMICOS` | `id_grupo`, sede, facultad, programa, nombre del grupo, período, semestre | `StgOracleGrupoAcademico` | `Grupo` |
| `VW_HORARIO` | grupo, programa, asignatura, período, cantidad de estudiantes, identificación y nombre del docente, aula, día, hora de inicio y fin, fecha de inicio y fin | `StgOracleHorario` | `Horario` |
| `VW_ESPACIOS_FISICOS` | identificador del aula, bloque, nombre, tipo, sede, facultad | `StgOracleEspacioFisico` | `EspacioFisico` |
| `VW_DOCENTES` | `id_docente`, tipo y número de identificación, nombres, apellidos, correo institucional, período. **No trae** sede, facultad ni estado | `StgOracleDocente` | `Usuario` (rol docente) |
| `VW_ESTUDIANTES` | tipo de identificación, id y código del estudiante, nombres, apellidos, semestre, período, programa, sede | `StgOracleEstudiante` | `Usuario` (rol estudiante) |

### Vacíos que se detectan en el inventario

1. **Horario por estudiante.** `VW_ESTUDIANTES` no trae los grupos en los que está inscrito el estudiante. Para mostrarle "su
   horario" hace falta una vista de matrícula (estudiante – grupo o estudiante – asignatura). No aparece en el código.
2. **Identificación del usuario en SIHUL.** El modelo `Usuario` guarda nombre, correo, rol, sede, seccional y facultad, pero no
   el número de documento. Para buscar a una persona en Oracle por su identificación (y no por el correo) hay que decidir dónde
   se guarda ese dato.
3. **Docente.** `VW_DOCENTES` no trae sede ni facultad; hoy se resuelven por el horario.
4. **Período.** Todas las consultas filtran por el período configurado (`ETL_PERIODO`); en lectura directa el período activo
   debe salir de SIHUL, no de una variable de entorno.

## 3. Clasificación

| Tipo | Vistas | Cómo se trata |
|---|---|---|
| **A. Referencia** (cambian poco, SIHUL no las modifica) | sedes, facultades, programas, asignaturas, asignatura–programa, grupos | Lectura con caché; SIHUL puede quedarse con una copia que se refresca sola |
| **B. Mixta** (Oracle da la base, SIHUL agrega) | horarios, espacios físicos | Datos de Oracle de solo lectura + datos propios de SIHUL (espacio asignado, fusiones, apertura, recursos) en tablas separadas |
| **C. Identidad** | docentes, estudiantes | El **perfil académico** viene de Oracle; la **cuenta** (rol, acceso, permisos) es de SIHUL |

## 4. Estrategia recomendada: lectura bajo demanda con proyección local

Se descartan dos extremos:

- **Seguir con la carga programada.** Es lo que se quiere eliminar.
- **Leer siempre directo de Oracle, sin copia local.** No es viable: decenas de relaciones de SIHUL apuntan a usuarios,
  grupos, horarios y espacios; PostgreSQL no puede unir tablas con una base Oracle externa; y si Oracle no responde, SIHUL
  dejaría de funcionar.

Lo que se propone: SIHUL consulta Oracle **cuando necesita el dato** y guarda una **proyección local mínima** (la fila que otras
tablas necesitan referenciar), con una marca de última actualización.

1. **Una sola interfaz** (`FuenteAcademica`) por dato: `buscar_estudiante(identificación)`, `horario_de_grupo(grupo, período)`,
   etc. Tiene dos implementaciones: la **local** (lo que hay hoy) y la de **Oracle** (consulta la vista). Un interruptor por
   dato elige cuál se usa, así se migra de a una vista sin riesgo.
2. **Docentes y estudiantes bajo demanda.** Al buscar o registrar una persona, se consulta la vista por identificación, se crea
   o actualiza su fila local y se devuelve el resultado. Es el caso que pidió el negocio: el nombre, el programa y el horario se
   llenan solos.
3. **Horarios por grupo y período bajo demanda.** Se refrescan al consultarlos si la copia local es más vieja que un tiempo
   configurable, y hay un botón de sincronizar para quien administra.
4. **Datos propios de SIHUL separados.** Lo que SIHUL escribe sobre horarios y espacios (espacio asignado, fusiones, solicitudes)
   queda en tablas propias, identificado por el `external_id` de Oracle. Así una actualización desde Oracle no pisa lo asignado.
5. **Resiliencia.** Tiempo máximo de espera por consulta, caché en Redis y "corte de circuito": si Oracle no responde, se sirve la
   última copia local y se avisa que puede estar desactualizada.
6. **Retirar la carga programada y las tablas de *staging*** cuando todas las vistas estén migradas.

### Seguridad y privacidad

- La cuenta de Oracle que use SIHUL debe tener permiso de **solo lectura sobre las vistas** necesarias.
- Las credenciales y direcciones de Oracle viven únicamente en el archivo de variables de cada entorno; nunca en el repositorio.
- No se registran datos personales (documentos, nombres) en los registros del sistema.
- Se pide a Oracle solo lo necesario para la pantalla que se está mostrando.

### Producción y pruebas

- Cada entorno tiene sus propias variables `ORACLE_*` y apunta a su propia instancia.
- En las pruebas automáticas se usa una **implementación simulada** de la interfaz, para no depender de Oracle real.
- Se agrega un chequeo de salud de la conexión a Oracle, separado del chequeo general del backend.

## 5. Preguntas abiertas (necesitan respuesta de la institución)

1. ¿Existe una vista de matrícula (estudiante – grupo / asignatura) para armar el horario del estudiante? Si no, hay que pedirla.
2. ¿Las vistas tienen índices para buscar por número de identificación? Sin ellos una búsqueda puntual puede ser lenta.
3. ¿Qué cuenta de solo lectura se puede usar desde producción y desde pruebas, y cuántas conexiones simultáneas se permiten?
4. ¿Qué tan seguido cambian los horarios dentro de un período? Define el tiempo de vida de la copia local.
5. ¿Dónde se guarda el número de documento de las personas dentro de SIHUL (campo nuevo en `Usuario` o tabla de perfil)?
