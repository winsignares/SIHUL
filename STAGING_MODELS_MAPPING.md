# Comprehensive StgOracle Models Mapping

## Overview
This document maps all staging (StgOracle*) models to their corresponding real models, including field mappings, relationships, and data load status.

---

## 1. USUARIOS / DOCENTES

### Staging Model: `StgOracleDocente`
**File:** [backend/usuarios/models.py](backend/usuarios/models.py#L103)
**Table:** `usuarios_stgoracledocente`
**Data Status:** ✅ **LOADED** - 8,884 records

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=100, indexed) - **PK from Oracle**
- `id_docente_oracle` (CharField, max_length=100, nullable, indexed)
- `tipo_documento` (CharField, max_length=30, nullable)
- `numero_documento` (CharField, max_length=100, nullable, indexed)
- `nombres` (CharField, max_length=501, nullable)
- `apellidos` (CharField, max_length=501, nullable)
- `nombre_completo` (CharField, max_length=501, nullable)
- `correo_institucional` (CharField, max_length=150, nullable, indexed)
- `correo_personal` (CharField, max_length=150, nullable)
- `id_sede_oracle` (CharField, max_length=50, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=255, nullable)
- `id_facultad_oracle` (CharField, max_length=50, nullable, indexed)
- `nombre_facultad_oracle` (CharField, max_length=255, nullable)
- `periodo_academico` (CharField, max_length=50, nullable, indexed)
- `estado_docente` (CharField, max_length=50, nullable, indexed)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_doc_source_external`

### Real Model: `Usuario` (Docente Role)
**File:** [backend/usuarios/models.py](backend/usuarios/models.py#L47)
**Table:** `usuarios_usuario`
**Base Model:** `AbstractUser` (Django Auth)

#### Real Model Fields (for Docentes):
- `id` (AutoField, PK)
- `correo` (EmailField, max_length=100, unique) ← Maps to `correo_institucional`
- `nombre` (CharField, max_length=100) ← Maps to `nombre_completo`
- `password` / `contrasena_hash` (CharField, max_length=255)
- `rol` (FK to Rol) ← Should be "Docente"
- `facultad` (FK to Facultad) ← Resolved via `nombre_facultad_oracle`
- `sede` (FK to Sede) ← Resolved via `id_sede_oracle` / `nombre_sede_oracle`
- `seccional` (FK to Seccional) ← Derived from sede
- `activo` (BooleanField, default=True)
- `es_superusuario` (BooleanField, default=False)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_DOCENTE | id_docente_oracle | (not stored) | Only in staging |
| TIP_IDENTIFICACION | tipo_documento | (not stored) | Only in staging |
| NUM_IDENTIFICACION | numero_documento | (not stored) | Only in staging |
| NOMBRES | nombres | (not stored) | Only in staging |
| APELLIDOS | apellidos | (not stored) | Only in staging |
| NOMBRE_COMPLETO | nombre_completo | nombre | Used for Usuario.nombre |
| CORREO_INSTITUCIONAL | correo_institucional | correo | Used for login |
| CORREO_PERSONAL | correo_personal | (not stored) | Only in staging |
| ID_SEDE | id_sede_oracle | sede_id | FK resolution required |
| NOMBRE_SEDE | nombre_sede_oracle | (via FK) | Used for FK lookup |
| ID_FACULTAD | id_facultad_oracle | facultad_id | FK resolution required |
| NOMBRE_FACULTAD | nombre_facultad_oracle | (via FK) | Used for FK lookup |
| PERIODO_ACADEMICO | periodo_academico | (not stored) | Context only |
| ESTADO_DOCENTE | estado_docente | activo | Needs mapping logic |

#### ETL Command:
- Command: `python manage.py etl_oracle_docentes`
- Source View: `UHORARIOS.VW_DOCENTES`
- Status: ✅ Completed

---

## 2. USUARIOS / ESTUDIANTES

### Staging Model: `StgOracleEstudiante`
**File:** [backend/usuarios/models.py](backend/usuarios/models.py#L142)
**Table:** `usuarios_stgoracleestudiante`
**Data Status:** 🔄 **IN PROGRESS** - Being loaded (40,000+ expected)

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=100, indexed) - **PK from Oracle**
- `tipo_identificacion` (CharField, max_length=6, nullable)
- `id_estudiante_oracle` (CharField, max_length=30, nullable, indexed)
- `codigo_estudiante_oracle` (CharField, max_length=12, nullable, indexed)
- `nombres` (CharField, max_length=501, nullable)
- `apellidos` (CharField, max_length=501, nullable)
- `nombre_completo` (CharField, max_length=501, nullable)
- `semestre_oracle` (IntegerField, nullable)
- `periodo_academico` (CharField, max_length=5, nullable, indexed)
- `programa_oracle` (CharField, max_length=250, nullable)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_est_source_external`

### Real Model: `Usuario` (Estudiante Role)
**File:** [backend/usuarios/models.py](backend/usuarios/models.py#L47)
**Table:** `usuarios_usuario` (shared with Docente)
**Base Model:** `AbstractUser` (Django Auth)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| TIP_IDENTIFICACION | tipo_identificacion | (not stored) | Only in staging |
| ID_ESTUDIANTE | id_estudiante_oracle | (not stored) | Only in staging |
| CODIGO_ESTUDIANTE | codigo_estudiante_oracle | (not stored) | Only in staging |
| NOMBRES | nombres | (not stored) | Only in staging |
| APELLIDOS | apellidos | (not stored) | Only in staging |
| NOMBRE_COMPLETO | nombre_completo | nombre | Used for Usuario.nombre |
| SEMESTRE | semestre_oracle | (not stored) | Context only, linked via Grupo |
| PERIODO_ACADEMICO | periodo_academico | (not stored) | Context only |
| PROGRAMA | programa_oracle | (not stored) | Resolved via FK to Programa |

**Note:** Estudiante does NOT have direct correo in staging. Need email generation or discovery mechanism.

#### ETL Command:
- Command: `python manage.py etl_oracle_estudiantes`
- Source View: `UHORARIOS.VW_ESTUDIANTES`
- Status: 🔄 In Progress / Being loaded

---

## 3. SEDES

### Staging Model: `StgOracleSede`
**File:** [backend/sedes/models.py](backend/sedes/models.py#L67)
**Table:** `sedes_stgoraclesede`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=50, indexed) - **PK from Oracle (ID_SEDE)**
- `nombre_sede` (CharField, max_length=255)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_sede_source_external`

### Real Model: `Sede`
**File:** [backend/sedes/models.py](backend/sedes/models.py#L18)
**Table:** `sedes_sede`

#### Real Model Fields:
- `id` (AutoField, PK)
- `nombre` (CharField, max_length=100) ← Maps to `nombre_sede`
- `direccion` (CharField, max_length=150, nullable)
- `source_system` (CharField, max_length=50, nullable, indexed)
- `external_id` (CharField, max_length=50, nullable, indexed) - **Oracle ID**
- `seccional` (FK to Seccional) - **Must be resolved separately**
- `activa` (BooleanField, default=True)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_SEDE | external_id | external_id | Foreign key from Oracle |
| NOMBRE_SEDE | nombre_sede | nombre | Direct mapping |
| N/A | (computed) | seccional_id | Needs MapOracleSedeSeccional lookup |
| N/A | (implicit) | source_system | Always 'ORACLE_SIU' |

#### ETL Commands:
- Command: `python manage.py etl_oracle_sedes`
- Fallback: `python manage.py etl_oracle_staging` (with sedes_query param)
- Source View: `UHORARIOS.VW_SEDES`
- Status: ❓ Unknown

---

## 4. FACULTADES

### Staging Model: `StgOracleFacultad`
**File:** [backend/sedes/models.py](backend/sedes/models.py#L103)
**Table:** `sedes_stgoraclefacultad`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=50, indexed) - **PK from Oracle (ID_FACULTAD)**
- `id_sede_oracle` (CharField, max_length=50, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=255, nullable)
- `nombre_facultad` (CharField, max_length=255)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_fac_source_external`

### Real Model: `Facultad`
**File:** [backend/facultades/models.py](backend/facultades/models.py)
**Table:** `facultades_facultad`

#### Real Model Fields:
- `id` (AutoField, PK)
- `nombre` (CharField, max_length=100) ← Maps to `nombre_facultad`
- `source_system` (CharField, max_length=50, nullable, indexed)
- `external_id` (CharField, max_length=50, nullable, indexed) - **Oracle ID**
- `sede` (FK to Sede) ← Resolved via `id_sede_oracle`
- `activa` (BooleanField, default=True)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_FACULTAD | external_id | external_id | Foreign key from Oracle |
| ID_SEDE | id_sede_oracle | sede_id | FK to Sede via external_id |
| NOMBRE_SEDE | nombre_sede_oracle | (via FK) | Used for Sede lookup |
| NOMBRE_FACULTAD | nombre_facultad | nombre | Direct mapping |
| N/A | (implicit) | source_system | Always 'ORACLE_SIU' |

#### ETL Command:
- Command: `python manage.py etl_oracle_facultades`
- Source View: `UHORARIOS.VW_FACULTADES`
- Status: ❓ Unknown

---

## 5. PROGRAMAS

### Staging Model: `StgOraclePrograma`
**File:** [backend/programas/models.py](backend/programas/models.py#L9)
**Table:** `programas_stgoraclePrograma`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=50, indexed) - **PK from Oracle (ID_PROGRAMA)**
- `id_programa_oracle` (CharField, max_length=50, nullable, indexed)
- `id_sede_oracle` (CharField, max_length=50, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=255, nullable)
- `id_facultad_oracle` (CharField, max_length=50, nullable, indexed)
- `nombre_facultad_oracle` (CharField, max_length=255, nullable)
- `nombre_programa` (CharField, max_length=255)
- `periodo_academico` (CharField, max_length=50, nullable, indexed)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` with condition `source_system NOT NULL AND external_id NOT NULL AND external_id != ''` - name: `uq_stg_oracle_prog_source_external`

### Real Model: `Programa`
**File:** [backend/programas/models.py](backend/programas/models.py#L1)
**Table:** `programas_programa`

#### Real Model Fields:
- `id` (AutoField, PK)
- `facultad` (FK to Facultad) ← Resolved via `id_facultad_oracle` / `nombre_facultad_oracle`
- `nombre` (CharField, max_length=100) ← Maps to `nombre_programa`
- `semestres` (IntegerField, default=10)
- `activo` (BooleanField, default=False)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_PROGRAMA | id_programa_oracle | (not stored) | External reference only |
| ID_FACULTAD | id_facultad_oracle | facultad_id | FK to Facultad via external_id |
| NOMBRE_FACULTAD | nombre_facultad_oracle | (via FK) | Used for Facultad lookup |
| ID_SEDE | id_sede_oracle | (not stored) | Context only |
| NOMBRE_SEDE | nombre_sede_oracle | (not stored) | Context only |
| NOMBRE_PROGRAMA | nombre_programa | nombre | Direct mapping |
| PERIODO_ACADEMICO | periodo_academico | (not stored) | Context only |

#### ETL Command:
- Command: `python manage.py etl_oracle_asignatura_programa` (or dedicated command)
- Source View: `UHORARIOS.VW_PROGRAMAS_ACADEMICOS`
- Status: ❓ Unknown

---

## 6. GRUPOS ACADÉMICOS

### Staging Model: `StgOracleGrupoAcademico`
**File:** [backend/grupos/models.py](backend/grupos/models.py#L29)
**Table:** `grupos_stgoraclegrupoacademico`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=100, indexed) - **PK from Oracle**
- `id_grupo_oracle` (CharField, max_length=22, nullable, indexed)
- `id_sede_oracle` (CharField, max_length=20, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=50, nullable)
- `id_facultad_oracle` (CharField, max_length=20, nullable, indexed)
- `nombre_facultad_oracle` (CharField, max_length=250, nullable)
- `id_programa_oracle` (CharField, max_length=5, nullable, indexed)
- `nombre_programa_oracle` (CharField, max_length=250, nullable)
- `nombre_grupo_oracle` (CharField, max_length=20, nullable)
- `periodo_academico` (CharField, max_length=5, nullable, indexed)
- `semestre_oracle` (IntegerField, nullable)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_grupo_source_external`

### Real Model: `Grupo`
**File:** [backend/grupos/models.py](backend/grupos/models.py#L1)
**Table:** `grupos_grupo`

#### Real Model Fields:
- `id` (AutoField, PK)
- `programa` (FK to Programa) ← Resolved via `id_programa_oracle`
- `periodo` (FK to PeriodoAcademico) ← Resolved via `periodo_academico`
- `nombre` (CharField, max_length=50) ← Maps to `nombre_grupo_oracle`
- `semestre` (IntegerField, validators=[Min(1), Max(10)]) ← Maps to `semestre_oracle`
- `activo` (BooleanField, default=True)

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_GRUPO | id_grupo_oracle | (not stored) | External reference only |
| ID_PROGRAMA | id_programa_oracle | programa_id | FK to Programa via external_id |
| NOMBRE_PROGRAMA | nombre_programa_oracle | (via FK) | Used for Programa lookup |
| ID_FACULTAD | id_facultad_oracle | (not stored) | Context only |
| NOMBRE_FACULTAD | nombre_facultad_oracle | (not stored) | Context only |
| ID_SEDE | id_sede_oracle | (not stored) | Context only |
| NOMBRE_SEDE | nombre_sede_oracle | (not stored) | Context only |
| NOMBRE_GRUPO | nombre_grupo_oracle | nombre | Direct mapping |
| PERIODO_ACADEMICO | periodo_academico | periodo_id | FK to PeriodoAcademico |
| SEMESTRE | semestre_oracle | semestre | Direct mapping |

#### ETL Command:
- Command: `python manage.py etl_oracle_grupos`
- Source View: `UHORARIOS.VW_GRUPOS_ACADEMICOS`
- Status: ❓ Unknown

---

## 7. ESPACIOS FÍSICOS

### Staging Model: `StgOracleEspacioFisico`
**File:** [backend/espacios/models.py](backend/espacios/models.py#L59)
**Table:** `espacios_stgoracleespaciofisico`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=100, indexed) - **PK from Oracle**
- `ident_aula_oracle` (CharField, max_length=10, nullable, indexed)
- `bloque_oracle` (CharField, max_length=22, nullable)
- `nombre_espacio_oracle` (CharField, max_length=60, nullable)
- `tipo_espacio_oracle` (CharField, max_length=6, nullable, indexed)
- `id_sede_oracle` (CharField, max_length=20, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=50, nullable)
- `nombre_facultad_oracle` (CharField, max_length=250, nullable)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_espacio_source_external`

### Real Model: `EspacioFisico`
**File:** [backend/espacios/models.py](backend/espacios/models.py#L14)
**Table:** `espacios_espaciofisico`

#### Real Model Fields:
- `id` (AutoField, PK)
- `nombre` (CharField, max_length=100) ← Maps to `nombre_espacio_oracle` or `bloque_oracle + ident_aula_oracle`
- `sede` (FK to Sede) ← Resolved via `id_sede_oracle`
- `tipo` (FK to TipoEspacio) ← Resolved via `tipo_espacio_oracle`
- `capacidad` (PositiveIntegerField) - **Not in staging**
- `ubicacion` (CharField, max_length=100, nullable) ← Could map to `ident_aula_oracle` or `bloque_oracle`
- `esta_abierto` (BooleanField, default=True)
- `estado` (CharField, max_length=20, choices: 'Disponible', 'Mantenimiento', 'No Disponible', default='Disponible')

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| IDENT_AULA | ident_aula_oracle | ubicacion | Could use for location |
| BLOQUE | bloque_oracle | ubicacion | Combined with ident_aula for full address |
| NOMBRE_AULA | nombre_espacio_oracle | nombre | Direct mapping |
| TIPO_AULA | tipo_espacio_oracle | tipo_id | FK to TipoEspacio (lookup needed) |
| ID_SEDE | id_sede_oracle | sede_id | FK to Sede via external_id |
| NOMBRE_SEDE | nombre_sede_oracle | (via FK) | Used for Sede lookup |
| N/A | (not available) | capacidad | Must be queried separately or set default |
| N/A | (implicit) | estado | Defaults to 'Disponible' |

#### ETL Command:
- Command: `python manage.py etl_oracle_espacios`
- Source View: `UHORARIOS.VW_AULAS` or similar
- Status: ❓ Unknown

---

## 8. HORARIOS

### Staging Model: `StgOracleHorario`
**File:** [backend/horario/models.py](backend/horario/models.py#L115)
**Table:** `horario_stgoraclehorario`
**Data Status:** ❓ **UNKNOWN** - Needs verification

#### Staging Fields:
- `source_system` (CharField, max_length=50, default='ORACLE_SIU', indexed)
- `external_id` (CharField, max_length=120, indexed) - **PK from Oracle (composite ID)**
- `id_grupo_oracle` (CharField, max_length=22, nullable, indexed)
- `programa_oracle` (CharField, max_length=5, nullable, indexed)
- `id_asignatura_oracle` (CharField, max_length=20, nullable, indexed)
- `nombre_grupo_oracle` (CharField, max_length=20, nullable)
- `periodo_oracle` (CharField, max_length=5, nullable, indexed)
- `cantidad_estudiantes_oracle` (IntegerField, nullable)
- `asignatura_oracle` (CharField, max_length=255, nullable)
- `nombre_programa_oracle` (CharField, max_length=273, nullable)
- `id_sede_oracle` (CharField, max_length=20, nullable, indexed)
- `nombre_sede_oracle` (CharField, max_length=50, nullable)
- `num_identificacion_docente` (CharField, max_length=30, nullable, indexed)
- `nombre_docente_oracle` (CharField, max_length=501, nullable)
- `apellidos_docente_oracle` (CharField, max_length=501, nullable)
- `nom_aula_oracle` (CharField, max_length=60, nullable)
- `hor_inicio_raw` (TextField, nullable)
- `hor_fin_raw` (TextField, nullable)
- `raw_data` (JSONField)
- `row_hash` (CharField, max_length=64, indexed) - **Change detection**
- `estado_registro` (CharField, max_length=30, default='valido', indexed)
- `fecha_carga` (DateTimeField, auto_now)

#### Unique Constraint:
- Composite: `(source_system, external_id)` - name: `uq_stg_oracle_horario_source_external`

### Real Model: `Horario`
**File:** [backend/horario/models.py](backend/horario/models.py#L8)
**Table:** `horario_horario`

#### Real Model Fields:
- `id` (AutoField, PK)
- `grupo` (FK to Grupo) ← Resolved via `id_grupo_oracle`
- `asignatura` (FK to Asignatura) ← Resolved via `id_asignatura_oracle`
- `docente` (FK to Usuario) ← Resolved via `num_identificacion_docente`
- `espacio` (FK to EspacioFisico) ← Resolved via `nom_aula_oracle`
- `dia_semana` (CharField, max_length=15) - **Not in staging**
- `hora_inicio` (TimeField) ← Parsed from `hor_inicio_raw`
- `hora_fin` (TimeField) ← Parsed from `hor_fin_raw`
- `cantidad_estudiantes` (IntegerField, nullable) ← Maps to `cantidad_estudiantes_oracle`
- `estado` (CharField, max_length=20, choices: 'pendiente', 'aprobado', 'rechazado', default='pendiente')

#### Field Mapping (Oracle → Django):
| Oracle Field | Staging Field | Real Field | Notes |
|---|---|---|---|
| ID_GRUPO | id_grupo_oracle | grupo_id | FK to Grupo via external_id |
| NOMBRE_GRUPO | nombre_grupo_oracle | (via FK) | Used for Grupo lookup |
| ID_PROGRAMA | programa_oracle | (not stored) | Context only |
| NOMBRE_PROGRAMA | nombre_programa_oracle | (not stored) | Context only |
| ID_ASIGNATURA | id_asignatura_oracle | asignatura_id | FK to Asignatura (lookup needed) |
| NOMBRE_ASIGNATURA | asignatura_oracle | (via FK) | Used for Asignatura lookup |
| PERIODO | periodo_oracle | (not stored) | Used to find Grupo.periodo |
| CANTIDAD_ESTUDIANTES | cantidad_estudiantes_oracle | cantidad_estudiantes | Direct mapping |
| ID_SEDE | id_sede_oracle | (not stored) | Context only |
| NOMBRE_SEDE | nombre_sede_oracle | (not stored) | Context only |
| NUM_IDENTIFICACION_DOCENTE | num_identificacion_docente | docente_id | FK to Usuario via documento |
| NOMBRE_DOCENTE | nombre_docente_oracle | (via FK) | Used for Usuario lookup |
| APELLIDOS_DOCENTE | apellidos_docente_oracle | (via FK) | Used for Usuario lookup |
| NOMBRE_AULA | nom_aula_oracle | espacio_id | FK to EspacioFisico via name/oracle_id |
| HOR_INICIO_RAW | hor_inicio_raw | hora_inicio | Requires parsing (TimeField) |
| HOR_FIN_RAW | hor_fin_raw | hora_fin | Requires parsing (TimeField) |
| N/A | (computed) | dia_semana | Must be computed or added to Oracle data |
| N/A | (implicit) | estado | Defaults to 'pendiente' |

#### ETL Command:
- Command: `python manage.py etl_oracle_horario`
- Source View: `UHORARIOS.VW_HORARIO`
- Status: ❓ Unknown

---

## Data Relationships & Dependencies

### Load Order (Required Dependencies):
```
1. Sedes (base for everything)
   ↓
2. Facultades (requires Sede)
   ↓
3. Programas (requires Facultad)
   ↓
4. PeriodoAcademico (independent)
5. Grupos (requires Programa + PeriodoAcademico)
   ↓
6. Docentes/Estudiantes (Usuario table)
   ↓
7. Espacios (requires Sede)
   ↓
8. Asignaturas (requires Sede)
   ↓
9. Horarios (requires Grupo + Asignatura + Usuario + Espacio)
```

### FK Resolution Maps:

| Real Field | Resolution Method | Source Fields |
|---|---|---|
| Sede.seccional_id | MapOracleSedeSeccional.seccional_id | StgOracleSede.external_id → MapOracleSedeSeccional |
| Facultad.sede_id | Sede lookup by external_id | StgOracleFacultad.id_sede_oracle |
| Programa.facultad_id | Facultad lookup by external_id | StgOraclePrograma.id_facultad_oracle |
| Grupo.programa_id | Programa lookup by external_id | StgOracleGrupoAcademico.id_programa_oracle |
| Grupo.periodo_id | PeriodoAcademico lookup by name | StgOracleGrupoAcademico.periodo_academico |
| Usuario.sede_id | Sede lookup by external_id | StgOracleDocente/Estudiante.id_sede_oracle |
| Usuario.facultad_id | Facultad lookup by external_id | StgOracleDocente.id_facultad_oracle |
| EspacioFisico.sede_id | Sede lookup by external_id | StgOracleEspacioFisico.id_sede_oracle |
| EspacioFisico.tipo_id | TipoEspacio lookup by name | StgOracleEspacioFisico.tipo_espacio_oracle |
| Horario.grupo_id | Grupo lookup by external_id | StgOracleHorario.id_grupo_oracle |
| Horario.asignatura_id | Asignatura lookup (needs mapping) | StgOracleHorario.id_asignatura_oracle |
| Horario.docente_id | Usuario lookup by numero_documento | StgOracleHorario.num_identificacion_docente |
| Horario.espacio_id | EspacioFisico lookup by name or external_id | StgOracleHorario.nom_aula_oracle |

---

## Data Load Status Summary

| Model | Staging Table | Real Table | Status | Records | Notes |
|---|---|---|---|---|---|
| **Docentes** | StgOracleDocente | Usuario (rol='Docente') | ✅ LOADED | 8,884 | All valido, ready for migration |
| **Estudiantes** | StgOracleEstudiante | Usuario (rol='Estudiante') | 🔄 IN PROGRESS | ~40,000+ | Being loaded, awaiting completion |
| **Sedes** | StgOracleSede | Sede | ❓ UNKNOWN | ? | Needs verification and Seccional mapping |
| **Facultades** | StgOracleFacultad | Facultad | ❓ UNKNOWN | ? | Needs verification and Sede FK resolution |
| **Programas** | StgOraclePrograma | Programa | ❓ UNKNOWN | ? | Needs verification and Facultad FK resolution |
| **Grupos** | StgOracleGrupoAcademico | Grupo | ❓ UNKNOWN | ? | Needs verification, Programa + PeriodoAcademico FK resolution |
| **Espacios** | StgOracleEspacioFisico | EspacioFisico | ❓ UNKNOWN | ? | Needs verification and TipoEspacio mapping |
| **Horarios** | StgOracleHorario | Horario | ❓ UNKNOWN | ? | Complex multi-table FK resolution needed |

---

## Key Observations

### 1. **Composite Foreign Keys**
Many staging records require lookup across multiple external_id fields:
- Horarios require finding: Grupo → Asignatura → Docente → Espacio
- Requires careful FK resolution with proper error handling

### 2. **Missing Data Transformations**
Several fields in staging don't have direct equivalents in real models:
- `dia_semana` in Horario: Not in staging data, must be computed from time/group schedule
- `capacidad` in EspacioFisico: Not in staging data, must be discovered elsewhere
- Email for Estudiantes: Not available in staging, generation needed
- Time parsing: `hor_inicio_raw` and `hor_fin_raw` need parsing to TimeField

### 3. **Staging Table Change Detection**
All staging tables have `row_hash` field for idempotent upsert:
- Computed from JSON payload in Oracle
- Allows detection of record changes without re-processing

### 4. **Common Fields in All Staging Tables**
- `source_system` (always 'ORACLE_SIU')
- `external_id` (Oracle PK)
- `raw_data` (Full Oracle row as JSON)
- `row_hash` (SHA256 of data for change detection)
- `estado_registro` (always 'valido' for data from VW_*)
- `fecha_carga` (auto_now timestamp)

### 5. **Unique Constraints**
All staging tables enforce uniqueness on `(source_system, external_id)` composite:
- Allows multiple data sources in same table
- Ensures idempotent processing
- Supports retry logic

### 6. **FK Resolution Strategy Needed**
For proper migration, need to implement:
1. **Sede → Seccional mapping** via MapOracleSedeSeccional
2. **External ID lookup functions** for each model
3. **Fallback mechanisms** when external_id not found
4. **Batch migration commands** to process staging → real in correct order
5. **Error handling** for FK resolution failures

---

## Related Models (Not Staging Tables)

### Supporting Models:
- **Rol** (usuarios/models.py) - User roles, referenced by Usuario.rol
- **Seccional** (sedes/models.py) - Geographic regions, referenced by Sede.seccional
- **TipoEspacio** (espacios/models.py) - Space types, referenced by EspacioFisico.tipo
- **PeriodoAcademico** (periodos/models.py) - Academic periods, referenced by Grupo.periodo
- **MapOracleSedeSeccional** (sedes/models.py) - Mapping table for Sede ↔ Seccional
- **OracleSyncRun** (sedes/models.py) - Audit trail for sync operations
- **OracleSyncIssue** (sedes/models.py) - Error logging for sync issues

---

## ETL Command Status Reference

| Command | Status | Source View | Table | Notes |
|---|---|---|---|---|
| `etl_oracle_docentes` | ✅ Ready | VW_DOCENTES | StgOracleDocente | Completed, 8,884 records |
| `etl_oracle_estudiantes` | 🔄 Running | VW_ESTUDIANTES | StgOracleEstudiante | 40,000+ expected |
| `etl_oracle_sedes` | ❓ Status Unknown | VW_SEDES | StgOracleSede | Check status |
| `etl_oracle_facultades` | ❓ Status Unknown | VW_FACULTADES | StgOracleFacultad | Check status |
| `etl_oracle_programas` | ❓ Status Unknown | VW_PROGRAMAS_ACADEMICOS | StgOraclePrograma | Check status |
| `etl_oracle_grupos` | ❓ Status Unknown | VW_GRUPOS_ACADEMICOS | StgOracleGrupoAcademico | Check status |
| `etl_oracle_espacios` | ❓ Status Unknown | VW_AULAS | StgOracleEspacioFisico | Check status |
| `etl_oracle_horario` | ❓ Status Unknown | VW_HORARIO | StgOracleHorario | Check status |
| `etl_oracle_staging` | ✅ Available | VW_SEDES, VW_FACULTADES | Stg* models | General purpose staging loader |

