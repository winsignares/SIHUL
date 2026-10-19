# Tests y seeders del backend

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

## Tests

Cada app tiene `tests.py`; la mayoría son el placeholder por defecto de Django. Con contenido real: `financiero/tests.py` (159 líneas), `prestamos/tests.py` (62 líneas), `periodos/tests.py` (47 líneas). No hay pytest configurado; se ejecutan con `manage.py test` (ver `../ENTORNO_PRUEBAS.md`).

## Seeders

`backend/mysite/management/commands/seed_all.py` orquesta los seeders individuales en `backend/mysite/management/commands/seeders/`: roles, componentes, componentes-rol, sedes, usuarios, espacios, financiero (`financiero_seeder.py`, `financiero_facturas_stress_seeder.py` para pruebas de carga). `backend/mysite/comandos.txt` documenta los comandos manuales típicos vía `docker compose exec`.
