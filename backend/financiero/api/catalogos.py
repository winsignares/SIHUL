from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from ..permissions import EsUsuarioFinanciero
from django_filters.rest_framework import DjangoFilterBackend
from .. import models
from .. import serializers



DEFAULT_CUENTAS_CONTABLES = [
    {
        'codigo': '513505',
        'nombre': 'Servicios públicos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '513595',
        'nombre': 'Otros servicios administrativos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '220505',
        'nombre': 'Proveedores nacionales',
        'tipo_cuenta': 'Pasivo',
        'nivel': 4,
        'cuenta_padre': '2205',
        'naturaleza': 'Crédito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': False,
        'estado': 'Activo',
    },
]


DEFAULT_CENTROS_COSTO = [
    {'codigo': 'CC-ADM-001', 'nombre': 'Administración General', 'tipo': 'Administrativo', 'estado': 'Activo'},
    {'codigo': 'CC-ACA-001', 'nombre': 'Gestión Académica', 'tipo': 'Académico', 'estado': 'Activo'},
    {'codigo': 'CC-OPE-001', 'nombre': 'Operación Institucional', 'tipo': 'Operativo', 'estado': 'Activo'},
]


class PaisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Pais.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.PaisSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'codigo_iso']
    search_fields = ['nombre', 'codigo_iso']
    ordering = ['nombre']


class DepartamentoGeograficoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.DepartamentoGeograficoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'pais']
    search_fields = ['nombre', 'codigo', 'pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = models.DepartamentoGeografico.objects.filter(activo=True).select_related('pais').order_by('nombre')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')
        ciudad_id = self.request.query_params.get('ciudad_id')

        if ciudad_id:
            ciudad = models.Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento').first()
            if ciudad:
                queryset = queryset.filter(id=ciudad.departamento_id)

        if pais_id:
            queryset = queryset.filter(pais_id=pais_id)

        return queryset


class CiudadViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.CiudadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'departamento']
    search_fields = ['nombre', 'departamento__nombre', 'departamento__pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = models.Ciudad.objects.filter(activo=True).select_related('departamento__pais').order_by('nombre')
        departamento_id = self.request.query_params.get('departamento_id') or self.request.query_params.get('departamento')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')

        if departamento_id:
            queryset = queryset.filter(departamento_id=departamento_id)

        if pais_id:
            queryset = queryset.filter(departamento__pais_id=pais_id)

        return queryset


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = models.Departamento.objects.all()
    serializer_class = serializers.DepartamentoSerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def areas_solicitantes(self, request):
        """Lista las áreas activas disponibles en la base de datos."""
        queryset = models.Departamento.objects.filter(
            estado='Activo',
            codigo__startswith='SOL-',
        ).order_by('nombre')
        serializer = serializers.DepartamentoSerializer(queryset, many=True)
        return Response(serializer.data)


class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = models.CuentaContable.objects.all()
    serializer_class = serializers.CuentaContableSerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not models.CuentaContable.objects.exists():
            for cuenta in DEFAULT_CUENTAS_CONTABLES:
                models.CuentaContable.objects.get_or_create(codigo=cuenta['codigo'], defaults=cuenta)
        return super().list(request, *args, **kwargs)


class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = models.CentroCosto.objects.all()
    serializer_class = serializers.CentroCostoSerializer
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not models.CentroCosto.objects.exists():
            for centro in DEFAULT_CENTROS_COSTO:
                models.CentroCosto.objects.get_or_create(codigo=centro['codigo'], defaults=centro)
        return super().list(request, *args, **kwargs)


class BancoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Banco.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.BancoSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']


class TipoCuentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.TipoCuenta.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.TipoCuentaSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
