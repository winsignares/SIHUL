"""Quién puede usar el módulo financiero.

El módulo financiero es un sistema aparte del académico: solo lo usan los roles financieros (y los proveedores) o quien
tenga un componente financiero asignado, igual que decide el frontend para mostrar sus pantallas. Un estudiante, un
docente o cualquier otro rol que solo esté autenticado no debe poder leer ni modificar facturas.
"""
from rest_framework.permissions import BasePermission

from nucleo.auth_helpers import (
    construir_componentes, is_admin_global, is_admin_sistema, is_authenticated_user, is_superuser_effective,
)
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


# Quién puede ejecutar cada paso del flujo de la factura. Un paso que no está aquí no tiene restricción de rol.
_TODOS_LOS_INTERNOS = ('funcionario', 'contabilidad', 'tesoreria', 'auditoria', 'direccion financiera', 'rectoria')
ROLES_POR_PASO = {
    'radicar': ('contabilidad',),
    'causar': ('contabilidad',),
    'alistar': ('tesoreria',),
    'enviar_direccion_financiera': ('tesoreria',),
    'detener_en_tesoreria': ('tesoreria',),
    'registrar_pago_aplicado': ('tesoreria',),
    'generar_comprobante': ('tesoreria',),
    'aprobar_auditoria': ('auditoria',),
    'rechazar_auditoria': ('auditoria',),
    'cargar_direccion_financiera': ('direccion financiera',),
    'enviar_rectoria': ('direccion financiera',),
    'generar_numero_confirmacion': ('direccion financiera',),
    'confirmar_control_pago': ('direccion financiera',),
    'autorizar_rectoria': ('rectoria',),
    'rechazar_rectoria': ('rectoria',),
    'rechazar': _TODOS_LOS_INTERNOS,
}


def puede_ejecutar_paso(usuario, paso):
    """True si el rol del usuario puede ejecutar ese paso. La administración (general, del sistema y financiera)
    puede todos."""
    roles = ROLES_POR_PASO.get(paso)
    if roles is None:
        return True
    if is_admin_global(usuario) or is_admin_sistema(usuario) or is_superuser_effective(usuario):
        return True
    rol = normalizar(getattr(getattr(usuario, 'rol', None), 'nombre', ''))
    return rol == 'admin financiero' or rol in roles


class RolDelPasoDeFactura(BasePermission):
    """Cada paso del flujo lo ejecuta solo el rol que le corresponde."""

    message = 'Tu rol no puede ejecutar este paso del flujo de la factura.'

    def has_permission(self, request, view):
        return puede_ejecutar_paso(getattr(request, 'user', None), getattr(view, 'action', None))
