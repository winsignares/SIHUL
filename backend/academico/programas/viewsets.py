from rest_framework import permissions, viewsets

from academico.programas.models import Programa
from academico.programas.serializers import ProgramaSerializer

from mysite.auth_helpers import (
    seccional_publica,
)
from mysite.cache_utils import CachedCatalogMixin
from mysite.seccional_auth import SeccionalMixin
from mysite.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)



class ProgramaViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer
    seccional_lookup = 'facultad__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        # La consulta pública de horarios necesita el catálogo de programas para filtrar. Solo el listado:
        # la consulta individual y toda escritura siguen requiriendo sesión.
        if self.action == 'list':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            if self.action != 'list':
                return Programa.objects.none()
            programas = Programa.objects.all().order_by('nombre')
            seccional_id = seccional_publica(self.request)
            return programas.filter(facultad__sede__seccional_id=seccional_id) if seccional_id else programas
        return super().get_queryset()

    def get_cache_scope(self):
        # El listado público cambia según la seccional elegida: cada una con su propia entrada de caché
        if not self.get_current_user():
            return f'anon-{seccional_publica(self.request) or "todas"}'
        return super().get_cache_scope()
