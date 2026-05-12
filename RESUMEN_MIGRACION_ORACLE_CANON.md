# 📊 RESUMEN DE MIGRACIONES ORACLE → SISTEMA CANON (POSTGRESQL)

**Fecha de Documento:** Mayo 12, 2026  
**Sistema Origen:** Oracle - SIULEDU (UHORARIOS)  
**Sistema Destino:** PostgreSQL - SIHUL  
**Conexión Oracle:** `10.4.100.215:1521/SIULEDU` (Usuario: UHORARIOS)

---

## 🎯 OVERVIEW DE MIGRACIONES

Se han implementado **11 comandos ETL** para migrar datos desde Oracle hacia PostgreSQL utilizando un modelo de **2 capas**:
1. **Capa Staging**: Captura datos en bruto desde Oracle (StgOracle*)
2. **Capa Producción**: Procesa y normaliza datos (modelos Django finales)

---

## 📋 TABLAS MIGRADAS POR MÓDULO

### 1️⃣ **USUARIOS (3 migraciones)**

#### a) **Docentes**
- **Tabla Oracle:** `VW_DOCENTES` (UHORARIOS)
- **Tabla Staging:** `usuarios_stgoracledocente`
- **Tabla Canon:** `usuarios_usuario` (con rol=Docente)
- **Comando ETL:** `etl_oracle_docentes`
- **Estado:** ✅ COMPLETADO (8,884 registros)

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_DOCENTE | id_docente_oracle | - | Referencia |
| NUM_IDENTIFICACION | numero_documento | - | Referencia |
| NOMBRE_COMPLETO | nombre_completo | nombre | CharField |
| CORREO_INSTITUCIONAL | correo_institucional | correo | EmailField |
| ID_SEDE | id_sede_oracle | sede_id | FK |
| ID_FACULTAD | id_facultad_oracle | facultad_id | FK |
| ESTADO_DOCENTE | estado_docente | activo | Boolean |

#### b) **Estudiantes**
- **Tabla Oracle:** `VW_ESTUDIANTES` (UHORARIOS)
- **Tabla Staging:** `usuarios_stgoracleestudiante`
- **Tabla Canon:** `usuarios_usuario` (con rol=Estudiante)
- **Comando ETL:** `etl_oracle_estudiantes`
- **Estado:** 🔄 EN PROGRESO (40,000+ esperados)

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_ESTUDIANTE | id_estudiante_oracle | - | Referencia |
| CODIGO_ESTUDIANTE | codigo_estudiante_oracle | - | Referencia |
| NOMBRE_COMPLETO | nombre_completo | nombre | CharField |
| SEMESTRE | semestre_oracle | - | Contexto |
| PERIODO_ACADEMICO | periodo_academico | - | Contexto |
| PROGRAMA | programa_oracle | - | FK (vía Grupo) |

---

### 2️⃣ **SEDES Y FACULTADES (2 migraciones)**

#### a) **Sedes**
- **Tabla Oracle:** `VW_SEDES` (UHORARIOS)
- **Tabla Staging:** `sedes_stgoraclesede`
- **Tabla Canon:** `sedes_sede`
- **Comando ETL:** `etl_oracle_sedes`
- **Estado:** ❓ VERIFICACIÓN PENDIENTE

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_SEDE | external_id | external_id | CharField |
| NOMBRE_SEDE | nombre_sede | nombre | CharField |
| - | - | seccional_id | FK (MapOracleSedeSeccional) |
| - | - | activa | Boolean |

#### b) **Facultades**
- **Tabla Oracle:** `VW_FACULTAD` (UHORARIOS)
- **Tabla Staging:** `sedes_stgoraclefacultad`
- **Tabla Canon:** `facultades_facultad`
- **Comando ETL:** `etl_oracle_facultades`
- **Estado:** ❓ VERIFICACIÓN PENDIENTE

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_FACULTAD | external_id | external_id | CharField |
| NOMBRE_FACULTAD | nombre_facultad | nombre | CharField |
| ID_SEDE | id_sede_oracle | sede_id | FK |
| - | - | activa | Boolean |

---

### 3️⃣ **PROGRAMAS ACADÉMICOS (1 migración)**

- **Tabla Oracle:** `VW_PROGRAMAS_ACADEMICOS` (UHORARIOS)
- **Tabla Staging:** `programas_stgoracleprograma`
- **Tabla Canon:** `programas_programa`
- **Comando ETL:** `etl_oracle_programas`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_PROGRAMA | external_id | external_id | CharField |
| NOMBRE_PROGRAMA | nombre_programa | nombre | CharField |
| ID_SEDE | id_sede_oracle | sede_id | FK |
| ID_FACULTAD | id_facultad_oracle | facultad_id | FK |
| PERIODO_ACADEMICO | periodo_academico | - | Contexto |

---

### 4️⃣ **ASIGNATURAS (2 migraciones)**

#### a) **Asignaturas**
- **Tabla Oracle:** `ASIGNATURA` (UHORARIOS)
- **Tabla Staging:** DIRECTO (sin staging intermedio)
- **Tabla Canon:** `asignaturas_asignatura`
- **Comando ETL:** `etl_oracle_asignaturas`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Canon | Tipo | Notas |
|---|---|---|---|
| COD_ASIGNATURA | codigo | CharField | Clave única |
| NOMBRE_ASIGNATURA | nombre | CharField | |
| CREDITOS | creditos | IntegerField | |
| HORAS_TEORICAS | horas | IntegerField | |
| ID_FACULTAD | facultad_id | FK | |
| ACTIVA | activa | Boolean | |

#### b) **Asignatura-Programa**
- **Tabla Oracle:** `VW_ASIGNATURA_PROGRAMA` (UHORARIOS)
- **Tabla Staging:** `asignaturas_stgoracleaprograma`
- **Tabla Canon:** `asignaturas_asignaturaprograma`
- **Comando ETL:** `etl_oracle_asignatura_programa`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Staging | Campo Canon | Tipo |
|---|---|---|---|
| ID_ASIGNATURA_PROGRAMA | external_id | external_id | CharField |
| ID_PROGRAMA | id_programa_oracle | programa_id | FK |
| COD_ASIGNATURA | codigo_asignatura_oracle | asignatura_id | FK |
| SEMESTRE | semestre_oracle | semestre | IntegerField |
| TIPO_ASIGNATURA | tipo_asignatura_oracle | tipo | CharField |

---

### 5️⃣ **GRUPOS ACADÉMICOS (1 migración)**

- **Tabla Oracle:** `VW_GRUPOS_ACADEMICOS` (UHORARIOS)
- **Tabla Staging:** `grupos_stgoraclegrupo`
- **Tabla Canon:** `grupos_grupoaca...

demia`
- **Comando ETL:** `etl_oracle_grupos`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Staging | Campo Canon | Tipo | Notas |
|---|---|---|---|---|
| ID_GRUPO | external_id | external_id | CharField | PK Oracle |
| COD_GRUPO | codigo_grupo_oracle | codigo | CharField | Identificador |
| ID_PROGRAMA | id_programa_oracle | programa_id | FK | |
| ID_DOCENTE_TITULAR | id_docente_oracle | docente_id | FK | |
| ID_SEDE | id_sede_oracle | sede_id | FK | |
| SEMESTRE | semestre_oracle | semestre | IntegerField | |
| PERIODO_ACADEMICO | periodo_academico | periodo_id | FK | |
| JORNADA | jornada_oracle | jornada | CharField | Matutina/Vespertina |

---

### 6️⃣ **ESPACIOS FÍSICOS (1 migración)**

- **Tabla Oracle:** `VW_ESPACIOS_FISICOS` (UHORARIOS)
- **Tabla Staging:** `espacios_stgoracleespaciofisico`
- **Tabla Canon:** `espacios_espaciofisico`
- **Comando ETL:** `etl_oracle_espacios`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Staging | Campo Canon | Tipo | Notas |
|---|---|---|---|---|
| ID_ESPACIO | external_id | external_id | CharField | PK Oracle |
| CODIGO_ESPACIO | codigo_oracle | codigo | CharField | Identificador |
| NOMBRE_ESPACIO | nombre_oracle | nombre | CharField | |
| CAPACIDAD | capacidad_oracle | capacidad | IntegerField | |
| PISO | piso_oracle | piso | IntegerField | |
| ID_SEDE | id_sede_oracle | sede_id | FK | |
| TIPO_ESPACIO | tipo_espacio_oracle | tipo_id | FK | Aula/Lab/Otros |
| DISPONIBLE | disponible_oracle | disponible | Boolean | |

---

### 7️⃣ **HORARIOS (1 migración)**

- **Tabla Oracle:** `VW_HORARIO` (UHORARIOS)
- **Tabla Staging:** `horario_stgoraclehorario`
- **Tabla Canon:** `horario_horarioaca...demia`
- **Comando ETL:** `etl_oracle_horario`
- **Estado:** ✅ COMPLETADO

| Campo Oracle | Campo Staging | Campo Canon | Tipo | Notas |
|---|---|---|---|---|
| ID_HORARIO | external_id | external_id | CharField | PK Oracle |
| ID_GRUPO | id_grupo_oracle | grupo_id | FK | |
| ID_ESPACIO | id_espacio_oracle | espacio_id | FK | |
| DIA_SEMANA | dia_oracle | dia | CharField | Lunes-Viernes |
| HORA_INICIO | hora_inicio_oracle | hora_inicio | TimeField | |
| HORA_FIN | hora_fin_oracle | hora_fin | TimeField | |
| DOCENTES | docentes_oracle | (M2M) | ManyToMany | A través de tabla pivote |
| PERIODO_ACADEMICO | periodo_academico | periodo_id | FK | |

---

## 🔄 FLUJO DE MIGRACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORACLE (SIULEDU)                              │
│         VW_DOCENTES, VW_ESTUDIANTES, VW_PROGRAMAS, etc.         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    [ETL via oracledb Python]
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA STAGING (PostgreSQL)                     │
│   StgOracleDocente, StgOracleEstudiante, StgOraclePrograma, etc.│
│                                                                   │
│  ✅ Detección de cambios (row_hash)                              │
│  ✅ Validación de integridad                                     │
│  ✅ Idempotencia en upserts                                      │
│  ✅ Raw data JSON para auditoría                                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                     [Transformación Django ORM]
                                 │
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA PRODUCCIÓN (PostgreSQL)                  │
│    Usuario, Programa, Asignatura, Grupo, Horario, etc.         │
│                                                                   │
│  ✅ Datos normalizados                                           │
│  ✅ Relaciones FK resueltas                                      │
│  ✅ Validaciones de negocio aplicadas                            │
│  ✅ Historial y auditoría                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 CARACTERÍSTICAS DE SEGURIDAD Y CALIDAD

### Idempotencia
- Upserts basados en `(source_system, external_id)`
- No duplica registros en ejecuciones múltiples
- Permite re-ejecución segura

### Detección de Cambios
- Hash SHA256 del payload (`row_hash`)
- Detecta modificaciones en datos Oracle
- Actualiza solo registros que han cambiado

### Validación
- `--dry-run`: Simula sin guardar cambios
- Preview de primeros registros
- Confirmación interactiva antes de cargar

### Auditoría
- `raw_data` JSON: Preserva datos originales Oracle
- `fecha_carga`: Timestamp de ingesta
- `estado_registro`: Valid/Invalid markers
- Source system tracking: Trazabilidad de origen

### Límite de Registros
- `--limit N`: Restringe cantidad para testing
- Previene saturación en ambiente desarrollo

---

## 📊 ESTADO DE MIGRACIONES (A FECHA 12/05/2026)

| Módulo | Vista Oracle | Tabla Canon | Registros | Estado | Comando |
|---|---|---|---|---|---|
| 👥 Docentes | VW_DOCENTES | usuario (docente) | 8,884 | ✅ Completado | etl_oracle_docentes |
| 👨‍🎓 Estudiantes | VW_ESTUDIANTES | usuario (estudiante) | 40,000+ | 🔄 En Progreso | etl_oracle_estudiantes |
| 🏫 Sedes | VW_SEDES | sede | ? | ❓ Verificar | etl_oracle_sedes |
| 📚 Facultades | VW_FACULTAD | facultad | ? | ❓ Verificar | etl_oracle_facultades |
| 🎓 Programas | VW_PROGRAMAS_ACADEMICOS | programa | ? | ✅ Completado | etl_oracle_programas |
| 📖 Asignaturas | ASIGNATURA | asignatura | ? | ✅ Completado | etl_oracle_asignaturas |
| 🔗 Asig-Programa | VW_ASIGNATURA_PROGRAMA | asignaturaprograma | ? | ✅ Completado | etl_oracle_asignatura_programa |
| 👫 Grupos | VW_GRUPOS_ACADEMICOS | grupoaca...demia | ? | ✅ Completado | etl_oracle_grupos |
| 🏢 Espacios | VW_ESPACIOS_FISICOS | espaciofisico | ? | ✅ Completado | etl_oracle_espacios |
| ⏰ Horarios | VW_HORARIO | horarioaca...demia | ? | ✅ Completado | etl_oracle_horario |
| 🗂️ Staging | Múltiples | stgOracle* | - | ✅ Completado | etl_oracle_staging |

---

## 🛠️ TECNOLOGÍAS UTILIZADAS

- **ORM Python:** `oracledb` (Oracle Client 23.3+)
- **Database:** PostgreSQL 15
- **Framework:** Django 4.2.26+
- **Modelos Staging:** Django ORM con campos de auditoría
- **Transacciones:** Atómicas a nivel de módulo
- **Hash:** SHA256 para detección de cambios
- **Serialización:** JSON para raw_data

---

## 📝 NOTAS IMPORTANTES

1. **Credenciales Sensibles:** Los datos de conexión Oracle se pasan via:
   - Variables de entorno: `ORACLE_HOST`, `ORACLE_PORT`, `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_SERVICE`
   - O parámetros de línea de comando: `--host`, `--port`, `--user`, `--password`, `--service`

2. **Transacciones Atómicas:** Cada ETL carga todos sus registros en una transacción. Si falla, se revierte todo.

3. **Campos Sin Mapeo Directo:** Algunos campos Oracle se almacenan SOLO en staging para referencia:
   - `id_docente_oracle`, `numero_documento` (Docentes)
   - `id_estudiante_oracle`, `codigo_estudiante_oracle` (Estudiantes)
   - etc.

4. **Resolución de FKs:** Las relaciones foráneas se resuelven:
   - Primero en staging (lookups básicos)
   - Luego en capa canon (normalización completa)

5. **Diseño de 2 Capas Justificado:**
   - Mantiene datos brutos para auditoría
   - Permite replays de transformaciones
   - Desacopla extracción de transformación
   - Facilita debugging de problemas de integridad

---

**Documento Generado:** 12 de Mayo de 2026  
**Próxima Revisión:** Cuando se complete la migración de Estudiantes
