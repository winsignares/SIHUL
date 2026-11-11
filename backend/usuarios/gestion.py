"""Gestión de Usuarios para quien no es administrador.

El permiso del componente «Gestión de Usuarios» da alcance sobre las personas de la propia seccional:
- VER: consultar la lista.
- EDITAR: además crear, editar y eliminar personas, sin roles de administración (admin, admin_global, Admin
  Financiero) ni superusuarios, y sin tocar las cuentas que ya los tienen. En su propio registro solo cambia nombre,
  correo y contraseña, y no puede eliminarse.

Los administradores (superusuario, admin_global, admin y Admin Financiero) siguen sus propias reglas.
"""
import unicodedata

from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from mysite.auth_helpers import get_componente_permiso, is_superuser_effective

COMPONENTE = 'Gestión de Usuarios'
ROLES_DE_ADMINISTRACION = frozenset({'admin', 'admin global', 'admin financiero'})
CAMPOS_DEL_PROPIO_REGISTRO = frozenset({'nombre', 'correo', 'contrasena'})

MSG_ROL_DE_ADMINISTRACION = 'No puedes asignar roles de administración.'
MSG_SUPERUSUARIO = 'No puedes crear superusuarios.'
MSG_CUENTA_DE_ADMINISTRACION = 'No puedes modificar cuentas de administración.'
MSG_PROPIO_REGISTRO = 'En tu propio registro solo puedes cambiar el nombre, el correo y la contraseña.'
MSG_ELIMINARSE = 'No puedes eliminar tu propia cuenta.'


def normalizar_rol(nombre):
    """'Admin_Financiero', 'admin financiero' y 'Admin Financiéro' se comparan igual."""
    texto = unicodedata.normalize('NFD', (nombre or '').strip().lower())
    texto = ''.join(ch for ch in texto if unicodedata.category(ch) != 'Mn').replace('_', ' ')
    return ' '.join(texto.split())


def es_rol_de_administracion(rol):
    return rol is not None and normalizar_rol(getattr(rol, 'nombre', '')) in ROLES_DE_ADMINISTRACION


def es_cuenta_de_administracion(usuario):
    return bool(usuario) and (is_superuser_effective(usuario) or es_rol_de_administracion(getattr(usuario, 'rol', None)))


def permiso_de_gestion(usuario):
    """'VER' o 'EDITAR' si `usuario` no es administrador y tiene el componente; None en otro caso."""
    if not usuario or es_cuenta_de_administracion(usuario):
        return None
    return get_componente_permiso(usuario, COMPONENTE)


def exigir_que_pueda_modificar(gestor, objetivo, eliminar=False):
    """Para quien gestiona sin ser administrador: no toca cuentas de administración ni elimina la suya."""
    if es_cuenta_de_administracion(objetivo):
        raise PermissionDenied(MSG_CUENTA_DE_ADMINISTRACION)
    if eliminar and getattr(objetivo, 'pk', None) == getattr(gestor, 'pk', None):
        raise PermissionDenied(MSG_ELIMINARSE)


def _ids_actuales(usuario, campo):
    if campo == 'tipos_espacio_permitidos':
        return sorted(usuario.tipos_espacio_permitidos.values_list('id', flat=True))
    from espacios.models import EspacioPermitido
    return sorted(EspacioPermitido.objects.filter(usuario=usuario).values_list('espacio_id', flat=True))


def _cambia(usuario, campo, valor):
    if campo in ('tipos_espacio_permitidos', 'espacios_permitidos'):
        return sorted(set(valor or [])) != _ids_actuales(usuario, campo)
    actual = getattr(usuario, campo, None)
    return actual != valor


def validar_datos(gestor, instancia, attrs):
    """Datos que puede enviar quien gestiona sin ser administrador (ValidationError si no)."""
    if 'rol' in attrs and es_rol_de_administracion(attrs['rol']):
        raise serializers.ValidationError({'rol': MSG_ROL_DE_ADMINISTRACION})
    if attrs.get('es_superusuario'):
        raise serializers.ValidationError({'es_superusuario': MSG_SUPERUSUARIO})
    if instancia is not None and instancia.pk == getattr(gestor, 'pk', None):
        cambios = [c for c, v in attrs.items() if c not in CAMPOS_DEL_PROPIO_REGISTRO and _cambia(instancia, c, v)]
        if cambios:
            raise serializers.ValidationError({cambios[0]: MSG_PROPIO_REGISTRO})
