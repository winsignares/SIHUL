from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.exceptions import ValidationError as DRFValidationError

from .auth_helpers import is_superuser_effective


class SessionUsuarioAuthentication(BaseAuthentication):
    """Autenticación ligera basada en la sesión existente del proyecto.

    Permite que DRF resuelva request.user con el modelo Usuario propio del sistema
    sin migrar todo el backend al auth nativo de Django.
    """

    def authenticate(self, request: Any):
        user_id = request.session.get('user_id')
        if not user_id:
            return None

        from usuarios.models import Usuario

        try:
            usuario = Usuario.objects.select_related('sede', 'seccional').get(id=user_id, activo=True)
        except Usuario.DoesNotExist as exc:
            raise AuthenticationFailed('Usuario de sesión no válido.') from exc

        return (usuario, None)


class SeccionalMixin:
    """Filtra los querysets por la seccional del usuario autenticado.

    - Superuser: retorna todo.
    - Usuario normal: filtra por el campo configurado en `seccional_lookup`.
    """

    seccional_lookup = 'sede__seccional'

    def get_current_user(self):
        user = getattr(self.request, 'user', None)
        if user and not isinstance(user, AnonymousUser) and getattr(user, 'is_authenticated', False):
            return user
        return getattr(self.request, 'user_obj', None)

    def get_user_seccional(self):
        user = self.get_current_user()
        if not user:
            return None

        seccional = getattr(user, 'seccional', None)
        if seccional:
            return seccional

        sede = getattr(user, 'sede', None)
        if sede is not None:
            return getattr(sede, 'seccional', None)

        return getattr(self.request, 'seccional', None)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.get_current_user()

        if not user:
            return queryset.none()

        if is_superuser_effective(user):
            return queryset

        seccional = self.get_user_seccional()
        lookup = getattr(self, 'seccional_lookup', None)
        if not lookup:
            return queryset

        if seccional is not None:
            return queryset.filter(**{lookup: seccional})

        return queryset.none()

    def get_create_defaults(self, serializer):
        user = self.get_current_user()
        if not user:
            return {}
        if is_superuser_effective(user):
            return {}

        defaults = {}
        model = getattr(getattr(serializer, 'Meta', None), 'model', None)
        model_fields = {field.name for field in model._meta.fields} if model is not None else set()

        seccional = self.get_user_seccional()
        if seccional is not None and 'seccional' in model_fields:
            defaults['seccional'] = seccional

        sede = getattr(user, 'sede', None)
        request_sede = getattr(serializer, 'validated_data', {}).get('sede')
        if sede is not None and 'sede' in model_fields and request_sede is None:
            defaults['sede'] = sede

        return defaults

    def _normalize_django_validation_error(self, exc: DjangoValidationError):
        if hasattr(exc, 'message_dict') and exc.message_dict:
            return exc.message_dict
        if hasattr(exc, 'messages') and exc.messages:
            if len(exc.messages) == 1:
                return exc.messages[0]
            return exc.messages
        return str(exc)

    def perform_create(self, serializer):
        defaults = self.get_create_defaults(serializer)
        try:
            serializer.save(**defaults)
        except DjangoValidationError as exc:
            raise DRFValidationError(self._normalize_django_validation_error(exc)) from exc

    def perform_update(self, serializer):
        try:
            serializer.save()
        except DjangoValidationError as exc:
            raise DRFValidationError(self._normalize_django_validation_error(exc)) from exc
