"""Quién puede usar el módulo financiero.

El módulo financiero es un sistema aparte del académico: solo lo usan los roles financieros (y los proveedores) o quien
tenga un componente financiero asignado, igual que decide el frontend para mostrar sus pantallas. Un estudiante, un
docente o cualquier otro rol que solo esté autenticado no debe poder leer ni modificar facturas.
"""
import unicodedata

from rest_framework.permissions import BasePermission

from mysite.auth_helpers import (
    construir_componentes, is_admin_global, is_admin_sistema, is_authenticated_user, is_superuser_effective,
)

# Mismo criterio que `normalizeFinancialRole` del frontend (frontend/src/context/financialRoleUtils.ts)
_PALABRAS_DE_ROL_FINANCIERO = (
    'admin financiero', 'administrador financiero', 'rector', 'direccion financiera', 'sindicatura',
    'tesoreria', 'auditor', 'contabilidad', 'funcionario', 'proveedor',
)

# Componentes que marcan a una persona como parte del módulo financiero (como `AppRouter.tsx` en el frontend)
_PALABRAS_DE_COMPONENTE_FINANCIERO = (
    'factur', 'financier', 'pendient', 'tesorer', 'alistar pago', 'registrar pago', 'pago aplicado', 'comprobante egreso',
    'direccion financiera', 'sindicatura', 'revisar pagos', 'confirmacion pagos', 'control de pago', 'enviar rectoria',
    'enviar a rectoria', 'auditor', 'control previo', 'rector', 'autorizar pago', 'aprobacion rectoria',
    'gestion proveedores', 'parametrizacion sla', 'reportes consolidados', 'configuracion sistema',
)


def _normalizar(texto):
    sin_tildes = ''.join(c for c in unicodedata.normalize('NFD', texto or '') if unicodedata.category(c) != 'Mn')
    return ' '.join(''.join(c if c.isalnum() else ' ' for c in sin_tildes.lower().replace('_', ' ').replace('-', ' ')).split())


def es_componente_financiero(nombre):
    """True si el componente pertenece al módulo financiero (da acceso a facturas, pagos, proveedores…)."""
    nombre = _normalizar(nombre)
    return any(palabra in nombre for palabra in _PALABRAS_DE_COMPONENTE_FINANCIERO)


def es_rol_financiero(nombre):
    """True si el rol es de los del módulo financiero (incluye al administrador financiero)."""
    nombre = _normalizar(nombre)
    return any(palabra in nombre for palabra in _PALABRAS_DE_ROL_FINANCIERO)


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
_ROLES_GESTIONABLES_NORMALIZADOS = {_normalizar(nombre) for nombre in ROLES_FINANCIEROS_GESTIONABLES}


def es_solo_admin_financiero(usuario):
    """True si el usuario es administrador financiero y NO es administrador general ni de una seccional.
    Su alcance es el equipo financiero (usuarios con roles financieros, SLA y proveedores): no administra
    usuarios académicos, ni roles, ni el catálogo de componentes."""
    if not is_authenticated_user(usuario):
        return False
    if is_admin_global(usuario) or is_admin_sistema(usuario):
        return False
    return _normalizar(getattr(getattr(usuario, 'rol', None), 'nombre', '')) == 'admin financiero'


def es_rol_gestionable_por_admin_financiero(rol):
    """True si `rol` es uno de los roles financieros que el administrador financiero puede asignar."""
    return rol is not None and _normalizar(getattr(rol, 'nombre', '')) in _ROLES_GESTIONABLES_NORMALIZADOS


def es_usuario_financiero(usuario):
    """True si el usuario pertenece al módulo financiero por su rol o por sus componentes."""
    if not is_authenticated_user(usuario):
        return False
    if is_superuser_effective(usuario):
        return True

    rol = _normalizar(getattr(getattr(usuario, 'rol', None), 'nombre', ''))
    if any(palabra in rol for palabra in _PALABRAS_DE_ROL_FINANCIERO):
        return True

    return any(
        palabra in _normalizar(componente['nombre'])
        for componente in construir_componentes(usuario)
        for palabra in _PALABRAS_DE_COMPONENTE_FINANCIERO
    )


class EsUsuarioFinanciero(BasePermission):
    """Solo personas del módulo financiero. La decisión se guarda en la petición para no repetir consultas."""

    message = 'No tienes acceso al módulo financiero.'

    def has_permission(self, request, view):
        decision = getattr(request, '_es_usuario_financiero', None)
        if decision is None:
            decision = es_usuario_financiero(getattr(request, 'user', None))
            request._es_usuario_financiero = decision
        return decision
