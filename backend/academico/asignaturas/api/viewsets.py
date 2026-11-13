from rest_framework import viewsets

from academico.asignaturas.models import Asignatura, AsignaturaPrograma
from academico.asignaturas.serializers import AsignaturaProgramaSerializer, AsignaturaSerializer

from mysite.auth_helpers import (
    is_admin_global,
)
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class AsignaturaViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        from django.db.models import Q
        user = self.get_current_user()
        if not user:
            return Asignatura.objects.none()
        if is_admin_global(user):
            return Asignatura.objects.all()
        seccional = self.get_user_seccional()
        if seccional is not None:
            return Asignatura.objects.filter(
                Q(sede__seccional=seccional) | Q(sede__isnull=True)
            )
        return Asignatura.objects.filter(sede__isnull=True)

    def get_cache_scope(self):
        # get_queryset() da acceso completo a is_admin_global (no solo a
        # superusuarios reales), así que la clave de caché debe seguir ese
        # mismo criterio o dos roles distintos podrían compartir por error
        # la respuesta cacheada de otro.
        user = self.get_current_user()
        if user and is_admin_global(user):
            return 'all'
        return super().get_cache_scope()


class AsignaturaProgramaViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = AsignaturaPrograma.objects.select_related('programa', 'asignatura')
    serializer_class = AsignaturaProgramaSerializer
    seccional_lookup = 'asignatura__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]
