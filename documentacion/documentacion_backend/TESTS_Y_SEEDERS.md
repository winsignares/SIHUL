# Tests y seeders del backend

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

## Tests

Las apps con pruebas tienen su `tests.py` (o varios `tests_*.py`, como en `financiero/`); las vacías se eliminaron. La CI corre además `ruff` (reglas F) y `mysite/tests_dependencias.py`, que vigila qué app puede importar a cuál. No hay pytest configurado; se ejecutan con `manage.py test` (ver `../general/ENTORNO_PRUEBAS.md`).

## Seeders

Los seeders individuales viven en `backend/mysite/management/commands/seeders/` (roles, sedes, tipos de espacio y de actividad,
facultades, programas, periodos, asignaturas, usuarios, espacios, componentes, grupos, horarios, agentes del chatbot, financiero…).
Hay **un solo comando para pruebas locales**:

```bash
docker compose exec backend python manage.py seed_initial_data
```

Carga todos los datos de demostración (incluye usuarios de prueba con contraseñas de ejemplo). Es idempotente: se puede repetir.
Para agregar datos, edita únicamente el seeder correspondiente y vuelve a ejecutar el comando.

`seed_required_data` carga solo la configuración que Oracle no provee (roles, sedes, componentes, periodos, agentes…) y sirve
para entornos con acceso a los ETL de Oracle (`etl_oracle_*`). No es necesario en pruebas locales.
