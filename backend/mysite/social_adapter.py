from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.core.exceptions import ValidationError
import unicodedata

from usuarios.models import Rol, Usuario


def _microsoft_email(sociallogin, data=None):
    data = data or {}
    extra_data = sociallogin.account.extra_data or {}
    return (
        data.get('email')
        or extra_data.get('mail')
        or extra_data.get('userPrincipalName')
        or extra_data.get('preferred_username')
        or extra_data.get('upn')
        or extra_data.get('email')
    )


def _microsoft_display_name(sociallogin, data=None):
    data = data or {}
    extra_data = sociallogin.account.extra_data or {}
    email = _microsoft_email(sociallogin, data)
    return (
        data.get('name')
        or extra_data.get('displayName')
        or extra_data.get('name')
        or (email.split('@')[0] if email else 'Usuario Microsoft')
    )


def _rol_por_correo(email):
    local_part = (email or '').split('@', 1)[0].strip()
    if '-' in local_part:
        role_name = 'estudiante'
    elif '.' in local_part:
        role_name = 'docente'
    else:
        role_name = 'estudiante'

    rol = Rol.objects.filter(nombre__iexact=role_name).first()
    if rol:
        return rol

    return Rol.objects.create(nombre=role_name, descripcion=f'Rol {role_name}')


def _normalizar_nombre(nombre):
    texto = str(nombre or '').strip().upper()
    texto = ''.join(
        char for char in unicodedata.normalize('NFD', texto)
        if unicodedata.category(char) != 'Mn'
    )
    return ' '.join(texto.split())


def _buscar_usuario_por_nombre_normalizado(nombre):
    nombre_normalizado = _normalizar_nombre(nombre)
    if not nombre_normalizado:
        return None

    usuarios = Usuario.objects.exclude(nombre__isnull=True).exclude(nombre='')
    for usuario in usuarios.order_by('id'):
        if _normalizar_nombre(usuario.nombre) == nombre_normalizado:
            return usuario

    return None


def _actualizar_correo_usuario(usuario, email):
    if not email or usuario.correo.lower() == email.lower():
        return
    if Usuario.objects.filter(correo__iexact=email).exclude(id=usuario.id).exists():
        return

    usuario.correo = email
    usuario.email = email
    usuario.save(update_fields=['correo', 'email'])


def _actualizar_nombre_usuario(usuario, nombre):
    nombre = str(nombre or '').strip()
    if not nombre or usuario.nombre == nombre:
        return

    usuario.nombre = nombre[:100]
    usuario.save(update_fields=['nombre'])


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Adapta datos de Microsoft al modelo Usuario del proyecto."""

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        email = _microsoft_email(sociallogin)
        display_name = _microsoft_display_name(sociallogin)
        if not email and not display_name:
            return

        existing_user = None
        if email:
            existing_user = Usuario.objects.filter(correo__iexact=email).first()
        if existing_user is None:
            existing_user = _buscar_usuario_por_nombre_normalizado(display_name)

        if existing_user is None:
            return

        _actualizar_nombre_usuario(existing_user, display_name)
        if email:
            _actualizar_correo_usuario(existing_user, email)

        sociallogin.connect(request, existing_user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        email = _microsoft_email(sociallogin, data)
        display_name = _microsoft_display_name(sociallogin, data)
        if not email:
            raise ValidationError('Microsoft no entregó un correo institucional para autenticar el usuario.')

        user.correo = email
        user.email = email
        user.nombre = display_name[:100]
        user.activo = True
        user.contrasena_hash = user.contrasena_hash or ''
        if email and not user.rol_id:
            user.rol = _rol_por_correo(email)

        if not user.password:
            user.set_unusable_password()

        return user

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form)
        email = _microsoft_email(sociallogin)
        if not email:
            raise ValidationError('Microsoft no entregó un correo institucional para autenticar el usuario.')

        changed_fields = []
        if email and not user.rol_id:
            user.rol = _rol_por_correo(email)
            changed_fields.append('rol')

        if not user.activo:
            user.activo = True
            changed_fields.append('activo')
            changed_fields.append('is_active')

        if not user.contrasena_hash:
            user.contrasena_hash = user.password or ''
            changed_fields.append('contrasena_hash')

        if changed_fields:
            user.save(update_fields=changed_fields)

        return user
