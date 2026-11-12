"""Qué roles y componentes pertenecen al módulo financiero.

Son reglas puras sobre nombres de roles y componentes. Viven en la plataforma (y no en `financiero`) porque
la gestión de usuarios y de componentes necesita saber qué es «financiero» sin depender de ese módulo.
"""
import unicodedata

from mysite.auth_helpers import is_admin_global, is_admin_sistema, is_authenticated_user

# Mismo criterio que `normalizeFinancialRole` del frontend (frontend/src/context/financialRoleUtils.ts)
PALABRAS_DE_ROL_FINANCIERO = (
    'admin financiero', 'administrador financiero', 'rector', 'direccion financiera', 'sindicatura',
    'tesoreria', 'auditor', 'contabilidad', 'funcionario', 'proveedor',
)

# Componentes que marcan a una persona como parte del módulo financiero (como `AppRouter.tsx` en el frontend)
PALABRAS_DE_COMPONENTE_FINANCIERO = (
    'factur', 'financier', 'pendient', 'tesorer', 'alistar pago', 'registrar pago', 'pago aplicado', 'comprobante egreso',
    'direccion financiera', 'sindicatura', 'revisar pagos', 'confirmacion pagos', 'control de pago', 'enviar rectoria',
    'enviar a rectoria', 'auditor', 'control previo', 'rector', 'autorizar pago', 'aprobacion rectoria',
    'gestion proveedores', 'parametrizacion sla', 'reportes consolidados', 'configuracion sistema',
)


def normalizar(texto):
    sin_tildes = ''.join(c for c in unicodedata.normalize('NFD', texto or '') if unicodedata.category(c) != 'Mn')
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in sin_tildes.lower().replace('_', ' ').replace('-', ' ')).split())


def es_componente_financiero(nombre):
    """True si el componente pertenece al módulo financiero (da acceso a facturas, pagos, proveedores…)."""
    nombre = normalizar(nombre)
    return any(palabra in nombre for palabra in PALABRAS_DE_COMPONENTE_FINANCIERO)


def es_rol_financiero(nombre):
    """True si el rol es de los del módulo financiero (incluye al administrador financiero)."""
    nombre = normalizar(nombre)
    return any(palabra in nombre for palabra in PALABRAS_DE_ROL_FINANCIERO)


# Roles de las personas que el administrador financiero puede crear, editar y eliminar (y solo esas).
ROLES_FINANCIEROS_GESTIONABLES = (
    'Funcionario',
    'Contabilidad',
    'Tesorería',
    'Auditoría',
    'Dirección Financiera',
    'Rectoría',
    'Admin Financiero',
)
_ROLES_GESTIONABLES_NORMALIZADOS = {normalizar(nombre) for nombre in ROLES_FINANCIEROS_GESTIONABLES}


def es_solo_admin_financiero(usuario):
    """True si el usuario es administrador financiero y NO es administrador general ni de una seccional.
    Su alcance es el equipo financiero (usuarios con roles financieros, SLA y proveedores): no administra
    usuarios académicos, ni roles, ni el catálogo de componentes."""
    if not is_authenticated_user(usuario):
        return False
    if is_admin_global(usuario) or is_admin_sistema(usuario):
        return False
    return normalizar(getattr(getattr(usuario, 'rol', None), 'nombre', '')) == 'admin financiero'


def es_rol_gestionable_por_admin_financiero(rol):
    """True si `rol` es uno de los roles financieros que el administrador financiero puede asignar."""
    return rol is not None and normalizar(getattr(rol, 'nombre', '')) in _ROLES_GESTIONABLES_NORMALIZADOS
