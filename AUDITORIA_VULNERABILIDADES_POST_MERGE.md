# Auditoría de Vulnerabilidades Post‑Merge (IDOR/XSS/SQLi)
**Fecha:** 28 de Mayo 2026  
**Estado:** ✅ Hallazgos corregidos

---

## 1) Hallazgos y mitigaciones

### A) Notificaciones (legacy views) – **IDOR/XSS**
**Riesgo:** Los endpoints legacy (`notificaciones/views.py`) permitían operaciones sin autenticación y sin sanitización en `mensaje/tipo_notificacion`. Esto permitía:
- **IDOR**: acceder/editar/eliminar notificaciones de otros usuarios.
- **XSS**: inyección en `mensaje`/`tipo_notificacion`.

**Mitigación aplicada:**
- Se añadió **_require_auth** para forzar autenticación.
- Se impuso **ownership** (solo admin global o dueño).
- Se sanitizó payload con `sanitize_dict` y `NOTIFICACION_SCHEMA`.

**Archivos:**
- `backend/notificaciones/views.py`
- `backend/notificaciones/serializers.py`
- `backend/mysite/xss_protection.py`

---

### B) Notificaciones (DRF serializer) – **XSS**
**Riesgo:** `NotificacionSerializer` no sanitizaba entradas.

**Mitigación aplicada:**
- Se agregó `validate()` con `sanitize_dict`.

**Archivo:**
- `backend/notificaciones/serializers.py`

---

### C) Componentes (DRF serializer) – **XSS**
**Riesgo:** `ComponenteSerializer` permitía entradas sin sanitización (`nombre`, `descripcion`).

**Mitigación aplicada:**
- Se agregó `validate()` con `sanitize_dict` y `COMPONENTE_SCHEMA`.

**Archivo:**
- `backend/componentes/serializers.py`

---

### D) SQLi en comando de sincronización Oracle – **SQLi**
**Riesgo:** `--query` se ejecutaba directamente con `cursor.execute(query)`.

**Mitigación aplicada:**
- Validación estricta: solo `SELECT`, sin múltiples sentencias, sin palabras peligrosas, sin comentarios SQL.

**Archivo:**
- `backend/usuarios/management/commands/sincronizar_oracle.py`

---

## 2) Resumen de cambios clave

- ✅ Autenticación requerida y control de ownership en notificaciones legacy.
- ✅ Sanitización XSS en notificaciones y componentes.
- ✅ Validación anti‑SQLi en sincronización Oracle.
- ✅ Esquema `NOTIFICACION_SCHEMA` actualizado a campos reales (`tipo_notificacion`, `mensaje`, `prioridad`).

---

## 3) Archivos modificados

- `backend/notificaciones/views.py`
- `backend/notificaciones/serializers.py`
- `backend/componentes/serializers.py`
- `backend/mysite/xss_protection.py`
- `backend/usuarios/management/commands/sincronizar_oracle.py`

---

## 4) Estado final

**Sin hallazgos críticos pendientes** en los módulos revisados post‑merge.  
Listo para continuar con QA o pruebas automatizadas.
