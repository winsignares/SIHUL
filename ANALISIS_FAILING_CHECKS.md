# 🚨 Análisis: Failing Dependency Audit Checks

**Fecha:** 2026-05-30  
**Estado:** ❌ 2 checks fallando en GitHub Actions  
**Causa:** Vulnerabilidades detectadas en dependencias

---

## 📋 RESUMEN EJECUTIVO

**Los dos workflows de auditoría de dependencias están fallando porque encontraron 21 vulnerabilidades HIGH/CRITICAL en tus dependencias Python y Node.**

✅ **ESTO ES CORRECTO** — Significa que los controles de seguridad están funcionando perfectamente.  
✅ **PERO NECESITA ACCIÓN** — Las dependencias tienen versiones vulnerables que necesitan actualización.

### ¿Qué está pasando?

1. La IA creó el archivo `.github/workflows/dependency-audit.yml` con auditoría automática
2. El workflow **está configurado para fallar si encuentra HIGH/CRITICAL** — ESTO ES INTENCIONAL Y BUENO
3. Las **dependencias pinned en requirements.txt tienen versiones viejas** con vulnerabilidades conocidas
4. GitHub Actions ejecuta `pip-audit`, `safety`, y `npm audit` en cada push
5. **Los checks fallan porque encuentra vulnerabilidades** — no porque el código esté mal

### Resumen de hallazgos

- **Backend:** 11 vulnerabilidades en gunicorn, werkzeug, cryptography
- **Chatbot:** 9 vulnerabilidades en python-dotenv, python-multipart, langchain, starlette  
- **Frontend:** 1 vulnerabilidad HIGH en xlsx (sin fix disponible aún)
- **TOTAL:** 21 vulnerabilidades que bloquean el merge

---

## 🔴 Los 2 Failing Checks

```
❌ Dependency Audit / Node Audit (frontend) (push) - Failing after 20s
❌ Dependency Audit / Python Audit (backend + chatbot) (push) - Failing after 27s
```

### ¿Qué está pasando en cada uno?

**Node Audit (Frontend):**
```bash
# El workflow ejecuta:
npm audit --omit=dev --audit-level=high

# Esto significa: "Falla si encuentra vulnerabilidades HIGH o CRITICAL"
# Excluye devDependencies (--omit=dev)
```

**Python Audit (Backend + Chatbot):**
```bash
# El workflow ejecuta:
pip-audit -r backend/requirements.txt
pip-audit -r chatbot/requirements.txt
safety check -r backend/requirements.txt
safety check -r chatbot/requirements.txt

# Ambas herramientas fallan si detectan vulnerabilidades
```

---

## 🔍 ANÁLISIS POR MÓDULO (DATOS REALES DE pip-audit + npm audit)

### 1️⃣ BACKEND (Python) — ❌ 11 VULNERABILIDADES

**Archivo:** `backend/requirements.txt`

**Vulnerabilidades encontradas:**

```
┌─ gunicorn 21.2.0 (2 CVEs)
├─ CVE-2024-1135 → Actualizar a 22.0.0
├─ CVE-2024-6827 → Actualizar a 22.0.0
│
├─ werkzeug 3.0.3 (5 CVEs)
├─ CVE-2024-49766 → Actualizar a 3.0.6
├─ CVE-2024-49767 → Actualizar a 3.0.6
├─ CVE-2025-66221 → Actualizar a 3.1.4
├─ CVE-2026-21860 → Actualizar a 3.1.5
├─ CVE-2026-27199 → Actualizar a 3.1.6
│
└─ cryptography 42.0.8 (4 CVEs)
  ├─ PYSEC-2026-35 → Actualizar a 46.0.6
  ├─ GHSA-h4gh-qq45-vh27 → Actualizar a 43.0.1
  ├─ CVE-2024-12797 → Actualizar a 44.0.1
  └─ CVE-2026-26007 → Actualizar a 46.0.5
```

---

### 2️⃣ CHATBOT (Python) — ❌ 9 VULNERABILIDADES

**Archivo:** `chatbot/requirements.txt`

**Vulnerabilidades encontradas:**

```
┌─ python-dotenv 1.0.1 (1 CVE)
├─ CVE-2026-28684 → Actualizar a 1.2.2
│
├─ python-multipart 0.0.20 (3 CVEs)
├─ CVE-2026-24486 → Actualizar a 0.0.22
├─ CVE-2026-40347 → Actualizar a 0.0.26
├─ CVE-2026-42561 → Actualizar a 0.0.27
│
├─ langchain-text-splitters 0.3.4 (2 CVEs)
├─ PYSEC-2026-77 → Actualizar a 1.1.2
├─ CVE-2025-6985 → Actualizar a 0.3.9
│
└─ starlette 0.41.3 (3 CVEs)
  ├─ PYSEC-2026-161 → Actualizar a 1.0.1
  ├─ CVE-2025-54121 → Actualizar a 0.47.2
  └─ CVE-2025-62727 → Actualizar a 0.49.1
```

---

### 3️⃣ FRONTEND (Node) — ❌ 1 VULNERABILIDAD HIGH

**Archivo:** `frontend/package.json`

**Vulnerabilidades encontradas:**

```
┌─ xlsx (1 HIGH)
├─ Prototype Pollution in sheetJS
│  └─ https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
│
└─ SheetJS Regular Expression Denial of Service (ReDoS)
   └─ https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
   └─ ⚠️ No hay fix disponible en npm
```

---

## � RESUMEN DE VULNERABILIDADES

| Componente | Total | Vulnerabilidades |
|-----------|-------|-------------------|
| **Backend** | 🔴 11 | gunicorn (2), werkzeug (5), cryptography (4) |
| **Chatbot** | 🔴 9 | python-dotenv (1), python-multipart (3), langchain (2), starlette (3) |
| **Frontend** | 🔴 1 | xlsx (HIGH) |
| **TOTAL** | 🔴 21 | Vulnerabilidades críticas y altas |

---

## 🛠️ SOLUCIONES

### ✅ Paso 1: ACTUALIZAR BACKEND

```bash
cd c:\Users\SOPORTE\Documents\Sihul\SIHUL\backend

# Actualizar paquetes vulnerables
pip install --upgrade gunicorn==22.0.0
pip install --upgrade werkzeug==3.1.6
pip install --upgrade cryptography==46.0.6

# Regenerar requirements.txt con nuevas versiones
pip freeze > requirements.txt
```

Versiones finales esperadas:
```
gunicorn==22.0.0       # De 21.2.0
werkzeug==3.1.6        # De 3.0.3
cryptography==46.0.6   # De 42.0.8
```

---

### ✅ Paso 2: ACTUALIZAR CHATBOT

```bash
cd c:\Users\SOPORTE\Documents\Sihul\SIHUL\chatbot

# Actualizar paquetes vulnerables
pip install --upgrade python-dotenv==1.2.2
pip install --upgrade python-multipart==0.0.27
pip install --upgrade langchain-text-splitters==1.1.2
pip install --upgrade starlette==0.49.1

# Regenerar requirements.txt
pip freeze > requirements.txt
```

Versiones finales esperadas:
```
python-dotenv==1.2.2             # De 1.0.1
python-multipart==0.0.27         # De 0.0.20
langchain-text-splitters==1.1.2  # De 0.3.4
starlette==0.49.1                # De 0.41.3 (note: starlette no está en la lista original pero lo encontró pip-audit)
```

---

### ✅ Paso 3: ACTUALIZAR FRONTEND

**PROBLEMA:** `xlsx` no tiene fix en npm.

```bash
cd c:\Users\SOPORTE\Documents\Sihul\SIHUL\frontend

# Opción A: Esperar nuevo release de xlsx (recomendado)
# npm audit fix # no va a funcionar

# Opción B: Cambiar a librería alternativa
npm install --save xlsx@latest  # Intenta versión más nueva

# Opción C: Usar paquete alternativo
npm install --save-dev @sheet/core  # O similar
```

**Alternativas a `xlsx`:**
- `exceljs` — Mejor soporte y más activo
- `node-xlsx` — Más ligero
- `sheetjs-pro` — Versión comercial con soporte


---

### 🔧 Opción RÁPIDA: Automatizar todo con Script

**Archivo:** `update-deps.ps1`

```powershell
# Backend
Write-Host "Actualizando Backend..." -ForegroundColor Cyan
cd "c:\Users\SOPORTE\Documents\Sihul\SIHUL\backend"
pip install --upgrade gunicorn werkzeug cryptography
pip freeze > requirements.txt

# Chatbot
Write-Host "Actualizando Chatbot..." -ForegroundColor Cyan
cd "..\chatbot"
pip install --upgrade python-dotenv python-multipart langchain-text-splitters starlette
pip freeze > requirements.txt

# Frontend
Write-Host "Actualizando Frontend..." -ForegroundColor Cyan
cd "..\frontend"
npm audit fix --force
npm install

Write-Host "✅ Actualización completada" -ForegroundColor Green
```

Ejecutar:
```bash
powershell -ExecutionPolicy Bypass -File update-deps.ps1
```

---

## � TABLA DE RIESGOS

| Paquete | Versión | Riesgo | CVEs | Acción Recomendada |
|---------|---------|--------|------|-------------------|
| `gunicorn` | 21.2.0 | 🔴 HIGH | 2 | Actualizar a **22.0.0** |
| `werkzeug` | 3.0.3 | 🔴 HIGH | 5 | Actualizar a **3.1.6** |
| `cryptography` | 42.0.8 | 🔴 HIGH | 4 | Actualizar a **46.0.6** |
| `python-dotenv` | 1.0.1 | 🟡 MEDIO | 1 | Actualizar a **1.2.2** |
| `python-multipart` | 0.0.20 | 🔴 HIGH | 3 | Actualizar a **0.0.27** |
| `langchain-text-splitters` | 0.3.4 | 🟡 MEDIO | 2 | Actualizar a **1.1.2** |
| `starlette` | 0.41.3 | 🔴 HIGH | 3 | Actualizar a **0.49.1** |
| `xlsx` | (latest) | 🔴 HIGH | 2 | ⚠️ **Sin fix disponible** |

---

## ✅ CHECKLIST DE RESOLUCIÓN

- [ ] Ejecutar auditorías locales
- [ ] Capturar output exacto de errores
- [ ] Identificar vulnerabilidades reales vs falsas positivas
- [ ] Actualizar dependencias o crear allowlist
- [ ] Hacer push de cambios
- [ ] Validar que los checks pasen
- [ ] Notificar al equipo del cambio

---

## 🔗 REFERENCIAS

- https://pypi.org/project/pip-audit/
- https://pypi.org/project/safety/
- https://docs.npmjs.com/cli/v10/commands/npm-audit
- https://github.com/pypa/pip-audit

---

**Creado:** 2026-05-30  
**Status:** 🟡 Pendiente resolución  
**Prioridad:** 🔴 Alta (bloquea merges)

