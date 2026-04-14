from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from usuarios.models import Usuario


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """Adapta datos de Microsoft al modelo Usuario del proyecto."""

    def pre_social_login(self, request, sociallogin):
        if sociallogin.is_existing:
            return

        email = sociallogin.account.extra_data.get('mail') or sociallogin.account.extra_data.get('userPrincipalName')
        if not email:
            return

        try:
            existing_user = Usuario.objects.get(correo__iexact=email)
        except Usuario.DoesNotExist:
            return

        sociallogin.connect(request, existing_user)

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        email = data.get('email') or sociallogin.account.extra_data.get('mail') or sociallogin.account.extra_data.get('userPrincipalName')
        display_name = (
            data.get('name')
            or sociallogin.account.extra_data.get('displayName')
            or (email.split('@')[0] if email else 'Usuario Microsoft')
        )

        user.correo = email or user.correo
        user.email = email or ''
        user.nombre = display_name[:100]
        user.activo = True
        user.contrasena_hash = user.contrasena_hash or ''

        if not user.password:
            user.set_unusable_password()

        return user
