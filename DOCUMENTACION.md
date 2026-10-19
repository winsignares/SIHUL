# Documentación Completa del Sistema SIHUL

> Documento unificado, generado a partir de la carpeta `documentacion/` del repositorio.
> Fecha de consolidación: 2026-10-19

## Tabla de contenido

- INDICE.md
- ARQUITECTURA_COMPLETA_ANALISIS.md
- REFERENCIA_RAPIDA.md
- CAMBIOS_SIHUL_FINANCIERO.md
- ENTORNO_PRUEBAS.md
- GUIA_INTEGRACION_MODULO_FINANCIERO.md
- documentacion_backend/APPS_DJANGO.md
- documentacion_backend/AUTENTICACION_Y_PERMISOS.md
- documentacion_backend/CONFIGURACION_SETTINGS.md
- documentacion_backend/MODULO_FINANCIERO.md
- documentacion_backend/TESTS_Y_SEEDERS.md
- documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md
- documentacion_oracle/INTEGRACION_ETL_ORACLE.md
- documentacion_frontend/ESTRUCTURA_Y_STACK.md
- documentacion_frontend/ENRUTAMIENTO_DINAMICO.md
- documentacion_frontend/RESPONSIVE_UPDATES.md
- documentacion_frontend/RESUMEN_NOTIFICACIONES.md
- documentacion_frontend/hooks/HOOKS_INDICE.md
- documentacion_frontend/hooks/HOOKS_PRINCIPALES.md
- documentacion_frontend/hooks/HOOKS_DASHBOARD.md
- documentacion_frontend/hooks/HOOKS_ESPACIOS.md
- documentacion_frontend/hooks/HOOKS_HORARIOS.md
- documentacion_frontend/hooks/HOOKS_GESTION_ACADEMICA.md
- documentacion_frontend/hooks/HOOKS_FINANCIERO.md
- documentacion_frontend/hooks/HOOKS_CHATBOT_NOTIFICACIONES.md
- documentacion_frontend/hooks/HOOKS_PERMISOS_USERS.md
- documentacion_frontend/hooks/HOOKS_REPORTE.md
- documentacion_frontend/hooks/HOOKS_PATRON_CACHE.md
- documentacion_frontend/paginas/PAGINAS_INDICE.md
- documentacion_frontend/paginas/PAGINAS_DASHBOARD.md
- documentacion_frontend/paginas/PAGINAS_GESTION_ACADEMICA.md
- documentacion_frontend/paginas/PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md
- documentacion_frontend/paginas/PAGINAS_CHATBOT_FINANCIERO.md
- documentacion_frontend/paginas/PAGINAS_REPORTES_PERMISOS_USUARIOS.md
- documentacion_frontend/paginas/PAGINAS_SHARED.md
- documentacion_frontend/services/SERVICES_INDICE.md
- documentacion_frontend/services/SERVICES_CORE.md
- documentacion_frontend/services/SERVICES_ACADEMICO.md
- documentacion_frontend/services/SERVICES_ESPACIOS_HORARIOS.md
- documentacion_frontend/services/SERVICES_FINANCIERO.md
- documentacion_frontend/services/SERVICES_PRESTAMOS_REPORTE.md
- documentacion_frontend/services/SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md
- documentacion_frontend/services/SERVICES_CHATBOT.md
- documentacion_frontend/services/SERVICES_LEGACY.md

---


<!-- ===================================================== -->
## 📄 INDICE.md

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
| `chatbot` | `chatbot.Dockerfile` | `8001` | FastAPI (`uvicorn --reload`), usa su propio `chatbot/.env`. |
| `frontend` | `frontend.Dockerfile` | `5173` | Vite dev server con hot-reload (polling), `VITE_API_URL`/`VITE_CHATBOT_URL` apuntan a los otros dos servicios. |

Existe además `docker-compose.test.yml`: una copia aislada del stack (puertos y red distintos, cookies de sesión con nombre distinto) pensada para pruebas end-to-end sin interferir con el entorno de desarrollo. Está documentada en detalle en [ENTORNO_PRUEBAS.md](ENTORNO_PRUEBAS.md).

Variables de entorno:
- `.env.example` (raíz): solo variables de almacenamiento NAS del módulo financiero. El resto de configuración del stack de desarrollo está hardcodeada en `docker-compose.yml`.
- `.env.test.example` (raíz): plantilla completa para el stack de test (puertos, credenciales, `DJANGO_SECRET_KEY`, CORS/CSRF, OAuth Microsoft opcional, config. del chatbot, `ETL_PERIODO`).
- `chatbot/.env`: configuración propia del servicio de chatbot (independiente del `.env` de la raíz).
- Variables `ORACLE_*` (host/puerto/usuario/password/service): **no** están en ninguna plantilla `.env`; se deben proveer manualmente al ejecutar los comandos ETL (ver [documentacion_oracle/INTEGRACION_ETL_ORACLE.md](documentacion_oracle/INTEGRACION_ETL_ORACLE.md)).

## Módulos de dominio (resumen ejecutivo)

SIHUL gestiona información académica de la Universidad Libre (sedes, facultades, programas, periodos, grupos, asignaturas, horarios, espacios físicos, préstamos de espacios/recursos) más dos módulos transversales:

- **Financiero**: gestión de facturación institucional (proveedores, cuentas contables PUC, centros de costo, flujo de aprobación de facturas con ~18 estados, documentos adjuntos en NAS, reportes).
- **Chatbot (RAG)**: asistente conversacional que responde preguntas en lenguaje natural sobre documentos cargados en el sistema, usando embeddings vectoriales y OpenAI.

El acceso a cada pantalla no está hardcodeado por rol: existe un sistema de **componentes dinámicos** (`Componente` + `ComponenteRol` + overrides `ComponenteUsuario`) que el backend entrega al hacer login, y que el frontend usa para construir el menú y proteger rutas en caliente, sincronizando cambios de permisos cada 7 segundos sin recargar la página. Ver detalle en [documentacion_backend/AUTENTICACION_Y_PERMISOS.md](documentacion_backend/AUTENTICACION_Y_PERMISOS.md) y [documentacion_frontend/ENRUTAMIENTO_DINAMICO.md](documentacion_frontend/ENRUTAMIENTO_DINAMICO.md).

---

<!-- ===================================================== -->
## 📄 ARQUITECTURA_COMPLETA_ANALISIS.md

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

---

<!-- ===================================================== -->
## 📄 REFERENCIA_RAPIDA.md

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

---

<!-- ===================================================== -->
## 📄 CAMBIOS_SIHUL_FINANCIERO.md

# 🎯 RESUMEN DE CAMBIOS - SIHUL FINANCIERO (21 Abril 2026)

## 📋 Problemas Resueltos

### 1. ✅ Eliminar Seed Data Problemático
**Problema:** Las facturas del seed data causaban errores 404 y conflictos al intentar registrar desde "Mis Pendientes"

**Solución:**
- Comentado el bloque de creación de facturas demo en `seed_financiero.py`
- Las facturas deben crearse manualmente a través del panel
- Evita inconsistencias en la base de datos

**Archivo modificado:**
- `backend/financiero/management/commands/seed_financiero.py` (línea ~400)

---

### 2. ✅ Panel de Proveedor (NUEVO)
**Objetivo:** Dar a los proveedores visibilidad de sus facturas

**Componentes Creados:**
```
frontend/src/pages/financiero/proveedor/
├── index.tsx                 # Dashboard principal con tabla y estadísticas
├── FacturaDetalle.tsx        # Página de detalles de factura
└── README.md                 # Documentación del módulo
```

**Características:**
- Dashboard con estadísticas (total, monto, vencidas, etc.)
- Tabla de facturas con filtrado y búsqueda
- Vista detallada de cada factura
- Estados de facturas con colores
- Información financiera desglosada
- Cronograma de fechas

**Rutas Registradas:**
```
/financiero/proveedor                    # Dashboard principal
/financiero/proveedor/dashboard          # Alias del dashboard
/financiero/proveedor/:id                # Detalles de factura
```

---

### 3. ✅ Actualización de Router
**Archivo:** `frontend/src/router/AppRouter.tsx`

**Cambios:**
- Agregados lazy loading para `ProveedorDashboard` y `ProveedorFacturaDetalle`
- Registradas 3 nuevas rutas de proveedor
- Suspense correctamente implementado

---

## 🔧 Cambios Técnicos

### Backend (`financiero`)
```python
# seed_financiero.py - Seed data comentado
if False:  # Deshabilitado intencionalmente
    for data in facturas_demo:
        # Creación deshabilitada
        pass
```

**Por qué:** El seed data conflictúa con el flujo normal de registro

### Frontend

**Router actualizado:**
```typescript
const ProveedorDashboard = lazy(() => import('../pages/financiero/proveedor'));
const ProveedorFacturaDetalle = lazy(() => import('../pages/financiero/proveedor/FacturaDetalle'));

// Routes agregadas
<Route path="financiero/proveedor" />
<Route path="financiero/proveedor/dashboard" />
<Route path="financiero/proveedor/:id" />
```

---

## 📊 Estados Soportados en Panel de Proveedor

✅ Recibida  
✅ Registrada  
✅ Radicada  
✅ Causada  
✅ Alistada  
✅ Aprobada Auditoría  
✅ Cargada  
✅ Revisada Dir. Financiera  
✅ Enviada Rectoría  
✅ Autorizada  
✅ Pago Aplicado  
✅ Pagada  
⚠️ Rechazada  
⚠️ Devuelta  
⚠️ Detenida  
⚠️ Anulada  

---

## 🚀 Próximos Pasos

### Inmediatos
1. **Ejecutar Docker rebuild:**
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Vaciar la base de datos de facturas (opcional):**
   ```bash
   # Dentro del container
   python manage.py shell
   >>> from financiero.models import Factura
   >>> Factura.objects.all().delete()
   ```

3. **Probar flujo**
   - Crear factura como Funcionario
   - Actualizar desde "Mis Pendientes"
   - Ver en panel de Proveedor

### Futuro
- [ ] Agregar autenticación de proveedor (login independiente)
- [ ] Descarga de PDF con comprobantes
- [ ] Notificaciones por email
- [ ] Reportes mensuales
- [ ] Soporte para múltiples usuarios por proveedor

---

## 📝 Explicación de "Recurso no Encontrado"

**Error 404: "Recurso no encontrado"** ocurre cuando:

1. **El endpoint no existe en la BD** - Factura con ese ID específico no existe
2. **El usuario no tiene permisos** - No está autenticado o rol insuficiente
3. **La factura fue eliminada** - Borrada de la base de datos
4. **ID inválido en URL** - El parámetro `:id` no es numérico

**En este caso:** Las facturas del seed no existían realmente con los datos consistentes necesarios

---

## 🧪 Verificación de Cambios

### 1. Seed data deshabilitado
```bash
grep -n "if False:" backend/financiero/management/commands/seed_financiero.py
```
✅ Debe mostrar la línea con `if False:`

### 2. Archivos de proveedor creados
```bash
ls -la frontend/src/pages/financiero/proveedor/
```
✅ Debe mostrar: `index.tsx`, `FacturaDetalle.tsx`, `README.md`

### 3. Router actualizado
```bash
grep -n "ProveedorDashboard" frontend/src/router/AppRouter.tsx
```
✅ Debe mostrar 3 líneas (import + 2 routes)

---

## 📦 Archivos Modificados/Creados

| Archivo | Estado | Motivo |
|---------|--------|--------|
| `backend/financiero/management/commands/seed_financiero.py` | Modificado | Seed data deshabilitado |
| `frontend/src/pages/financiero/proveedor/index.tsx` | Creado | Dashboard de proveedor |
| `frontend/src/pages/financiero/proveedor/FacturaDetalle.tsx` | Creado | Detalles de factura |
| `frontend/src/pages/financiero/proveedor/README.md` | Creado | Documentación |
| `frontend/src/router/AppRouter.tsx` | Modificado | Nuevas rutas agregadas |

---

## ✨ Ventajas de esta Solución

### Para la Universidad
✅ Control total sobre el flujo de facturas  
✅ Evita duplicados y conflictos de datos  
✅ Base de datos limpia sin facturas de prueba  

### Para Proveedores
✅ Panel intuitivo para ver sus facturas  
✅ Seguimiento en tiempo real del estado  
✅ Información financiera clara  

### Para Desarrolladores
✅ Código organizado y modular  
✅ Rutas bien documentadas  
✅ Componentes reutilizables  

---

## 🐛 Troubleshooting

### Docker no inicia
```bash
docker-compose logs sihul-backend
# Revisar si hay errores de migración
```

### Rutas de proveedor no aparecen
```bash
# Limpiar cache de React
rm -rf frontend/node_modules/.vite

# Reiniciar servidor
npm run dev
```

### Seed data aún se crea
```bash
# Verificar que el cambio se guardó
grep -A 5 "COMENTADO: Seed data" backend/financiero/management/commands/seed_financiero.py
```

---

## 📞 Soporte
Para problemas o preguntas, consulta el README en:
- `frontend/src/pages/financiero/proveedor/README.md`
- `GUIA_PRUEBA_FACTURAS.md` (en raíz del proyecto)

---

**Versión:** 1.0  
**Fecha:** 21 de Abril de 2026  
**Estado:** ✅ Producción

---

<!-- ===================================================== -->
## 📄 ENTORNO_PRUEBAS.md

# Entorno de pruebas SIHUL

Este entorno usa el proyecto Compose `sihul-test` y no reutiliza los
contenedores, la red ni los volúmenes del stack principal `sihul`.

## Archivos

- `docker-compose.test.yml`: servicios aislados de prueba.
- `.env.test.example`: plantilla versionada.
- `.env.test`: configuración local ignorada por Git.

## URLs y puertos

- Frontend: `http://localhost:5273`
- Backend: `http://localhost:8100`
- Chatbot: `http://localhost:8101`
- PostgreSQL: `localhost:55432`
- Red Docker: `10.202.10.0/24` (`10.202.10.1` como gateway)

Los puertos internos siguen siendo `5173`, `8000`, `8001` y `5432`.
La subred puede cambiarse con `TEST_DOCKER_NETWORK_SUBNET` y
`TEST_DOCKER_NETWORK_GATEWAY` en `.env.test`.
En un servidor remoto, `TEST_PUBLIC_HOST` debe contener la IP o dominio que
usan los navegadores, por ejemplo `10.4.100.146`. No debe configurarse como
`localhost`, porque Vite usaría el equipo del usuario para el WebSocket HMR.
Las cookies usan los nombres `sihul_test_sessionid` y
`sihul_test_csrftoken`, evitando que el entorno de pruebas sobrescriba las
sesiones del entorno principal aunque ambos compartan host.

## Preparación

En una instalación nueva, crear el archivo local a partir de la plantilla:

```powershell
Copy-Item .env.test.example .env.test
```

Cambiar como mínimo `DB_PASSWORD` y `DJANGO_SECRET_KEY`. Para probar llamadas
reales del chatbot también se debe configurar `OPENAI_API_KEY`.

## Operación

Levantar o reconstruir todo el entorno:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build
```

Ver el estado:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml ps
```

Ver todos los logs:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml logs -f
```

Ver logs de un servicio:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml logs -f backend
docker compose --env-file .env.test -f docker-compose.test.yml logs -f frontend
```

Reconstruir solo backend o frontend:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build backend
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build frontend
```

Ejecutar comprobaciones de Django:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py check
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py test
```

Abrir una consola de Django:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml exec backend python manage.py shell
```

Detener temporalmente sin eliminar contenedores ni datos:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml stop
```

Volver a iniciar:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml start
```

Eliminar contenedores y red, conservando la base de pruebas:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml down
```

Reiniciar completamente la base de pruebas:

```powershell
docker compose --env-file .env.test -f docker-compose.test.yml down -v
docker compose --env-file .env.test -f docker-compose.test.yml up -d --build
```

`down -v` elimina únicamente los volúmenes del proyecto `sihul-test`, pero
borra de forma irreversible los datos almacenados en la base de pruebas.

---

<!-- ===================================================== -->
## 📄 GUIA_INTEGRACION_MODULO_FINANCIERO.md

# 💰 GUÍA DE INTEGRACIÓN - MÓDULO FINANCIERO A SIHUL

**Enfoque**: Integración del módulo Sihul-Financiera dentro de SIHUL principal

---

## 📋 RESUMEN ESTRATÉGICO

El módulo Financiero debe seguir la **arquitectura dinámica de componentes** de SIHUL:

1. ✅ **No crear un app separado**: Integrar como un módulo dentro de SIHUL
2. ✅ **Usar el sistema de Componentes**: "Gestión Financiera", "Reportes Financieros", etc.
3. ✅ **Compartir AuthContext**: El financiero hereda la autenticación
4. ✅ **Respetar roles**: admin, jefe_financiero, contador, auditor, etc.
5. ✅ **Sincronizar permisos**: Los cambios en BD se ven en ~7 segundos

---

## 🎯 DECISIONES CLAVE

### Opción A: Módulo Separado con Routing (NO RECOMENDADO)
- Versionable independiente
- Pero: Requiere duplicar AuthContext, necesita sincronización manual, difícil hacer auditaje integrado

### Opción B: Módulo Integrado en SIHUL (✅ RECOMENDADO)
- Usa misma DB, autenticación, sistema de menú
- Ventajas:
  - ✅ Reportes financieros + académicos juntos
  - ✅ Un solo login
  - ✅ Auditaje centralizado (quién hizo qué transacción)
  - ✅ Permisos finogranulares por facultad/sede
  - ✅ Tableros integrados

**Recomendación: Opción B**

---

## 📁 ESTRUCTURA PROPUESTA

```
backend/
├── financiero/                    ← NUEVO APP
│   ├── admin.py                   ← Registrar en admin Django
│   ├── apps.py
│   ├── models.py
│   ├── serializers.py
│   ├── views.py                   ← ViewSets REST
│   ├── permissions.py             ← Permisos personalizados
│   ├── api_urls.py                ← /api/financiero/*
│   ├── urls.py
│   ├── tests.py
│   ├── management/
│   │   └── commands/
│   │       └── crear_roles_financiero.py  ← Script para agregar roles
│   └── migrations/
│
├── auditoria/                     ← Si necesitas auditar cambios
│   ├── models.py
│   └── ...

frontend/
├── src/
│   ├── pages/
│   │   ├── financiero/            ← NUEVO (si separa)
│   │   │   ├── GestionFinanciera.tsx
│   │   │   ├── ReportesFinancieros.tsx
│   │   │   └── components/
│   │   └── (O integrar en gestionAcademica/)
│   │
│   ├── services/api/
│   │   ├── financiero.ts          ← Cliente API
│   │   └── ...
│   │
│   ├── config/
│   │   └── componentRoutes.ts     ← Actualizar

Sihul-Financiera/                  ← LEGACY (importar código)
├── src/
│   ├── components/admin/
│   └── ...
```

---

## 🔧 INTEGRACIÓN PASO A PASO

### FASE 1: Backend - Setup Django

#### 1.1 Crear App

```bash
cd backend
python manage.py startapp financiero
```

#### 1.2 Modelos (financiero/models.py)

```python
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from usuarios.models import Usuario, Rol
from facultades.models import Facultad
from periodos.models import Periodo

class CentroFinanciero(models.Model):
    """Centro/Dependencia financiera (Rectoría, Facultades, etc)"""
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    facultad = models.ForeignKey(
        Facultad, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='centros_financieros'
    )
    responsable = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='centros_financieros_responsable'
    )
    presupuesto_anual = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        default=0
    )
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name_plural = "Centros Financieros"
    
    def __str__(self):
        return self.nombre

class Presupuesto(models.Model):
    """Presupuesto para un período académico"""
    class Estado(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        APROBADO = 'APROBADO', 'Aprobado'
        EJECUTANDO = 'EJECUTANDO', 'En ejecución'
        CERRADO = 'CERRADO', 'Cerrado'
    
    id = models.AutoField(primary_key=True)
    centro = models.ForeignKey(
        CentroFinanciero,
        on_delete=models.CASCADE,
        related_name='presupuestos'
    )
    periodo = models.ForeignKey(
        Periodo,
        on_delete=models.CASCADE,
        related_name='presupuestos'
    )
    monto_total = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)
    
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='presupuestos_creados'
    )
    aprobado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='presupuestos_aprobados'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_cierre = models.DateTimeField(null=True, blank=True)
    
    observaciones = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('centro', 'periodo')
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.centro.nombre} - {self.periodo} - {self.get_estado_display()}"
    
    @property
    def monto_ejecutado(self):
        return self.transacciones.filter(tipo='EGRESO').aggregate(
            total=models.Sum('monto')
        )['total'] or 0
    
    @property
    def monto_disponible(self):
        return self.monto_total - self.monto_ejecutado

class Transaccion(models.Model):
    """Ingreso o egreso financiero"""
    class Tipo(models.TextChoices):
        INGRESO = 'INGRESO', 'Ingreso'
        EGRESO = 'EGRESO', 'Egreso'
    
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        APROBADA = 'APROBADA', 'Aprobada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'
        EJECUTADA = 'EJECUTADA', 'Ejecutada'
    
    id = models.AutoField(primary_key=True)
    presupuesto = models.ForeignKey(
        Presupuesto,
        on_delete=models.CASCADE,
        related_name='transacciones'
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.EGRESO
    )
    monto = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    descripcion = models.TextField()
    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )
    categoria = models.CharField(
        max_length=100,
        help_text="Ej: Servicios, Equipos, Viáticos"
    )
    
    solicitante = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transacciones_solicitadas'
    )
    aprobado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transacciones_aprobadas'
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_aprobacion = models.DateTimeField(null=True, blank=True)
    fecha_ejecucion = models.DateTimeField(null=True, blank=True)
    
    comprobante = models.FileField(
        upload_to='comprobantes/',
        null=True,
        blank=True,
        help_text="Factura, recibo, etc"
    )
    
    class Meta:
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['presupuesto', 'tipo']),
            models.Index(fields=['estado']),
            models.Index(fields=['solicitante'])
        ]
    
    def __str__(self):
        return f"{self.get_tipo_display()} ${self.monto} - {self.descripcion[:50]}"

class ReporteFinanciero(models.Model):
    """Reporte generado para análisis"""
    class Tipo(models.TextChoices):
        EJECUCION = 'EJECUCION', 'Ejecución Presupuestaria'
        INGRESOS = 'INGRESOS', 'Ingresos'
        EGRESOS = 'EGRESOS', 'Egresos'
        COMPARATIVO = 'COMPARATIVO', 'Comparativo'
    
    id = models.AutoField(primary_key=True)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    centro = models.ForeignKey(
        CentroFinanciero,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    periodo = models.ForeignKey(Periodo, on_delete=models.CASCADE)
    
    generado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reportes_financieros_generados'
    )
    
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    datos = models.JSONField(default=dict)  # Datos del reporte
    archivo_pdf = models.FileField(upload_to='reportes/', null=True, blank=True)
    archivo_excel = models.FileField(upload_to='reportes/', null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_generacion']
    
    def __str__(self):
        return f"{self.get_tipo_display()} - {self.periodo}"

class AuditoriaFinanciera(models.Model):
    """Log de cambios en transacciones (para auditoría)"""
    id = models.AutoField(primary_key=True)
    transaccion = models.ForeignKey(
        Transaccion,
        on_delete=models.CASCADE,
        related_name='auditorias'
    )
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    accion = models.CharField(
        max_length=50,
        help_text="crear, actualizar, aprobar, rechazar, ejecutar"
    )
    cambios = models.JSONField(
        default=dict,
        help_text="Campo antiguo -> nuevo"
    )
    fecha = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha']
        verbose_name_plural = "Auditorías Financieras"
    
    def __str__(self):
        return f"{self.accion} de {self.transaccion} por {self.usuario}"
```

#### 1.3 Serializers (financiero/serializers.py)

```python
from rest_framework import serializers
from .models import CentroFinanciero, Presupuesto, Transaccion, ReporteFinanciero

class CentroFinancieroSerializer(serializers.ModelSerializer):
    facultad_nombre = serializers.CharField(source='facultad.nombre', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.nombre', read_only=True)
    
    class Meta:
        model = CentroFinanciero
        fields = [
            'id', 'nombre', 'facultad', 'facultad_nombre',
            'responsable', 'responsable_nombre', 'presupuesto_anual',
            'activo', 'fecha_creacion'
        ]

class PresupuestoSerializer(serializers.ModelSerializer):
    centro_nombre = serializers.CharField(source='centro.nombre', read_only=True)
    periodo_nombre = serializers.SerializerMethodField()
    creado_por_nombre = serializers.CharField(source='creado_por.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.nombre', read_only=True)
    monto_ejecutado = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    monto_disponible = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    
    def get_periodo_nombre(self, obj):
        return f"{obj.periodo.nombre}" if obj.periodo else None
    
    class Meta:
        model = Presupuesto
        fields = [
            'id', 'centro', 'centro_nombre', 'periodo', 'periodo_nombre',
            'monto_total', 'monto_ejecutado', 'monto_disponible',
            'estado', 'creado_por', 'creado_por_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_creacion', 'fecha_aprobacion', 'observaciones'
        ]

class TransaccionSerializer(serializers.ModelSerializer):
    presupuesto_centro = serializers.CharField(source='presupuesto.centro.nombre', read_only=True)
    solicitante_nombre = serializers.CharField(source='solicitante.nombre', read_only=True)
    aprobado_por_nombre = serializers.CharField(source='aprobado_por.nombre', read_only=True)
    
    class Meta:
        model = Transaccion
        fields = [
            'id', 'presupuesto', 'presupuesto_centro', 'tipo', 'monto',
            'descripcion', 'estado', 'categoria',
            'solicitante', 'solicitante_nombre',
            'aprobado_por', 'aprobado_por_nombre',
            'fecha_creacion', 'fecha_aprobacion', 'fecha_ejecucion',
            'comprobante'
        ]
```

#### 1.4 Views (financiero/views.py)

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    CentroFinanciero, Presupuesto, Transaccion, ReporteFinanciero
)
from .serializers import (
    CentroFinancieroSerializer, PresupuestoSerializer,
    TransaccionSerializer
)

class CentroFinancieroViewSet(viewsets.ModelViewSet):
    queryset = CentroFinanciero.objects.select_related('facultad', 'responsable')
    serializer_class = CentroFinancieroSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filtrar por facultad del usuario si es planeación facultad
        user = self.request.user
        if hasattr(user, 'facultad') and user.facultad:
            if user.rol and 'planeacion' in user.rol.nombre.lower():
                return super().get_queryset().filter(facultad=user.facultad)
        return super().get_queryset()

class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.select_related(
        'centro', 'periodo', 'creado_por', 'aprobado_por'
    )
    serializer_class = PresupuestoSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        presupuesto = self.get_object()
        if presupuesto.estado != Presupuesto.Estado.BORRADOR:
            return Response(
                {'error': 'Solo se pueden aprobar presupuestos en borrador'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        presupuesto.estado = Presupuesto.Estado.APROBADO
        presupuesto.aprobado_por = request.user
        presupuesto.fecha_aprobacion = timezone.now()
        presupuesto.save()
        
        return Response(
            PresupuestoSerializer(presupuesto).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'])
    def por_centro(self, request):
        centro_id = request.query_params.get('centro_id')
        if centro_id:
            presupuestos = self.get_queryset().filter(centro_id=centro_id)
            serializer = self.get_serializer(presupuestos, many=True)
            return Response(serializer.data)
        return Response({'error': 'centro_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

class TransaccionViewSet(viewsets.ModelViewSet):
    queryset = Transaccion.objects.select_related(
        'presupuesto', 'solicitante', 'aprobado_por'
    )
    serializer_class = TransaccionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        transaccion = self.get_object()
        if transaccion.estado != Transaccion.Estado.PENDIENTE:
            return Response(
                {'error': 'Solo se pueden aprobar transacciones pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        transaccion.estado = Transaccion.Estado.APROBADA
        transaccion.aprobado_por = request.user
        transaccion.fecha_aprobacion = timezone.now()
        transaccion.save()
        
        return Response(
            TransaccionSerializer(transaccion).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        # Implementar rechazo
        pass
```

#### 1.5 URLs (financiero/api_urls.py)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'centros', views.CentroFinancieroViewSet, basename='centro-financiero')
router.register(r'presupuestos', views.PresupuestoViewSet, basename='presupuesto')
router.register(r'transacciones', views.TransaccionViewSet, basename='transaccion')

urlpatterns = [
    path('', include(router.urls)),
]

# En mysite/urls.py agregar:
# path('api/financiero/', include('financiero.api_urls')),
```

#### 1.6 Registrar en apps (mysite/settings.py)

```python
INSTALLED_APPS = [
    # ... existentes ...
    'financiero',
]
```

#### 1.7 Migrations

```bash
python manage.py makemigrations financiero
python manage.py migrate
```

---

### FASE 2: Backend - Crear Roles y Componentes

#### 2.1 Script (financiero/management/commands/crear_roles_financiero.py)

```python
from django.core.management.base import BaseCommand
from usuarios.models import Rol
from componentes.models import Componente, ComponenteRol

class Command(BaseCommand):
    help = 'Crea roles y componentes para el módulo financiero'
    
    def handle(self, *args, **options):
        # Crear roles
        jefe_financiero, _ = Rol.objects.get_or_create(
            nombre='jefe_financiero',
            defaults={'descripcion': 'Jefe de Finanzas'}
        )
        
        contador, _ = Rol.objects.get_or_create(
            nombre='contador',
            defaults={'descripcion': 'Contador/Contable'}
        )
        
        auditor, _ = Rol.objects.get_or_create(
            nombre='auditor',
            defaults={'descripcion': 'Auditor Interno'}
        )
        
        # Crear componentes
        comp_gestion, _ = Componente.objects.get_or_create(
            nombre='Gestión Financiera',
            defaults={'descripcion': 'CRUD presupuestos y transacciones'}
        )
        
        comp_reportes, _ = Componente.objects.get_or_create(
            nombre='Reportes Financieros',
            defaults={'descripcion': 'Visualización de reportes financieros'}
        )
        
        comp_auditoria, _ = Componente.objects.get_or_create(
            nombre='Auditoría Financiera',
            defaults={'descripcion': 'Log y auditoría de cambios'}
        )
        
        # Asignar permisos
        ComponenteRol.objects.get_or_create(
            rol=jefe_financiero,
            componente=comp_gestion,
            defaults={'permiso': 'EDITAR'}
        )
        ComponenteRol.objects.get_or_create(
            rol=jefe_financiero,
            componente=comp_reportes,
            defaults={'permiso': 'EDITAR'}
        )
        
        ComponenteRol.objects.get_or_create(
            rol=contador,
            componente=comp_gestion,
            defaults={'permiso': 'EDITAR'}
        )
        ComponenteRol.objects.get_or_create(
            rol=contador,
            componente=comp_reportes,
            defaults={'permiso': 'VER'}
        )
        
        ComponenteRol.objects.get_or_create(
            rol=auditor,
            componente=comp_auditoria,
            defaults={'permiso': 'VER'}
        )
        
        self.stdout.write(self.style.SUCCESS('Roles y componentes creados'))
```

#### 2.2 Ejecutar script

```bash
python manage.py crear_roles_financiero
```

---

### FASE 3: Frontend - Agregar Componentes

#### 3.1 Actualizar componentRoutes.ts

```typescript
// src/config/componentRoutes.ts
import { DollarSign, BarChart3, Shield } from 'lucide-react';

export const COMPONENT_ROUTES: Record<string, string> = {
    // ... existentes ...
    'Gestión Financiera': '/admin/financiero',
    'Reportes Financieros': '/admin/reportes-financieros',
    'Auditoría Financiera': '/admin/auditoria-financiera'
};

export const COMPONENT_ICONS: Record<string, LucideIcon> = {
    // ... existentes ...
    'Gestión Financiera': DollarSign,
    'Reportes Financieros': BarChart3,
    'Auditoría Financiera': Shield
};
```

#### 3.2 Actualizar useAdminDashboard.ts

```typescript
// Agregar sección financiera
const financeNames = [
    'Gestión Financiera',
    'Reportes Financieros',
    'Auditoría Financiera'
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

// Insertar en orden correcto (después de Gestión Académica, antes de Reportes)
```

#### 3.3 Crear Servicio API

```typescript
// src/services/api/financiero.ts
import { apiClient } from '../../core/apiClient';

export interface CentroFinanciero {
    id: number;
    nombre: string;
    facultad_id?: number;
    facultad_nombre?: string;
    responsable_id?: number;
    responsable_nombre?: string;
    presupuesto_anual: number;
    activo: boolean;
}

export interface Presupuesto {
    id: number;
    centro_id: number;
    centro_nombre: string;
    periodo_id: number;
    periodo_nombre: string;
    monto_total: number;
    monto_ejecutado: number;
    monto_disponible: number;
    estado: 'BORRADOR' | 'APROBADO' | 'EJECUTANDO' | 'CERRADO';
    creado_por_nombre: string;
    fecha_creacion: string;
    observaciones?: string;
}

export interface Transaccion {
    id: number;
    presupuesto_id: number;
    tipo: 'INGRESO' | 'EGRESO';
    monto: number;
    descripcion: string;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EJECUTADA';
    categoria: string;
    solicitante_nombre: string;
    fecha_creacion: string;
}

export const financieroService = {
    // Centros
    getCentros: () => 
        apiClient.get<CentroFinanciero[]>('/api/financiero/centros/'),
    
    getCentro: (id: number) =>
        apiClient.get<CentroFinanciero>(`/api/financiero/centros/${id}/`),
    
    createCentro: (data: any) =>
        apiClient.post('/api/financiero/centros/', data),
    
    updateCentro: (id: number, data: any) =>
        apiClient.put(`/api/financiero/centros/${id}/`, data),
    
    // Presupuestos
    getPresupuestos: () =>
        apiClient.get<Presupuesto[]>('/api/financiero/presupuestos/'),
    
    getPresupuestosPorCentro: (centroId: number) =>
        apiClient.get<Presupuesto[]>(
            `/api/financiero/presupuestos/por_centro/?centro_id=${centroId}`
        ),
    
    createPresupuesto: (data: any) =>
        apiClient.post('/api/financiero/presupuestos/', data),
    
    aprobarPresupuesto: (id: number) =>
        apiClient.post(`/api/financiero/presupuestos/${id}/aprobar/`, {}),
    
    // Transacciones
    getTransacciones: () =>
        apiClient.get<Transaccion[]>('/api/financiero/transacciones/'),
    
    createTransaccion: (data: any) =>
        apiClient.post('/api/financiero/transacciones/', data),
    
    aprobarTransaccion: (id: number) =>
        apiClient.post(`/api/financiero/transacciones/${id}/aprobar/`, {}),
    
    rechazarTransaccion: (id: number) =>
        apiClient.post(`/api/financiero/transacciones/${id}/rechazar/`, {})
};
```

#### 3.4 Crear Páginas

```tsx
// src/pages/financiero/GestionFinanciera.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { financieroService, type Presupuesto } from '../../services/api/financiero';
import { Button } from '../../components/ui/button';
import { useIsMobile } from '../../hooks/useIsMobile';
import { DollarSign, Plus, Eye, Edit2, Trash2 } from 'lucide-react';

export default function GestionFinanciera() {
    const isMobile = useIsMobile();
    const { hasEditPermission } = useAuth();
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [loading, setLoading] = useState(true);
    
    const canEdit = hasEditPermission('Gestión Financiera');
    
    useEffect(() => {
        loadPresupuestos();
    }, []);
    
    const loadPresupuestos = async () => {
        try {
            setLoading(true);
            const data = await financieroService.getPresupuestos();
            setPresupuestos(data);
        } catch (error) {
            console.error('Error cargando presupuestos:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleAprobar = async (id: number) => {
        try {
            await financieroService.aprobarPresupuesto(id);
            loadPresupuestos();
        } catch (error) {
            console.error('Error:', error);
        }
    };
    
    if (loading) {
        return (
            <div className={`${isMobile ? 'p-4' : 'p-8'} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }
    
    return (
        <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
            {/* Header */}
            <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>
                            Gestión Financiera
                        </h1>
                        <p className="text-gray-500">Administra presupuestos y transacciones</p>
                    </div>
                </div>
                
                {canEdit && (
                    <Button className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Presupuesto
                    </Button>
                )}
            </div>
            
            {/* Estadísticas */}
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Total Presupuesto</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_total, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Ejecutado</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_ejecutado, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600 text-sm">Disponible</p>
                    <p className="text-2xl font-bold">
                        ${presupuestos.reduce((sum, p) => sum + p.monto_disponible, 0).toLocaleString()}
                    </p>
                </div>
            </div>
            
            {/* Tabla */}
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Centro</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Período</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Ejecutado</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Estado</th>
                            {!isMobile && canEdit && (
                                <th className="px-4 py-3 text-left text-sm font-semibold">Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {presupuestos.map(p => (
                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3">{p.centro_nombre}</td>
                                <td className="px-4 py-3">{p.periodo_nombre}</td>
                                <td className="px-4 py-3">${p.monto_total.toLocaleString()}</td>
                                <td className="px-4 py-3">${p.monto_ejecutado.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded text-xs font-semibold"
                                        style={{
                                            backgroundColor: p.estado === 'APROBADO' ? '#dcfce7' : 
                                                            p.estado === 'EJECUTANDO' ? '#dbeafe' : '#f3f4f6',
                                            color: p.estado === 'APROBADO' ? '#166534' :
                                                   p.estado === 'EJECUTANDO' ? '#1e40af' : '#374151'
                                        }}
                                    >
                                        {p.estado}
                                    </span>
                                </td>
                                {!isMobile && canEdit && (
                                    <td className="px-4 py-3 space-x-2">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button className="text-green-600 hover:text-green-800"
                                            onClick={() => handleAprobar(p.id)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button className="text-red-600 hover:text-red-800">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

#### 3.5 Agregar Rutas en AppRouter.tsx

```typescript
// src/router/AppRouter.tsx
const GestionFinanciera = lazy(() => 
    import('../pages/financiero/GestionFinanciera')
);

const ReportesFinancieros = lazy(() => 
    import('../pages/financiero/ReportesFinancieros')
);

// En las rutas:
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

---

### FASE 4: Testing

#### 4.1 Test de Permisos

```bash
# Test login como admin
curl -X POST http://localhost:8000/usuarios/login/ \
  -H "Content-Type: application/json" \
  -d '{"correo": "admin@universidad.edu", "contrasena": "pass123"}'

# Debe incluir en respuesta:
# "componentes": [
#   {"id": 1, "nombre": "Gestión Financiera", "permiso": "EDITAR"},
#   ...
# ]
```

#### 4.2 Test Frontend

```tsx
// Verificar que aparece en menú
// 1. Hacer login como admin
// 2. Revisar que menú tiene sección "Financiero"
// 3. Clic en "Gestión Financiera"
// 4. Verificar que carga page sin "Acceso Denegado"
```

---

## ✅ CHECKLIST FINAL

### Backend
- [ ] App `financiero` creada
- [ ] Modelos definidos (Presupuesto, Transaccion, etc)
- [ ] Serializers creados
- [ ] ViewSets creados
- [ ] URLs registradas en `mysite/urls.py`
- [ ] App agregada a `INSTALLED_APPS`
- [ ] Migrations ejecutadas
- [ ] Componentes creados en DB
- [ ] ComponenteRol asignados

### Frontend
- [ ] `componentRoutes.ts` actualizado
- [ ] `useAdminDashboard.ts` actualizado (sección financiero)
- [ ] API service creado (`financiero.ts`)
- [ ] Páginas creadas (GestionFinanciera, ReportesFinancieros)
- [ ] Rutas agregadas en AppRouter
- [ ] Import lazy de componentes

### Testing
- [ ] Login devuelve componentes financieros
- [ ] Menú muestra sección Financiero
- [ ] ProtectedRoute funciona (bloquea sin permiso)
- [ ] Página carga sin errores
- [ ] CRUD básico funciona

---

## 🚀 DESPUÉS DE INTEGRACIÓN

Una vez funcionando:

1. **Personalizar permisos**: Crear más roles (auditor, contador, etc.)
2. **Reportes**: Agregar generación de PDF/Excel
3. **Notificaciones**: Avisar cuando transacciones necesitan aprobación
4. **Gráficos**: Dashboards con charts de Recharts o Chart.js
5. **Importación**: Bulk upload de presupuestos desde Excel
6. **Integración con reporte académico**: Ligar gasto → actividades académicas

---

**Notas finales**:
- El código anterior es de EJEMPLO, ajustar según tu estructura exacta
- Validaciones de permisos más robustas en backend (middleware)
- Considerar auditoría automática con django-auditlog
- Test unitarios para modelos y views

---

<!-- ===================================================== -->
## 📄 documentacion_backend/APPS_DJANGO.md

# Apps Django del backend (`backend/`)

Django 5.2.7 + Django REST Framework, sirviendo tanto la API académica como el módulo financiero. Ver también [../documentacion_oracle/INTEGRACION_ETL_ORACLE.md](../documentacion_oracle/INTEGRACION_ETL_ORACLE.md) para el ETL, y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md) para la app puente `chatbot`.

## Stack y dependencias clave (`backend/requirements.txt`)

- `Django==5.2.7`, `djangorestframework==3.15.2`, `django-filter`, `django-cors-headers==4.6.0`.
- `django-allauth==65.2.0` → login social con Microsoft (OAuth), opcional.
- `psycopg2-binary==2.9.10` → driver PostgreSQL (base de datos operativa).
- `oracledb>=2.0.0` → driver Oracle, usado **solo** por los comandos ETL.
- `smbprotocol==1.15.0` → acceso a NAS compartido para documentos financieros.
- `reportlab`, `pypdf`, `openpyxl`, `Pillow` → generación de PDF/Excel/imágenes (reportes, facturas).
- `gunicorn` (producción), `werkzeug`, `cryptography`, `requests`.

Proyecto Django raíz: `backend/mysite/` (contiene `settings.py`, `urls.py`, y no es una app de dominio sino el núcleo transversal: autenticación de sesión, permisos, middleware, seeders).

## Apps Django

Cada app vive en `backend/<app>/` con su `models.py`/`views.py`/`urls.py` estándar.

| App | Responsabilidad |
|---|---|
| `mysite` | Núcleo transversal: settings, urls raíz, autenticación de sesión custom (`seccional_auth.py`), helpers de roles (`auth_helpers.py`), permisos DRF (`permissions.py`), middleware de sede (`middleware.py`), vistas de auth (`auth_views.py`), adaptador OAuth (`social_adapter.py`), filtro Oracle por seccional (`oracle_seccional_filter.py`), seeders (`management/commands/seed_all.py` + `seeders/*`). |
| `usuarios` | Modelo `Usuario` (custom, login por `correo`), `Rol`, staging Oracle de docentes/estudiantes, comandos ETL relacionados. |
| `componentes` | Sistema de permisos dinámico: `Componente`, `ComponenteRol`, `ComponenteUsuario`. Ver [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md). |
| `sedes` | `Sede`, `Seccional` (Bogotá, Cali, Barranquilla, Cúcuta, Cartagena, Pereira, El Socorro, Virtual, Nacional) + ETL. |
| `facultades` | Facultades académicas. |
| `programas` | Programas académicos + ETL Oracle. |
| `periodos` | Periodos académicos (usado también como filtro global `ETL_PERIODO`). |
| `grupos` | Grupos académicos + staging Oracle. |
| `asignaturas` | Asignaturas y su relación con programas + ETL. |
| `horario` | Núcleo de horarios académicos, ETL Oracle, reportes de horarios sin espacio asignado. |
| `espacios` | Espacios físicos (aulas, laboratorios), `EspacioPermitido` (autorización de supervisores), ETL Oracle. |
| `recursos` | Recursos/equipos asociados a espacios. |
| `prestamos` | Préstamos de espacios/recursos, lógica de disponibilidad (`availability.py`). |
| `chatbot` | App puente Django ↔ servicio FastAPI: `api_views.py`/`api_urls.py` actúan de proxy hacia `CHATBOT_FASTAPI_URL`. |
| `notificaciones` | Notificaciones vía señales Django (`signals.py`), consumidas por el frontend con polling cada 30s. Ver `backend/notificaciones/README.md` para el detalle completo de tipos de evento y prioridades. |
| `financiero` | Módulo de facturación institucional. Ver [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md). |

## Documentos relacionados en esta carpeta

- [AUTENTICACION_Y_PERMISOS.md](AUTENTICACION_Y_PERMISOS.md) — RBAC dinámico por componente, sesiones, OAuth.
- [CONFIGURACION_SETTINGS.md](CONFIGURACION_SETTINGS.md) — `settings.py`: base de datos, apps instaladas, middleware, variables de entorno.
- [MODULO_FINANCIERO.md](MODULO_FINANCIERO.md) — modelo de facturación institucional.
- [TESTS_Y_SEEDERS.md](TESTS_Y_SEEDERS.md) — tests existentes y seeders de datos.

---

<!-- ===================================================== -->
## 📄 documentacion_backend/AUTENTICACION_Y_PERMISOS.md

# Autenticación y sistema de permisos (RBAC dinámico por componente)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md) para el listado general de apps del backend.

SIHUL **no usa JWT**: usa sesiones de Django sobre un modelo `Usuario` custom (`AUTH_USER_MODEL = 'usuarios.Usuario'`, login por `correo`).

- **`SessionUsuarioAuthentication`** (`mysite/seccional_auth.py`): clase de autenticación DRF que resuelve `request.user` leyendo `request.session['user_id']`. Es la primera clase en `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`.
- **Modelo de permisos**:
  - `Rol`: nombre libre (`admin`, `admin_global`, `docente`, `estudiante`, `supervisor_general`, y los roles financieros: `funcionario`, `contabilidad`, `tesoreria`, `auditoria`, `direccion_financiera`, `rectoria`, `admin_financiero`, `proveedor`).
  - `Componente`: una "pantalla" o funcionalidad con nombre libre (ej. "Gestión de Facturas").
  - `ComponenteRol`: asigna un `Componente` a un `Rol` con `permiso` = `VER` o `EDITAR`.
  - `ComponenteUsuario`: **override individual** — permite ajustar el permiso de un componente para un usuario puntual sin tocar su rol.
- **Endpoint de sesión** (`mysite/auth_views.py`):
  - `user_view`: construye la lista de componentes efectivos del usuario (combinando `ComponenteRol` + overrides), calcula `espacios_permitidos`, genera/reutiliza un **token secreto de sesión** (`secrets.token_urlsafe(32)`) y una **firma** (`_session_signature`, hash corto sobre componentes+rol) que el frontend usa para detectar cambios de permisos sin volver a pedir todo.
  - `logout_view`, `login_success` (redirección tras login OAuth Microsoft).
- **Filtrado multi-sede/seccional**:
  - `SedeFilterMiddleware` (`mysite/middleware.py`): adjunta `request.sede`/`request.sede_id`/`request.seccional`/`request.user_obj` en cada request autenticado.
  - `SeccionalMixin` (`mysite/seccional_auth.py`): mixin para ViewSets DRF que filtra automáticamente los querysets por la seccional del usuario (excepto admins globales/sistema) y completa `sede`/`seccional` al crear registros.
- **Helpers y permisos DRF**: `mysite/auth_helpers.py` (funciones puras: `is_admin_global`, `is_admin_sistema`, `has_any_role`, etc.) usadas por las clases de permiso en `mysite/permissions.py` (`IsAdminGlobal`, `IsAdminSistema`, `IsCoordinador`, `IsDocente`, `IsEstudiante`, `IsSupervisorGeneral`, `IsAuthenticatedReadOnlyOrAdminWrite`...).
- **Microsoft OAuth** (opcional, solo si `MICROSOFT_CLIENT_ID`/`SECRET` están configurados): vía `django-allauth` + adaptador custom `mysite/social_adapter.py`.

> Nota: los documentos `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../REFERENCIA_RAPIDA.md` explican este mismo flujo con más diagramas y ejemplos de queries; este documento es el resumen técnico ligado directamente al código fuente actual.

Ver también [../documentacion_frontend/ENRUTAMIENTO_DINAMICO.md](../documentacion_frontend/ENRUTAMIENTO_DINAMICO.md) para cómo el frontend consume este sistema de componentes/permisos.

---

<!-- ===================================================== -->
## 📄 documentacion_backend/CONFIGURACION_SETTINGS.md

# `settings.py` — puntos relevantes (`backend/mysite/settings.py`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

- Base de datos: PostgreSQL vía `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST` (default `db`)/`DB_PORT`.
- `INSTALLED_APPS`: todas las apps de dominio listadas en [APPS_DJANGO.md](APPS_DJANGO.md) + `rest_framework`, `corsheaders`, `django_filters`, apps `django.contrib.*`, y condicionalmente `allauth.*`.
- `MIDDLEWARE`: stack estándar + `corsheaders` + `SedeFilterMiddleware` al final.
- CORS/CSRF configurables por variable de entorno (default incluye `localhost:5173` y `sihul.unilibre.edu.co`).
- Nombre de cookie de sesión/CSRF configurable — permite que el stack de test (`sihul_test_sessionid`) conviva con producción en el mismo host.
- Almacenamiento de documentos financieros: `MEDIA_ROOT` (`FINANCIERO_DOCUMENT_ROOT`, default `/tmp/sihul_uploads`) + `FINANCIERO_DOCUMENT_NETWORK_ROOT/USER/PASSWORD` para copiar a un NAS SMB institucional.
- `ETL_PERIODO`: periodo académico activo usado como filtro por los comandos ETL de Oracle (default `20261`).
- `CHATBOT_FASTAPI_URL`: URL interna al servicio FastAPI del chatbot (`http://chatbot:8001/api/v1` en Docker).

---

<!-- ===================================================== -->
## 📄 documentacion_backend/MODULO_FINANCIERO.md

# Módulo Financiero (`financiero/`)

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

App más grande y reciente del backend (`models.py` ~865 líneas, `views.py` ~3000 líneas). Gestiona el ciclo de vida completo de facturación institucional:

- **Entidades principales**: `Proveedor`, `Departamento`, `CuentaContable` (PUC), `CentroCosto`, `Banco`/`TipoCuenta`.
- **`Factura`**: entidad central, con un flujo de **~18 estados**: Recibida → Registrada → Radicada → Causada → Alistada → Aprobada Auditoría → Cargada → Revisada Dirección Financiera → Enviada Rectoría → Autorizada → Pago Aplicado → Pagada (más ramas de rechazo/devolución en cualquier etapa).
- **`ItemFactura`**: líneas/ítems de cada factura.
- **`DocumentoAdjunto` / `DocumentoUnificado`**: soportes documentales, con copia opcional a NAS vía SMB.
- **`HistorialFactura`**: auditoría de cambios de estado.
- **`ComentarioFactura`**, **`RechazoDevolucion`**: seguimiento del proceso.
- **`ParametroSLA`** y **`ParametrosFinanciero`**: configuración runtime de tiempos de SLA y otros parámetros del módulo (lógica en `financiero/sla.py`).
- **`ReporteGenerado`**: reportes exportables (PDF/Excel) generados por el módulo.

> **Aviso de desactualización**: los documentos `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../GUIA_INTEGRACION_MODULO_FINANCIERO.md` describen un **diseño original propuesto** con modelos `Presupuesto`/`Transaccion`/`CentroFinanciero`/`AuditoriaFinanciera` que **no coinciden** con la implementación real (basada en `Factura` con flujo SLA). Útiles para entender la intención de diseño y el razonamiento de integración (por qué se decidió integrar el módulo en vez de crear un proyecto separado), pero no reflejan el estado final del código. El changelog en `../CAMBIOS_SIHUL_FINANCIERO.md` sí documenta cambios puntuales reales (ej. panel de Proveedor, deshabilitación de seed data de facturas demo).

Ver también [../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md](../documentacion_frontend/PAGINAS_CHATBOT_FINANCIERO.md) para los 8 dashboards financieros del frontend (uno por rol).

---

<!-- ===================================================== -->
## 📄 documentacion_backend/TESTS_Y_SEEDERS.md

# Tests y seeders del backend

Ver también [APPS_DJANGO.md](APPS_DJANGO.md).

## Tests

Cada app tiene `tests.py`; la mayoría son el placeholder por defecto de Django. Con contenido real: `financiero/tests.py` (159 líneas), `prestamos/tests.py` (62 líneas), `periodos/tests.py` (47 líneas). No hay pytest configurado; se ejecutan con `manage.py test` (ver `../ENTORNO_PRUEBAS.md`).

## Seeders

`backend/mysite/management/commands/seed_all.py` orquesta los seeders individuales en `backend/mysite/management/commands/seeders/`: roles, componentes, componentes-rol, sedes, usuarios, espacios, financiero (`financiero_seeder.py`, `financiero_facturas_stress_seeder.py` para pruebas de carga). `backend/mysite/comandos.txt` documenta los comandos manuales típicos vía `docker compose exec`.

---

<!-- ===================================================== -->
## 📄 documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md

# Chatbot SIHUL

Servicio de chatbot con **recuperación aumentada por generación (RAG)**, integrado al stack de SIHUL. Responde preguntas en lenguaje natural usando únicamente los documentos cargados para cada **chatbot (agente)** y **sede**.

Son **dos piezas que comparten la misma base de datos PostgreSQL**:

| Pieza | Dónde | Responsabilidad |
|---|---|---|
| **Servicio RAG** (FastAPI) | `chatbot/` | Ingesta de documentos, embeddings, búsqueda por similitud, llamada al LLM, caché |
| **App Django `chatbot`** | `backend/chatbot/` | Agentes y preguntas sugeridas, historial por usuario, permisos, proxy hacia el RAG, admin |

```
Frontend (React) ──► Django (backend/chatbot) ──requests──► FastAPI (chatbot/) ──► OpenAI
                         │                                     │  └──► Redis (db 1): caché de respuestas
                         └────────── PostgreSQL + pgvector ────┘
```

## Qué tabla crea cada servicio

| Tabla | La crea | Contenido |
|---|---|---|
| `chatbot_agente`, `chatbot_preguntasugerida`, `chatbot_conversacion` | Django (migraciones) | Agentes, preguntas rápidas, historial por usuario/hilo |
| `documents`, `chunks`, `chat_messages` | FastAPI (al arrancar) | Documentos, fragmentos con su embedding, registro de preguntas del RAG |

Django ve las tablas del RAG con modelos `managed=False` (`ChatbotDocument`, `ChatbotChunk`, `ChatbotAppMessage`) solo para consultarlas desde el admin. FastAPI lee `chatbot_agente` con SQL para validar que el chatbot exista y esté activo.

**Esquema del RAG.** No usa un sistema de migraciones: al arrancar, `_prepare_schema` (`chatbot/app/main.py`) ejecuta `create_all` y añade de forma idempotente las columnas posteriores (`_EXTRA_COLUMNS`). Todo ocurre en una transacción protegida por un *advisory lock* de Postgres, de modo que varios procesos arrancando a la vez no chocan. Para añadir una columna: declararla en `models.py`, agregarla a `_EXTRA_COLUMNS` y reflejarla (si Django debe verla) en `backend/chatbot/models.py` con una migración de estado (ver `0009`), que no ejecuta SQL.

Al arrancar también se **valida** que la dimensión de `chunks.embedding` coincida con `EMBEDDING_DIM` (si no, el servicio no inicia) y se **avisa** si hay documentos procesados con un modelo de embeddings distinto del configurado.

## Estructura (`chatbot/app/`)

```
main.py                 → app FastAPI, preparación del esquema, rutas, CORS
core/config.py          → Settings (pydantic): variables de entorno y valores por defecto
core/database.py        → conexión SQLAlchemy async
core/cache.py           → cliente Redis y borrado de respuestas cacheadas
core/sedes.py           → enum de sedes válidas
models/models.py        → Document, Chunk (vector), ChatMessage
routers/                → chat.py, documents.py, chatbots.py
schemas/schemas.py      → modelos Pydantic de entrada/salida
services/
  text_extraction.py    → extracción de texto y troceado estructurado
  document_service.py   → ingesta (validaciones, duplicados, embeddings, persistencia)
  embedding_service.py  → embeddings por lotes
  chat_service.py       → RAG: recuperación, memoria del hilo, LLM, caché
  chatbot_service.py    → lectura de agentes (tabla de Django)
```

## Endpoints del RAG (`/chatbot/api/v1`)

`POST /documents/upload` · `GET /documents/` · `DELETE /documents/{id}` · `POST /chat/ask` · `GET /chat/history` · `GET /chatbots/` · `GET /sedes` · `GET /health`

El RAG **no tiene autenticación propia**: la autorización la hace Django (`PuedeGestionarChatbots`, usuario autenticado) y el RAG debe ser inaccesible desde fuera de la red del stack.

## Perfiles de comportamiento (tipo de agente)

Cada agente tiene un `tipo` (`Agente.tipo` en Django) que selecciona un **perfil** definido en `chatbot/app/core/profiles.py`. El perfil controla el **prompt de sistema**, el **mensaje de «sin información»** y, al subir un documento, si se reconocen los **encabezados numerados** (ver «Ingesta»); la recuperación es igual para todos.

| Tipo | Para qué | Comportamiento |
|---|---|---|
| `normativo` (predeterminado) | Reglamentos, manuales, procedimientos | Respuestas breves y cercanas, sin citar la fuente, aplica las reglas del contexto a casos concretos |
| `investigativo` | Monografías, tesis, artículos | Tono académico, **cita documento y página** de cada dato, no infiere ni calcula salvo que se pida, avisa cuando la respuesta es parcial |

Además, `Agente.instrucciones_adicionales` (hasta 2000 caracteres) permite ajustes finos sobre el perfil («responde en máximo tres frases»). Se añaden al prompt como instrucciones subordinadas: si contradicen las reglas del perfil (responder solo con el contexto, no revelar el prompt) prevalecen las reglas. El mensaje de «sin información» se mantiene en el idioma del perfil aunque las instrucciones pidan otro.

- El RAG lee `tipo` e `instrucciones_adicionales` en cada pregunta (`get_chatbot`); un tipo desconocido usa el normativo.
- La clave de la caché de respuestas incluye una huella del perfil, **del texto de su prompt** y de las instrucciones: al cambiar cualquiera de ellos (incluso editando `profiles.py`), las respuestas cacheadas con el comportamiento anterior dejan de usarse.
- Solo quien puede gestionar chatbots (administradores o permiso de edición sobre «Gestión de Chatbots») puede crear, editar o borrar agentes y ver las instrucciones adicionales; el resto de usuarios autenticados solo ve la lista de agentes.
- Cambiar el tipo no vuelve a procesar los documentos ya cargados: conservan el troceado (secciones y páginas) con que se subieron; `documents.perfil` indica con qué perfil se procesó cada uno. Para aplicar el nuevo tipo hay que volver a subirlos.
- Para añadir un perfil: definirlo en `profiles.py`, registrarlo en `PROFILES` y añadir el tipo a `Agente.TIPO_CHOICES` (y a `CHATBOT_TIPOS` en el frontend).

## Ingesta de documentos

Formatos: `.pdf`, `.txt`, `.md`, `.csv` (la extensión no distingue mayúsculas). Máximo `MAX_UPLOAD_MB` (25) y `MAX_CHUNKS_PER_DOCUMENT` (5000) fragmentos.

1. **Validación y duplicados.** El mismo contenido (SHA-256) para el mismo chatbot y sede responde **409**. Un archivo con el mismo nombre y contenido distinto se interpreta como una **versión nueva** y reemplaza al anterior (y sus chunks).
2. **Extracción.**
   - *PDF*: PyMuPDF. Las **tablas** se detectan (`find_tables`) y cada fila se guarda con sus columnas (`GRADO: QUINTO | COSTOS 2025 PENSIÓN: $1.114.423`); las tablas que continúan en la página siguiente heredan sus encabezados. Un PDF sin texto (escaneado) se rechaza con 422: **no hay OCR**.
   - *Texto*: UTF-8 (con o sin BOM), UTF-16 con BOM o Windows-1252.
   - *CSV*: una línea por fila con el nombre de cada columna; las filas no se parten.
3. **Orden de lectura y páginas (PDF).** En las páginas de dos columnas (artículos científicos) se lee la columna izquierda completa y luego la derecha; los bloques de ancho completo (título, resumen, tablas anchas) separan «bandas». El texto extraído lleva una marca por página, de modo que cada fragmento guarda en `chunks.page` la página del PDF en que empieza (la página física, no la numeración impresa). Los documentos que no son PDF, o los cargados antes de este cambio, no tienen página.
4. **Troceado.** `CHUNK_SIZE` 900 / `CHUNK_OVERLAP` 150. El texto se divide por secciones (título › capítulo › artículo › subtítulo en mayúsculas) y **cada fragmento lleva su ruta de sección** como prefijo, para que un ítem de una lista conserve el título que lo clasifica. Un subtítulo en mayúsculas solo se reconoce si lo sigue texto (los nombres de una firma no lo son) y el cierre del documento («Expedido en…», «Firman:») forma su propia sección `FIRMAS Y EXPEDICIÓN`. En los PDF, los textos alineados en columnas se emparejan por columna («NOMBRE — Cargo»). Con un agente **investigativo** se reconocen además los encabezados de trabajos académicos: numerados («2. Marco teórico», «2.1 Antecedentes», hasta tres niveles) y secciones conocidas («Resumen», «Introducción», «Conclusiones», «Referencias»…). Solo se activan en ese tipo porque en un reglamento «7. Ingresar a los baños…» es un ítem de lista, no un título.
5. **Embeddings.** `EMBEDDING_MODEL`, en lotes de 128 (hasta 3 en paralelo), conservando el orden. El modelo usado queda registrado en `documents.embedding_model`.
6. **Persistencia** en `documents` (con `perfil`) y `chunks` (con `page`) (con `sede` y `chatbot_id` desnormalizados) y borrado de la caché de respuestas de ese chatbot y sede.

Los errores de ingesta usan `IngestionError` con su código HTTP: 409 duplicado, 413 demasiado grande, 422 archivo ilegible/vacío/escaneado/protegido.

## Consulta (`POST /chat/ask`)

1. Se valida que el chatbot exista y esté activo.
2. Si llega `chat_id`, se cargan los últimos 3 intercambios del hilo (memoria). Para resolver seguimientos ("¿y los sábados?") se buscan **dos formulaciones**: la pregunta sola conserva sus `TOP_K` resultados, exactamente como sin historial, y la combinada con la anterior solo añade unos pocos candidatos extra. Así una pregunta nueva sobre otro tema no queda desplazada por fragmentos de la anterior.
3. Sin historial, se consulta la caché (Redis, `ANSWER_CACHE_TTL_SECONDS`); las respuestas "sin información" nunca se cachean.
4. Búsqueda por similitud coseno (índice HNSW) **filtrando por `chatbot_id` y `sede`**; se descartan los fragmentos por debajo de `MIN_SIMILARITY` y los repetidos, y se conservan hasta `TOP_K`. A los 5 mejores se les añaden sus **fragmentos vecinos de la misma sección** (hasta 2 por lado), para que las listas y tablas largas lleguen completas aunque la búsqueda solo haya traído una parte. Además hay una **búsqueda léxica** (texto completo de Postgres en español) que aporta hasta 3 fragmentos más: recupera lo que los embeddings encuentran mal (ISBN, siglas, códigos, apellidos, cifras). Ignora los términos de la pregunta presentes en más del 10 % de los fragmentos y puntúa más los términos raros; si falla, solo se usa la búsqueda vectorial.
5. Sin contexto relevante se responde con `NO_INFO_RESPONSE` sin llamar al LLM; con contexto, se llama a `CHAT_MODEL` (o a `CHAT_MODEL_LISTS` si la pregunta pide contar o enumerar: «¿cuántas… hay?», «¿cuáles son…?», «en total», «enumera», «lista») con el prompt de sistema (solo responde con el contexto, listas completas, ante contradicciones gana el documento más reciente).
6. Se registra el intercambio en `chat_messages` (con `chat_id` e `id_usuario` para cruzarlo con el historial de Django).

**Tiempos.** Django espera 30 s al RAG. El embedding de la pregunta (`OPENAI_TIMEOUT_SECONDS / 2`) y el LLM (`OPENAI_TIMEOUT_SECONDS`, 18 s) no reintentan, para no exceder ese plazo. Si OpenAI falla, el RAG responde **503** con un mensaje genérico (el detalle queda en el log).

## Django (`backend/chatbot/`)

- `views.py`: `enviar_pregunta` (usuario autenticado: resuelve la sede por su seccional, guarda `Conversacion`) y `enviar_pregunta_publico` (sede indicada por el cliente, sin historial). Si el RAG no responde, se muestra al usuario un mensaje genérico y **el intercambio no se guarda** en el historial.
- `api_urls.py` (`/api/chatbot/…`): rutas que usa el frontend (los agentes se pueden listar estando autenticado; modificarlos exige poder gestionar chatbots). `urls.py` (`/chatbot/…`) son rutas **heredadas** que ya no usa el frontend.
- `admin_views.py`: proxy autenticado hacia el RAG para subir, listar y borrar documentos (permiso "Gestión de Chatbots"). El borrado es idempotente (un 404 del RAG se devuelve como 204).
- `signals.py`: al **borrar un agente** se eliminan sus documentos (los chunks caen por `ON DELETE CASCADE`) y sus mensajes en el RAG, que no tienen clave foránea.

## Variables de entorno (`chatbot/.env`)

El chatbot usa su **propio** archivo (`chatbot/.env`, plantilla en `chatbot/.env.template`); `docker-compose.yml` fija además `DATABASE_URL`, `REDIS_URL` y los tamaños de chunk.

| Variable | Por defecto | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | — (obligatoria) | Clave de OpenAI |
| `DATABASE_URL` | — (obligatoria) | `postgresql+asyncpg://…` |
| `EMBEDDING_MODEL` / `EMBEDDING_DIM` | `text-embedding-3-small` / `1536` | Modelo y dimensión de sus vectores |
| `CHAT_MODEL` | `gpt-4o-mini` | Modelo que redacta la respuesta |
| `CHAT_MODEL_LISTS` | `gpt-4o` | Modelo para preguntas de conteo o de listas exhaustivas (vacío = usar siempre `CHAT_MODEL`) |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `900` / `150` | Troceado |
| `TOP_K` / `MIN_SIMILARITY` | `8` / `0.40` | Fragmentos recuperados y umbral |
| `MAX_UPLOAD_MB` / `MAX_CHUNKS_PER_DOCUMENT` | `25` / `5000` | Límites de ingesta |
| `OPENAI_TIMEOUT_SECONDS` / `OPENAI_INGEST_TIMEOUT_SECONDS` | `18` / `60` | Tiempos de consulta e ingesta |
| `REDIS_URL` / `ANSWER_CACHE_TTL_SECONDS` | — / `3600` | Caché de respuestas (opcional) |

### Cambiar el modelo de embeddings
Los vectores de modelos distintos no son comparables. Para cambiar `EMBEDDING_MODEL`: si la dimensión cambia, actualizar `EMBEDDING_DIM` y recrear `chunks.embedding` (el servicio no arranca mientras no coincidan); en cualquier caso, **volver a cargar los documentos**. Al arrancar se avisa de los documentos procesados con otro modelo.

## Docker

`chatbot.Dockerfile` (`python:3.11-slim`) arranca `uvicorn` **sin** `--reload`. En desarrollo, `docker-compose.yml` monta `./chatbot` y sobrescribe el comando con `--reload`. Las dependencias están fijadas en `chatbot/requirements.txt` (la fuente de verdad de las versiones).

## Limitaciones conocidas

- Sin OCR: los PDF escaneados se rechazan.
- `gpt-4o-mini` omite a veces los últimos elementos de una lista aunque estén en el contexto; por eso las preguntas de conteo y de listas usan `CHAT_MODEL_LISTS`. La detección es por palabras (`_EXHAUSTIVE_QUESTION` en `chat_service.py`): una pregunta de lista formulada de otra forma («¿qué faltas existen?») irá al modelo económico.
- Procedimientos con varios plazos en una misma celda de tabla (p. ej. reposición/apelación del Art. 73 del manual de prueba) los puede interpretar mal el modelo económico, aunque el texto se haya extraído bien.
- Las tablas complejas (celdas combinadas en vertical) pueden quedar parcialmente fragmentadas.
- El RAG no autentica: debe quedar accesible solo desde Django.
- Notificaciones: el modelo `Agente` dispara `AGENTE_CREADO`/`AGENTE_DESACTIVADO`/`AGENTE_ELIMINADO` (ver `backend/notificaciones/README.md`).


## Vista previa del documento citado

Los PDF se guardan completos en `documents.file_data` (BYTEA, columna diferida: los listados no la cargan). En el chat, el frontend convierte cada cita `(archivo.pdf, p. N)` de una respuesta en un enlace (`MensajeConCitas`) que abre el PDF en un visor (`VistaPreviaDocumento`) en la página citada.

- Django: `GET /api/chatbot/documentos/archivo/?agente=<id>&nombre=<archivo>` (cualquier usuario autenticado). Resuelve la sede del propio usuario y pide el archivo a `GET /api/v1/documents/file` del RAG, de modo que no se puede acceder a documentos de otra sede.
- El chat público (sin sesión) muestra las citas como texto, sin enlace.
- Los documentos cargados antes de existir esta columna no tienen original (la vista previa avisa). Subir de nuevo el mismo archivo lo reprocesa y lo guarda; también se reprocesa si el tipo del agente cambió desde que se cargó.

### Citas según el tipo de agente

- **Investigativo:** el modelo cita cada afirmación con `(archivo.pdf, p. N)` (regla 4 del prompt).
- **Normativo:** el código añade al final de la respuesta **una sola cita** de la fuente principal, el documento y la página del fragmento mejor puntuado (`Profile.cite_main_source`). Se hace en código y no en el prompt porque el modelo pequeño no cumplía el formato de forma fiable. No se añade a la respuesta de «sin información». Solo lleva página si el documento es un PDF cargado con las páginas guardadas; los anteriores se recargan subiendo de nuevo el archivo.

### Varios documentos por chatbot

Un chatbot puede tener varios documentos por seccional (subir uno con el mismo nombre reemplaza al existente; con otro nombre se suma). En la recuperación se **reservan hasta 2 puestos** para el mejor fragmento de los documentos que no aparecen entre los resultados, siempre que sea al menos el 85 % de relevante que el primero; las 5 semillas no se tocan. La cita automática del perfil normativo incluye un segundo documento solo si su mejor fragmento alcanza el 90 % de la similitud del primero (máximo 2).

Límites conocidos: si dos documentos se contradicen, el modelo pequeño no siempre lo señala; una pregunta que mezcla temas de dos documentos puede citar solo uno; las preguntas sobre el propio conjunto de documentos («¿qué documentos tienes?») no se responden.

### Prioridad de documentos y límite por agente

- **Prioridad** (`documents.prioridad`): entre los documentos de un chatbot **en una sede**, 1 es la más alta y N la más baja (N = cuántos hay), sin huecos ni repetidos. Por defecto es una pila: el último documento cargado entra con la prioridad 1 y el resto baja un puesto. Reemplazar un documento (mismo nombre, o `replace_document_id` al actualizar) conserva su prioridad; al borrar uno se cierra el hueco. Se cambia con `PATCH /documents/{id}/priority` (Django: `PATCH /api/chatbot/admin/documentos/{id}/prioridad/`) y en la tabla de documentos. Los documentos anteriores se numeran al arrancar el servicio (el más reciente = 1). Código: `app/services/document_priority.py`.
- **Cómo influye**: no es una búsqueda secuencial. (1) Al ordenar los fragmentos candidatos se suma a la similitud hasta `PRIORITY_BOOST` (0,08): la prioridad 1 suma todo, la más baja nada; un fragmento claramente mejor de un documento de baja prioridad sigue ganando. (2) Cada fragmento del contexto lleva `prioridad X de N` y el prompt indica que, si dos documentos se contradicen, se prefiere el de prioridad más alta.
- **Límite** (`chatbot_agente.max_documentos`, 1 a 10, por agente y sede): por defecto 10 en normativos y 5 en investigativos (`Profile.default_max_documents`). Se edita en la gestión del chatbot. Al llegar al tope la carga se rechaza con 409; reemplazar un documento no cuenta. El límite no puede bajarse por debajo de los documentos que el agente ya tiene en alguna seccional (lo valida el serializador de Django y el formulario); hay que eliminar documentos antes.
- Límite conocido: la cita automática del perfil normativo se elige por relevancia de los fragmentos, no por lo que el modelo usó; con documentos que se contradicen puede citar un documento distinto del que respalda la respuesta.

---

<!-- ===================================================== -->
## 📄 documentacion_oracle/INTEGRACION_ETL_ORACLE.md

# Integración con Oracle (ETL)

**Oracle no es la base de datos de SIHUL.** La base de datos operativa de la aplicación es PostgreSQL (`pgvector/pgvector:pg16`, servicio `db` en `docker-compose.yml`). Oracle es el **sistema fuente externo**: el SIU/UHORARIOS académico institucional de la Universidad Libre, del cual el backend Django extrae periódicamente información mediante procesos ETL usando el driver `oracledb`.

No existe una carpeta `oracle/` en la raíz del repo, ni un `docker-compose` que levante una instancia Oracle local: se asume una instancia Oracle institucional remota ya existente, a la que el backend se conecta como cliente.

## Conexión

Cada comando ETL construye su propia conexión Oracle leyendo variables de entorno:

- `ORACLE_HOST`
- `ORACLE_PORT` (default `1521`)
- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_SERVICE`

**Estas variables no están definidas en `.env.example` ni `.env.test.example`** — deben proveerse manualmente (como variables de entorno del contenedor `backend` o como argumentos del comando) antes de ejecutar cualquier ETL.

## Vistas fuente conocidas (esquema `UHORARIOS`)

- `VW_ESTUDIANTES`
- `VW_PROGRAMAS_ACADEMICOS`
- Vistas equivalentes para docentes, grupos, horarios, espacios, facultades, sedes y asignaturas (una por dominio, mismo patrón).

## Patrón ETL

El flujo es el mismo para todos los dominios (ejemplo tomado de `usuarios/management/commands/etl_oracle_estudiantes.py`):

1. **Query Oracle parametrizada** por periodo académico (`settings.ETL_PERIODO`) y, opcionalmente, por `--seccional` (usando `mysite/oracle_seccional_filter.py` para filtrar vía subquery a `VW_PROGRAMAS_ACADEMICOS`).
2. **Hash de fila** (`row_hash`) para detectar cambios de forma idempotente sin reprocesar todo cada vez.
3. **Staging**: cada fila se guarda en un modelo `Stg*` (ej. `StgOracleEstudiante`, `StgOracleDocente`, `StgOracleGrupoAcademico`, `StgOracleEspacioFisico`, `StgOracleHorario`, `StgOraclePrograma`) con `source_system='ORACLE_SIU'`, `external_id`, `raw_data` (JSON crudo) y `estado_registro`.
4. **Flags de ejecución**: `--dry-run`, `--limit`, `--offset`, `--batch-size` para pruebas y cargas incrementales controladas.
5. **Promoción a tablas reales**: un paso posterior (`migrate_staging_to_real.py`, `sincronizar_oracle.py`) mergea los datos de staging hacia las tablas de dominio reales (Usuario, Grupo, Horario, etc.) en PostgreSQL.

## Comandos disponibles por app

| App | Comando(s) |
|---|---|
| `usuarios` | `etl_oracle_docentes`, `etl_oracle_estudiantes`, `migrate_staging_to_real`, `sincronizar_oracle` |
| `sedes` | `etl_oracle_facultades`, `etl_oracle_sedes`, `etl_oracle_staging` |
| `programas` | `etl_oracle_programas` |
| `asignaturas` | `etl_oracle_asignaturas`, `etl_oracle_asignatura_programa`, `sync_asignaturas_sede_oracle` |
| `grupos` | `etl_oracle_grupos` |
| `horario` | `etl_oracle_horario` |
| `espacios` | `etl_oracle_espacios` |

Ejecución típica (dentro del contenedor backend, con las variables `ORACLE_*` exportadas):

```
docker compose exec backend python manage.py etl_oracle_estudiantes --dry-run
docker compose exec backend python manage.py etl_oracle_estudiantes
docker compose exec backend python manage.py migrate_staging_to_real
```

## Normalización de seccionales

`mysite/oracle_seccional_filter.py` define los nombres canónicos de seccional (Nacional, Virtual, El Socorro, Cali, Barranquilla, Bogotá, Cúcuta, Cartagena, Pereira) y un diccionario de alias para limpiar inconsistencias del dato Oracle crudo antes de filtrar la extracción por sede/seccional.

## Migraciones relacionadas (historial de esta integración)

- `espacios/migrations/0007_stgoracleespaciofisico.py`
- `grupos/migrations/0002_stgoraclegrupoacademico.py`
- `horario/migrations/0005_*.py`, `0006_*.py`
- `programas/migrations/0004_stgoracleprograma.py`
- `sedes/migrations/0004_oracle_staging_mapping_and_external_fields.py`
- `usuarios/migrations/0008_*.py`, `0009_*.py`, `0010_*.py`

No hay dump ni script `.sql` de esquema Oracle en el repositorio: la estructura de las vistas fuente vive únicamente en la base Oracle institucional.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/ESTRUCTURA_Y_STACK.md

# Frontend SIHUL — estructura y stack (`frontend/`)

React 19.1.1 + TypeScript + Vite 7. No es Next.js: el enrutamiento es explícito (`react-router-dom` v7), no basado en archivos.

## Stack de UI

- Radix UI (primitives) + Tailwind CSS v4 + `lucide-react` (iconos) + `class-variance-authority`/`tailwind-merge` (patrón tipo shadcn).
- `recharts` (gráficos), `motion` (animaciones), `sonner` (toasts).
- `jspdf` / `html2canvas` / `xlsx` — exportación de reportes.

## Estructura (`frontend/src/`)

```
assets/       → imágenes y CSS global (globals.css)
components/   → common/, espacios/, horarios/, notificaciones/
config/       → componentRoutes.ts (mapeo componente → ruta/ícono)
context/      → AuthContext.tsx, UserContext.tsx, ThemeContext.tsx,
                NotificacionesContext.tsx, roleUtils.ts, financialRoleUtils.ts
core/         → apiClient.ts, endpoints.ts, backendUrl.ts, errorHandler.ts,
                sessionCache.ts, apiActivity.ts
hooks/        → organizados por dominio (ver HOOKS_INDICE.md)
layouts/      → AdminDashboard.tsx (layout compartido con sidebar)
models/       → tipos TS por dominio (academica, auth, chatbot, dashboard,
                espacios, financiero, horarios, prestamos, recursos,
                reporte, shared, users)
pages/        → páginas por dominio (ver PAGINAS_INDICE.md)
router/       → AppRouter.tsx (única fuente de rutas)
services/     → clientes API por dominio (ver SERVICES_INDICE.md)
utils/, share/ → utilidades varias
```

## Documentos relacionados en esta carpeta

- [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md) — `AuthContext`, `componentRoutes.ts`, `AppRouter.tsx`.
- [PAGINAS_INDICE.md](PAGINAS_INDICE.md) — páginas por dominio.
- [HOOKS_INDICE.md](HOOKS_INDICE.md) — hooks por dominio, patrón de cache, hooks transversales.
- [SERVICES_INDICE.md](SERVICES_INDICE.md) — clientes API por dominio, `core/` base, deuda técnica legacy.
- [RESPONSIVE_UPDATES.md](RESPONSIVE_UPDATES.md) — migración a diseño responsive (hook `useIsMobile`, 39 páginas actualizadas).
- [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md) — implementación del sistema de notificaciones en el frontend (contexto, polling, endpoints consumidos).

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/ENRUTAMIENTO_DINAMICO.md

# Enrutamiento dinámico basado en componentes/roles

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md) (contraparte backend de este sistema).

Este es el patrón arquitectónico central del frontend (documentado también, con más diagramas, en `../ARQUITECTURA_COMPLETA_ANALISIS.md` y `../REFERENCIA_RAPIDA.md`).

## `context/AuthContext.tsx`

- Estado persistido en `localStorage` (no `sessionStorage`): `auth_token`, `auth_user`, `auth_role`, `auth_components`, `auth_faculties`, `auth_sede`, `auth_areas`, `auth_signature`.
- `login()`: llama a `authService.login`, limpia cachés previas y persiste el nuevo estado.
- Al montar, hidrata la sesión existente vía `authService.getAuthenticatedUser()` — soporta tanto login OAuth (redirect) como refresco de página.
- `hasPermission(componentName)` / `hasEditPermission(componentName)`: búsquedas O(1) contra `Map`/`Set` memoizados.
- **Sincronización periódica cada 7 segundos**: llama a `authService.getSessionAuthState(signature)`; si el backend indica `changed: true`, actualiza rol/componentes en caliente sin recargar la página. Solo corre si la pestaña está visible, y también se dispara al recuperar el foco.

## `config/componentRoutes.ts`

- `COMPONENT_ROUTES`: diccionario nombre-de-componente-exacto → ruta frontend. Cubre todo el módulo académico y todo el financiero (un dashboard/vista por cada rol: funcionario, contabilidad, tesorería, auditoría, dirección financiera, rectoría, admin financiero, proveedor).
- `COMPONENT_ICONS`: mismo mapeo pero a íconos Lucide.
- `getRouteForComponent()`: resuelve ruta exacta; si no hay coincidencia, aplica heurísticas de texto normalizado para inferir a qué dashboard financiero pertenece un componente nuevo no registrado explícitamente; como último recurso genera una ruta dinámica `/componentes/{slug}` resuelta por `pages/shared/DynamicComponentPage.tsx`.

## `router/AppRouter.tsx`

- `ProtectedRoute`: bloquea acceso si el usuario no está autenticado o si `!hasPermission(requiredComponent)`, mostrando "Acceso Denegado".
- Calcula `homeRoute` según rol + componentes existentes, con precedencia especial para roles financieros (`admin_financiero` > `rectoria` > `direccion_financiera` > `tesoreria` > `auditoria` > `contabilidad` > `proveedor` > `funcionario`).
- Usa `context/financialRoleUtils.ts` (`normalizeFinancialRole`/`resolveCanonicalFinancialRole`) para mapear el rol crudo del backend a un rol canónico financiero y proteger rutas sensibles (`/financiero/rectoria/*`, `/financiero/direccion-financiera/*`, `/financiero/admin-financiero/*`) con una verificación adicional además de `ProtectedRoute`.
- Todas las páginas se cargan con `lazy()` + `Suspense` (code-splitting).

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/RESPONSIVE_UPDATES.md

# Frontend Responsive Updates - Completed

## Summary
Successfully made **39 frontend page components** fully responsive for mobile devices (< 768px viewport width).

## Infrastructure Created

### 1. **useIsMobile Hook** ✅
- **Location**: `frontend/src/hooks/useIsMobile.ts`
- **Features**:
  - Detects mobile viewport (< 768px)
  - SSR-safe with default value
  - Automatic resize listener
  - Cleanup on unmount

## Updates by Category

### Dashboard Components (✅ COMPLETED)
- ✅ AdminDashboard.tsx - Full mobile UI with hamburger menu + overlay navigation
- ✅ DashboardHome.tsx - Responsive grids, padding, typography
- ✅ ConsultorEstudianteHome.tsx - Responsive stats cards
- ✅ ConsultorDocenteHome.tsx - Responsive action cards + icons
- ✅ SupervisorGeneralHome.tsx - Already responsive (verified)
- ✅ PublicDashboard.tsx - Responsive main layout

### Pages - Reporte (✅ COMPLETED)
- ✅ Reportes.tsx - Responsive grids + padding
- ✅ ConsultaOcupacion.tsx - Import + hook + responsive padding
- ✅ OcupacionSemanal.tsx - Import + hook + responsive padding
- ✅ ConsultaReportes.tsx - Import + hook + responsive padding

### Pages - Prestamos (✅ COMPLETED)
- ✅ ConsultaPrestamos.tsx - Import + hook + responsive padding
- ✅ PlazasDisponibles.tsx - Import + hook + responsive padding
- ✅ DocentePrestamos.tsx - Import + hook + responsive padding
- ✅ PrestamosEspacios.tsx - Import + hook + responsive padding + header
- ✅ PublicPrestamo.tsx - EnConstruccion wrapper (no changes needed)

### Pages - Horarios (✅ COMPLETED)
- ✅ MiHorario.tsx - Import + hook + responsive padding
- ✅ ConsultaHorarios.tsx - Import + hook + responsive padding
- ✅ VisualizacionHorarios.tsx - Import + hook + responsive padding
- ✅ PublicConsultaHorario.tsx - EnConstruccion wrapper (no changes needed)

### Pages - Gestion Academica (✅ COMPLETED)
- ✅ CentroHorarios.tsx - Import + hook
- ✅ FacultadesPrograms.tsx - Import + hook
- ✅ PeriodosAcademicos.tsx - Import + hook
- ✅ GestionUsuarios.tsx - Import + hook
- ✅ EspaciosFisicos.tsx - Import + hook + responsive padding + filter grid
- ✅ EstadoRecursos.tsx - Import + hook
- ✅ HorariosAcademicos.tsx - Import + hook
- ✅ Docentes.tsx - Import + hook + responsive padding + filter grid
- ✅ Grupos.tsx - Import + hook + responsive padding + filter grid
- ✅ Asignaturas.tsx - Import + hook + responsive padding
- ✅ GruposFusion.tsx - Import + hook + responsive padding
- ✅ Sedes.tsx - Import + hook + responsive padding
- ✅ CrearHorarios.tsx - Import + hook
- ✅ AsignacionAutomatica.tsx - Import + hook + responsive padding

### Pages - Users (✅ COMPLETED)
- ✅ Login.tsx - Import + hook + responsive grid + padding
- ✅ Ajustes.tsx - Import + hook + responsive padding + filter grid
- ✅ Notificaciones.tsx - Import + hook + responsive padding + header flex

### Pages - Espacios (✅ COMPLETED)
- ✅ ConsultaEspacios.tsx - Already responsive (previously updated)
- ✅ SupervisorSalonHome.tsx - Import + hook + responsive padding

### Pages - Chatbot (✅ COMPLETED)
- ✅ AsistentesVirtuales.tsx - Import + hook

### Pages - Shared (✅ COMPLETED)
- ✅ EnConstruccion.tsx - Import + hook

## Responsive Design Patterns Applied

### 1. **Padding Responsive**
```tsx
<div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
```

### 2. **Grid Responsive**
```tsx
<div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'md:grid-cols-4'}`}>
```

### 3. **Flex Responsive**
```tsx
<div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
```

### 4. **Icon Sizing Responsive**
```tsx
<Icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
```

### 5. **Typography Responsive**
```tsx
<h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold`}>
```

## Global CSS Updates

Added to `frontend/src/globals.css`:
- Mobile typography scaling
- Touch target minimum sizes (44px)
- Horizontal scroll prevention
- Image responsive (max-width: 100%)
- Table responsive font sizes

## Mobile Features Added

### AdminDashboard Mobile UI
- Fixed top header (16px content margin)
- Hamburger menu icon (Menu/X toggle)
- Slide-over navigation overlay (260px width)
- Backdrop overlay (black/50 opacity)
- Auto-close menu on route navigation
- Touch-optimized buttons (min 44px height)

## Testing Checklist

- [x] All 39 page files have useIsMobile import
- [x] 37/39 files have hook initialization (2 are EnConstruccion wrappers - OK)
- [x] Responsive padding applied to main containers
- [x] Grids use mobile-first breakpoints
- [x] Icons scale for mobile
- [x] Headers use responsive flex layout
- [x] Filter grids are responsive
- [x] No horizontal scrolling on mobile
- [x] Touch targets >= 44px
- [x] AdminDashboard has mobile menu

## Files Modified

**Total Files Updated: 39**
- 37 page files with full responsive implementation
- 2 wrapper files (already simple/responsive)

## Breakpoint Strategy

- **Mobile**: < 768px (sm/md boundary)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Uses Tailwind's responsive prefixes:
- `sm:` for small screens
- `md:` for medium screens  
- `lg:` for large screens

## Performance Impact

- ✅ No new dependencies added
- ✅ Hook uses native ResizeObserver pattern
- ✅ Minimal bundle size increase
- ✅ Event listener cleanup implemented
- ✅ SSR-safe implementation

## Known Limitations

- Tables on mobile may need horizontal scroll (intentional - preserves data integrity)
- Some complex layouts may benefit from additional tweaking
- Charts/graphs responsiveness depends on their individual implementations

## Future Enhancements

1. Add landscape orientation handling
2. Implement bottom sheet drawer for complex filters
3. Add touch gesture support (swipe navigation)
4. Optimize table display for mobile (collapsible columns)
5. Add mobile-specific keyboard handling

## Header Improvements

All main management pages now have responsive headers:
- ✅ Docentes - Responsive flex header with full-width button on mobile
- ✅ Asignaturas - Responsive flex header with full-width button on mobile
- ✅ Grupos - Responsive flex header with full-width button on mobile
- ✅ Sedes - Responsive flex header with full-width button on mobile
- ✅ GruposFusion - Responsive flex header with full-width button on mobile

Headers stack vertically on mobile with gap-4 spacing.

## Status: ✅ COMPLETE

All 39 frontend page components are now fully responsive and optimized for mobile devices.

**Last Update**: All pages include:
- ✅ useIsMobile hook import and initialization
- ✅ Responsive main container padding (p-4 mobile, p-8 desktop)
- ✅ Responsive header layouts (flex-col mobile, justify-between desktop)
- ✅ Responsive filter grids (2-col mobile, 3-4 col desktop)
- ✅ Full-width buttons on mobile where applicable
- ✅ Responsive typography sizing

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/RESUMEN_NOTIFICACIONES.md

# 🔔 Sistema de Notificaciones - Resumen de Implementación

## ✅ Implementación Completada

Se ha implementado un sistema completo de notificaciones que conecta el frontend con el backend, incluyendo:

## 📦 Archivos Creados/Modificados

### Frontend

#### ✨ Nuevos Archivos

1. **`context/NotificacionesContext.tsx`**
   - Contexto global para el contador de notificaciones
   - Polling automático cada 30 segundos
   - Disponible en toda la aplicación

2. **`components/notificaciones/NotificacionesIcon.tsx`**
   - Componente del ícono para navbar
   - Muestra badge con contador de no leídas
   - Navegación a página de notificaciones

3. **`docs/NOTIFICACIONES.md`**
   - Documentación completa del sistema frontend
   - Guías de uso y mejores prácticas

#### 🔄 Archivos Modificados

1. **`models/users/notification.model.ts`**
   - Actualizado para alinearse con el backend
   - Nuevos tipos: `NotificacionBackend`, `NotificacionUsuario`, `TipoNotificacion`

2. **`services/notificaciones/notificacionesAPI.ts`**
   - Importa modelos actualizados
   - Mantiene todas las funciones de API

3. **`hooks/users/useNotificaciones.ts`**
   - COMPLETAMENTE REESCRITO
   - Consume API real del backend
   - Obtiene userId del AuthContext
   - Polling automático cada 30 segundos
   - Mapeo automático de notificaciones backend → frontend
   - Actualiza contexto global

4. **`pages/users/Notificaciones.tsx`**
   - Adaptado para usar datos reales
   - Eliminada lógica de "eliminadas" (se eliminan permanentemente)
   - Soporte para nuevos tipos de notificación
   - Indicador de carga
   - Botón de actualizar manual

5. **`App.tsx`**
   - Agregado `NotificacionesProvider` al árbol de contextos

### Backend

#### ✨ Nuevos Archivos

1. **`notificaciones/TRIGGERS_GUIDE.md`**
   - Guía completa para implementar triggers
   - Ejemplos de código para cada tipo de notificación
   - Checklist de implementación
   - Tabla de roles y destinatarios

## 🎯 Funcionalidades Implementadas

### 1. Gestión de Notificaciones
- ✅ Cargar notificaciones del usuario autenticado
- ✅ Marcar una notificación como leída
- ✅ Marcar todas las notificaciones como leídas
- ✅ Eliminar notificaciones permanentemente
- ✅ Filtrar por tipo de notificación
- ✅ Filtrar por estado (todas/pendientes/leídas)

### 2. Estadísticas en Tiempo Real
- ✅ Total de notificaciones
- ✅ Notificaciones pendientes (no leídas)
- ✅ Notificaciones leídas
- ✅ Contador global en toda la aplicación

### 3. Actualización Automática
- ✅ Polling cada 30 segundos
- ✅ Actualización al marcar como leída
- ✅ Actualización al eliminar
- ✅ Actualización manual con botón

### 4. Tipos de Notificación Soportados
- ✅ `horario` - Cambios en horarios
- ✅ `prestamo` - Solicitudes de préstamo
- ✅ `espacio` - Cambios en espacios permitidos
- ✅ `facultad` - Actualizaciones de facultad
- ✅ `solicitud` - Solicitudes generales
- ✅ `mensaje` - Mensajes directos
- ✅ `alerta` - Alertas del sistema
- ✅ `sistema` - Notificaciones del sistema
- ✅ `exito` - Confirmaciones exitosas
- ✅ `error` - Errores
- ✅ `advertencia` - Advertencias

### 5. Interfaz de Usuario
- ✅ Diseño responsivo
- ✅ Modo oscuro/claro
- ✅ Animaciones suaves (framer-motion)
- ✅ Badges de prioridad (alta/media/baja)
- ✅ Iconos distintivos por tipo
- ✅ Colores temáticos por tipo
- ✅ Toasts para feedback (sonner)

## 🔌 Integración con Backend

### Endpoints Utilizados

```
GET    /notificaciones/mis-notificaciones/?id_usuario={id}
GET    /notificaciones/estadisticas/?id_usuario={id}
POST   /notificaciones/marcar-leida/{id}/
POST   /notificaciones/marcar-todas-leidas/
DELETE /notificaciones/delete/
```

### Autenticación
- ✅ Usa token del AuthContext
- ✅ ID de usuario del localStorage
- ✅ Validación de autenticación antes de cada petición

## 🎨 Cómo Usar

### 1. Agregar ícono al navbar

```tsx
import { NotificacionesIcon } from './components/notificaciones/NotificacionesIcon';

function Navbar() {
    return (
        <nav>
            <NotificacionesIcon />
        </nav>
    );
}
```

### 2. Usar el contexto en cualquier componente

```tsx
import { useNotificacionesContext } from './context/NotificacionesContext';

function MiComponente() {
    const { contadorNoLeidas } = useNotificacionesContext();
    return <span>{contadorNoLeidas} nuevas</span>;
}
```

### 3. Acceder a la página de notificaciones

```
/notificaciones
```

## 🔄 Flujo de Trabajo

### Backend → Frontend

1. **Evento ocurre** (ej: se crea un horario)
2. **Trigger del backend** crea una notificación en BD
3. **Polling automático** del frontend detecta nueva notificación (máx. 30 seg)
4. **Contador se actualiza** en el ícono de navbar
5. **Usuario ve badge** con número de notificaciones
6. **Usuario hace click** y ve el detalle
7. **Usuario marca como leída** o elimina
8. **API actualiza** el backend
9. **Contexto se actualiza** y el contador disminuye

## 🔔 Triggers del Backend

### ¿Cuándo se crean notificaciones automáticamente?

Según rol del usuario, recibirá notificaciones de:

#### Estudiante
- ✅ Asignación de nuevo horario
- ✅ Cambios en su horario
- ✅ Mensajes del sistema

#### Docente
- ✅ Aprobación/Rechazo de préstamos solicitados
- ✅ Cambios en sus horarios asignados
- ✅ Mensajes directos

#### Supervisor General
- ✅ Asignación de nuevos espacios permitidos
- ✅ Remoción de espacios permitidos
- ✅ Alertas de sus espacios

#### Planeador de Facultad
- ✅ Cambios en horarios de su facultad
- ✅ Nuevos programas agregados
- ✅ Modificaciones estructurales

#### Administrador de Planeación
- ✅ Nuevas solicitudes de préstamo
- ✅ Nuevos horarios creados por planeadores
- ✅ Conflictos detectados
- ✅ Todas las operaciones importantes del sistema

## 📊 Prioridades

| Prioridad | Color | Uso |
|-----------|-------|-----|
| Alta | 🔴 Rojo | Requiere atención inmediata |
| Media | 🟡 Amarillo | Importante pero no urgente |
| Baja | 🔵 Azul | Informativa |

## ✨ Características Destacadas

1. **Mapeo Inteligente de Mensajes**
   - Si el mensaje viene como "Título: Descripción", lo separa automáticamente
   - Si no, genera un título basado en el tipo

2. **Polling Eficiente**
   - Solo hace polling si el usuario está autenticado
   - Se detiene al hacer logout
   - No sobrecarga el servidor

3. **Contexto Global**
   - El contador está disponible en toda la app
   - No requiere prop drilling
   - Fácil de usar desde cualquier componente

4. **Feedback Visual**
   - Toasts para todas las acciones
   - Animaciones suaves
   - Estados de carga

5. **Filtros Potentes**
   - Por estado (todas/pendientes/leídas)
   - Por tipo específico
   - Estadísticas en tiempo real

## 🚀 Próximos Pasos Recomendados

### Para el Backend

1. Implementar los triggers en cada módulo según la guía `TRIGGERS_GUIDE.md`
2. Probar que las notificaciones se crean correctamente
3. Ajustar mensajes para usar formato "Título: Descripción"

### Para el Frontend

1. ✅ Sistema ya implementado y listo para usar
2. Agregar `<NotificacionesIcon />` en el navbar
3. Probar con datos reales del backend

## 📚 Documentación

- **Frontend**: `frontend/src/docs/NOTIFICACIONES.md`
- **Backend Triggers**: `backend/notificaciones/TRIGGERS_GUIDE.md`
- **Este resumen**: `RESUMEN_NOTIFICACIONES.md`

## 🎉 Estado Final

✅ **Sistema completamente funcional y listo para producción**

El sistema de notificaciones está:
- Conectado al backend
- Con polling automático
- Con contexto global
- Con UI completa y responsive
- Documentado extensivamente
- Listo para recibir notificaciones de triggers

Solo falta implementar los triggers en el backend según la guía proporcionada.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_INDICE.md

# Hooks del frontend (`frontend/src/hooks/`) — índice

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [SERVICES_INDICE.md](SERVICES_INDICE.md) (los hooks de datos consumen los services documentados ahí).

`frontend/src/hooks/` está organizado por dominio, más un puñado de hooks transversales sueltos en la raíz de la carpeta. Documentación dividida en:

- [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md) — el patrón de cache que comparten casi todos los hooks de datos (`core/sessionCache.ts`) y el sistema legacy (`hooks/cache/`, `services/cache/cacheService.ts`).
- [HOOKS_PRINCIPALES.md](HOOKS_PRINCIPALES.md) — hooks transversales usados en todo el proyecto: `useIsMobile`, `useAdminDashboard`, `useErrorHandler`, `useRoutes`.
- [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) — `useAsistentesVirtuales` (chatbot) y `useNotificaciones`.
- [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md) — `hooks/dashboard/`.
- [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) — `hooks/espacios/`.
- [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md) — `hooks/gestionAcademica/` (el dominio más grande, incluye advertencia de hooks legacy sobre datos mock).
- [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md) — `hooks/horarios/`.
- [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md) — `hooks/permisos/` y `hooks/users/`.
- [HOOKS_REPORTE.md](HOOKS_REPORTE.md) — `hooks/reporte/`.
- [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md) — `hooks/financiero/` (8 perfiles de rol).

## Regla de diseño transversal: `{ force?: boolean }`

Casi todas las funciones de carga de datos (`loadX`/`cargarX`) en los hooks de este proyecto aceptan un parámetro opcional `{ force?: boolean }` para forzar un refetch saltándose el cache. Es la convención estándar a seguir si se agrega un hook nuevo con fetching de datos.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_PRINCIPALES.md

# Hooks transversales (`frontend/src/hooks/*.ts`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md).

Hooks sueltos en la raíz de `hooks/`, usados a través de todo el proyecto (no pertenecen a un dominio específico).

## `useIsMobile.ts`

- Estado: `isMobile: boolean` (`window.innerWidth < 768`, con listener de `resize`).
- Expone: `isMobile` (booleano puro).
- No llama servicios.
- El hook responsivo más usado del proyecto: consumido en 39 archivos, entre ellos `layouts/AdminDashboard.tsx` y prácticamente todas las páginas de `gestionAcademica/`, `horarios/`, `espacios/`, `prestamos/`, `reporte/`, `users/`, `chatbot/`, `dashboard/`. Documentado también en [RESPONSIVE_UPDATES.md](RESPONSIVE_UPDATES.md).

## `useAdminDashboard.ts` (698 líneas)

El hook que arma el sidebar del panel autenticado. Único consumidor: `layouts/AdminDashboard.tsx`.

- Estado: `isSidebarCollapsed` (fijo en `true`), `isSidebarHovered`, `notificacionesSinLeer` (actualmente hardcodeado a `3`, no viene del backend — pendiente de conectar a `useNotificaciones`).
- Expone: `user`, `role`, `userName`, `userRole`, `userFacultyName`, `isSidebarCollapsed`, `isSidebarHovered`, `setIsSidebarHovered`, `shouldShowExpanded`, `notificacionesSinLeer`, `menuSections` (`MenuSection[]`), `handleLogout`, `location`, `isPublicAccess`.
- No llama servicios API — construye el menú en memoria a partir de `useAuth()` (`user`, `role`, `components`, `logout`) y de `config/componentRoutes.ts` (`getRouteForComponent`, `getIconForComponent`) + `context/financialRoleUtils.ts` (`resolveCanonicalFinancialRole`).
- Agrupa los componentes autorizados del usuario en secciones (`Principal`, `Gestión de Espacios`, `Académico`, `Gestión Académica`, `Asistente Virtual`, `Reportes`, `Administración`, `Módulos Asignados`).
- **Los roles financieros tienen ramas de menú completamente hardcodeadas** (`admin_financiero`, `rectoria`, `direccion_financiera`, `tesoreria`, `auditoria`, `funcionario`, `proveedor`, `contabilidad`), cada una con su propio árbol de menú fijo en vez de derivarlo de `components` como el resto de roles. Ver [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md) para el modelo backend de componentes/roles.

## `useErrorHandler.ts`

Dos hooks pequeños:
- `useErrorHandler()`: estado `error`, funciones `handleError`, `clearError`.
- `useAsyncError()`: permite relanzar errores asíncronos para que los capture un Error Boundary de React.

No llama servicios.

## `useRoutes.ts`

- Define `routesByRole` (mapa estático rol → rutas) y el hook `useRoutes()`.
- Sin estado propio; usa `useUser()` de `context/UserContext`.
- Expone: `currentRole`, `getHomeRouteByRole(roleCode)`, `canAccessRoute(path, role)`, `protectedRoutes`.
- Depende de `context/roleUtils.ts` (`normalizeRole`).
- Complementa a `router/AppRouter.tsx` y `config/componentRoutes.ts` — ver [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md) para la lógica principal de enrutamiento.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_DASHBOARD.md

# Hooks: Dashboard (`frontend/src/hooks/dashboard/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_DASHBOARD.md](PAGINAS_DASHBOARD.md) y [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md).

## `useDashboardHome.ts` (298 líneas)

Usado en `pages/dashboard/DashboardHome.tsx`.

- Llama en paralelo: `facultadService.list()`, `programaService.listarProgramas()`, `espacioHorariosService.getAllDisponiblesWithHorarios()`, `asignaturaService.list()`, `obtenerEstadisticasDashboard()` (`services/dashboard/dashboardAPI.ts`), `ocupacionSemanalService.getOcupacionSemanal()`, `periodoService.listarPeriodos()`.
- Cache: clave `dashboard-home` vía `sessionCache` (ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md)).
- Usa datos por defecto de `services/dashboard.data.ts` (mock estático de iconos/labels) que se sobreescriben con los datos reales una vez llegan.

## `useSupervisorDashboard.ts` (155 líneas)

Usado en `pages/dashboard/SupervisorGeneralHome.tsx`.

- Llama `supervisorDashboardService.getMetricas()` y `getMetricasRecursos()` (`services/dashboard/supervisorDashboardAPI.ts`).
- Sin cache de `sessionCache` — recarga siempre al montar.

## `useConsultorDocente.ts` / `useConsultorEstudiante.ts` (37 líneas cada uno, prácticamente idénticos)

Usados en `pages/dashboard/ConsultorDocenteHome.tsx` / `ConsultorEstudianteHome.tsx`.

- Delegan en `useMiHorario()` (ver [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md)) y calculan estadísticas derivadas (materias, horas, grupos) con `useMemo`.

## `usePublicDashboard.ts` (71 líneas)

Usado en `pages/dashboard/PublicDashboard.tsx`.

- Solo navegación estática (`quickAccessItems`), sin llamadas API.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_ESPACIOS.md

# Hooks: Espacios (`frontend/src/hooks/espacios/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md](PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md) y [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md).

## `useConsultaEspacios.ts` — orquestador

Usado en `pages/espacios/ConsultaEspacios.tsx`. Combina varios sub-hooks del mismo directorio:

- `useConsultaEspaciosFiltros` — filtros de búsqueda/tipo/apertura/sede/período/ocupación.
- `useConsultaEspaciosDatos` — fetch de espacios/horarios/préstamos.
- `useConsultaEspaciosPaginacion`.
- `useConsultaEspaciosSeleccion` — selección de rango para crear una solicitud.
- `useConsultaEspaciosExport` — exportar cronograma a PDF/Excel.
- `useConsultaEspaciosPeriodos` — búsqueda de horarios por período académico.

Expone ~50 propiedades combinadas: filtros, `vistaActual` (`tarjetas|cronograma`), `filteredEspacios`, `paginatedEspacios`, `getOcupacionPorHora`, `getConflictoEnRango`, `horarios`, `prestamos`, exportación, selección por arrastre (`isDragging`, `seleccionRango`, `iniciarSeleccion`...), `verCronogramaIndividual`/`volverALista`.

## `usePrestamosEspacios.ts` (737 líneas)

Usado en `pages/espacios/PrestamosEspacios.tsx`. CRUD administrativo completo de préstamos de espacios.

- Estado: filtros (búsqueda/estado/fecha), diálogos, paginación, `prestamos`.
- Expone: `aprobarSolicitud`, `rechazarSolicitud`, `iniciarEdicion`/`guardarEdicion`/`cancelarEdicion`, `eliminarSolicitud`.
- Servicios: `prestamoService` (`services/prestamos/prestamoAPI.ts`), `prestamosPublicAPI` (`services/prestamos/prestamosPublicAPI.ts`).
- Distingue préstamos "públicos" de "autenticados" por convención de ID (`auth-123` / `public-123`, función `parseUniqueId`).
- Sincronización cross-tab: escucha el evento `storage` con clave `PRESTAMOS_CHANGED_STORAGE_KEY` y el evento custom `PRESTAMOS_CHANGED_EVENT`, más polling cada 15s (`PRESTAMOS_SYNC_INTERVAL_MS`) mientras la pestaña está visible.

## `useAperturaCierre.ts` (684 líneas)

Gestión de apertura/cierre de salones para supervisores.

- Servicios: `aperturaCierreService`, `espacioService`, `espacioRecursoService`.
- Auto-refresh cada 30 segundos.
- Notificaciones toast escalonadas (15/5/1 min para apertura; 10/5/1 min para cierre) con deduplicación vía `useRef<Set<string>>`.

## `useSupervisorSalonHome.ts` (524 líneas) — parcialmente legacy

> **Deuda técnica**: usa `db` (mock sobre `localStorage`, `services/database.ts`) mezclado con servicios reales (`espacioService`, `espacioRecursoService`). Usado en `pages/espacios/SupervisorSalonHome.tsx`. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `hooks/cache/useCacheInvalidation.ts`

Ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md) — sistema de cache legacy específico de espacios, separado de `sessionCache`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_HORARIOS.md

# Hooks: Horarios (`frontend/src/hooks/horarios/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md](PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md) y [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md).

## `useMiHorario.ts` (207 líneas)

Usado en `pages/horarios/MiHorario.tsx`, y consumido indirectamente por `useConsultorDocente`/`useConsultorEstudiante` (ver [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md)). Horario personal de docente/estudiante.

- Servicio: `horarioService.miHorario(userId)` / `miHorarioEstudiante(userId)`, más exportación PDF/Excel (`exportarPdfUsuario`, `exportarExcelUsuario`).
- Cache por `userScope` (rol + id de usuario).

## `useConsultaHorario.ts` (291 líneas) y `useConsultaHorarios.ts` (170 líneas)

Dos hooks distintos con nombres casi idénticos:
- `useConsultaHorario.ts` (singular): vista dual programa/docente con modales.
- `useConsultaHorarios.ts` (plural): tabla filtrable simple.

Ambos llaman `horarioService.listExtendidos()` y `periodoActivoService.getPeriodoActivo()`; el singular además usa `programaService`/`userService.listarDocentes()`. Usados en las páginas de consulta de horarios (público y `pages/horarios/ConsultaHorarios.tsx` respectivamente — verificar cuál exacto en cada página al usarlos).

## `useVisualizacionHorarios.ts` (196 líneas) — legacy

> **Deuda técnica**: usa `db.getFacultades/getProgramas/...` (`services/database.ts`) y lee horarios directamente de `localStorage.getItem('horariosCompletos')`, no del backend. Usado en `pages/horarios/VisualizacionHorarios.tsx`. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `useAsignacionEspaciosSeccional.ts` (312 líneas)

Usado en `pages/gestionAcademica/AsignacionEspaciosSeccionalPage.tsx`. Asigna espacios a horarios sin espacio, filtrado por la seccional del usuario.

- Servicio: `asignacionEspaciosService` (`services/horarios/asignacionEspaciosService.ts`), más `programaService`, `grupoService`, `asignaturaService`, `periodoService`.
- Cache de filtros y de horarios por `seccionalId + periodoId`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_GESTION_ACADEMICA.md

# Hooks: Gestión Académica (`frontend/src/hooks/gestionAcademica/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_GESTION_ACADEMICA.md](PAGINAS_GESTION_ACADEMICA.md) y [SERVICES_ACADEMICO.md](SERVICES_ACADEMICO.md).

El dominio más grande de `hooks/` (17 archivos). **Aviso importante**: conviven dos generaciones de hooks.

## Deuda técnica: hooks legacy sobre datos mock

Estos hooks usan `services/database.ts` (`db`, un simulador de backend sobre `localStorage` de una fase previa del proyecto), no el backend Django real:

- `useHorariosAcademicos.ts` — usado en `pages/gestionAcademica/HorariosAcademicos.tsx`.
- `useAsignacionAutomatica.ts` (694 líneas) — usado en `pages/gestionAcademica/AsignacionAutomatica.tsx`. Importa/parsea Excel-CSV con `exceljs`, ejecuta un algoritmo de asignación automática de espacios (ordena por capacidad, calcula coincidencia de recursos ≥30%, detecta conflictos de horario) y persiste todo en `db`, no en el backend real. Genera también una plantilla de descarga.

Ver también `hooks/horarios/useVisualizacionHorarios.ts` y `hooks/espacios/useSupervisorSalonHome.ts` (mismo patrón, documentados en sus respectivos archivos). Recomendación: tratar estas páginas como pendientes de migración al backend real antes de considerarlas completamente funcionales en producción.

## Hooks reales (sobre backend Django)

### `useCrearHorarios.ts` (817 líneas) — el hook más complejo del dominio académico

Usado en `pages/gestionAcademica/CrearHorarios.tsx`.

- Estado: catálogos (`facultades`, `programas`, `grupos`, `espacios`, `asignaturas`, `asignaturasPrograma`, `docentes`, `periodos`, `todosLosHorarios`), 9 filtros independientes, vista (`lista|asignar`), modal de asignación con `diasSeleccionados`/`horasPorDia`.
- Servicios: `facultadService`, `programaService`, `espacioService`, `asignaturaService`, `asignaturaProgramaService`, `userService.listarDocentes`, `periodoService`, `grupoService`, `horarioService.listExtendidos`, `solicitudEspacioService`.
- Carga progresiva en 3 fases (catálogos pequeños → grupos → horarios pesados) con cache por `userScope` (rol + usuario + facultad).
- Valida conflictos de horario vía el sub-hook `useValidacionHorarios.ts`.
- Notifica cambios con el evento global `horariosUpdated` y limpia cache con `clearSessionCacheByPrefix` (`gestion-academica-crear-horarios`, `gestion-academica-centro-horarios-v2`).

### `useGestionUsuarios.ts` (840 líneas)

Usado en `pages/gestionAcademica/GestionUsuarios.tsx`. CRUD de usuarios con roles/facultades/sedes/espacios permitidos (individual o por tipo de espacio).

- Servicios: `userService`, `rolService` (`services/users/authService.ts`), `espacioService`/`espacioPermitidoService`, `facultadService`, `sedeService`.
- Cache multi-clave (usuarios, roles, facultades, espacios, sedes, tipos de espacio), cada una con su propio evento de invalidación (`ROLES_UPDATED_EVENT`, `ESPACIOS_UPDATED_EVENT`, `SEDES_UPDATED_EVENT`, `ACADEMIC_CATALOG_UPDATED_EVENT`), incluyendo un listener en `window.addEventListener('focus', ...)` para refrescar catálogos al recuperar el foco.

> Nota: existe un segundo hook de roles independiente, `hooks/permisos/useGestionRoles.ts` (ver [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md)), que se sincroniza con este vía el evento `ROLES_UPDATED_EVENT` — no comparten código.

### Resto de hooks del dominio

Mismo patrón de CRUD + `sessionCache` + servicios homónimos: `useAsignaturas.ts`, `useCentroHorarios.ts`, `useDocentes.ts`, `useEspaciosFisicos.ts`, `useEstadoRecursos.ts`, `useFacultadesPrograms.ts`, `useGestionRecursos.ts`, `useGrupos.ts`, `useGruposFusion.ts`, `usePeriodosAcademicos.ts`, `useSedes.ts`, `useSolicitudesEspacio.ts`.

### `useValidacionHorarios.ts`

Sub-hook consumido por `useCrearHorarios.ts` para detectar conflictos de horario (docente/grupo/espacio ocupado en el mismo bloque).

### `paginacion.ts` — utilidades, no un hook

Módulo de funciones puras reusado por casi todos los hooks paginados del proyecto: `PAGE_SIZE_DEFAULT`, `getPageNumbers`, `getPageSlice`, `getTotalPages`, `normalizePage`, `hasNextPageWindow`, `hasPrevPageWindow`, `getTargetPageForNextWindow`/`PrevWindow`. Usado también por `useGestionUsuarios`, `usePrestamosEspacios`, `useAperturaCierre`, `useCrearHorarios`, entre otros.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_FINANCIERO.md

# Hooks: Financiero (`frontend/src/hooks/financiero/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_CHATBOT_FINANCIERO.md](PAGINAS_CHATBOT_FINANCIERO.md), [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md) y [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

Estructura repetida por cada uno de los 8 perfiles financieros: `admin_financiero`, `auditoria`, `contabilidad`, `direccion_financiera`, `funcionario`, `proveedor`, `rectoria`, `tesoreria`.

## Hooks de navegación (`{perfil}/index.ts` + `{perfil}/index/use{Perfil}Dashboard.ts`)

Se repiten idénticos en los 8 perfiles — son simplemente **routers de tabs internos**, sin llamadas API:

- Calculan `activeView` a partir del `pathname` (`useLocation`).
- Exponen `onNavigate(menu)`, que hace `navigate(routes[menu])`.

Ejemplo real: `useAdminFinancieroDashboard.ts` (32 líneas).

## Hooks de negocio (uno por pantalla, con fetching real)

No usan `sessionCache` (a diferencia del resto del proyecto) — recargan siempre al montar. Todos consumen el barrel `services/financiero/index.ts` para acceder a `facturasService`, `documentosService`, `comentariosService`, `historialService`, etc. (ver [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md)).

- **`useFuncionarioHome.ts`** (129 líneas): stats (recibidas/pendientes/registradas/en revisión) + actividad reciente. Servicio: `facturasService` (`getAll`, `getEstadisticas`, `getPendientes`).
- **`useContabilidadMisPendientes.ts`** (146 líneas): lista de facturas en estado `Registrada` (excluye `Corrección Funcionario`), con documentos adjuntos por factura y cálculo de nivel de riesgo SLA (`SLA_DIAS_CONTABILIDAD = 12`, niveles verde/amarillo/naranja/vencido). `accionRequerida(factura)` decide la acción disponible según `etapa_actual` del backend. Servicios: `facturasService`, `documentosService`.
- Resto de hooks del mismo patrón (uno por pantalla): `useContabilidadCausarFacturas`, `useContabilidadRadicarFacturas`, `useContabilidadHome`, `useConfirmacionPagos`, `useEnviarRectoria`, `useDireccionFinancieraHome`, `useMisPendientes` (existe duplicado con el mismo nombre en las carpetas `direccion_financiera/` y `rectoria/` — no comparten código), `useRevisarPagos`, `useProveedorHome`, `useAutorizarPagos`, `useRectoriaHome`, `useAuditoriaDashboard`.

## Notas de arquitectura

- El flujo de una factura (ver [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md)) se refleja directamente en los nombres de las acciones que exponen estos hooks (radicar, causar, alistar, enviar a Dirección Financiera, enviar a Rectoría, autorizar, registrar pago aplicado, etc.).
- El cálculo de riesgo SLA en el frontend (ej. `SLA_DIAS_CONTABILIDAD` en `useContabilidadMisPendientes.ts`) se alimenta del catálogo `parametrosSlaService` (ver [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md)), que define los días máximos por etapa.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_CHATBOT_NOTIFICACIONES.md

# Hooks: Chatbot y Notificaciones

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [SERVICES_CHATBOT.md](SERVICES_CHATBOT.md) y [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md).

## `hooks/chatbot/useAsistentesVirtuales.ts` (752 líneas)

Único consumidor: `pages/chatbot/AsistentesVirtuales.tsx`.

- Estado: `asistentes`, `asistenteActivo`, `mensajes` (por agente), `inputMensaje`, `isTyping`, `searchTerm`, `loading`, `preguntasRotadas`, `chatIds` (mapeo agente→chat_id), `seccionalesPublico`, `seccionalPublica`, `cargandoSeccionales`, `mostrarHistorial`, `conversacionesHistorial`, `cargandoHistorial`, `messagesEndRef`.
- Expone: `abrirChat`, `enviarMensaje`, `enviarPreguntaRapida`, `handleKeyPress`, `limpiarConversacion`, `cargarHistorialConversaciones`, `cargarConversacionAnterior`, y getters derivados: `mensajesActuales`, `mostrarPreguntasRapidas`, `filteredAsistentes`, `esPublico`.
- Servicio: `services/chatbot/chatbotAPI.ts` — `listarAgentes`/`listarAgentesPublico`, `enviarPregunta`/`enviarPreguntaPublico`, `obtenerHistorial`, `listarConversaciones`.
- Cache: usa `core/sessionCache.ts` con clave `chatbot-asistentes-virtuales-{userId}-{rol}`. Además persiste `chat_ids` y mensajes en `localStorage` por usuario (`sihul_chat_ids_{userId}`, `sihul_mensajes_chat_{userId}`) con un patrón *distinto* al `sessionCache` genérico: como los iconos de `lucide-react` no son serializables, solo se guarda el nombre del icono (`icono: string`) y se "rehidrata" con un `iconMap` al leer.
- Detecta usuario público vs. autenticado (`user?.id`) y cambia de endpoint público/privado en consecuencia.

## `hooks/users/useNotificaciones.ts` (376 líneas)

Único consumidor: `pages/users/Notificaciones.tsx`.

- Estado: `notificaciones`, `filterTab` (`'importantes'|'pendientes'|'leidas'`), `isLoading`, `stats` (`total/pendientes/leidas/eliminadas`), paginación (`paginaActual`, `totalPaginas`, `totalNotificaciones`, `limite=5`), `busqueda`/`busquedaActiva` (debounce 500ms), `filtroTiempo`, `filtroPrioridad`.
- Expone: `setFilterTab` (alias `cambiarTab`), `marcarComoLeida`, `marcarTodasComoLeidas`, `eliminarNotificacion`, `filteredNotificaciones`, `recargar`, `cambiarPagina`, `setBusqueda`, `setFiltroTiempo`, `setFiltroPrioridad`.
- Servicios: `services/notificaciones/notificacionesAPI.ts` — `obtenerMisNotificaciones`, `obtenerEstadisticas`, `marcarComoLeida`, `marcarTodasComoLeidas`, `eliminarNotificacion`.
- También consume `context/NotificacionesContext` (`actualizarContador`) para sincronizar el badge global de notificaciones no leídas.
- Polling: refresca estadísticas cada 30 segundos.
- Mapea el modelo backend (`NotificacionBackend`) a un modelo de UI (`NotificacionUsuario`) vía `mapearNotificacion`, con lógica especial para los tipos `factura_devuelta`/`factura_etapa_actualizada` (usa el mensaje completo) y `solicitud_rechazada` (separa título/descripción por líneas).

> Nota: `useAdminDashboard.ts` (ver [HOOKS_PRINCIPALES.md](HOOKS_PRINCIPALES.md)) tiene un contador `notificacionesSinLeer` hardcodeado a `3` — todavía no está conectado a este hook/servicio real.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_PERMISOS_USERS.md

# Hooks: Permisos y Usuarios (`frontend/src/hooks/permisos/`, `frontend/src/hooks/users/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_REPORTES_PERMISOS_USUARIOS.md](PAGINAS_REPORTES_PERMISOS_USUARIOS.md) y [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md).

## `hooks/permisos/useGestionRoles.ts` (149 líneas)

Usado en `pages/permisos/GestionRoles.tsx`. CRUD de roles + paginación local (5 por página) + búsqueda.

- Servicio: `rolService` (`services/users/authService.ts`).
- Cache: `permisos-gestion-roles-v3`. Al mutar, también limpia el cache homónimo usado por `gestionAcademica` (`gestion-academica-roles-v3`) y dispara `ROLES_UPDATED_EVENT`.
- **Existen dos hooks de roles independientes** (este y el `loadRoles` embebido en `useGestionUsuarios.ts`, ver [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md)) que se sincronizan solo vía evento global, sin compartir código.

## `hooks/permisos/useComponentesRoles.ts` (279 líneas)

Usado en `pages/permisos/ComponentesRoles.tsx`. Gestiona asignaciones componente↔rol↔permiso (`VER`/`EDITAR`) — es la UI del sistema RBAC dinámico documentado en [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md).

- Servicios: `componenteService`, `componenteRolService` (`services/componentes/componentesAPI.ts`), `rolService`.
- Cache: `permisos-componentes-roles`.

## `hooks/users/useLogin.ts` (159 líneas)

Usado en `pages/users/Login.tsx`.

- Implementa **lockout de 120 segundos tras HTTP 429** (persistido en `localStorage['login_lockout_until']`, con cuenta regresiva en vivo).
- Acceso público (`handlePublicAccess`): limpia todo `localStorage` y marca `auth_is_public`.
- Login Microsoft: `authService.getMicrosoftLoginUrl()`.
- Depende de `context/AuthContext` (`login`, `isAuthenticated`, `role`, `components`).

## `hooks/users/useAjustes.ts` (285 líneas)

Usado en `pages/users/Ajustes.tsx`. Perfil de usuario + cambio de contraseña + espacios permitidos (si el rol supervisa espacios).

- Servicios: `userService`, `authService` (`getAuthenticatedUser`, `changePassword`), `espacioPermitidoService.listByUsuario`.
- Sincroniza `localStorage['auth_user']` tras guardar cambios.

## `hooks/users/useRegister.ts` (215 líneas)

Usado en `pages/users/Register.tsx`. Registro público con validaciones de formulario (nombre, correo, confirmación de correo/password, sede).

- Servicios: `sedeService.listarSedes()` (con fallback hardcodeado de 12 sedes si falla el fetch), `userService.crearUsuario()` (el usuario se crea sin `rol_id`, pendiente de asignación por un admin).

## `hooks/users/useNotificaciones.ts`

Documentado en [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md).

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_REPORTE.md

# Hooks: Reporte (`frontend/src/hooks/reporte/`)

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md), [PAGINAS_REPORTES_PERMISOS_USUARIOS.md](PAGINAS_REPORTES_PERMISOS_USUARIOS.md) y [SERVICES_PRESTAMOS_REPORTE.md](SERVICES_PRESTAMOS_REPORTE.md).

## `useReportes.ts` (876 líneas) — el hook más grande de `reporte/`

Usado en `pages/reporte/Reportes.tsx`. Combina 5 tipos de reporte en un solo hook: ocupación, horarios-docente, horarios-programa, disponibilidad, capacidad.

- Servicios: `reporteOcupacionService`, `disponibilidadService`, `capacidadService` (los tres en `services/reporte/`), `horarioService.listExtendidos`, `programaService`, `periodoActivoService`, `userService.listarDocentes`.
- Exportación PDF vía backend (`/espacios/reporte/{ocupacion,disponibilidad,capacidad}/pdf/`, `/horarios/exportar-pdf{,-docente}/`) usando `trackedFetch` de `core/apiActivity.ts` **directamente**, no `apiClient` (ver [SERVICES_CORE.md](SERVICES_CORE.md)). Exportación Excel local con `exceljs` para los reportes sin endpoint backend dedicado.
- Cache por `estadoReporte` (aprobado/pendiente/todos) y por `userScope`.
- Filtra programas visibles según facultad si el rol es `planeacion_facultad` — lógica hardcodeada por nombre de facultad, marcada explícitamente como "demo" en el código fuente.

## `useOcupacionSemanal.ts` (251 líneas)

Usado en `pages/reporte/OcupacionSemanal.tsx`. Dashboard de ocupación semanal por tipo de espacio.

- Servicios: `ocupacionSemanalService`, `periodoActivoService`.
- Cache en 3 claves separadas (período, tipos, data-por-tipo-y-período).

## `useConsultaOcupacion.ts` y `useConsultaReportes.ts`

Variantes adicionales para roles de consulta/rol restringido. Mismos servicios de `services/reporte/`. Usados en `pages/reporte/ConsultaOcupacion.tsx` y `pages/reporte/ConsultaReportes.tsx`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/hooks/HOOKS_PATRON_CACHE.md

# Patrón de cache en los hooks

Ver también [HOOKS_INDICE.md](HOOKS_INDICE.md) y [SERVICES_CORE.md](SERVICES_CORE.md) (`core/sessionCache.ts` es la pieza base).

Coexisten **dos sistemas de cache** en el proyecto:

## 1. Sistema dominante: `core/sessionCache.ts`

Usado por ~20+ hooks de datos (`dashboard/`, `gestionAcademica/`, `horarios/`, `espacios/`, `prestamos/`, `reporte/`, `permisos/`, `chatbot/`). Patrón típico repetido en cada hook:

```ts
const CACHE_KEY = 'dominio-especifico';
const activeToken = localStorage.getItem('auth_token');
const cached = force ? null : getSessionCacheData<T>(CACHE_KEY, activeToken);
if (cached) { setState(cached); return; }
// ... fetch real ...
setSessionCacheData(CACHE_KEY, activeToken, data);
```

Características:
- TTL fijo de 30 minutos (`CACHE_TTL_MS` en `core/sessionCache.ts`).
- Claves con prefijo `sihul_cache_` en `localStorage`.
- El cache se asocia al `token` de sesión: si cambia (nuevo login), se invalida automáticamente.
- Muchos hooks usan una clave compuesta por `userScope` (rol + id de usuario + facultad) para no mezclar cache entre usuarios distintos con el mismo rol.

### Invalidación por eventos globales (`window` custom events)

- `academic-catalog-updated`
- `espacios-updated`
- `sedes-updated`
- `roles-updated` (`ROLES_UPDATED_EVENT`)
- `horariosUpdated`
- `sihul:prestamos-changed` (definido en `services/prestamos/prestamosChanges.ts`, con sincronización cross-tab vía `storage` event + `localStorage['sihul_prestamos_changed_at']`)

### `clearSessionCacheByPrefix(prefix)`

Permite invalidar varias claves relacionadas de una vez (ej. `useCrearHorarios.ts` limpia `gestion-academica-crear-horarios` y `gestion-academica-centro-horarios-v2` al guardar un horario nuevo).

## 2. Sistema legacy: `hooks/cache/useCacheInvalidation.ts` + `services/cache/cacheService.ts`

Precede al sistema de `sessionCache`. Solo expone `invalidateEspaciosCache()`, que resuelve una clave de cache por usuario y la limpia. Vive aparte de `sessionCache` y no comparte código con él — al leer o modificar código de gestión de espacios, verificar cuál de los dos sistemas está en juego.

## Hooks financieros: sin cache

Los hooks de `hooks/financiero/` (ver [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md)) son la excepción: **no usan `sessionCache`**, recargan datos siempre al montar el componente.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_INDICE.md

# Páginas principales (`frontend/src/pages/`) — índice

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md).

Las páginas del frontend están organizadas por dominio. Documentación dividida en:

- [PAGINAS_DASHBOARD.md](PAGINAS_DASHBOARD.md) — `dashboard/`
- [PAGINAS_GESTION_ACADEMICA.md](PAGINAS_GESTION_ACADEMICA.md) — `gestionAcademica/`
- [PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md](PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md) — `horarios/`, `espacios/`, `prestamos/`
- [PAGINAS_REPORTES_PERMISOS_USUARIOS.md](PAGINAS_REPORTES_PERMISOS_USUARIOS.md) — `reporte/`, `permisos/`, `users/`
- [PAGINAS_CHATBOT_FINANCIERO.md](PAGINAS_CHATBOT_FINANCIERO.md) — `chatbot/`, `financiero/`
- [PAGINAS_SHARED.md](PAGINAS_SHARED.md) — `shared/`

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_DASHBOARD.md

# Páginas: Dashboard (`frontend/src/pages/dashboard/`)

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

- `DashboardHome` — home principal para roles administrativos/académicos.
- `PublicDashboard` — vista pública sin autenticación.
- `SupervisorGeneralHome` — home del rol supervisor general.
- `ConsultorDocenteHome` — home del rol docente (consulta).
- `ConsultorEstudianteHome` — home del rol estudiante (consulta).

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_GESTION_ACADEMICA.md

# Páginas: Gestión Académica (`frontend/src/pages/gestionAcademica/`)

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

Es el dominio con más páginas del frontend, cubre la administración completa de la estructura académica:

- Facultades/Programas
- Periodos
- Grupos (+ Fusión de grupos)
- Asignaturas
- Espacios Físicos
- Horarios Académicos (+ Horarios Fusionados)
- Docentes
- Sedes
- Gestión de Usuarios
- Gestión de Recursos
- Estado de Recursos
- Asignación Automática
- Asignación de Espacios Seccional
- Solicitudes de Espacio
- Centro de Horarios
- Crear Horarios

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_HORARIOS_ESPACIOS_PRESTAMOS.md

# Páginas: Horarios, Espacios y Préstamos

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

## `frontend/src/pages/horarios/`

- Consulta de Horarios
- Mi Horario
- Visualización
- Consulta pública

## `frontend/src/pages/espacios/`

- Consulta de Espacios
- Préstamos de Espacios
- Supervisor Salón Home

## `frontend/src/pages/prestamos/`

- Consulta
- Docente Préstamos
- Plazas Disponibles
- Préstamo público

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_CHATBOT_FINANCIERO.md

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

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_REPORTES_PERMISOS_USUARIOS.md

# Páginas: Reportes, Permisos y Usuarios

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

## `frontend/src/pages/reporte/`

- Consulta de Ocupación
- Ocupación Semanal
- Consulta de Reportes
- Reportes

## `frontend/src/pages/permisos/`

- `ComponentesRoles.tsx` — asignar componentes a roles (ver [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md) para el modelo backend).
- `GestionRoles.tsx`

## `frontend/src/pages/users/`

- Login
- Register
- Ajustes
- Notificaciones (ver [RESUMEN_NOTIFICACIONES.md](RESUMEN_NOTIFICACIONES.md))

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/paginas/PAGINAS_SHARED.md

# Páginas: Shared (`frontend/src/pages/shared/`)

Ver también [PAGINAS_INDICE.md](PAGINAS_INDICE.md).

- `EnConstruccion.tsx` — placeholder para features pendientes de implementar.
- `DynamicComponentPage.tsx` — fallback para componentes sin ruta específica registrada en `componentRoutes.ts` (ver [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md)).

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_INDICE.md

# Services del frontend (`frontend/src/services/`) — índice

Ver también [ESTRUCTURA_Y_STACK.md](ESTRUCTURA_Y_STACK.md) y [HOOKS_INDICE.md](HOOKS_INDICE.md) (los hooks consumen estos services).

`frontend/src/services/` contiene los clientes API por dominio, organizados en subcarpetas. Documentación dividida en:

- [SERVICES_CORE.md](SERVICES_CORE.md) — los 8 módulos base de `frontend/src/core/` de los que dependen todos los services (`apiClient`, `endpoints`, `backendUrl`, `errorHandler`, `sessionCache`, `apiActivity`, `backendHealth`, `clearStaleState`).
- [SERVICES_LEGACY.md](SERVICES_LEGACY.md) — capa mock (`database.ts`, `auth.ts`, `complete-data.ts`, `cacheService.ts`) que precede al backend real; deuda técnica visible.
- [SERVICES_ACADEMICO.md](SERVICES_ACADEMICO.md) — asignaturas, componentes, facultades, grupos, periodos, programas, sedes, recursos.
- [SERVICES_ESPACIOS_HORARIOS.md](SERVICES_ESPACIOS_HORARIOS.md) — espacios, horarios, solicitudes de espacio, asignación de espacios.
- [SERVICES_PRESTAMOS_REPORTE.md](SERVICES_PRESTAMOS_REPORTE.md) — préstamos (admin/público) y reportes de ocupación/capacidad/disponibilidad.
- [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md) — usuarios/auth, notificaciones, dashboard, configuración local.
- [SERVICES_CHATBOT.md](SERVICES_CHATBOT.md) — cliente del chatbot (proxy hacia el backend Django).
- [SERVICES_FINANCIERO.md](SERVICES_FINANCIERO.md) — los 11 servicios del módulo financiero.

## Patrón base común

Todos los servicios "reales" (no legacy) importan `apiClient` desde `core/apiClient.ts` y llaman a `apiClient.get/post/put/patch/delete/postFormData/getBlob/postBlob`. Ninguno usa `fetch` crudo salvo casos puntuales de descarga de blobs vía `trackedFetch` (`core/apiActivity.ts`).

Patrón típico de transformación backend↔frontend: cada servicio suele definir una interfaz `XApi` (relaciones como `number` planas, ej. `programa: number`) y una interfaz pública `X` (con sufijo `_id`, ej. `programa_id: number`), más una función `toFrontendX(apiObj): X` de normalización. Ejemplos: `toFrontendAsignaturaPrograma`, `toFrontendHorario`, `toFrontendPrestamo`, `toFrontendGrupo`, `toFrontendSede`, `toFrontendFacultad`, `toFrontendComponenteRol`, `toFrontendUsuario`.

## `core/endpoints.ts`: convención parcialmente adoptada

Existe un objeto `ENDPOINTS` centralizado en `core/endpoints.ts`, pero la mayoría de los servicios **no lo usan** — construyen las rutas como strings literales directamente en cada llamada (`apiClient.get('/asignaturas/')`). Antes de asumir que las rutas están centralizadas ahí, verificar con un grep si el servicio en cuestión lo importa.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_CORE.md

# Core (`frontend/src/core/`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md) y [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md).

Los módulos base de los que dependen todos los `services/`.

## `apiClient.ts` (211 líneas)

Cliente HTTP centralizado. Clase `ApiClient`, instancia exportada como `apiClient`.

- `baseURL` resuelto por `resolveApiBaseUrl(import.meta.env.VITE_API_URL)` (ver `backendUrl.ts`).
- Headers automáticos: `Content-Type: application/json` (salvo `FormData`), `Authorization: Bearer {auth_token}` desde `localStorage`.
- `credentials: 'include'` en todas las peticiones (cookies de sesión, usado por el flujo OAuth Microsoft).
- Métodos: `get`, `post`, `put`, `patch`, `delete`, `postFormData`, `getBlob`, `postBlob`.
- Config extendida por llamada: `requiresAuth` (default `true`; si `false`, no fuerza redirect en 401), `suppressErrorLog` (evita loggear/reportar el error — útil en llamadas "opcionales" de hidratación de sesión o en endpoints donde un 404 es esperado).
- Un `204` retorna `{}`.
- Integra `beginApiRequest()`/`endRequest()` de `apiActivity.ts` para trackear peticiones pendientes globalmente, y `handleApiError` de `errorHandler.ts` para respuestas no-ok.
- No cachea nada — el cache vive en la capa de hooks (`sessionCache.ts`), no aquí.

## `endpoints.ts` (176 líneas)

Objeto `ENDPOINTS` con rutas centralizadas por dominio (`USUARIOS`, `ROLES`, `SEDES`, `FACULTADES`, `PROGRAMAS`, `PERIODOS`, `GRUPOS`, `ASIGNATURAS`, `ESPACIOS`, `RECURSOS`, `ESPACIO_RECURSO`, `PRESTAMOS`, `HORARIOS`, `HORARIOS_FUSIONADOS`, `AUTH`, `RESERVAS`, `DASHBOARD`, `NOTIFICACIONES`, `REPORTES`, `BUSQUEDA`). Ver nota de adopción parcial en [SERVICES_INDICE.md](SERVICES_INDICE.md).

## `backendUrl.ts` (34 líneas)

- `resolveBackendBaseUrl(rawUrl)`: si hay `VITE_API_URL` configurado y no es localhost (o si el navegador sí está en localhost), lo usa; si no, cae a `window.location.origin`. Limpia el sufijo `/api`.
- `resolveApiBaseUrl(rawUrl)`: añade `/api` al resultado anterior (o retorna `/api` si no hay base).
- Usado por `apiClient.ts`, `authService.ts` (para `getMicrosoftLoginUrl`), `backendHealth.ts`, `ocupacionSemanalAPI.ts`, `useReportes.ts`.

## `errorHandler.ts` (159 líneas)

- `handleApiError(response, { redirectOn401 })`: parsea el body de error (string/array/objeto DRF con `non_field_errors` o campo específico), arma un `ApiError { message, status, errors }`.
- Casos especiales por status:
  - `401` (si `redirectOn401`): limpia estado de auth (`clearAuthClientState`), limpia `db.cerrarSesion()` (import dinámico para evitar ciclo con la capa legacy), navega a `/login` vía History API + `PopStateEvent('popstate')` (evita un full reload; cae a `window.location.href` si falla).
  - `403` → "No tienes permisos...".
  - `404` → "Recurso no encontrado".
  - `422` → "Datos de validación incorrectos".
  - `500` → "Error interno del servidor" (si no hay mensaje del servidor).
- `formatValidationErrors(errors)`: formatea errores de campo para mostrar en la UI.

## `sessionCache.ts` (112 líneas) — el corazón del patrón de cache del proyecto

Documentado en detalle en [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md). Resumen técnico:

- `CACHE_TTL_MS = 30 * 60 * 1000` (30 min), `CACHE_PREFIX = 'sihul_cache_'`.
- `getSessionCacheData<T>(key, token)`: lee de `localStorage`, valida que el `token` coincida (invalida cache al cambiar de sesión) y que no haya expirado el TTL.
- `setSessionCacheData<T>(key, token, data)`: guarda `{ token, data, timestamp }`; si supera `MAX_CACHE_SIZE_BYTES` (~4MB estimado por `JSON.stringify(data).length * 2`), no cachea silenciosamente; si `localStorage` lanza `QuotaExceededError`, limpia todo el cache.
- `clearSessionCache(key?)`: borra una clave o todas las que empiecen con el prefijo.
- `clearSessionCacheByPrefix(prefix)`: borra todas las claves que empiecen con `sihul_cache_{prefix}`.
- Auto-cleanup al cargar el módulo: si `localStorage` está lleno o no disponible, limpia todo el cache proactivamente.

## `apiActivity.ts` (151 líneas)

Sistema de estado global (pub/sub simple, sin librería) para trackear actividad de red:

- `beginApiRequest()` / callback `endRequest()`: incrementa/decrementa `pendingRequests`.
- `reportApiError(error)`: si detecta 2+ fallos de red consecutivos (`TypeError` sin response, es decir backend inalcanzable), marca `backendUnreachable = true`.
- `reportBackendReachable()`: si veníamos de `backendUnreachable`, entra en `backendRecovering` y **recarga la página completa tras 1.5s** para forzar que toda la UI re-consulte datos frescos tras una caída del backend.
- `trackedFetch(input, init)`: wrapper de `fetch` nativo (no pasa por `apiClient`) que añade el Bearer token, trackea la petición y reporta reachability. Usado en llamadas puntuales que necesitan `fetch` crudo (descargas de PDF/Excel con streaming de blob, endpoints públicos de préstamos con PUT directo).
- Expone `subscribeApiActivity`/`getApiActivitySnapshot`, consumidos probablemente por un banner global de estado (fuera del alcance de hooks/services).

## `backendHealth.ts` (56 líneas)

- `startBackendHealthWatcher()`: arranca un polling perezoso (`PING_INTERVAL_MS = 5000`) que **solo hace ping real si `backendUnreachable` está activo** (para no generar tráfico innecesario en el caso normal). Hace `HEAD` a `{apiUrl}/` con `AbortController` (timeout 10s). Cualquier respuesta HTTP (incluso 401/403/404) cuenta como "backend vivo".

## `clearStaleState.ts` (48 líneas)

- `clearAuthClientState()`: borra claves específicas de auth (`auth_token`, `auth_user`, `auth_role`, `auth_components`, `auth_faculties`, `auth_areas`, `auth_sede`, `auth_signature`, `auth_is_public`) más todo lo que empiece con `cache_` o `sihul_cache_`. Usado por `errorHandler.ts` en el flujo de 401.
- `clearStaleClientState()`: borra **todo** `localStorage` salvo `theme`, y limpia `sessionStorage` completo — función de "reset total" para depurar bugs de cache/sesión corrupta.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_ACADEMICO.md

# Services: dominio académico

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md) y [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md).

## `services/asignaturas/asignaturaAPI.ts`

- `asignaturaService`: `create`, `update`, `delete`, `get(id)`, `list()` sobre `/asignaturas/`.
- `asignaturaProgramaService`: `create`, `update`, `delete`, `get(id)`, `list(programa_id?)` (filtra en cliente si se pasa `programa_id`) sobre `/asignaturas-programa/`.

## `services/componentes/componentesAPI.ts`

Cliente del sistema RBAC dinámico (ver [../documentacion_backend/AUTENTICACION_Y_PERMISOS.md](../documentacion_backend/AUTENTICACION_Y_PERMISOS.md)).

- `componenteService`: `create`, `list`, `get(id)`, `update`, `delete` sobre `/componentes/`.
- `componenteRolService`: CRUD sobre `/componentes/roles/` (permiso `VER`/`EDITAR`).
- `componenteUsuarioService`: `list(usuarioId?)`, `create`, `update`, `delete` sobre `/componentes/usuarios/` (asignación directa de componente a usuario, independiente del rol).

## `services/facultades/facultadesAPI.ts`

`facultadService`: `create`, `update`, `delete`, `get(id)`, `list()` sobre `/facultades/`.

## `services/grupos/gruposAPI.ts`

`grupoService`: `create`, `update` (PATCH parcial), `delete`, `get(id)`, `list()` sobre `/grupos/`.

## `services/periodos/periodoAPI.ts`

`periodoService`: `listarPeriodos`, `obtenerPeriodo(id)`, `crearPeriodo`, `actualizarPeriodo`, `eliminarPeriodo`, `copiarPeriodo(origenId, nuevoPeriodo)` (POST `/periodos/copy/` — clona un período y migra sus grupos), `periodoPorRangoFechas(inicio, fin)` (GET `/periodos/rango-fechas/`, `suppressErrorLog: true`).

## `services/periodos/periodoActivoAPI.ts`

`periodoActivoService.getPeriodoActivo()`: GET `/periodos/activo/`, retorna `null` en error (try/catch interno, no propaga excepción). Es el servicio de "período activo" que casi todos los demás hooks consultan para mostrar el período académico vigente.

## `services/programas/programaAPI.ts`

`programaService`: `listarProgramas`, `obtenerPrograma(id)`, `crearPrograma`, `actualizarPrograma`, `eliminarPrograma` sobre `/programas/`.

## `services/sedes/sedeAPI.ts`

`sedeService`: `listarSeccionales()` (GET `/seccionales/`), `listarSedes`, `obtenerSede(id)`, `crearSede`, `actualizarSede`, `eliminarSede` sobre `/sedes/`. El modelo `Sede` tiene compatibilidad dual `ciudad`/`seccional_ciudad` (alias legacy).

## `services/recursos/recursoAPI.ts`

- `recursoService`: `listarRecursos` (normaliza array/`{recursos}`/`{results}`), `obtenerRecurso(id)`, `crearRecurso`, `actualizarRecurso` (PATCH), `eliminarRecurso` sobre `/recursos/`.
- `espacioRecursoService`: gestiona la relación N:M espacio↔recurso con estado (`disponible|no_disponible|en_mantenimiento`). Endpoints `/espacios-recursos/` y `/espacios-recursos/por-ids/{espacioId}/{recursoId}/`. `listarPorEspacio(espacioId)` combina `listarEspacioRecursos()` + `listarRecursos()` en cliente para enriquecer con nombre. Consumido intensivamente por `useAperturaCierre.ts` y `useSupervisorSalonHome.ts` (ver [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md)) para el checklist de revisión de recursos al cerrar un salón.

## `services/espacios/tipoEspacioAPI.ts`

`tipoEspacioService`: `crearTipoEspacio`, `listarTiposEspacio`, `obtenerTipoEspacio(id)` sobre `/tipos-espacio/`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_ESPACIOS_HORARIOS.md

# Services: Espacios y Horarios

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) y [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md).

## `services/espacios/espaciosAPI.ts` (459 líneas — el service más grande fuera de financiero)

- `espacioService`: CRUD completo + `listTipos()`, `getEstado(id)`, `getHorario(id)`, `cambiarEstado(id, estado)` (PUT `/espacios/{id}/estado/`), `cambiarApertura(id, bool)` / `abrirSalon` / `cerrarSalon` (POST `/espacios/{id}/abrir|cerrar/`).
- `espacioPermitidoService`: CRUD de asignación espacio↔usuario supervisor, `listByUsuario(usuario_id)`.
- `espacioHorariosService`: endpoints "bulk" para pantallas públicas/supervisor con horarios embebidos: `getAllWithHorarios`, `getAllDisponiblesWithHorarios` (ambos `requiresAuth: false`), `getSupervisorHorarios(usuarioId)`, `getSupervisorDisponiblesHorarios(usuarioId)`.
- `aperturaCierreService.getProximos()`: GET `/espacios/apertura-cierre/proximos/?user_id=`.
- Alias: `export const espaciosAPI = espacioService`.

## `services/horarios/horariosAPI.ts` (482 líneas)

- `horarioService`: CRUD sobre `/horarios/`, más:
  - `createConFlujoSolicitud` (alias de `create` — el backend decide internamente si crea el horario directo o como solicitud pendiente, según el rol del usuario).
  - `listExtendidos({ includePending?, estado? })`: GET `/horarios/list/extendidos/` con query `estado_horario` o `include_pending=1`.
  - `miHorario(usuarioId)` / `miHorarioEstudiante(usuarioId)`: GET `/horarios/mi-horario/` y `/horarios/mi-horario-estudiante/`.
  - Exportaciones: `exportarPdfPrograma/Docente`, `exportarExcelPrograma/Docente` (POST con `{ horarios }` en el body, retorna Blob), `exportarPdfUsuario/exportarExcelUsuario` (GET con query `usuario_id`).
  - `horariosPorPeriodo(periodoId, estado?)`: GET `/horarios/por-periodo/?periodo_id=&estado=` (con `suppressErrorLog: true`, porque frecuentemente no hay horarios para el período consultado).
- `horarioFusionadoService`: CRUD sobre `/horarios-fusionados/`. Los "horarios fusionados" son grupos combinados que comparten espacio/horario — se crean automáticamente en el backend vía señal cuando se crea un `Horario` con múltiples grupos.

## `services/horarios/asignacionEspaciosService.ts`

`asignacionEspaciosService`: `getHorariosSinEspacio(filters)` (GET `/horarios/sin-espacio/` con 9 filtros posibles en query), `getEspaciosDisponiblesPorHorario(params)` (GET `/espacios/disponibles/por-horario/`), `asignarEspacioHorario(payload)` / `actualizarEspacioHorario` (alias, POST `/horarios/asignar-espacio/`).

## `services/horarios/solicitudEspacioAPI.ts`

`solicitudEspacioService`: `list(estado?)` / `listPendientes()` (filtran en cliente sobre GET `/solicitudes-espacio/` — no hay filtro server-side por estado), `aprobar(payload)` (POST `/solicitudes-espacio/aprobar/`), `rechazar(payload)`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_FINANCIERO.md

# Services: Financiero (`frontend/src/services/financiero/`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md) y [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

El módulo con más archivos y con la arquitectura más consistente del frontend: 11 servicios de dominio + una base compartida.

## Base compartida

- `financiero/core/shared.ts` (13 líneas): define `API_BASE = '/financiero'` y `buildQueryString(params)`, helper genérico de query string usado por todos los servicios financieros.
- `financiero/core/index.ts`: solo re-exporta `shared.ts`.
- `financiero/index.ts`: barrel que reexporta los 11 servicios de dominio.

Confirmación: el service financiero refleja la enorme complejidad del backend — es, con diferencia, el dominio con más acciones de negocio (transiciones de estado) expuestas como funciones dedicadas, no solo CRUD genérico.

## `financiero/facturas/facturasAPI.ts` (183 líneas) — el service más grande y complejo del frontend

`facturasService` expone ~25 funciones, reflejando el flujo de aprobación de facturas paso a paso:

- **CRUD base**: `getAll(params)` (paginado con filtros arbitrarios vía `buildQueryString`), `getById`, `create`, `update` (PATCH).
- **Transiciones de flujo** (cada una un POST a una acción del ViewSet DRF, patrón `/{id}/{accion}/`): `radicar`, `causar` (soporta `FormData` si adjunta `soporte_causacion: File`), `alistar`, `enviarDireccionFinanciera`, `cargarDireccionFinanciera`, `enviarRectoria`, `autorizarRectoria`, `rechazarRectoria` (requiere `motivo`), `generarNumeroConfirmacion`, `confirmarControlPago`, `registrarPagoAplicado` (FormData con comprobante bancario), `generarComprobante`, `detenerEnTesoreria`, `aprobarAuditoria`, `rechazarAuditoria`, `rechazar` (genérico, con `destino: 'funcionario'|'radicacion'|'proveedor'` — permite devolver la factura a distintas etapas), `completarRegistro` (PATCH), `corregir` (PATCH tras devolución).
- **Consultas especializadas**: `getByEstado(estado)`, `getPendientes()`, `getEstadisticas()`, `getSeguimiento(id)`, `getNumeroSugerido()` (autogenera consecutivo).
- **Descargas**: `descargarComprobantePdf(id)` → Blob, `getDocumentosConsolidados(id, opts)` → Blob (con query `scope`/`descargar`/`doc_id`), `getDocumentosHistorialZip(id, opts)` → Blob ZIP.

Los nombres de los métodos confirman el ciclo de vida de una factura (coincide con lo observado en `useContabilidadMisPendientes.ts`): **Recepción y Registro → Radicación → Causación → Cargue Formal → Autorización Rectoría → Control Previo → Alistamiento → Control de Pago Bancario → Tesorería (ajustes internos) → Envío a Dirección Financiera → Corrección Dirección Financiera → Pago Aplicado**. Ver el flujo de ~18 estados documentado en [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md).

## `financiero/proveedores/proveedoresAPI.ts`

`proveedoresService`: `getAll`, `getById`, `create`, `update`, `delete`, `getMiPerfil(nit?)` (perfil del proveedor autenticado), `getMisFacturas(proveedorId, params?)` (filtra facturas por proveedor), `crearConUsuario(data)` (POST `/financiero/proveedores/crear_con_usuario/` — crea usuario + proveedor en una sola transacción, usado por `admin_financiero` al dar de alta un proveedor).

## `financiero/catalogos-proveedores/catalogosProveedoresAPI.ts`

`catalogosProveedoresService`: catálogos geográficos/bancarios de solo lectura para formularios de proveedor: `getPaises`, `getDepartamentos({pais_id?, ciudad_id?})`, `getCiudades({pais_id?, departamento_id?})`, `getBancos`, `getTiposCuenta`.

## `financiero/departamentos/departamentosAPI.ts`

`departamentosService`: `getAll`, `getById`, `getAreasSolicitantes()` (GET `/financiero/departamentos/areas_solicitantes/` — subconjunto de departamentos que pueden generar solicitudes de compra/factura).

## `financiero/cuentas-contables/cuentasContablesAPI.ts` y `financiero/centros-costo/centrosCostoAPI.ts`

Ambos: CRUD simple (`getAll`, `getById`, `create`, `update`, `delete`) — catálogos contables de soporte para la clasificación de facturas (PUC y centros de costo, ver [../documentacion_backend/MODULO_FINANCIERO.md](../documentacion_backend/MODULO_FINANCIERO.md)).

## `financiero/parametros-sla/parametrosSlaAPI.ts`

`parametrosSlaService`: `listar()`, `getResumenProceso()` (calcula en cliente: suma de `dias_maximos` de todas las etapas SLA, si todas aplican días hábiles, y cantidad de etapas). Es el catálogo de tiempos máximos por etapa que alimenta el cálculo de riesgo (`dias_transcurridos`) visto en los hooks de "Mis Pendientes" (ver [HOOKS_FINANCIERO.md](HOOKS_FINANCIERO.md)).

## `financiero/documentos/documentosAPI.ts`

`documentosService`: `getByFactura(facturaId)`, `upload(facturaId, file, tipoDocumento)` (arma `FormData` con metadata: nombre truncado a 100 caracteres, tamaño, tipo MIME), `delete(id)`.

## `financiero/historial/historialAPI.ts`

`historialService`: `getAll(params?)`, `getByFactura(facturaId)` — historial de auditoría/trazabilidad de cambios de estado de una factura (equivalente frontend de `HistorialFactura` en el backend).

## `financiero/comentarios/comentariosAPI.ts`

`comentariosService`: `getByFactura(facturaId)`, `create(facturaId, comentario, tipo)`, `delete(id)` — sistema de comentarios/notas internas sobre una factura.

## `financiero/reportes/reportesAPI.ts` (122 líneas — combina 3 sub-servicios)

- `reportesFinancieroService`: `getDashboardAdmin()` (GET `/financiero/reportes/dashboard_admin/` — retorna `resumen` con KPIs globales, `distribucion_estados`, `alertas` de facturas en riesgo, `actividades` recientes), `exportar(payload)` (POST → Blob, exporta en `Excel|PDF` con filtros de fecha/estado/proveedor), `listarGenerados(params?)`.
- `parametrosSlaAdminService`: variante admin de SLA con `actualizar(id, data)` (PATCH) — a diferencia de `parametrosSlaService` (solo lectura), este permite editar los días máximos por etapa.
- `parametrosFinancieroService`: catálogo de parámetros de configuración general del módulo financiero (`categoria: general|sla|autorizacion|email|sistema|reportes`), con `listar(categoria?)` y `actualizar(id, data)`.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_PRESTAMOS_REPORTE.md

# Services: Préstamos y Reporte

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md) y [HOOKS_REPORTE.md](HOOKS_REPORTE.md).

## `services/prestamos/prestamoAPI.ts`

`prestamoService`: `listarPrestamos({ includeOcurrencias? })`, `listarTodosPrestamosAdmin()`, `listarPrestamosSupervisor()` (GET `/prestamos/supervisor/espacios-prestamos/`), `listarPrestamosPorUsuario(usuarioId)` (filtra en cliente), `obtenerPrestamo(id)`, `crearPrestamo`, `actualizarPrestamo`, `eliminarPrestamo`. Todos sobre `/prestamos/espacios/`.

Maneja lógica de recurrencia compleja (`buildRecurrencePayload`: frecuencia `daily/weekly/monthly/yearly/weekdays`, fin de repetición por fecha/conteo/nunca). Al crear/actualizar/eliminar llama `notifyPrestamosChanged()` de `prestamosChanges.ts`.

## `services/prestamos/prestamosChanges.ts`

No es un cliente API: pub/sub simple. `notifyPrestamosChanged()` limpia el cache `prestamos-espacios-admin`, dispara `CustomEvent('sihul:prestamos-changed')` y escribe un timestamp en `localStorage['sihul_prestamos_changed_at']` para sincronizar entre pestañas vía el evento `storage`.

## `services/prestamos/prestamosPublicAPI.ts` (417 líneas)

`prestamosPublicAPI`: `listarTiposActividad`, `listarEspaciosDisponibles(fecha, horaInicio, horaFin, sede_id?)`, `crearSolicitud`, `listarPrestamosPublicos`, `listarMisSolicitudes(identificacion, correo)` (filtra en cliente por correo+identificación normalizados), `actualizarSolicitud`, `obtenerSolicitud(id)`, `eliminarSolicitud(id)`. Base `/prestamos/publicos/` y `/prestamos/public/...`. Mismo manejo de recurrencia que `prestamoAPI.ts`. Es el servicio consumido por el flujo público de reserva de espacios (sin login).

## `services/prestamos/tipoActividadAPI.ts`

`tipoActividadService`: `listarTiposActividad`, `crearTipoActividad` sobre `/prestamos/tipos-actividad/`.

## `services/reporte/` (4 archivos, todos clases con instancia singleton exportada — patrón distinto al resto, que usa objetos literales)

- `capacidadAPI.ts` → `capacidadService.getCapacidad(semanaOffset, estadoHorario)`: GET `/espacios/reporte/capacidad/`.
- `disponibilidadAPI.ts` → `disponibilidadService.getDisponibilidad(semanaOffset, estadoHorario)`: GET `/espacios/reporte/disponibilidad/`.
- `ocupacionSemanalAPI.ts` → `ocupacionSemanalService`: `getOcupacionSemanal(tipoEspacioId?, semanaOffset)` (GET `/espacios/ocupacion/semanal/`), `getTiposEspacio()`, `generarPDFOcupacion(...)` (usa `trackedFetch` crudo, no `apiClient`, porque maneja el blob de descarga manualmente con un enlace `<a>` + `URL.createObjectURL`).
- `reporteOcupacionAPI.ts` → `reporteOcupacionService.getOcupacionReporte(semanaOffset, estadoHorario)`: GET `/espacios/reporte/ocupacion/`.

Todos aceptan `estado_horario: 'aprobado'|'pendiente'|'todos'` como filtro — patrón consistente en todo el módulo de reportes/ocupación.

## `services/publicServices.ts`

`publicServices`: `verifyRecaptcha(token)` (POST `/prestamos/public/recaptcha/`), más 4 stubs (`consultaHorario`, `disponibilidadEspacios`, `prestamo`, `asistenteVirtual`) que **probablemente no reflejan los endpoints reales usados** — los flujos públicos reales de esas 4 áreas usan servicios más específicos (`prestamosPublicAPI`, `espacioHorariosService`, `chatbotAPI`). Verificar vigencia antes de documentar como fuente de verdad.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md

# Services: Usuarios/Auth, Notificaciones y Dashboard

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_PERMISOS_USERS.md](HOOKS_PERMISOS_USERS.md), [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) y [HOOKS_DASHBOARD.md](HOOKS_DASHBOARD.md).

## `services/users/authService.ts` (481 líneas) — el servicio real de usuarios/auth

- `authService`: `getMicrosoftLoginUrl()` (retorna URL absoluta al backend, no pasa por `apiClient`), `login(payload)` (POST `/usuarios/login/`, `requiresAuth: false`), `logout()` (GET `/auth/logout/`), `getAuthenticatedUser(options?)` (GET `/auth/user/`, usado para hidratar sesión vía cookie/OAuth), `changePassword`, `getProfile()` (lee `auth_user` de `localStorage` para resolver el ID), `getSessionAuthState(since?)` (GET `/usuarios/session-auth-state/?since=`, sincroniza rol/componentes si cambiaron desde la última firma conocida — es la optimización que consume `AuthContext` cada 7 segundos, ver [ENRUTAMIENTO_DINAMICO.md](ENRUTAMIENTO_DINAMICO.md)).
- `userService`: `listarUsuarios`, `listarDocentes` (GET `/usuarios/docentes/`), `obtenerUsuario(id)`, `crearUsuario`, `actualizarUsuario`, `eliminarUsuario` sobre `/usuarios/`.
- `rolService`: CRUD sobre `/roles/`.

> Este archivo es el servicio de auth real del proyecto — `services/auth.ts` (la clase `AuthService` legacy) es un vestigio no usado en el flujo real. Ver [SERVICES_LEGACY.md](SERVICES_LEGACY.md).

## `services/users/settingsService.ts`

Puramente local (no llama al backend): gestiona preferencias en `localStorage` (`notificaciones_preferencias`, `sistema_config`, `theme`) — notificaciones, idioma/timezone/formato de fecha-hora, tema claro/oscuro. Expone `getAllSettings`, `saveAllSettings`, `resetToDefaults`, `clearAllSettings`.

## `services/notificaciones/notificacionesAPI.ts`

Funciones sueltas, no un objeto de servicio: `crearNotificacion`, `actualizarNotificacion`, `eliminarNotificacion`, `obtenerNotificacion`, `listarNotificaciones(params?)`, `obtenerMisNotificaciones(params)` (paginado, con filtros de búsqueda/tipo/prioridad/tiempo/categoría), `obtenerMisNotificacionesPaginadas`, `obtenerEstadisticas(id_usuario)`, `marcarComoLeida(id)`, `marcarTodasComoLeidas(id_usuario)`, más helpers: `obtenerNotificacionesNoLeidas`, `contarNotificacionesNoLeidas`, `tieneNotificacionesNoLeidas`, `obtenerNotificacionesRecientes`, `obtenerNotificacionesPorPrioridad`. Todos sobre base `/notificaciones`. También exporta un `default` con todo agrupado. Ver `backend/notificaciones/README.md` para el catálogo completo de tipos de evento en el backend.

## `services/dashboard/dashboardAPI.ts`

No es un cliente API típico — agrega lógica de negocio en el frontend:

- `obtenerEstadisticasOcupacion()`: calcula ocupación semanal por franja horaria a partir de `prestamoService.listarPrestamos()` + `espacioService.list()`, sin endpoint de backend dedicado (todo el cálculo de solapamiento de horarios ocurre en JS).
- `obtenerActividadesRecientes()`: transforma `listarNotificaciones()` en un feed de actividad con colores por tipo.
- `obtenerEstadisticasDashboard()`: combina ambos en paralelo.

## `services/dashboard/supervisorDashboardAPI.ts`

`supervisorDashboardService`: `getMetricas()` (cuenta espacios por estado desde `espacioPermitidoService.listByUsuario`), `getAperturaCierre()` (GET `/espacios/apertura-cierre/proximos/?user_id=`), `getDisponibilidad()`, `getMetricasRecursos()` (itera recursos de cada espacio permitido). Resuelve `userId` leyendo `localStorage['auth_user']`/`['user']` directamente, en vez de recibirlo como parámetro.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_CHATBOT.md

# Services: Chatbot (`frontend/src/services/chatbot/chatbotAPI.ts`)

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_CHATBOT_NOTIFICACIONES.md](HOOKS_CHATBOT_NOTIFICACIONES.md) y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md).

`chatbotAPI` expone:

- `listarAgentes()`: combina en paralelo `/chatbot/agentes/` + `/chatbot/preguntas/` y agrupa las preguntas sugeridas por agente.
- `enviarPregunta(data)`: POST `/chatbot/pregunta/`, guarda historial — requiere `id_usuario` + `nombre_usuario` obligatorios.
- `obtenerHistorial(params)`: GET `/chatbot/historial/`.
- `listarConversaciones(params)`: GET `/chatbot/conversaciones/`.
- Variantes públicas (sin historial persistido por usuario): `listarAgentesPublico()` (GET `/chatbot/public/agentes/`) y `enviarPreguntaPublico(data)` (POST `/chatbot/public/pregunta/`, requiere `seccional`).

## Cómo llega al proxy Django → FastAPI

El frontend **no sabe ni le importa** que exista un servicio FastAPI detrás — solo llama a `/api/chatbot/...` vía `apiClient` (Django). Toda la lógica de decidir si reenviar la petición al servicio RAG externo (FastAPI) vive en el backend Django (app `chatbot`, ver [../documentacion_backend/APPS_DJANGO.md](../documentacion_backend/APPS_DJANGO.md) y [../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md](../documentacion_chatbot/ARQUITECTURA_RAG_CHATBOT.md)).

## Normalización en el frontend

`normalizarAgenteAPI` mapea alias de iconos (ej. `bookopen→BookOpen`, `door_open→DoorOpen`) y aplica un gradiente por defecto (`from-blue-500 via-blue-600 to-indigo-600`) si el backend no envía uno. Separa además las preguntas sugeridas "directas" (embebidas en el agente) de las que vienen de la tabla `PreguntaSugeridaAPI` aparte.

---

<!-- ===================================================== -->
## 📄 documentacion_frontend/services/SERVICES_LEGACY.md

# Services legacy — deuda técnica

Ver también [SERVICES_INDICE.md](SERVICES_INDICE.md), [HOOKS_GESTION_ACADEMICA.md](HOOKS_GESTION_ACADEMICA.md), [HOOKS_HORARIOS.md](HOOKS_HORARIOS.md) y [HOOKS_ESPACIOS.md](HOOKS_ESPACIOS.md).

Estos archivos son código de una fase previa del proyecto, cuando el backend Django real todavía no existía y se simulaba con `localStorage`:

- `services/database.ts` — clase `Database` (`db`), simula el backend completo sobre `localStorage`.
- `services/auth.ts` — clase `AuthService` legacy, no usa `apiClient`. No se detectaron consumidores en los hooks activos revisados; probablemente vestigial (reemplazado por `services/users/authService.ts`, ver [SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md](SERVICES_USERS_NOTIFICACIONES_DASHBOARD.md)).
- `services/complete-data.ts` — datos mock/seed usados por `database.ts`. Sin consumidores activos detectados fuera de la capa legacy.
- `services/cache/cacheService.ts` — sistema de cache pre-`sessionCache`, usado solo por `hooks/cache/useCacheInvalidation.ts` (ver [HOOKS_PATRON_CACHE.md](HOOKS_PATRON_CACHE.md)).
- `services/dashboard.data.ts` — mock estático de labels/iconos por defecto; **este sí sigue en uso activo** como valores por defecto en `hooks/dashboard/useDashboardHome.ts`, sobreescritos cuando llegan los datos reales.

## Páginas activas que todavía dependen de `db` (parcial o totalmente)

Estas páginas están en producción pero su hook asociado consulta datos simulados en `localStorage` en vez del backend real:

| Página | Hook | Detalle |
|---|---|---|
| `pages/gestionAcademica/HorariosAcademicos.tsx` | `hooks/gestionAcademica/useHorariosAcademicos.ts` | Totalmente sobre `db`. |
| `pages/gestionAcademica/AsignacionAutomatica.tsx` | `hooks/gestionAcademica/useAsignacionAutomatica.ts` | Algoritmo de asignación automática completo corre en cliente y persiste en `db`. |
| `pages/horarios/VisualizacionHorarios.tsx` | `hooks/horarios/useVisualizacionHorarios.ts` | Lee `db` + `localStorage.getItem('horariosCompletos')` directamente. |
| `pages/espacios/SupervisorSalonHome.tsx` | `hooks/espacios/useSupervisorSalonHome.ts` | Mezcla `db` con servicios reales (`espacioService`, `espacioRecursoService`). |

**Recomendación**: tratar estas 4 páginas como pendientes de migración a backend real antes de asumir que su comportamiento es representativo del resto del sistema. Cualquier bug reportado en ellas debería primero descartar si la causa es el uso de datos mock desincronizados del backend.

`services/database.ts` (`db`) también es importado por `hooks/dashboard/useDashboardHome.ts`, `hooks/dashboard/useSupervisorDashboard.ts`, `hooks/prestamos/usePlazasDisponibles.ts` y `context/UserContext.tsx` — verificar en cada caso si el import está realmente en uso o es residual antes de asumir dependencia funcional.

---
