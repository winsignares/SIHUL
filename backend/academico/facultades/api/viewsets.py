from rest_framework import viewsets

from academico.facultades.models import Facultad
from academico.facultades.serializers import FacultadSerializer

from nucleo.cache_utils import CachedCatalogMixin
from nucleo.seccional_auth import SeccionalMixin
from nucleo.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class FacultadViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Facultad.objects.all()
    serializer_class = FacultadSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Facultad.objects.none()
        return super().get_queryset()
