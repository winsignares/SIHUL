"""Quién puede usar el módulo financiero.

El módulo financiero es un sistema aparte del académico: solo lo usan los roles financieros (y los proveedores) o quien
tenga un componente financiero asignado, igual que decide el frontend para mostrar sus pantallas. Un estudiante, un
docente o cualquier otro rol que solo esté autenticado no debe poder leer ni modificar facturas.
"""
from rest_framework.permissions import BasePermission

from nucleo.auth_helpers import construir_componentes, is_authenticated_user, is_superuser_effective
from nucleo.roles_financieros import PALABRAS_DE_COMPONENTE_FINANCIERO, PALABRAS_DE_ROL_FINANCIERO, normalizar

def es_usuario_financiero(usuario):
    """True si el usuario pertenece al módulo financiero por su rol o por sus componentes."""
    if not is_authenticated_user(usuario):
        return False
    if is_superuser_effective(usuario):
        return True

    rol = normalizar(getattr(getattr(usuario, 'rol', None), 'nombre', ''))
    if any(palabra in rol for palabra in PALABRAS_DE_ROL_FINANCIERO):
        return True

    return any(
        palabra in normalizar(componente['nombre'])
        for componente in construir_componentes(usuario)
        for palabra in PALABRAS_DE_COMPONENTE_FINANCIERO
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
