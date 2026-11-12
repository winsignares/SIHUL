from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from ..permissions import EsUsuarioFinanciero
from django_filters.rest_framework import DjangoFilterBackend
from .. import models, serializers



AREAS_SOLICITANTES = [
    ('SOL-DER', 'Facultad de Derecho y Ciencias Políticas'),
    ('SOL-ING', 'Facultad de Ingeniería'),
    ('SOL-SAL', 'Facultad de Ciencias de la Salud'),
    ('SOL-ECO', 'Facultad de Ciencias Económicas, Administrativas y Contables'),
    ('SOL-ADM', 'Administración'),
]


class ParametroSLAViewSet(viewsets.ModelViewSet):
    queryset = models.ParametroSLA.objects.all()
    serializer_class = serializers.ParametroSLASerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)


class ParametrosFinancieroViewSet(viewsets.ModelViewSet):
    queryset = models.ParametrosFinanciero.objects.all()
    serializer_class = serializers.ParametrosFinancieroSerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Obtener parámetros agrupados por categoría"""
        params = models.ParametrosFinanciero.objects.all()
        grouped = {}
        for param in params:
            if param.categoria not in grouped:
                grouped[param.categoria] = []
            grouped[param.categoria].append({
                'clave': param.clave,
                'valor': param.valor,
                'tipo_dato': param.tipo_dato
            })
        return Response(grouped)
