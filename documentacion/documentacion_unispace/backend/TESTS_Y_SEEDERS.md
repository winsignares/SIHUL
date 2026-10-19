# Tests y seeders del backend

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

## Tests

Cada app tiene `tests.py`; la mayoría son el placeholder por defecto de Django. Con contenido real: `financiero/tests.py` (159 líneas), `prestamos/tests.py` (62 líneas), `periodos/tests.py` (47 líneas). No hay pytest configurado; se ejecutan con `manage.py test` (ver `../ENTORNO_PRUEBAS.md`).

## Seeders

El comando único `python manage.py seed` (`backend/config/management/commands/seed.py`) ejecuta, siempre de forma manual, los seeders registrados en orden en `backend/config/management/commands/seeders/registro.py` (flags: `--solo-requeridos`, `--solo a,b`, `--con-divipola`, `--listar`; en Docker: `docker compose run --rm seed`). Seeders disponibles: roles, componentes, componentes-rol, sedes, usuarios, espacios, financiero (`financiero_seeder.py`, `financiero_facturas_stress_seeder.py` para pruebas de carga). 
