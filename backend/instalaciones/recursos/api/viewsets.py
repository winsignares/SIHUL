from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from instalaciones.recursos.models import EspacioRecurso, Recurso
from instalaciones.recursos.serializers import EspacioRecursoSerializer, RecursoSerializer

from mysite.auth_helpers import (
    user_supervisa_espacios,
)
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class RecursoViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    seccional_lookup = None
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        # El portal público solo necesita el catálogo para filtrar espacios.
        # La creación, edición, eliminación y consulta individual permanecen
        # restringidas a usuarios autenticados.
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Recurso.objects.all().order_by('nombre')
        if user_supervisa_espacios(user):
            return super().get_queryset().filter(recurso_espacios__espacio__espacios_permitidos__usuario=user).distinct().order_by('nombre')
        return super().get_queryset().distinct().order_by('nombre')

    def get_cache_scope(self):
        # Un supervisor solo ve los recursos de los espacios que tiene
        # permitidos (filtro por usuario, no por seccional) — sin esta clave
        # por usuario, dos supervisores del mismo sitio podrían recibir el
        # listado cacheado del otro.
        user = self.get_current_user()
        if user and user_supervisa_espacios(user):
            return f'supervisor-{user.id}'
        return super().get_cache_scope()


class EspacioRecursoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioRecurso.objects.select_related('espacio', 'recurso').all()
    serializer_class = EspacioRecursoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_queryset(self):
        user = self.get_current_user()
        queryset = super().get_queryset()
        if not user:
            return queryset.none()
        if user_supervisa_espacios(user):
            return queryset.filter(espacio__espacios_permitidos__usuario=user)
        return queryset

    @action(detail=False, methods=['get'], url_path=r'por-ids/(?P<espacio_id>\d+)/(?P<recurso_id>\d+)')
    def por_ids(self, request, espacio_id=None, recurso_id=None):
        queryset = self.filter_queryset(self.get_queryset())
        instance = get_object_or_404(queryset, espacio_id=espacio_id, recurso_id=recurso_id)
        return Response(self.get_serializer(instance).data)
