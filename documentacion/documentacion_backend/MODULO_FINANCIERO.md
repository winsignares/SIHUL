# Módulo Financiero (`financiero/`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

App más grande y reciente del backend, dividida por recurso: `api/` (un archivo por recurso: `facturas/` — paquete con un módulo por etapa del flujo (`registro`, `contabilidad`, `auditoria`, `direccion_rectoria`, `tesoreria`, `devolucion`, `consultas`, `documentos`) reunidos en `FacturaViewSet` (`viewset.py`) —, `proveedores.py`, `documentos.py`, `catalogos.py`, `parametros.py`, `reportes.py`, `historial.py`, más `archivos_documentos.py` y `expediente_nas.py` de apoyo), `models/` (un archivo por entidad, reexportadas en `models/__init__.py`), `serializers/` (`catalogos`, `documentos`, `historial` y `facturas`, reexportados en `serializers/__init__.py`), `flujo_factura/` con los pasos del flujo (un módulo por quien actúa: `contabilidad`, `tesoreria`, `auditoria`, `direccion_rectoria`, `devolucion`, `registro`, `archivos`; lo común en `_base`), `archivos.py` con los PDF y Excel que genera). Gestiona el ciclo de vida completo de facturación institucional:

- **Entidades principales**: `Proveedor`, `Departamento`, `CuentaContable` (PUC), `CentroCosto`, `Banco`/`TipoCuenta`.
- **`Factura`**: entidad central, con un flujo de **~18 estados**: Recibida → Registrada → Radicada → Causada → Alistada → Aprobada Auditoría → Cargada → Revisada Dirección Financiera → Enviada Rectoría → Autorizada → Pago Aplicado → Pagada (más ramas de rechazo/devolución en cualquier etapa).
- **`ItemFactura`**: líneas/ítems de cada factura.
- **`DocumentoAdjunto` / `DocumentoUnificado`**: soportes documentales, con copia opcional a NAS vía SMB.
- **`HistorialFactura`**: auditoría de cambios de estado.
- **`ComentarioFactura`**, **`RechazoDevolucion`**: seguimiento del proceso.
- **`ParametroSLA`** y **`ParametrosFinanciero`**: configuración runtime de tiempos de SLA y otros parámetros del módulo (lógica en `financiero/sla.py`).
- **`ReporteGenerado`**: reportes exportables (PDF/Excel) generados por el módulo.

> **Aviso de desactualización**: los documentos `../general/ARQUITECTURA_COMPLETA_ANALISIS.md` y `../historico/GUIA_INTEGRACION_MODULO_FINANCIERO.md` describen un **diseño original propuesto** con modelos `Presupuesto`/`Transaccion`/`CentroFinanciero`/`AuditoriaFinanciera` que **no coinciden** con la implementación real (basada en `Factura` con flujo SLA). Útiles para entender la intención de diseño y el razonamiento de integración (por qué se decidió integrar el módulo en vez de crear un proyecto separado), pero no reflejan el estado final del código. El changelog en `../historico/CAMBIOS_SIHUL_FINANCIERO.md` sí documenta cambios puntuales reales (ej. panel de Proveedor, deshabilitación de seed data de facturas demo).

Ver también [../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md](../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md) para los 8 dashboards financieros del frontend (uno por rol).

## Quién ejecuta cada paso del flujo de la factura
La API comprueba el estado de la factura y también el rol de quien ejecuta el paso (`financiero/permissions.py::ROLES_POR_PASO`). La administración (general, del sistema y financiera) puede ejecutar todos.

| Paso | Rol |
|---|---|
| `radicar`, `causar` | Contabilidad |
| `alistar`, `enviar_direccion_financiera`, `detener_en_tesoreria`, `registrar_pago_aplicado`, `generar_comprobante` | Tesorería |
| `aprobar_auditoria`, `rechazar_auditoria` | Auditoría |
| `cargar_direccion_financiera`, `enviar_rectoria`, `generar_numero_confirmacion`, `confirmar_control_pago` | Dirección Financiera |
| `autorizar_rectoria`, `rechazar_rectoria` | Rectoría |
| `rechazar` (devolución) | Funcionario, Contabilidad, Tesorería, Auditoría, Dirección Financiera y Rectoría |

Un rol que no corresponde recibe 403. `completar_registro` y `corregir` conservan sus reglas propias.
