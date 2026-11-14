from rest_framework import viewsets

from academico.grupos.models import Grupo
from academico.grupos.serializers import GrupoSerializer

from nucleo.cache_utils import CachedCatalogMixin
from nucleo.seccional_auth import SeccionalMixin
from nucleo.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class GrupoViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    seccional_lookup = 'programa__facultad__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]
