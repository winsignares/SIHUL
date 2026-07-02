from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from usuarios.models import Rol, Usuario


def _microsoft_email(sociallogin, data=None):
    data = data or {}
    extra_data = sociallogin.account.extra_data or {}
    return (
        data.get('email')
        or extra_data.get('mail')
        or extra_data.get('userPrincipalName')
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

        if existing_user is None and display_name:
            existing_user = Usuario.objects.filter(nombre__iexact=display_name).first()

        if existing_user is None:
            return

        sociallogin.connect(request, existing_user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        email = _microsoft_email(sociallogin, data)
        display_name = _microsoft_display_name(sociallogin, data)

        user.correo = email or user.correo
        user.email = email or ''
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
