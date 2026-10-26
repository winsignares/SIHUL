# Documentación SIHUL — Índice

SIHUL es el Sistema de Información de Horarios de la Universidad Libre. El proyecto está compuesto por 4 módulos que se ejecutan como contenedores independientes orquestados por `docker-compose.yml`:

| Módulo | Carpeta | Tecnología | Documentación |
|---|---|---|---|
| Backend | `backend/` | Django 5.2 + DRF + PostgreSQL | [documentacion_backend/APPS_DJANGO.md](documentacion_backend/APPS_DJANGO.md) |
| Frontend | `frontend/` | React 19 + TypeScript + Vite | [documentacion_frontend/ESTRUCTURA_Y_STACK.md](documentacion_frontend/ESTRUCTURA_Y_STACK.md) |
| Oracle (ETL) | integrado en `backend/` | `oracledb` (fuente externa) | [documentacion_oracle/INTEGRACION_ETL_ORACLE.md](documentacion_oracle/INTEGRACION_ETL_ORACLE.md) |
| Chatbot | `chatbot/` | FastAPI + pgvector + OpenAI (RAG) | [documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md) |

## Aviso importante sobre "Oracle"

La base de datos operativa de SIHUL **no es Oracle, es PostgreSQL** (`pgvector/pgvector:pg16`). Oracle es el sistema académico institucional (SIU/UHORARIOS) del cual el backend extrae datos periódicamente vía ETL (`oracledb`) hacia tablas de *staging* y de ahí a las tablas reales en PostgreSQL. Ver [documentacion_oracle/INTEGRACION_ETL_ORACLE.md](documentacion_oracle/INTEGRACION_ETL_ORACLE.md) para el detalle del patrón ETL.

## Cómo está organizada esta carpeta

- **Este archivo (`INDICE.md`)**: punto de entrada, mapa general del sistema y de la infraestructura Docker.
- **`documentacion_backend/`**: dividida por tema — [APPS_DJANGO.md](documentacion_backend/APPS_DJANGO.md) (listado de apps), [AUTENTICACION_Y_PERMISOS.md](documentacion_backend/AUTENTICACION_Y_PERMISOS.md) (RBAC dinámico por componente), [CONFIGURACION_SETTINGS.md](documentacion_backend/CONFIGURACION_SETTINGS.md) (`settings.py`), [MODULO_FINANCIERO.md](documentacion_backend/MODULO_FINANCIERO.md), [TESTS_Y_SEEDERS.md](documentacion_backend/TESTS_Y_SEEDERS.md).
- **`documentacion_frontend/`**: dividida en [ESTRUCTURA_Y_STACK.md](documentacion_frontend/ESTRUCTURA_Y_STACK.md), [ENRUTAMIENTO_DINAMICO.md](documentacion_frontend/ENRUTAMIENTO_DINAMICO.md) (`AuthContext`, `componentRoutes.ts`, `AppRouter.tsx`), [PAGINAS_INDICE.md](documentacion_frontend/PAGINAS_INDICE.md) (un archivo por dominio de páginas), [HOOKS_INDICE.md](documentacion_frontend/HOOKS_INDICE.md) (hooks por dominio + patrón de cache) y [SERVICES_INDICE.md](documentacion_frontend/SERVICES_INDICE.md) (clientes API por dominio + `core/` base). También conserva changelogs previos ([RESPONSIVE_UPDATES.md](documentacion_frontend/RESPONSIVE_UPDATES.md), [RESUMEN_NOTIFICACIONES.md](documentacion_frontend/RESUMEN_NOTIFICACIONES.md)).
- **`documentacion_oracle/INTEGRACION_ETL_ORACLE.md`**: patrón ETL (staging → promoción a tablas reales), comandos disponibles, variables de entorno necesarias.
- **`documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md`**: arquitectura RAG del servicio FastAPI y su integración como proxy a través del backend Django.
- **Documentos raíz existentes** (`ARQUITECTURA_COMPLETA_ANALISIS.md`, `REFERENCIA_RAPIDA.md`, `GUIA_INTEGRACION_MODULO_FINANCIERO.md`, `CAMBIOS_SIHUL_FINANCIERO.md`, `ENTORNO_PRUEBAS.md`): documentan bien el patrón de autenticación y componentes dinámicos, y el histórico del entorno de pruebas. **Ojo:** los modelos financieros de ejemplo en `ARQUITECTURA_COMPLETA_ANALISIS.md` y `GUIA_INTEGRACION_MODULO_FINANCIERO.md` (`Presupuesto`, `Transaccion`, `CentroFinanciero`) corresponden al **diseño original propuesto**, no al modelo realmente implementado (`Factura`, `Proveedor`, `CuentaContable`, ver [documentacion_backend/MODULO_FINANCIERO.md](documentacion_backend/MODULO_FINANCIERO.md)).

## Infraestructura general (Docker)

El stack de desarrollo se levanta con `docker-compose.yml` (proyecto `sihul`) y consta de 4 servicios sobre una red bridge compartida (`sihul_network`):

| Servicio | Build | Puerto host | Notas |
|---|---|---|---|
| `db` | `pgvector/pgvector:pg16` | `5432` | PostgreSQL con extensión `pgvector`; compartido por backend y chatbot. |
| `backend` | `backend.Dockerfile` | `8000` | Django dev server (`runserver`), hot-reload vía volumen montado, corre `migrate --fake-initial --noinput` al iniciar. |
| `chatbot` | `chatbot.Dockerfile` | `8001` | FastAPI (`uvicorn --reload`), recibe `OPENAI_API_KEY` desde el `.env` de la raíz. |
| `frontend` | `frontend.Dockerfile` | `5173` | Vite dev server con hot-reload (polling), `VITE_API_URL` apunta al backend. |

Los entornos desplegados (pruebas y producción) usan otro compose, en `despliegue/` (ver [ENTORNO_PRUEBAS.md](ENTORNO_PRUEBAS.md) y `despliegue/README.md`).

### Variables de entorno (dónde vive cada una)

| Entorno | Archivo (NO se versiona) | Plantilla (sí se versiona) | Quién lo lee |
|---|---|---|---|
| Desarrollo local | `.env` en la raíz | `.env.example` | `docker-compose.yml`: el backend recibe el `.env`; el chatbot recibe solo `OPENAI_API_KEY` y las variables de su base |
| Pruebas | `despliegue/env/test.env` (permisos 600) | `despliegue/env/test.env.example` | `despliegue/compose/docker-compose.yml` |
| Producción | `despliegue/env/prod.env` (permisos 600) | `despliegue/env/prod.env.example` | `despliegue/compose/docker-compose.yml` |

- **Un solo archivo de variables por entorno.** Ya no existen `chatbot/.env`, `.env.db` ni `.env.test`.
- **Mínimo privilegio:** cada contenedor recibe solo las variables que usa (la llave de OpenAI llega únicamente al chatbot; el
  backend la recibe vacía aunque esté en el `.env`).
- **Qué se versiona:** solo las plantillas `*.example`. `.gitignore` ignora cualquier otro `.env` o `*.env`.
- **Nunca** escribir contraseñas, llaves ni usuarios de Oracle o del NAS en el código, en scripts ni en documentos: van en el
  archivo de variables del entorno.
- Variables `ORACLE_*` (host, puerto, usuario, contraseña, servicio): no están en las plantillas; se proveen al ejecutar los
  comandos ETL (ver [documentacion_oracle/INTEGRACION_ETL_ORACLE.md](documentacion_oracle/INTEGRACION_ETL_ORACLE.md)).

## Módulos de dominio (resumen ejecutivo)

SIHUL gestiona información académica de la Universidad Libre (sedes, facultades, programas, periodos, grupos, asignaturas, horarios, espacios físicos, préstamos de espacios/recursos) más dos módulos transversales:

- **Financiero**: gestión de facturación institucional (proveedores, cuentas contables PUC, centros de costo, flujo de aprobación de facturas con ~18 estados, documentos adjuntos en NAS, reportes).
- **Chatbot (RAG)**: asistente conversacional que responde preguntas en lenguaje natural sobre documentos cargados en el sistema, usando embeddings vectoriales y OpenAI.

El acceso a cada pantalla no está hardcodeado por rol: existe un sistema de **componentes dinámicos** (`Componente` + `ComponenteRol` + overrides `ComponenteUsuario`) que el backend entrega al hacer login, y que el frontend usa para construir el menú y proteger rutas en caliente, sincronizando cambios de permisos cada 7 segundos sin recargar la página. Ver detalle en [documentacion_backend/AUTENTICACION_Y_PERMISOS.md](documentacion_backend/AUTENTICACION_Y_PERMISOS.md) y [documentacion_frontend/ENRUTAMIENTO_DINAMICO.md](documentacion_frontend/ENRUTAMIENTO_DINAMICO.md).
