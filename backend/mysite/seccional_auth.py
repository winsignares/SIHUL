from __future__ import annotations

from typing import Any

from django.contrib.auth.models import AnonymousUser
from django.db.models import Q
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .auth_helpers import is_admin_global


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

        if is_admin_global(user):
            return queryset

        seccional = self.get_user_seccional()
        lookup = getattr(self, 'seccional_lookup', None)
        if not lookup:
            return queryset

        if seccional is not None:
            return queryset.filter(**{lookup: seccional})

        # Compatibilidad con datos legacy: si no hay seccional asignada,
        # filtrar por ciudad de la sede del usuario (comportamiento previo).
        sede = getattr(user, 'sede', None)
        ciudad = getattr(sede, 'ciudad', None)
        if not ciudad:
            return queryset.none()

        if lookup == 'seccional':
            model_fields = {field.name for field in queryset.model._meta.fields}

            query = Q()
            if 'seccional' in model_fields:
                query |= Q(seccional__ciudad=ciudad)
            if 'sede' in model_fields:
                query |= Q(sede__ciudad=ciudad)
            if 'ciudad' in model_fields:
                query |= Q(ciudad=ciudad)

            if query:
                return queryset.filter(query)
            return queryset.none()

        if lookup.endswith('__seccional'):
            city_lookup = f"{lookup[:-len('__seccional')]}__ciudad"
            return queryset.filter(**{city_lookup: ciudad})

        return queryset.none()

    def get_create_defaults(self, serializer):
        user = self.get_current_user()
        if not user:
            return {}

        defaults = {}
        model = getattr(getattr(serializer, 'Meta', None), 'model', None)
        model_fields = {field.name for field in model._meta.fields} if model is not None else set()

        seccional = self.get_user_seccional()
        if seccional is not None and 'seccional' in model_fields:
            defaults['seccional'] = seccional

        sede = getattr(user, 'sede', None)
        if sede is not None and 'sede' in model_fields:
            defaults['sede'] = sede

        return defaults

    def perform_create(self, serializer):
        defaults = self.get_create_defaults(serializer)
        serializer.save(**defaults)
