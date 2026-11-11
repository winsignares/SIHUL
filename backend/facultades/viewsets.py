from rest_framework import viewsets

from facultades.models import Facultad
from facultades.serializers import FacultadSerializer

from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
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
