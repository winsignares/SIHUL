"""Filtros por rol compartidos por las vistas de notificaciones."""
from django.db.models import Q
from mysite.auth_helpers import is_admin_global


TIPOS_IRRELEVANTES_NO_ADMIN = [
    'usuario_creado',
    'usuario_actualizado',
    'usuario_eliminado',
    'rol_creado',
    'rol_actualizado',
    'rol_eliminado',
    'facultad_creada',
    'facultad_actualizada',
    'facultad_eliminada',
    'componente_creado',
    'componente_actualizado',
    'componente_eliminado',
    'componente_rol_asignado',
    'componente_rol_actualizado',
    'componente_rol_eliminado',
]


def _resolve_target_user_id(user, requested_user_id):
    if not user or not getattr(user, 'is_authenticated', False):
        return requested_user_id

    if is_admin_global(user):
        return requested_user_id or user.id

    return user.id


def _filter_relevantes_por_rol(queryset, user):
    if not user or not getattr(user, 'is_authenticated', False):
        return queryset

    if is_admin_global(user):
        return queryset

    rol_nombre = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()

    if rol_nombre == 'proveedor':
        tipos_permitidos_proveedor = [
            'factura_etapa_actualizada',
            'factura_devuelta',
            'cuenta_creada',
            'cambio_contrasena',
            'cambio_nombre',
            'alerta',
            'advertencia',
            'error',
            'sistema',
        ]
        filtro_proveedor = Q()
        for tipo in tipos_permitidos_proveedor:
            filtro_proveedor |= Q(tipo_notificacion__iexact=tipo)
        return queryset.filter(filtro_proveedor)

    if rol_nombre in {'admin', 'admin financiero'}:
        return queryset

    filtros_admin = Q()
    for tipo in TIPOS_IRRELEVANTES_NO_ADMIN:
        filtros_admin |= Q(tipo_notificacion__iexact=tipo)

    return queryset.exclude(filtros_admin)
