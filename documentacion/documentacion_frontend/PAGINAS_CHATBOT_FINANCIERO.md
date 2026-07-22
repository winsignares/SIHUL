# Páginas: Chatbot y Financiero

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

## `frontend/src/pages/chatbot/`

- `AsistentesVirtuales.tsx` — UI del chatbot, reutilizada con distinta ruta según el rol (admin, supervisor, docente, estudiante, pública). Ver [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md) para el backend RAG.

## `frontend/src/pages/financiero/`

8 subcarpetas, un dashboard lazy-loaded por rol:

- `funcionario/`
- `proveedor/` (+ `FacturaDetalle.tsx`)
- `contabilidad/`
- `tesoreria/`
- `auditoria/`
- `direccion_financiera/`
- `rectoria/`
- `admin_financiero/`

Ver [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md) para el modelo de datos (`Factura`) y el flujo de estados correspondiente en el backend.
