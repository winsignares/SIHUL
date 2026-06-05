# 🎯 REFERENCIA RÁPIDA - SIHUL ARQUITECTURA

## 1️⃣ FLUJO DE AUTENTICACIÓN (5 MIN)

```
Login (correo/password)
    ↓
POST /usuarios/login/
    ↓
Backend:
  - Valida credenciales
  - Query: ComponenteRol.objects.filter(rol=usuario.rol)
  - Devuelve: user + token + componentes[] + espacios[]
    ↓
Frontend (AuthContext):
  - Guarda todo en localStorage
  - Inicia sync automático c/7 segundos
  - Navigator a home según rol
    ↓
AppRouter:
  - Lee components[] del state
  - Protege rutas con ProtectedRoute
  - Renderiza menú dinámico
```

## 2️⃣ TABLA DE COMPONENTES → RUTAS

| Componente | Ruta | Permiso |
|-----------|------|--------|
| Dashboard | /admin/dashboard | VER/EDITAR |
| Centro Institucional | /admin/centro-institucional | VER/EDITAR |
| Gestión de Usuarios | /admin/usuarios | EDITAR |
| Dashboard Docente | /docente/dashboard | VER |
| Mi Horario | /docente/horario | VER |
| Dashboard Estudiante | /estudiante/dashboard | VER |
| **Gestión Financiera** 🆕 | **/admin/financiero** | **EDITAR** |
| **Reportes Financieros** 🆕 | **/admin/reportes-financieros** | **VER** |

## 3️⃣ PROTECCIÓN DE RUTAS

```tsx
// Todas las rutas usan este patrón:
<Route path="/admin/financiero" element={
    <ProtectedRoute requiredComponent="Gestión Financiera">
        <GestionFinanciera />
    </ProtectedRoute>
} />

// ProtectedRoute valida:
// 1. ¿Está logueado? (hasPermission en components[])
// 2. ¿Tiene permiso? (nombre en COMPONENT_ROUTES)
// 3. Si no → muestra "Acceso Denegado"
```

## 4️⃣ AGREGAR NUEVO COMPONENTE (RECETA)

### Backend (5 min)
1. Crear Componente en BD: `Componente.objects.create(nombre="...", descripcion="...")`
2. Asignar roles: `ComponenteRol.objects.create(rol=role, componente=comp, permiso='VER'|'EDITAR')`

### Frontend (10 min)
1. Agregar en `componentRoutes.ts`:
   ```typescript
   'Mi Componente': '/admin/mi-componente',
   ```
2. Crear página en `pages/mi-componente.tsx`
3. Agregar ruta en `AppRouter.tsx`:
   ```tsx
   <ProtectedRoute requiredComponent="Mi Componente">
       <MiComponente />
   </ProtectedRoute>
   ```

✅ **LISTO** → Aparece automático en menú

## 5️⃣ ROLES DISPONIBLES EN SIHUL

- `admin` - Acceso total
- `supervisor_general` - Supervisa espacios
- `planeacion_facultad` - Planeación por facultad
- `docente` - Profesor
- `estudiante` - Alumno
- `autorizado` - Acceso limitado
- `consultor` - Solo lectura
- `jefe_financiero` 🆕 - Gestión financiera

## 6️⃣ PERMISOS: VER vs EDITAR

```typescript
// En componentes:
const { hasPermission, hasEditPermission } = useAuth();

if (!hasPermission("Mi Componente")) {
    return <AccessDenied />;  // No puede ni verlo
}

if (hasEditPermission("Mi Componente")) {
    return <EditorCompleto />;  // Puede crear/editar/eliminar
} else {
    return <VisorSoloLectura />;  // Solo ver
}
```

## 7️⃣ DÓNDE ESTÁ TODO

**Backend**:
- Autenticación: `backend/usuarios/views.py` (función `login`)
- Modelos Usuario/Rol: `backend/usuarios/models.py`
- Componentes: `backend/componentes/models.py`
- API REST: `backend/<app>/views.py` + `api_urls.py`

**Frontend**:
```
frontend/src/
├── context/
│   └── AuthContext.tsx          ← State de autenticación
├── router/
│   └── AppRouter.tsx            ← Rutas + protección
├── config/
│   └── componentRoutes.ts       ← Mapeo componente→ruta
├── hooks/
│   └── useAdminDashboard.ts     ← Lógica menú
├── layouts/
│   └── AdminDashboard.tsx       ← Sidebar + menú
├── pages/
│   ├── dashboard/
│   ├── gestionAcademica/
│   └── financiero/ 🆕
└── services/api/
    ├── authService.ts
    └── financiero.ts 🆕
```

## 8️⃣ SINCRONIZACIÓN DE PERMISOS

```
frontend → GET /usuarios/session-auth-state/?since=<firma>
          ↓
backend  → ¿Cambió algo?
          ↓
          Si NO: {changed: false}
          Si SÍ: {changed: true, componentes: [...], rol: {...}}
          ↓
frontend → Actualiza state automáticamente
```

**Intervalo**: 7 segundos si pestaña está visible  
**IP**: No requiere autenticación explícita (usa sesión Django)

## 9️⃣ ESTRUCTURA USUARIO EN DB

```python
class Usuario:
    - correo (PK para login)
    - nombre
    - contrasena_hash
    - rol ← ForeignKey(Rol)      # Un rol
    - facultad ← ForeignKey      # Para planeación
    - sede ← ForeignKey          # Para supervisores
    - seccional ← ForeignKey     # Opcional
    - activo
    - es_superusuario
```

## 🔟 VALIDACIÓN DE COMPONENTES

**Backend** (en login):
```python
componentes = []
if u.rol:
    componentes_rol = ComponenteRol.objects.filter(rol=u.rol)
    # Retorna lista de componentes accesibles
```

**Frontend** (en AuthContext):
```typescript
// O(1) búsqueda con Map/Set
hasPermission(componentName) → componentsByName.has(componentName)
hasEditPermission(componentName) → editableComponents.has(componentName)
```

## 1️⃣1️⃣ MENSAJES DE ERROR COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| "Acceso Denegado" | No tiene componente | Asignar ComponenteRol en BD |
| Ruta no existe (`404`) | No está en AppRouter | Agregar Route en AppRouter.tsx |
| Menú no aparece | Componente no mapeado | Agregar en componentRoutes.ts |
| No aparece permiso | Nombre no coincide | Verificar exactitud del nombre |

## 1️⃣2️⃣ QUERIES ÚTILES (Backend)

```python
# Ver roles
from usuarios.models import Rol
Rol.objects.all()

# Ver componentes
from componentes.models import Componente
Componente.objects.all()

# Ver componentes de un rol
from componentes.models import ComponenteRol
ComponenteRol.objects.filter(rol__nombre='admin').select_related('componente')

# Crear usuario con rol
u = Usuario.objects.create(
    nombre="Juan",
    correo="juan@uni.edu",
    contrasena_hash=make_password("pass123"),
    rol=Rol.objects.get(nombre='jefe_financiero')
)

# Asignar componente a rol
comp = Componente.objects.get(nombre='Gestión Financiera')
rol = Rol.objects.get(nombre='jefe_financiero')
ComponenteRol.objects.create(rol=rol, componente=comp, permiso='EDITAR')
```

## 1️⃣3️⃣ INTEGRACIÓN DE MÓDULO FINANCIERO (RESUMEN)

### Backend
```bash
1. python manage.py startapp financiero
2. Crear modelos (Presupuesto, Transaccion)
3. Crear serializers + views
4. Registrar URLs en mysite/urls.py
5. python manage.py migrate
6. Crear Componente en BD:
   Componente.objects.create(nombre="Gestión Financiera")
7. Asignar roles: ComponenteRol.objects.create(...)
```

### Frontend
```typescript
1. Actualizar componentRoutes.ts:
   'Gestión Financiera': '/admin/financiero'
2. Agregar sección en useAdminDashboard.ts
3. Crear página pages/financiero/GestionFinanciera.tsx
4. Agregar ruta en AppRouter.tsx
5. Crear service api/financiero.ts
```

**Resultado**: Aparece automáticamente en menú para usuarios con permiso ✅

## 1️⃣4️⃣ TESTING

```bash
# Test 1: Login devuelve componentes
curl -X POST http://localhost:8000/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo": "admin@uni.edu", "contrasena": "pass123"}'
# Verificar: "componentes": [...]

# Test 2: Sin permiso
# Hacer login como usuario sin componente
# Ir a /admin/financiero
# Debe mostrar "Acceso Denegado"

# Test 3: Frontend React
# npm run dev
# Login → verificar menú
# Clic en Financiero → debe cargar
```

## 1️⃣5️⃣ PERFORMANCE NOTES

- **useMemo** en AuthContext → O(1) búsquedas
- **lazy** en AppRouter → code splitting automático
- **Pool cada 7s** → Mínimo overhead de sincronización
- **localStorage** → Rápido pero no encriptado (confiar en HTTPS)
- **Índices DB** → Agregados en Usuario modelo (rol, facultad, sede, seccional)

## 1️⃣6️⃣ SEGURIDAD

✅ Token en localStorage (Django session)  
✅ CSRF exempt solo en login (permitido)  
✅ Protección de rutas frontend (ProtectedRoute)  
⚠️ **TODO**: Validación backend en endpoints individuales  
⚠️ **TODO**: Rate limiting en login  
⚠️ **TODO**: Middleware para auditoría de cambios

---

## 🔗 REFERENCIAS RÁPIDAS

**AuthContext**: `frontend/src/context/AuthContext.tsx` (186 líneas)  
**AppRouter**: `frontend/src/router/AppRouter.tsx` (244 líneas)  
**componentRoutes**: `frontend/src/config/componentRoutes.ts` (165 líneas)  
**useAdminDashboard**: `frontend/src/hooks/useAdminDashboard.ts` (350 líneas)  
**Login Backend**: `backend/usuarios/views.py` linea ~333  
**Modelos**: `backend/usuarios/models.py` + `backend/componentes/models.py`

---

**Última actualización**: 5 de abril de 2026  
**Para preguntas**: Ver `ARQUITECTURA_COMPLETA_ANALISIS.md` para detalles
