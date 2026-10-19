# Estructura actual del backend financiero

> Reemplaza lo descrito en `MODULO_FINANCIERO.md` sobre el archivo unico `financiero/models.py`/`views.py`:
> el dominio esta dividido en sub-apps autocontenidas. Las rutas `api/financiero/...` no cambiaron.

```
backend/financiero/
├── apps.py, urls.py            # contenedor + router unico (monta las urls de cada sub-app)
├── migrations/                 # historial original 0001-0027 (NO mover: lo exigen las BD existentes)
├── management/commands/        # repair_financiero, reset_financiero (mantenimiento, requieren --confirm)
├── tests/                      # test_facturas.py, test_proveedores.py
├── proveedores/   Proveedor, Pais, DepartamentoGeografico, Ciudad
├── contabilidad/  Departamento, CuentaContable, CentroCosto, Banco, TipoCuenta
├── parametros/    ParametroSLA, ParametrosFinanciero
├── reportes/      ReporteGenerado
└── facturas/
    ├── models, serializers, urls, admin
    ├── sla.py, signals.py, upload_paths.py, shared_storage.py
    └── views/  factura.py (compone los mixins) + factura_{base,pdf,registro,aprobacion,tesoreria,consultas}.py,
                documentos.py, historial.py, helpers.py
```

Cada modelo conserva `Meta.db_table = 'financiero_<modelo>'`: las tablas no se renombraron. El traslado de
modelos entre apps se hizo con migraciones solo-estado (`SeparateDatabaseAndState`, 0 DDL).

## Datos iniciales (siempre manual)
```bash
docker compose run --rm seed                                          # todo (demo)
docker compose run --rm seed python manage.py seed --solo-requeridos  # solo lo necesario en produccion
docker compose run --rm seed python manage.py seed --listar           # ver pasos
docker compose run --rm seed python manage.py seed --solo financiero  # un paso
docker compose run --rm seed python manage.py seed --con-divipola     # + municipios del DANE (red)
```
Los seeders viven en `backend/config/management/commands/seeders/`; el orden esta en `seeders/registro.py`.
