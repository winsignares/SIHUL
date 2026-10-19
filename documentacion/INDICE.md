# Documentación SIHUL — Índice

SIHUL es el Sistema de Información de Horarios de la Universidad Libre. El proyecto está compuesto por 4 módulos que se ejecutan como contenedores independientes orquestados por `docker-compose.yml`:

| Módulo | Carpeta | Tecnología | Documentación |
|---|---|---|---|
| Backend | `backend/` | Django 5.2 + DRF + PostgreSQL | [APPS_DJANGO.md](documentacion_unispace/backend/APPS_DJANGO.md) |
| Frontend | `frontend/` | React 19 + TypeScript + Vite | [ESTRUCTURA_Y_STACK.md](documentacion_unispace/frontend/ESTRUCTURA_Y_STACK.md) |
| Oracle (ETL) | integrado en `backend/` | `oracledb` (fuente externa) | [INTEGRACION_ETL_ORACLE.md](documentacion_unispace/oracle/INTEGRACION_ETL_ORACLE.md) |
| Chatbot | `chatbot/` | FastAPI + pgvector + OpenAI (RAG) | [ARQUITECTURA_RAG_CHATBOT.md](documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md) |

## Aviso importante sobre "Oracle"

La base de datos operativa de SIHUL **no es Oracle, es PostgreSQL** (`pgvector/pgvector:pg16`). Oracle es el sistema académico institucional (SIU/UHORARIOS) del cual el backend extrae datos periódicamente vía ETL (`oracledb`) hacia tablas de *staging* y de ahí a las tablas reales en PostgreSQL. Ver [INTEGRACION_ETL_ORACLE.md](documentacion_unispace/oracle/INTEGRACION_ETL_ORACLE.md) para el detalle del patrón ETL.

## Cómo está organizada esta carpeta

La documentación está dividida por dominio. Este archivo (`INDICE.md`) es el único punto de entrada; cada dominio tiene su propia carpeta.

```
documentacion/
├── INDICE.md                      ← punto de entrada
├── ARQUITECTURA_COMPLETA_ANALISIS.md
├── REFERENCIA_RAPIDA.md
├── ENTORNO_PRUEBAS.md
├── documentacion_unispace/        ← gestión de espacios (horarios, espacios, préstamos…)
│   ├── backend/
│   ├── oracle/
│   └── frontend/  (hooks/, paginas/, services/)
├── documentacion_financiero/      ← módulo financiero
│   ├── backend/
│   └── frontend/  (hooks/, paginas/, services/)
└── documentacion_chatbot/         ← chatbot RAG
    ├── frontend/  (hooks/, services/)
    └── pruebas_anexos/
```

### General (raíz)
- [ARQUITECTURA_COMPLETA_ANALISIS.md](ARQUITECTURA_COMPLETA_ANALISIS.md), [REFERENCIA_RAPIDA.md](REFERENCIA_RAPIDA.md): patrón de autenticación y componentes dinámicos.
- [ENTORNO_PRUEBAS.md](ENTORNO_PRUEBAS.md): histórico del entorno de pruebas.

### Unispace
- Backend: [APPS_DJANGO.md](documentacion_unispace/backend/APPS_DJANGO.md), [AUTENTICACION_Y_PERMISOS.md](documentacion_unispace/backend/AUTENTICACION_Y_PERMISOS.md), [CONFIGURACION_SETTINGS.md](documentacion_unispace/backend/CONFIGURACION_SETTINGS.md), [TESTS_Y_SEEDERS.md](documentacion_unispace/backend/TESTS_Y_SEEDERS.md).
- Oracle (ETL): [INTEGRACION_ETL_ORACLE.md](documentacion_unispace/oracle/INTEGRACION_ETL_ORACLE.md).
- Frontend: [ESTRUCTURA_Y_STACK.md](documentacion_unispace/frontend/ESTRUCTURA_Y_STACK.md), [ENRUTAMIENTO_DINAMICO.md](documentacion_unispace/frontend/ENRUTAMIENTO_DINAMICO.md), [PAGINAS_INDICE.md](documentacion_unispace/frontend/paginas/PAGINAS_INDICE.md), [HOOKS_INDICE.md](documentacion_unispace/frontend/hooks/HOOKS_INDICE.md), [SERVICES_INDICE.md](documentacion_unispace/frontend/services/SERVICES_INDICE.md), más los changelogs [RESPONSIVE_UPDATES.md](documentacion_unispace/frontend/RESPONSIVE_UPDATES.md) y [RESUMEN_NOTIFICACIONES.md](documentacion_unispace/frontend/RESUMEN_NOTIFICACIONES.md).

### Financiero
- [GUIA_INTEGRACION_MODULO_FINANCIERO.md](documentacion_financiero/GUIA_INTEGRACION_MODULO_FINANCIERO.md), [CAMBIOS_SIHUL_FINANCIERO.md](documentacion_financiero/CAMBIOS_SIHUL_FINANCIERO.md), [MODULO_FINANCIERO.md](documentacion_financiero/backend/MODULO_FINANCIERO.md).
- Frontend: [HOOKS_FINANCIERO.md](documentacion_financiero/frontend/hooks/HOOKS_FINANCIERO.md), [SERVICES_FINANCIERO.md](documentacion_financiero/frontend/services/SERVICES_FINANCIERO.md), [PAGINAS_CHATBOT_FINANCIERO.md](documentacion_financiero/frontend/paginas/PAGINAS_CHATBOT_FINANCIERO.md).

### Chatbot
- [ARQUITECTURA_RAG_CHATBOT.md](documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md), [ANEXOS_PREGUNTAS_RESPUESTAS.md](documentacion_chatbot/ANEXOS_PREGUNTAS_RESPUESTAS.md).
- Frontend: [HOOKS_CHATBOT_NOTIFICACIONES.md](documentacion_chatbot/frontend/hooks/HOOKS_CHATBOT_NOTIFICACIONES.md), [SERVICES_CHATBOT.md](documentacion_chatbot/frontend/services/SERVICES_CHATBOT.md).

**Ojo:** los modelos financieros de ejemplo en `ARQUITECTURA_COMPLETA_ANALISIS.md` y `GUIA_INTEGRACION_MODULO_FINANCIERO.md` (`Presupuesto`, `Transaccion`, `CentroFinanciero`) corresponden al **diseño original propuesto**, no al modelo realmente implementado (`Factura`, `Proveedor`, `CuentaContable`, ver [MODULO_FINANCIERO.md](documentacion_financiero/backend/MODULO_FINANCIERO.md)).

## Infraestructura general (Docker)

El stack de desarrollo se levanta con `docker-compose.yml` (proyecto `sihul`) y consta de 4 servicios sobre una red bridge compartida (`sihul_network`):

| Servicio | Build | Puerto host | Notas |
|---|---|---|---|
| `db` | `pgvector/pgvector:pg16` | `5432` | PostgreSQL con extensión `pgvector`; compartido por backend y chatbot. |
| `backend` | `backend.Dockerfile` | `8000` | Django dev server (`runserver`), hot-reload vía volumen montado, corre `migrate --fake-initial --noinput` al iniciar. |
| `chatbot` | `chatbot.Dockerfile` | `8001` | FastAPI (`uvicorn --reload`), usa su propio `chatbot/.env`. |
| `frontend` | `frontend.Dockerfile` | `5173` | Vite dev server con hot-reload (polling), `VITE_API_URL`/`VITE_CHATBOT_URL` apuntan a los otros dos servicios. |

Existe además `docker-compose.test.yml`: una copia aislada del stack (puertos y red distintos, cookies de sesión con nombre distinto) pensada para pruebas end-to-end sin interferir con el entorno de desarrollo. Está documentada en detalle en [ENTORNO_PRUEBAS.md](ENTORNO_PRUEBAS.md).

Variables de entorno:
- `.env.example` (raíz): solo variables de almacenamiento NAS del módulo financiero. El resto de configuración del stack de desarrollo está hardcodeada en `docker-compose.yml`.
- `.env.test.example` (raíz): plantilla completa para el stack de test (puertos, credenciales, `DJANGO_SECRET_KEY`, CORS/CSRF, OAuth Microsoft opcional, config. del chatbot, `ETL_PERIODO`).
- `chatbot/.env`: configuración propia del servicio de chatbot (independiente del `.env` de la raíz).
- Variables `ORACLE_*` (host/puerto/usuario/password/service): **no** están en ninguna plantilla `.env`; se deben proveer manualmente al ejecutar los comandos ETL (ver [INTEGRACION_ETL_ORACLE.md](documentacion_unispace/oracle/INTEGRACION_ETL_ORACLE.md)).

## Módulos de dominio (resumen ejecutivo)

SIHUL gestiona información académica de la Universidad Libre (sedes, facultades, programas, periodos, grupos, asignaturas, horarios, espacios físicos, préstamos de espacios/recursos) más dos módulos transversales:

- **Financiero**: gestión de facturación institucional (proveedores, cuentas contables PUC, centros de costo, flujo de aprobación de facturas con ~18 estados, documentos adjuntos en NAS, reportes).
- **Chatbot (RAG)**: asistente conversacional que responde preguntas en lenguaje natural sobre documentos cargados en el sistema, usando embeddings vectoriales y OpenAI.

El acceso a cada pantalla no está hardcodeado por rol: existe un sistema de **componentes dinámicos** (`Componente` + `ComponenteRol` + overrides `ComponenteUsuario`) que el backend entrega al hacer login, y que el frontend usa para construir el menú y proteger rutas en caliente, sincronizando cambios de permisos cada 7 segundos sin recargar la página. Ver detalle en [AUTENTICACION_Y_PERMISOS.md](documentacion_unispace/backend/AUTENTICACION_Y_PERMISOS.md) y [ENRUTAMIENTO_DINAMICO.md](documentacion_unispace/frontend/ENRUTAMIENTO_DINAMICO.md).
