# 🔐 SIHUL – Web Security Audit & Mitigation Report (v2026-05-30)

## Resumen Ejecutivo
- **Estado general:** Mitigaciones aplicadas y controles en marcha
- **Ámbito:** Backend (Django/DRF), Frontend (React/Vite), Chatbot (FastAPI), Docker/Nginx
- **Módulos:** Académico + Financiero + Chatbot
- **Severidades abordadas:** Alta y Crítica (CSRF, IDOR, XSS, Secrets/Config, Uploads, Dependencias, SQLi puntual)

---

## Hallazgos y Mitigaciones por Categoría

### 1) CSRF (Cross-Site Request Forgery)
- **Hallazgo:** ~170 endpoints con `@csrf_exempt` en múltiples apps. Riesgo alto de CSRF en operaciones de escritura.
- **Mitigación aplicada:**
  - **Middleware global:** `mysite.csrf_protection.JSONCsrfMiddleware` que exige header `X-CSRFToken` para `POST/PUT/PATCH/DELETE` y devuelve 403 si falta.
  - **Endpoint de token:** `GET /api/csrf-token/` (urls de `mysite`) para obtener token válido por sesión.
  - **Settings:** Cookies `SameSite=Lax`, `SESSION_COOKIE_HTTPONLY=True`.
  - **Frontend:** Debe enviar `X-CSRFToken` en todas las mutaciones.
- **Archivos:**
  - `backend/mysite/csrf_protection.py` (nuevo)
  - `backend/mysite/settings.py` (reemplazo del middleware CSRF por el personalizado)
  - `backend/mysite/urls.py` (agregado endpoint del token)
- **Estado:** Protegido en 170+ endpoints. Requiere front enviando token.

### 2) IDOR (Insecure Direct Object Reference)
- **Hallazgo:** Accesos y modificaciones de recursos sin validar propiedad/rol.
- **Mitigación (sesiones previas, confirmada):**
  - **Patrones:** Admin-only en escrituras, Same-User-or-Admin, filtros por seccional, validación de propiedad, RBAC.
  - **Cobertura:** 110+ endpoints (Académico + Financiero).
- **Archivos clave:** `grupos/views.py`, `asignaturas/views.py`, `programas/views.py`, `facultades/views.py`, `sedes/views.py`, `recursos/views.py`, `horario/views.py`, `financiero/views.py`, `mysite/auth_helpers.py`, `mysite/seccional_auth.py`.
- **Estado:** Blindaje aplicado y verificado.

### 3) XSS (Cross-Site Scripting)
- **Hallazgo:** Entradas potencialmente peligrosas en payloads JSON y formularios.
- **Mitigación:** Sanitización centralizada vía `sanitize_dict` y esquemas por módulo.
- **Ejemplos de cambios previos:**
  - `backend/componentes/serializers.py` (sanitize en `validate`)
  - `backend/notificaciones/serializers.py` + `mysite/xss_protection.py` (esquemas actualizados)
  - Controles en vistas de notificaciones legacy
- **Estado:** Activo y validado al inicio de los serializers/vistas relevantes.

### 4) Uploads / Manejo de Archivos (Financiero)
- **Hallazgo:** Riesgo de archivos maliciosos, names leak y rutas predecibles.
- **Mitigación aplicada en `DocumentoAdjunto`:**
  - **Validaciones fuertes:** extensión permitida (pdf/xml/png/jpg/jpeg), tamaño máx 10MB, MIME, magic-bytes (PDF/PNG/JPG/XML) y rechazo de HTML camuflado.
  - **Nombre seguro:** sanitización de `nombre_archivo` y **almacenamiento con UUID** para evitar filtración/colisiones.
  - **Reglas de integridad:** exigir al menos uno entre `archivo` o `url_storage` y validar `url_storage` (http/https o vacío).
- **Archivos:** `backend/financiero/serializers.py`.
- **Estado:** Blindado y compatible con flujos actuales.

### 5) Dependencias (Dependency Vulnerabilities)
- **Hallazgo:** Paquetes con rangos abiertos o sin pin en backend; frontend con rangos `^` (correcto si se versiona lockfile).
- **Mitigación aplicada (backend):** pins seguros en `backend/requirements.txt`:
  - `gunicorn==21.2.0`, `django-environ==0.11.2`, `werkzeug==3.0.3`, `cryptography==42.0.8`, `oracledb==2.1.1` (resto ya fijos)
- **Auditoría continua (CI):** `.github/workflows/dependency-audit.yml`
  - Python: `pip-audit` + `safety` (backend y chatbot)
  - Node: `npm audit --omit=dev` (frontend)
- **Frontend:** `frontend/package.json` con `"engines": { "node": ">=20 <21" }` para builds reproducibles; mantener `package-lock.json` en git.
- **Estado:** Control de drift y auditoría automática activos.

### 6) Secrets / Config Exposure
- **Hallazgo:** `docker-compose.yml` con secretos en claro (DB, reCAPTCHA, pgAdmin, DATABASE_URL chatbot).
- **Mitigación aplicada:**
  - **Variables de entorno** con defaults dev seguros; sin claves reales en YAML.
  - **Eliminado** `DATABASE_URL` inline del chatbot (usar `chatbot/.env`).
  - **.gitignore** reforzado para **no subir `.env`** (frontend/chatbot/recursivo), `node_modules`, `dist` y logs.
  - **Producción:** `settings.py` exige `DJANGO_SECRET_KEY` cuando `ENVIRONMENT=production` y aplica **SSL/HSTS/headers** de seguridad, CORS/CSRF desde env.
- **Archivos:** `docker-compose.yml`, `backend/mysite/settings.py`, `.gitignore`.
- **Estado:** Secretos fuera del repo; fallas seguras si falta SECRET_KEY en prod.

### 7) SQL Injection
- **Hallazgo:** Comando de sincronización Oracle ejecutaba query cruda desde CLI.
- **Mitigación aplicada (previa):** validación estricta que **solo permite SELECT** seguros y limita ejecución.
- **Archivo:** `backend/usuarios/management/commands/sincronizar_oracle.py`.
- **Estado:** Riesgo mitigado.

### 8) Escaneo Pasivo (OWASP ZAP Baseline)
- **Objetivo:** Detección continua de headers inseguros, cookies, CORS, enlaces mixtos, etc. sin ataques activos.
- **Implementación:**
  - **Local Docker:** `docker-compose.zap.yml`
    - Ejecutar: `docker compose up -d db backend frontend nginx`
    - Luego: `docker compose -f docker-compose.yml -f docker-compose.zap.yml run --rm zap`
    - Reporte: `zap-reports/zap-baseline.html`
  - **CI GitHub Actions:** `.github/workflows/zap-baseline.yml` (contra `http://localhost:8081`)
- **Estado:** Listo para ejecutar; ajustar a Staging/Prod cuando corresponda.

---

## Cambios Clave (Lista de Archivos)
- **CSRF**
  - `backend/mysite/csrf_protection.py` (nuevo)
  - `backend/mysite/settings.py` (middleware + endurecimiento prod + throttling DRF)
  - `backend/mysite/urls.py` (ruta `/api/csrf-token/`)
- **Uploads**
  - `backend/financiero/serializers.py` (validaciones, nombre UUID, `url_storage`)
- **Dependencias / CI**
  - `backend/requirements.txt` (pins seguros)
  - `.github/workflows/dependency-audit.yml` (pip-audit, safety, npm audit)
  - `frontend/package.json` (campo `engines` Node 20)
- **Secrets/Config**
  - `docker-compose.yml` (secretos via env, sin claves en claro)
  - `.gitignore` (ignorar `.env`, `node_modules`, `dist`, logs)
  - `docker-compose.zap.yml` (escaneo pasivo local)
  - `.github/workflows/zap-baseline.yml` (escaneo pasivo en CI)
- **XSS / IDOR / SQLi previos**
  - `backend/componentes/serializers.py`, `backend/notificaciones/serializers.py`, `backend/mysite/xss_protection.py`
  - Múltiples `views.py` (IDOR)
  - `backend/usuarios/management/commands/sincronizar_oracle.py` (SQLi)

---

## Validaciones Recomendadas (Rápidas)
- **CSRF:**
  - GET `/api/csrf-token/` → usar `csrfToken` en `X-CSRFToken` para `POST/PUT/PATCH/DELETE`.
  - Sin header debe dar 403; con header, 2xx/4xx según lógica.
- **Uploads:**
  - Rechazo de HTML renombrado a `.pdf` o `.xml` (400).
  - Rechazo >10MB (400).
  - Nombre almacenado aleatorio (UUID) y `nombre_archivo` saneado.
- **CI Auditoría:**
  - Ver que `Dependency Audit` corra en PR/push y semanal.
  - Ejecutar `ZAP Baseline` local y revisar `zap-reports/zap-baseline.html`.
- **Prod Env:**
  - `ENVIRONMENT=production`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DJANGO_SECRET_KEY`, `DB_*`, `RECAPTCHA_*`, `CHATBOT_FASTAPI_URL`, `VITE_*`.

---

## Riesgos Residuales y Próximos Pasos
- **ZAP Baseline:** ejecutar local, corregir headers/cookies señalados como High/Critical; luego programar en Staging.
- **Secret Scanning:** opcional agregar `gitleaks` en CI para evitar commits de secretos.
- **Rotación de Claves:** rotar **DB** y **reCAPTCHA** que estuvieron hardcodeadas previamente.
- **Auditoría periódica:** ejecutar auditoría completa cada 6 meses o tras upgrades mayores.

---

## Anexos – Snippets útiles
- **Frontend (CSRF):**
```js
// 1) Obtener token
const r = await fetch('/api/csrf-token/');
const { csrfToken } = await r.json();

// 2) Usar token en mutaciones
await fetch('/api/financiero/documentos/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
  body: JSON.stringify({ ... })
});
```
- **ZAP (local):**
```bash
docker compose up -d db backend frontend nginx
docker compose -f docker-compose.yml -f docker-compose.zap.yml run --rm zap
# Abrir: zap-reports/zap-baseline.html
```

---

## Conclusión
- CSRF, IDOR, XSS, Uploads, Dependencias, Secrets/Config y el caso puntual de SQLi fueron **mitigados**.
- Se habilitaron **controles continuos** (auditorías automáticas, escaneo pasivo ZAP, flags de seguridad por entorno).
- El sistema queda con una **postura de seguridad fortalecida** y procedimientos para evitar regresiones.
