from rest_framework import permissions, viewsets

from academico.sedes.models import Seccional, Sede
from academico.sedes.serializers import SeccionalSerializer, SedeSerializer

from mysite.auth_helpers import (
    ve_todas_las_seccionales,
)
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class SeccionalViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Seccional.objects.all()
    serializer_class = SeccionalSerializer
    seccional_lookup = 'id'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        # El portal público pide elegir la seccional: el listado (id y ciudad) es público
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()

        if self.request.method == 'GET':
            if not user and self.action == 'list':
                return Seccional.objects.all().order_by('ciudad')
            if user and ve_todas_las_seccionales(user):
                return Seccional.objects.all()

            seccional = self.get_user_seccional()
            if seccional is None:
                return Seccional.objects.none()

            return Seccional.objects.filter(id=seccional.id)

        if user and ve_todas_las_seccionales(user):
            return super().get_queryset()

        return Seccional.objects.none()


class SedeViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    # prefetch y no select_related: un JOIN cambiaría el orden en que la base devuelve las sedes (el modelo no define orden)
    queryset = Sede.objects.prefetch_related('seccional')
    serializer_class = SedeSerializer
    seccional_lookup = 'seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Sede.objects.prefetch_related('seccional').filter(activa=True)
        return super().get_queryset()
