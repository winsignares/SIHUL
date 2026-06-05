# 📐 ANÁLISIS COMPLETO ARQUITECTURA SIHUL

**Fecha**: 5 de abril de 2026  
**Objetivo**: Documentar los patrones y flujos de SIHUL para integración del módulo Financiero

---

## 🎯 RESUMEN EJECUTIVO

SIHUL usa una arquitectura **basada en componentes dinámicos** vinculados a roles. Los usuarios reciben una lista de componentes accesibles en el login, y el frontend construye dinámicamente el menú y rutas disponibles. **No hay rutas hardcodeadas** en el router para cada funcionalidad: todo es dinámico según lo que devuelva el backend.

---

## 1️⃣ SISTEMA DE AUTENTICACIÓN

### 1.1 Flow de Login

```
Usuario (correo + password)
    ↓
POST /usuarios/login/
    ↓
Backend valida credenciales
    ↓
Si OK:
  - Query: ComponenteRol.objects.filter(rol=usuario.rol)
  - Obtiene lista de componentes accesibles
  - Obtiene espacios_permitidos
  - Genera token secreto
  - Retorna JSON con TODOS esos datos
    ↓
Frontend (AuthContext):
  - Guarda token, user, role, components[] en localStorage
  - Inicializa estado de autenticación
  - Inicia pool de sincronización cada 7 segundos
    ↓
App carga rutas dinámicamente basadas en components[]
```

### 1.2 ¿Dónde se almacenan los datos?

**localStorage (Frontend)**:
- `auth_token` - JWT/secreto para autenticar peticiones
- `auth_user` - JSON con {id, nombre, correo, rol, facultad, sede}
- `auth_role` - JSON con {id, nombre, descripcion}
- `auth_components` - Array de {id, nombre, descripcion, permiso}
- `auth_faculties` - Solo para algunos roles
- `auth_areas` - Espacios permitidos
- `auth_signature` - Hash para detectar cambios de permisos

**Sesión Backend (Django)**:
- `user_id` - ID del usuario
- `correo` - Correo del usuario
- `is_authenticated` - Boolean
- `token` - Token generado
- `rol` - Nombre del rol
- `id_rol` - ID del rol

### 1.3 Sincronización de Permisos

**Endpoint**: `GET /usuarios/session-auth-state/?since={signature}`

- Se llama **cada 7 segundos** si la pestaña está visible
- Si la firma anterior = firma actual → backend responde `changed: false`
- Si cambió → backend devuelve nuevos `rol` y `componentes[]`
- Detecta cambios en permisos EN TIEMPO REAL
- Si pierde la sesión backend, el frontend no lo sabe hasta que intente acceder

---

## 2️⃣ ESTRUCTURA DE ROLES Y PERMISOS

### 2.1 Modelo de Base de Datos

```
┌─────────────────────┐
│       ROL           │
├─────────────────────┤
│ id (PK)             │
│ nombre              │
│ descripcion         │
└──────────┬──────────┘
           │ 1:N
           │
┌──────────▼──────────┐         ┌──────────────────┐
│  COMPONENTE_ROL     │────────→│   COMPONENTE     │
├─────────────────────┤         ├──────────────────┤
│ id (PK)             │         │ id (PK)          │
│ rol_id (FK)         │         │ nombre           │
│ componente_id (FK)  │         │ descripcion      │
│ permiso             │         └──────────────────┘
│ (VER, EDITAR)       │
└─────────────────────┘
```

### 2.2 Roles Canónicos en SIHUL

Definidos en `roleUtils.ts`:
- `admin` - Administrador del sistema
- `supervisor_general` - Supervisor de espacios
- `docente` - Profesor
- `estudiante` - Alumno
- `autorizado` - Acceso limitado
- `consultor` - Solo lectura

Normalización: Convierte formatos como "AdminPlaneacion" → "admin_planeacion"

### 2.3 Validación de Permisos (Frontend)

```typescript
// AuthContext.tsx
const hasPermission = (componentName: string): boolean => {
    return componentsByName.has(componentName);  // O(1) búsqueda
};

const hasEditPermission = (componentName: string): boolean => {
    return editableComponents.has(componentName);  // O(1) búsqueda
};

// Uso en componentes:
if (auth.hasPermission("Gestión Financiera")) {
    return <GestionFinanciera />;
}

if (auth.hasEditPermission("Gestión Financiera")) {
    return <EditorFinanciero />;
} else {
    return <VisorFinanciero />;
}
```

### 2.4 ¿Cómo se asignan componentes a roles?

**En el backend** (Django Admin o script):
1. Crear Componente: `Componente.objects.create(nombre="Gestión Financiera", descripcion="...")`
2. Crear ComponenteRol: `ComponenteRol.objects.create(rol=admin_role, componente=gestfinanciera, permiso='EDITAR')`
3. **No requiere cambios de código**: El backend lo devuelve en login automáticamente

**En el frontend**:
- El componente **aparece en el menú automáticamente**
- El router **lo detecta automáticamente** via `getRouteForComponent(nombre)`

---

## 3️⃣ ESTRUCTURA DE PANELES POR ROL

### 3.1 AppRouter.tsx - Protección de Rutas

```typescript
// ProtectedRoute wrapper
function ProtectedRoute({children, requiredComponent}) {
    const {isAuthenticated, hasPermission} = useAuth();
    
    if (!isAuthenticated) return <Navigate to="/login" />;
    
    if (requiredComponent && !hasPermission(requiredComponent)) {
        return <AccessDenied requiredComponent={requiredComponent} />;
    }
    
    return <>{children}</>;
}

// Uso en router:
<Route path="/admin/financiero" element={
    <ProtectedRoute requiredComponent="Gestión Financiera">
        <GestionFinanciera />
    </ProtectedRoute>
} />
```

### 3.2 Determinación de Ruta Home

```typescript
// AppRouter selecciona ruta inicial según rol + componentes
const homeRoute = (() => {
    const roleName = role?.nombre;
    
    // Admin con Dashboard → ir a dashboard admin
    if (roleName === 'admin' && hasComponentByName('Dashboard')) {
        return '/admin/dashboard';
    }
    
    // Supervisor → ir a dashboard supervisor
    if (roleName === 'supervisor_general') {
        return '/supervisor/dashboard';
    }
    
    // Docente → ir a dashboard docente
    if (roleName === 'docente' && hasComponentByName('Dashboard Docente')) {
        return '/docente/dashboard';
    }
    
    // Si no encuentra, intenta primera ruta disponible
    for (const component of components) {
        const route = getRouteForComponent(component.nombre);
        if (route !== '/') return route;
    }
    
    return '/notificaciones';  // Fallback
})();
```

### 3.3 Agrupación Dinámica de Menú

**Hook**: `useAdminDashboard.ts`

```typescript
groupComponentsBySection(): MenuSection[] {
    // Agrupa automáticamente por patrón de nombre:
    
    // Dashboard → sección "Principal"
    dashboardComponents = components.filter(c => 
        c.nombre.toLowerCase().includes('dashboard')
    );
    
    // "Apertura", "Disponibilidad", "Estado" → "Gestión de Espacios"
    espaciosComponents = [
        'Apertura y Cierre de Salones',
        'Disponibilidad de Espacios',
        'Estado de Recursos'
    ].map(name => components.find(c => c.nombre === name));
    
    // "Mi Horario", "Préstamos Docente" → "Académico"
    academicoComponents = [
        'Mi Horario',
        'Mi Horario Estudiante',
        'Préstamos Docente'
    ].map(name => components.find(c => c.nombre === name));
    
    // "Centro Institucional", "Centro Horarios", etc → "Gestión Académica"
    gestionComponents = [
        'Centro Institucional',
        'Centro de Horarios',
        'Préstamos de Espacios',
        'Periodos Académicos',
        'Asignación Automática'
    ].map(name => components.find(c => c.nombre === name));
    
    // "Reporte" → "Reportes"
    reportesComponents = components.filter(c =>
        c.nombre.toLowerCase().includes('reporte')
    );
    
    // "Usuario", "Rol", "Componente" → "Administración"
    adminComponents = [
        'Gestión de Usuarios',
        'Gestión de Roles',
        'Gestión de Componentes'
    ].map(name => components.find(c => c.nombre === name));
    
    return [
        {id: 'principal', label: 'Principal', items: dashboardComponents},
        {id: 'espacios', label: 'Gestión de Espacios', items: espaciosComponents},
        {id: 'academico', label: 'Académico', items: academicoComponents},
        {id: 'gestion', label: 'Gestión Académica', items: gestionComponents},
        {id: 'reportes', label: 'Reportes', items: reportesComponents},
        {id: 'admin', label: 'Administración', items: adminComponents}
    ];
}
```

### 3.4 AdminDashboard Layout

```
┌────────────────────────────────────────────────────────┐
│ Logo + User Info + Logout                              │
├────────────────────────────────────────────────────────┤
│         │                                              │
│ SIDEBAR │         MAIN CONTENT (Router outlet)         │
│ Menú    │                                              │
│ Secciones                                              │
│         │                                              │
│ - Ppal  │     <Page />                                │
│ - Gestión                                              │
│ - Admin │                                              │
│         │                                              │
└────────────────────────────────────────────────────────┘

Sidebar:
- Colapsable (80px collapsed, 280px expanded)
- Hover expande en desktop
- Hamburger menu en mobile (<768px)
- Ícono + label para cada ítem
- Active highlight en amarillo
- Tooltips en collapsed mode
```

---

## 4️⃣ MAPEO COMPONENTES → RUTAS

**Archivo**: `src/config/componentRoutes.ts`

### 4.1 Record COMPONENT_ROUTES

```typescript
export const COMPONENT_ROUTES: Record<string, string> = {
    // Admin
    'Dashboard': '/admin/dashboard',
    'Centro Institucional': '/admin/centro-institucional',
    'Centro de Horarios': '/admin/centro-horarios',
    'Préstamos de Espacios': '/admin/prestamos',
    'Periodos Académicos': '/admin/periodos',
    'Asignación Automática': '/admin/asignacion',
    'Gestión de Usuarios': '/admin/usuarios',
    'Gestión de Roles': '/admin/roles',
    'Gestión de Componentes': '/admin/componentes-roles',
    
    // Supervisor
    'Dashboard Supervisor': '/supervisor/dashboard',
    'Disponibilidad de Espacios': '/supervisor/espacios',
    'Apertura y Cierre de Salones': '/supervisor/prestamos',
    
    // Docente
    'Dashboard Docente': '/docente/dashboard',
    'Mi Horario': '/docente/horario',
    'Préstamos Docente': '/docente/prestamos',
    
    // Estudiante
    'Dashboard Estudiante': '/estudiante/dashboard',
    'Mi Horario Estudiante': '/estudiante/mi-horario'
};
```

### 4.2 Fallback Dinámico

Si un componente NO está en el record:
```typescript
function getRouteForComponent(name: string): string {
    const route = COMPONENT_ROUTES[name];
    
    if (!route) {
        // Genera ruta dinámica: "Gestión Financiera" → "/componentes/gestion-financiera"
        const dynamicRoute = getDynamicRouteForComponent(name);
        console.info(`Dynamic route used: ${name} -> ${dynamicRoute}`);
        return dynamicRoute;
    }
    
    return route;
}

function getDynamicRouteForComponent(name: string): string {
    // "Gestión Financiera" → "gestion-financiera"
    const slug = toComponentSlug(name);
    return `/componentes/${slug}`;
}

function toComponentSlug(name: string): string {
    return name
        .normalize('NFD')                    // Descomposición Unicode
        .replace(/[\u0300-\u036f]/g, '')   // Elimina acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')       // Reemplaza espacios/caracteres con -
        .replace(/^-+|-+$/g, '');          // Trim -
}
```

---

## 5️⃣ MODELO DE USUARIO

### 5.1 Backend (backend/usuarios/models.py)

```python
class Usuario(AbstractUser):
    id = AutoField(primary_key=True)
    username = None                 # Deshabilitado
    correo = EmailField(unique=True)    # Campo de login
    nombre = CharField(max_length=100)
    contrasena_hash = CharField(max_length=255)
    rol = ForeignKey(Rol, null=True, blank=True)
    facultad = ForeignKey(Facultad, null=True, blank=True)
    sede = ForeignKey(Sede, null=True, blank=True)
    seccional = ForeignKey(Seccional, null=True, blank=True)
    activo = BooleanField(default=True)
    es_superusuario = BooleanField(default=False)
    
    USERNAME_FIELD = 'correo'  # Login por correo
    REQUIRED_FIELDS = []
    
    class Meta:
        indexes = [
            Index(fields=['rol']),
            Index(fields=['facultad']),
            Index(fields=['sede']),
            Index(fields=['seccional'])
        ]
```

### 5.2 Frontend (AuthContext)

```typescript
interface User {
    id: number;
    nombre: string;
    correo: string;
    rol: Role | null;
    facultad: Faculty | null;
    sede: Sede | null;
}

interface AuthState {
    token: string | null;
    user: User | null;
    role: Role | null;
    components: Component[];  // [{ id, nombre, descripcion, permiso }]
    faculties?: Faculty[];
    areas?: AllowedSpace[];
    isAuthenticated: boolean;
    isLoading: boolean;
}
```

---

## 6️⃣ FLUJO BACKEND - LOGIN

**Endpoint**: `POST /usuarios/login/`

```python
@csrf_exempt
def login(request):
    # 1. Validar JSON
    data = json.loads(request.body)
    correo = data.get('correo')
    contrasena = data.get('contrasena')
    
    # 2. Buscar usuario
    u = Usuario.objects.select_related(
        'sede', 'rol', 'facultad'
    ).get(correo=correo)
    
    # 3. Validar contraseña
    password_ok, es_legacy = _password_valida(u, contrasena)
    if not password_ok:
        return JsonResponse({"error": "Credenciales inválidas"}, status=401)
    
    # 4. CRUCIAL: Obtener componentes del rol
    componentes = []
    if u.rol:
        componentes_rol = ComponenteRol.objects.filter(
            rol=u.rol
        ).select_related('componente')
        
        componentes = [
            {
                "id": cr.componente.id,
                "nombre": cr.componente.nombre,
                "descripcion": cr.componente.descripcion,
                "permiso": cr.permiso  # 'VER' o 'EDITAR'
            }
            for cr in componentes_rol
        ]
    
    # 5. Obtener espacios permitidos
    espacios_permitidos = []
    try:
        espacios_permisos = EspacioPermitido.objects.filter(
            usuario=u
        ).select_related('espacio', 'espacio__sede')
        
        espacios_permitidos = [
            {
                "id": ep.espacio.id,
                "tipo": ep.espacio.tipo,
                "sede_id": ep.espacio.sede.id
            }
            for ep in espacios_permisos
        ]
    except:
        pass
    
    # 6. Generar token y guardar en sesión
    token = secrets.token_urlsafe(32)
    request.session['user_id'] = u.id
    request.session['token'] = token
    
    # 7. Retornar respuesta
    return JsonResponse({
        "message": "Login exitoso",
        "id": u.id,
        "nombre": u.nombre,
        "correo": u.correo,
        "rol": {
            "id": u.rol.id,
            "nombre": u.rol.nombre,
            "descripcion": u.rol.descripcion
        } if u.rol else None,
        "facultad": {
            "id": u.facultad.id,
            "nombre": u.facultad.nombre
        } if u.facultad else None,
        "sede": {
            "id": u.sede.id,
            "nombre": u.sede.nombre,
            "ciudad": u.sede.ciudad
        } if u.sede else None,
        "componentes": componentes,        # ← CLAVE
        "espacios_permitidos": espacios_permitidos,
        "token": token
    }, status=200)
```

---

## 7️⃣ INTEGRACIÓN DEL MÓDULO FINANCIERO

### 7.1 Pasos de Integración (en orden)

#### **PASO 1: Backend - Crear Componentes en DB**

```bash
# En shell de Django o migration:
from componentes.models import Componente, ComponenteRol
from usuarios.models import Rol

# Crear componentes
gestion_fin = Componente.objects.create(
    nombre="Gestión Financiera",
    descripcion="Módulo de gestión financiera y presupuestos"
)

reportes_fin = Componente.objects.create(
    nombre="Reportes Financieros",
    descripcion="Visualización de reportes financieros"
)

# Asignar a rol admin (con permiso EDITAR)
admin_role = Rol.objects.get(nombre='admin')
ComponenteRol.objects.create(
    rol=admin_role,
    componente=gestion_fin,
    permiso='EDITAR'
)
ComponenteRol.objects.create(
    rol=admin_role,
    componente=reportes_fin,
    permiso='VER'
)

# Asignar a otros roles según necesidad
# (p.ej., jefe_financiero with EDITAR, coordinador with VER)
```

#### **PASO 2: Frontend - Registrar Rutas en componentRoutes.ts**

```typescript
// src/config/componentRoutes.ts

export const COMPONENT_ROUTES: Record<string, string> = {
    // ... existentes ...
    
    // Financiero
    'Gestión Financiera': '/admin/financiero',
    'Reportes Financieros': '/admin/reportes-financieros'
};

export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // ... existentes ...
    
    'Gestión Financiera': DollarSign,      // Lucide icon
    'Reportes Financieros': BarChart3
};
```

#### **PASO 3: Frontend - Crear Páginas**

```
frontend/src/pages/financiero/
├── index.ts
├── GestionFinanciera.tsx        ← Página principal
├── ReportesFinancieros.tsx      ← Reportes
├── components/
│   ├── FormPresupuesto.tsx
│   ├── TablaTransacciones.tsx
│   ├── GraficoIngresos.tsx
│   └── ...
└── hooks/
    └── useFinanciero.ts         ← API calls
```

#### **PASO 4: Frontend - Agregar Rutas en AppRouter.tsx**

```typescript
// src/router/AppRouter.tsx

const GestionFinanciera = lazy(() => 
    import('../pages/financiero/GestionFinanciera')
);
const ReportesFinancieros = lazy(() => 
    import('../pages/financiero/ReportesFinancieros')
);

// En el router:
<Route path="/admin/financiero" element={
    <ProtectedRoute requiredComponent="Gestión Financiera">
        <GestionFinanciera />
    </ProtectedRoute>
} />

<Route path="/admin/reportes-financieros" element={
    <ProtectedRoute requiredComponent="Reportes Financieros">
        <ReportesFinancieros />
    </ProtectedRoute>
} />
```

### 7.2 El Menú se Actualiza Automáticamente

Una vez hecho lo anterior:
1. Usuario admin hace login
2. Backend retorna componentes con "Gestión Financiera"
3. `useAdminDashboard` agrupa por nombre (contiene "Financiero" → crearía sección o iría a "Gestión Académica")
4. AdminDashboard renderiza menuSections
5. Menú aparece sin cambios de código

### 7.3 Agrupación del Menú (Personalización Opcional)

Para que "Gestión Financiera" aparezca en su propia sección:

```typescript
// useAdminDashboard.ts - Agregar lógica
const financeNames = [
    'Gestión Financiera',
    'Reportes Financieros',
    'Presupuestos',
    'Transacciones'
];
const financeComponents = financeNames
    .map(name => components.find(c => c.nombre === name))
    .filter((c): c is typeof components[0] => c !== undefined);

if (financeComponents.length > 0) {
    sections.push({
        id: 'financiero',
        label: 'Financiero',
        items: financeComponents.map(c => ({
            id: c.nombre,
            icon: getIconForComponent(c.nombre),
            label: cleanLabel(c.nombre),
            route: getRouteForComponent(c.nombre),
            code: c.nombre
        }))
    });
}

// Insertar en posición correcta:
const orderedSections = [
    sectionPrincipal,
    sectionEspacios,
    sectionAcademico,
    sectionGestion,
    sectionFinanciero,  // ← Aquí
    sectionAsistente,
    sectionReportes,
    sectionAdmin
].filter(s => s); // Eliminar undefined
```

---

## 8️⃣ ESTRUCTURA DE CARPETAS RECOMENDADA

```
backend/
├── financiero/               ← NUEVO APP
│   ├── __init__.py
│   ├── models.py            ← Presupuesto, Transaccion, MovimientoFinanciero
│   ├── serializers.py
│   ├── views.py             ← API CRUD
│   ├── api_urls.py
│   ├── urls.py
│   ├── tests.py
│   └── migrations/

frontend/
├── src/
│   ├── pages/
│   │   └── financiero/       ← NUEVO
│   │       ├── index.ts
│   │       ├── GestionFinanciera.tsx
│   │       ├── ReportesFinancieros.tsx
│   │       ├── components/
│   │       │   ├── FormPresupuesto.tsx
│   │       │   ├── TablaTransacciones.tsx
│   │       │   └── GraficoIngresos.tsx
│   │       └── hooks/
│   │           └── useFinanciero.ts
│   ├── services/
│   │   └── api/
│   │       └── financiero.ts ← API client
│   └── config/
│       └── componentRoutes.ts ← Actualizar mapeos
```

---

## 9️⃣ CHECKLIST DE INTEGRACIÓN

- [ ] **Backend**
  - [ ] Crear modelos en `financiero/models.py`
  - [ ] Crear serializers en `financiero/serializers.py`
  - [ ] Crear views/viewsets en `financiero/views.py`
  - [ ] Crear `financiero/api_urls.py` e incluir en `mysite/urls.py`
  - [ ] Ejecutar migrations: `python manage.py makemigrations financiero`
  - [ ] Crear componentes en DB: `Componente.objects.create(...)`
  - [ ] Asignar a roles: `ComponenteRol.objects.create(...)`

- [ ] **Frontend**
  - [ ] Agregar rutas en `componentRoutes.ts`
  - [ ] Crear carpeta `pages/financiero/`
  - [ ] Crear componentes principales
  - [ ] Agregar rutas en `AppRouter.tsx`
  - [ ] Crear service API en `services/api/financiero.ts`
  - [ ] Customizar agrupación en `useAdminDashboard.ts` (opcional)

- [ ] **Testing**
  - [ ] Test login devuelve componentes financieros
  - [ ] Test ProtectedRoute bloquea acceso sin permiso
  - [ ] Test página financiera renderiza
  - [ ] Test menú contiene finanzas si usuario tiene permiso

---

## 🔟 COSAS IMPORTANTES A SABER

### 10.1 Sincronización de Sesión

El frontend sincroniza cada 7 segundos. Si cambias permisos en DB:
- Si el admin da permiso → lo ve en ~7 segundos
- Si el admin quita permiso → la ruta devuelve "Acceso Denegado"
- **PERO** el componente no se recarga automáticamente, solo después de F5

### 10.2 localStorage vs SessionStorage

SIHUL usa **localStorage** (persiste entre tabs/sessions) no sessionStorage.
Esto significa:
- Si cierras el tab y lo vuelves a abrir → sigue logueado
- `logout()` limpia TODO el localStorage (incluyendo otros datos de la app)

### 10.3 Validación de Permisos

**Frontend**: `hasPermission(componentName)` busca en `components[]`  
**Backend**: Query de `ComponenteRol` en login

No hay validación duplicada en endpoints individuales currently. Podrías agregar middleware en Django para validar `user_id` en sesión.

### 10.4 Roles vs Componentes

- **Rol**: Usuario tiene UN rol (admin, docente, etc.)
- **Componente**: Funcionalidad (Gestión Financiera, Dashboard, etc.)
- **ComponenteRol**: Mapeo: "Este rol puede VER este componente"

Un usuario nunca ve componentes que no estén en su ComponenteRol.

### 10.5 El Nombre del Componente es CRÍTICO

El nombre exacto en `Componente.objects.create(nombre="X")` es lo que se busca después:
- En `components` array del frontend
- En `componentRoutes.ts` para mapeo de rutas
- En menú agrupación de `useAdminDashboard`

**Si nombras** `"Finanzas"` en DB pero buscas `"Gestión Financiera"` en componentRoutes → no funciona.

---

## 1️⃣1️⃣ EJEMPLO COMPLETO: Integración Paso a Paso

### Crear Rol "jefe_financiero"

```bash
# Terminal Django
python manage.py shell

from usuarios.models import Rol
jefe_fin_role = Rol.objects.create(
    nombre="jefe_financiero",
    descripcion="Jefe de Finanzas"
)
```

### Crear Componente

```python
from componentes.models import Componente, ComponenteRol

# Crear componentes
comp1 = Componente.objects.create(
    nombre="Gestión Financiera",
    descripcion="CRUD de presupuestos y transacciones"
)

comp2 = Componente.objects.create(
    nombre="Reportes Financieros",
    descripcion="Visualización de reportes"
)

# Asignar al rol
ComponenteRol.objects.create(
    rol=jefe_fin_role,
    componente=comp1,
    permiso='EDITAR'
)

ComponenteRol.objects.create(
    rol=jefe_fin_role,
    componente=comp2,
    permiso='VER'
)
```

### Crear Usuario Jefe Financiero

```python
from usuarios.models import Usuario
from django.contrib.auth.hashers import make_password

usuario = Usuario.objects.create(
    nombre="Juan Pérez",
    correo="juan@universidad.edu",
    contrasena_hash=make_password("password123"),
    rol=jefe_fin_role,
    activo=True
)
```

### Crear Modelos Financieros

```python
# financiero/models.py
class Presupuesto(models.Model):
    id = AutoField(primary_key=True)
    nombre = CharField(max_length=255)
    monto = DecimalField(max_digits=12, decimal_places=2)
    facultad = ForeignKey(Facultad, on_delete=CASCADE)
    periodo = ForeignKey(Periodo, on_delete=CASCADE)
    creado_por = ForeignKey(Usuario, on_delete=SET_NULL, null=True)
    fecha_creacion = DateTimeField(auto_now_add=True)
    activo = BooleanField(default=True)

class Transaccion(models.Model):
    id = AutoField(primary_key=True)
    tipo = CharField(choices=[('INGRESO', 'Ingreso'), ('EGRESO', 'Egreso')])
    monto = DecimalField(max_digits=12, decimal_places=2)
    descripcion = TextField()
    presupuesto = ForeignKey(Presupuesto, on_delete=CASCADE)
    fecha = DateTimeField(auto_now_add=True)
    usuario = ForeignKey(Usuario, on_delete=SET_NULL, null=True)
```

### Crear Serializers

```python
# financiero/serializers.py
from rest_framework import serializers
from .models import Presupuesto, Transaccion

class PresupuestoSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.nombre', read_only=True)
    
    class Meta:
        model = Presupuesto
        fields = ['id', 'nombre', 'monto', 'facultad', 'facultad_nombre', 
                  'periodo', 'creado_por', 'creado_por_nombre', 
                  'fecha_creacion', 'activo']

class TransaccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaccion
        fields = ['id', 'tipo', 'monto', 'descripcion', 'presupuesto', 
                  'fecha', 'usuario']
```

### Crear Views

```python
# financiero/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Presupuesto, Transaccion
from .serializers import PresupuestoSerializer, TransaccionSerializer

class PresupuestoListAPI(APIView):
    def get(self, request):
        presupuestos = Presupuesto.objects.all()
        serializer = PresupuestoSerializer(presupuestos, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        serializer = PresupuestoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### Registrar URLs

```python
# financiero/api_urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('presupuestos/', views.PresupuestoListAPI.as_view(), name='presupuesto-list'),
    path('transacciones/', views.TransaccionListAPI.as_view(), name='transaccion-list'),
]

# En mysite/urls.py, agregar:
# path('api/financiero/', include('financiero.api_urls'))
```

### Frontend - Componente

```tsx
// frontend/src/pages/financiero/GestionFinanciera.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../core/apiClient';

export default function GestionFinanciera() {
    const { hasEditPermission } = useAuth();
    const [presupuestos, setPresupuestos] = useState([]);
    const isEditable = hasEditPermission("Gestión Financiera");
    
    useEffect(() => {
        apiClient.get('/api/financiero/presupuestos/').then(data => {
            setPresupuestos(data);
        });
    }, []);
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Gestión Financiera</h1>
            
            {isEditable && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded mb-4">
                    + Nuevo Presupuesto
                </button>
            )}
            
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2 text-left">Nombre</th>
                        <th className="border p-2 text-left">Monto</th>
                        <th className="border p-2 text-left">Facultad</th>
                        <th className="border p-2 text-left">Creado Por</th>
                        <th className="border p-2 text-left">Fecha</th>
                        {isEditable && <th className="border p-2 text-left">Acciones</th>}
                    </tr>
                </thead>
                <tbody>
                    {presupuestos.map(p => (
                        <tr key={p.id}>
                            <td className="border p-2">{p.nombre}</td>
                            <td className="border p-2">${p.monto}</td>
                            <td className="border p-2">{p.facultad_nombre}</td>
                            <td className="border p-2">{p.creado_por_nombre}</td>
                            <td className="border p-2">{new Date(p.fecha_creacion).toLocaleDateString()}</td>
                            {isEditable && (
                                <td className="border p-2">
                                    <button className="text-blue-600 mr-2">Editar</button>
                                    <button className="text-red-600">Eliminar</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
```

### Actualizar componentRoutes.ts

```typescript
export const COMPONENT_ROUTES: Record<string, string> = {
    // ... existentes ...
    'Gestión Financiera': '/admin/financiero',
    'Reportes Financieros': '/admin/reportes-financieros'
};

export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // ... existentes ...
    'Gestión Financiera': DollarSign,
    'Reportes Financieros': BarChart3
};
```

### Actualizar AppRouter.tsx

```typescript
const GestionFinanciera = lazy(() => 
    import('../pages/financiero/GestionFinanciera')
);

// En routes:
<Route path="/admin/financiero" element={
    <ProtectedRoute requiredComponent="Gestión Financiera">
        <GestionFinanciera />
    </ProtectedRoute>
} />
```

### Resultado

Cuando el usuario "jefe_financiero" hace login:
1. ✅ Backend retorna componentes con "Gestión Financiera" (permiso EDITAR)
2. ✅ Frontend agrega a `auth.components`
3. ✅ `useAdminDashboard` agrupa en sección "Financiero"
4. ✅ AdminDashboard renderiza menú
5. ✅ Cuando entra a `/admin/financiero`, `ProtectedRoute` valida `hasPermission("Gestión Financiera")`
6. ✅ Componente renderiza tabla
7. ✅ Botones de edición visible porque `hasEditPermission("Gestión Financiera")` = true
8. ✅ Si intenta acceder sin permiso, ve "Acceso Denegado"

---

## 1️⃣2️⃣ REFERENCIA RÁPIDA

### URLs Backend
```
POST   /usuarios/login/                    → Login con componentes
GET    /usuarios/logout/                   → Logout
GET    /usuarios/session-auth-state/       → Sync de permisos
GET/POST /api/financiero/presupuestos/    → CRUD presupuestos
```

### Modelos Clave
```
Usuario → rol → ComponenteRol ← permiso
        → facultad
        → sede
        → seccional
```

### Flujos Frontend
```
Login → AuthContext → AppRouter → ProtectedRoute → Página
                   ↓
              useAdminDashboard → AdminDashboard → Menú
                   ↓
           Auth.hasPermission()
```

### Pattern Componente Nuevo
```
1. Crear Componente en DB
2. Crear ComponenteRol para roles
3. Agregar Nombre en componentRoutes.ts
4. Crear página TSX
5. Agregar ruta en AppRouter
6. (Opcional) Agregar agrupación en useAdminDashboard
```

---

**Última actualización**: 5 de abril de 2026  
**Versión**: 1.0
