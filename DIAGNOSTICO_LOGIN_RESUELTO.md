# 🔧 Diagnóstico de Login - Problemas Resueltos

**Fecha**: 30/05/2026  
**Estado**: ✅ **LOGIN FUNCIONA CORRECTAMENTE**

---

## 🐛 Problemas Encontrados y Solucionados

### 1️⃣ Error 405 (Method Not Allowed) - ✅ RESUELTO
**Síntoma**: `POST /%22http://localhost:8000%22/api/usuarios/login/ HTTP/1.1" 405`

**Causa Root**: Comillas literales en variables de entorno Docker
```yaml
# ❌ INCORRECTO (incluía comillas en el valor)
VITE_API_URL: ${VITE_API_URL:-"http://localhost:8000"}
VITE_CHATBOT_URL: ${VITE_CHATBOT_URL:-"http://localhost:8001"}
```

**Solución Aplicada**: Remover comillas
```yaml
# ✅ CORRECTO
VITE_API_URL: ${VITE_API_URL:-http://localhost:8000}
VITE_CHATBOT_URL: ${VITE_CHATBOT_URL:-http://localhost:8001}
```

**Commit**: `df59cef` - Remove quotes from VITE env vars

---

### 2️⃣ Error 403 (Forbidden - CSRF Token Missing) - ✅ RESUELTO
**Síntoma**: `[30/May/2026 22:07:48] "POST /api/usuarios/login/ HTTP/1.1" 403 60`  
**Log**: `CSRF token missing for POST /api/usuarios/login/`

**Causa Root**: Middleware CSRF personalizado interceptaba antes de que `@csrf_exempt` en la vista funcionara
- Middleware ejecuta en `process_view` (antes que decoradores)
- Endpoints públicos como login no necesitaban CSRF pero estaban siendo rechazados

**Solución Aplicada**: Agregar lista de endpoints exemptados en middleware
```python
CSRF_EXEMPT_PATHS = {
    '/api/usuarios/login/',
    '/usuarios/login/',
    '/api/usuarios/logout/',
    '/usuarios/logout/',
    '/api/auth/logout/',
    '/auth/logout/',
    '/api/csrf-token/',
    # ... más endpoints públicos
}
```

**Commit**: `95c166e` - Exempt public endpoints from CSRF validation

---

### 3️⃣ Servidor Docker No Iniciaba (Chatbot) - ✅ RESUELTO
**Síntoma**: `exec: "uvicorn": executable file not found in $PATH`

**Solución**: Agregar `fastapi==0.115.6` y `uvicorn==0.34.0` a `chatbot/requirements.txt`

**Commit**: `a889ef5` - Restore missing fastapi and uvicorn

---

### 4️⃣ Dependencia Starlette Incompatible - ✅ RESUELTO
**Síntoma**: `ERROR: Cannot install -r requirements.txt (line 1) and starlette==1.0.1`

**Solución**: `fastapi==0.115.6` requiere `starlette<0.42.0`
- Cambié: `starlette==1.0.1` → `starlette==0.41.2`

**Commit**: `89092d5` - Use starlette 0.41.2 compatible

---

## ✅ Estado Actual del Sistema

```
✅ Backend (Django)       http://localhost:8000
✅ Chatbot (FastAPI)      http://localhost:8001
✅ Frontend (Vite React)  http://localhost:5173
✅ Nginx (Proxy)          http://localhost:8081
✅ PostgreSQL             Port 5432 (healthy)
✅ pgAdmin                http://localhost:5050
```

### Test de Login Exitoso

```bash
curl -X POST http://localhost:8000/api/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@unilibre.edu.co","contrasena":"admin123"}'

Response: 200 OK
{
  "id": 2,
  "nombre": "Administrador del Sistema",
  "correo": "admin@unilibre.edu.co",
  "rol": {"id": 1, "nombre": "admin"},
  "token": "53oR5aBrRY8-wrRkN-zTivXk0s0d1tck7wZWsF1f0Ls"
}
```

---

## ⚠️ Pendiente: reCAPTCHA

### Estado Actual
Variables de reCAPTCHA **vacías** en frontend y backend:
```
VITE_RECAPTCHA_SITE_KEY=         ❌ Vacío
RECAPTCHA_SITE_KEY=               ❌ Vacío
RECAPTCHA_SECRET_KEY=             ❌ Vacío
```

### Cómo Configurar reCAPTCHA

**Opción 1: Usar reCAPTCHA v3 de Google (Recomendado)**
1. Ir a https://www.google.com/recaptcha/admin/create
2. Seleccionar **reCAPTCHA v3**
3. Agregar dominio: `localhost`, `127.0.0.1`, `sihul.unilibre.edu.co`
4. Copiar las claves y guardar en `.env`:
   ```
   VITE_RECAPTCHA_SITE_KEY=XXXXX...
   RECAPTCHA_SITE_KEY=XXXXX...
   RECAPTCHA_SECRET_KEY=YYYYY...
   ```
5. Reconstruir contenedores:
   ```bash
   docker compose up -d --build
   ```

**Opción 2: Deshabilitar reCAPTCHA Temporalmente**
Si solo quieres testing sin reCAPTCHA, edita [frontend/src/pages/users/Login.tsx](frontend/src/pages/users/Login.tsx):
```tsx
// Línea ~21
const publicRecaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "DISABLED";

// Línea ~54
if (!publicRecaptchaSiteKey || publicRecaptchaSiteKey === "DISABLED") {
  // Permitir acceso sin reCAPTCHA para testing
  handlePublicAccess();
  return;
}
```

---

## 📋 Credenciales de Prueba

### Usuarios Académico
| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@unilibre.edu.co` | `admin123` | Admin Sistema |
| `admin_planeacion@unilibre.edu.co` | `admin123` | Admin Planeación |
| `docente@unilibre.edu.co` | `doc123` | Docente |
| `planeacion@unilibre.edu.co` | `plan123` | Coordinador Planeación |
| `supervisor@unilibre.edu.co` | `sup123` | Supervisor |

### Usuarios Financiero
| Email | Contraseña | Rol |
|-------|-----------|-----|
| `funcionario@financiera.edu.co` | `func123` | Funcionario |
| `contabilidad@financiera.edu.co` | `conta123` | Contabilidad |
| `tesoreria@financiera.edu.co` | `teso123` | Tesorería |
| `auditoria@financiera.edu.co` | `audit123` | Auditoría |
| `direccion-financiera@financiera.edu.co` | `dirfin123` | Dirección Financiera |
| `rectoria@financiera.edu.co` | `recto123` | Rectoría |

---

## 🚀 Próximos Pasos

1. ✅ **Verificar login funciona** → Completado
2. ⏳ **Configurar reCAPTCHA** (si se requiere)
3. ⏳ **Ejecutar E2E Tests**:
   ```bash
   cd backend && python manage.py test
   cd frontend && npm run build && npm run lint
   ```
4. ⏳ **Ejecutar ZAP Baseline Security Scan**:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.zap.yml run --rm zap
   ```

---

## 📝 Commits Realizados

1. `a889ef5` - fix: restore missing fastapi and uvicorn in chatbot requirements
2. `89092d5` - fix: use starlette 0.41.2 compatible with fastapi 0.115.6
3. `9e98855` - fix: restore backend requirements with security patches
4. `0a27ec0` - fix: use valid email for pgAdmin
5. `df59cef` - fix: remove quotes from VITE env vars in docker-compose
6. `95c166e` - fix: exempt public endpoints from CSRF validation in middleware

---

**Status**: ✅ Sistema OPERATIVO - Login funciona correctamente
