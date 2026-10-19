# Integración con Oracle (ETL)

**Oracle no es la base de datos de SIHUL.** La base de datos operativa de la aplicación es PostgreSQL (`pgvector/pgvector:pg16`, servicio `db` en `docker-compose.yml`). Oracle es el **sistema fuente externo**: el SIU/UHORARIOS académico institucional de la Universidad Libre, del cual el backend Django extrae periódicamente información mediante procesos ETL usando el driver `oracledb`.

No existe una carpeta `oracle/` en la raíz del repo, ni un `docker-compose` que levante una instancia Oracle local: se asume una instancia Oracle institucional remota ya existente, a la que el backend se conecta como cliente.

## Conexión

Cada comando ETL construye su propia conexión Oracle leyendo variables de entorno:

- `ORACLE_HOST`
- `ORACLE_PORT` (default `1521`)
- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_SERVICE`

**Estas variables no están definidas en `.env.example` ni `.env.test.example`** — deben proveerse manualmente (como variables de entorno del contenedor `backend` o como argumentos del comando) antes de ejecutar cualquier ETL.

## Vistas fuente conocidas (esquema `UHORARIOS`)

- `VW_ESTUDIANTES`
- `VW_PROGRAMAS_ACADEMICOS`
- Vistas equivalentes para docentes, grupos, horarios, espacios, facultades, sedes y asignaturas (una por dominio, mismo patrón).

## Patrón ETL

El flujo es el mismo para todos los dominios (ejemplo tomado de `usuarios/management/commands/etl_oracle_estudiantes.py`):

1. **Query Oracle parametrizada** por periodo académico (`settings.ETL_PERIODO`) y, opcionalmente, por `--seccional` (usando `mysite/oracle_seccional_filter.py` para filtrar vía subquery a `VW_PROGRAMAS_ACADEMICOS`).
2. **Hash de fila** (`row_hash`) para detectar cambios de forma idempotente sin reprocesar todo cada vez.
3. **Staging**: cada fila se guarda en un modelo `Stg*` (ej. `StgOracleEstudiante`, `StgOracleDocente`, `StgOracleGrupoAcademico`, `StgOracleEspacioFisico`, `StgOracleHorario`, `StgOraclePrograma`) con `source_system='ORACLE_SIU'`, `external_id`, `raw_data` (JSON crudo) y `estado_registro`.
4. **Flags de ejecución**: `--dry-run`, `--limit`, `--offset`, `--batch-size` para pruebas y cargas incrementales controladas.
5. **Promoción a tablas reales**: un paso posterior (`migrate_staging_to_real.py`, `sincronizar_oracle.py`) mergea los datos de staging hacia las tablas de dominio reales (Usuario, Grupo, Horario, etc.) en PostgreSQL.

## Comandos disponibles por app

| App | Comando(s) |
|---|---|
| `usuarios` | `etl_oracle_docentes`, `etl_oracle_estudiantes`, `migrate_staging_to_real`, `sincronizar_oracle` |
| `sedes` | `etl_oracle_facultades`, `etl_oracle_sedes`, `etl_oracle_staging` |
| `programas` | `etl_oracle_programas` |
| `asignaturas` | `etl_oracle_asignaturas`, `etl_oracle_asignatura_programa`, `sync_asignaturas_sede_oracle` |
| `grupos` | `etl_oracle_grupos` |
| `horario` | `etl_oracle_horario` |
| `espacios` | `etl_oracle_espacios` |

Ejecución típica (dentro del contenedor backend, con las variables `ORACLE_*` exportadas):

```
docker compose exec backend python manage.py etl_oracle_estudiantes --dry-run
docker compose exec backend python manage.py etl_oracle_estudiantes
docker compose exec backend python manage.py migrate_staging_to_real
```

## Normalización de seccionales

`mysite/oracle_seccional_filter.py` define los nombres canónicos de seccional (Nacional, Virtual, El Socorro, Cali, Barranquilla, Bogotá, Cúcuta, Cartagena, Pereira) y un diccionario de alias para limpiar inconsistencias del dato Oracle crudo antes de filtrar la extracción por sede/seccional.

## Migraciones relacionadas (historial de esta integración)

- `espacios/migrations/0007_stgoracleespaciofisico.py`
- `grupos/migrations/0002_stgoraclegrupoacademico.py`
- `horario/migrations/0005_*.py`, `0006_*.py`
- `programas/migrations/0004_stgoracleprograma.py`
- `sedes/migrations/0004_oracle_staging_mapping_and_external_fields.py`
- `usuarios/migrations/0008_*.py`, `0009_*.py`, `0010_*.py`

No hay dump ni script `.sql` de esquema Oracle en el repositorio: la estructura de las vistas fuente vive únicamente en la base Oracle institucional.
