from rest_framework import viewsets

from grupos.models import Grupo
from grupos.serializers import GrupoSerializer

from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class GrupoViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    seccional_lookup = 'programa__facultad__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]
