# Módulo Financiero (`financiero/`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

App más grande y reciente del backend (`models.py` ~865 líneas, `views.py` ~3000 líneas). Gestiona el ciclo de vida completo de facturación institucional:

- **Entidades principales**: `Proveedor`, `Departamento`, `CuentaContable` (PUC), `CentroCosto`, `Banco`/`TipoCuenta`.
- **`Factura`**: entidad central, con un flujo de **~18 estados**: Recibida → Registrada → Radicada → Causada → Alistada → Aprobada Auditoría → Cargada → Revisada Dirección Financiera → Enviada Rectoría → Autorizada → Pago Aplicado → Pagada (más ramas de rechazo/devolución en cualquier etapa).
- **`ItemFactura`**: líneas/ítems de cada factura.
- **`DocumentoAdjunto` / `DocumentoUnificado`**: soportes documentales, con copia opcional a NAS vía SMB.
- **`HistorialFactura`**: auditoría de cambios de estado.
- **`ComentarioFactura`**, **`RechazoDevolucion`**: seguimiento del proceso.
- **`ParametroSLA`** y **`ParametrosFinanciero`**: configuración runtime de tiempos de SLA y otros parámetros del módulo (lógica en `financiero/sla.py`).
- **`ReporteGenerado`**: reportes exportables (PDF/Excel) generados por el módulo.

> **Aviso de desactualización**: los documentos `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../GUIA_INTEGRACION_MODULO_FINANCIERO.md` describen un **diseño original propuesto** con modelos `Presupuesto`/`Transaccion`/`CentroFinanciero`/`AuditoriaFinanciera` que **no coinciden** con la implementación real (basada en `Factura` con flujo SLA). Útiles para entender la intención de diseño y el razonamiento de integración (por qué se decidió integrar el módulo en vez de crear un proyecto separado), pero no reflejan el estado final del código. El changelog en `../CAMBIOS_SIHUL_FINANCIERO.md` sí documenta cambios puntuales reales (ej. panel de Proveedor, deshabilitación de seed data de facturas demo).

Ver también [../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md](../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md) para los 8 dashboards financieros del frontend (uno por rol).
