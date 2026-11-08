"""Quién puede usar el módulo financiero.

El módulo financiero es un sistema aparte del académico: solo lo usan los roles financieros (y los proveedores) o quien
tenga un componente financiero asignado, igual que decide el frontend para mostrar sus pantallas. Un estudiante, un
docente o cualquier otro rol que solo esté autenticado no debe poder leer ni modificar facturas.
"""
import unicodedata

from rest_framework.permissions import BasePermission

from mysite.auth_helpers import construir_componentes, is_authenticated_user, is_superuser_effective

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
