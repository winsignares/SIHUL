from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from instalaciones.espacios import alcance as alcance_espacios
from instalaciones.espacios.models import EspacioFisico, EspacioPermitido, TipoEspacio
from instalaciones.espacios.serializers import EspacioFisicoSerializer, EspacioPermitidoSerializer, TipoEspacioSerializer
from identidad.usuarios.models import Usuario

from nucleo.auth_helpers import (
    puede_ver_usuario, user_supervisa_espacios,
)
from nucleo.cache_utils import CachedCatalogMixin
from nucleo.seccional_auth import SeccionalMixin
from nucleo.permissions import (
    IsAuthenticatedReadOnlyOrAdminWrite,
)

from instalaciones.espacios import api
from instalaciones.espacios.api import informes


def _exigir_ver_usuario(solicitante, usuario_id):
    """Los espacios y horarios de una persona los consulta ella misma o quien la administra."""
    objetivo = Usuario.objects.select_related('sede').filter(pk=usuario_id).first()
    if objetivo is not None and not puede_ver_usuario(solicitante, objetivo):
        raise PermissionDenied('No puedes consultar los datos de esta persona.')


class TipoEspacioViewSet(CachedCatalogMixin, SeccionalMixin, viewsets.ModelViewSet):
    queryset = TipoEspacio.objects.all()
    serializer_class = TipoEspacioSerializer
    seccional_lookup = None
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return TipoEspacio.objects.none()
        return super().get_queryset()


class EspacioFisicoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioFisico.objects.select_related('sede', 'tipo').prefetch_related('espacio_recursos__recurso')
    serializer_class = EspacioFisicoSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return self.queryset.none()
        if user_supervisa_espacios(user):
            espacios_ids = EspacioPermitido.objects.filter(usuario=user).values_list('espacio_id', flat=True)
            return self.queryset.filter(id__in=espacios_ids)
        return super().get_queryset()

    def perform_create(self, serializer):
        # Un supervisor solo crea espacios de los tipos que tiene asignados, en su sede
        motivo = alcance_espacios.motivo_no_puede_crear(
            self.get_current_user(),
            serializer.validated_data['tipo'].id,
            serializer.validated_data['sede'].id,
        )
        if motivo:
            raise PermissionDenied(motivo)
        serializer.save()

    def perform_update(self, serializer):
        datos = serializer.validated_data
        motivo = alcance_espacios.motivo_no_puede_actualizar(
            self.get_current_user(),
            serializer.instance,
            tipo_id=datos['tipo'].id if 'tipo' in datos else None,
            sede_id=datos['sede'].id if 'sede' in datos else None,
        )
        if motivo:
            raise PermissionDenied(motivo)
        serializer.save()

    def _deny_unassigned_space_for_supervisor(self, pk):
        user = self.get_current_user()
        if user and user_supervisa_espacios(user):
            has_access = EspacioPermitido.objects.filter(usuario=user, espacio_id=pk).exists()
            if not has_access:
                return Response({'error': 'No tienes permiso para gestionar este espacio.'}, status=status.HTTP_403_FORBIDDEN)
        return None

    @action(detail=False, methods=['get'], url_path='horarios/all', permission_classes=[permissions.AllowAny])
    def horarios_all(self, request):
        return api.list_all_espacios_with_horarios(request._request)

    @action(detail=False, methods=['get'], url_path='horarios/disponibles/all', permission_classes=[permissions.AllowAny])
    def horarios_disponibles_all(self, request):
        return api.list_all_espacios_disponibles_with_horarios(request._request)

    @action(detail=False, methods=['get'], url_path='disponibles/por-horario')
    def disponibles_por_horario(self, request):
        return informes.list_espacios_disponibles_por_horario(request._request)


    @action(detail=False, methods=['get'], url_path=r'horarios/supervisor/(?P<usuario_id>\d+)')
    def horarios_supervisor(self, request, usuario_id=None):
        _exigir_ver_usuario(self.get_current_user(), usuario_id)
        return api.list_supervisor_espacios_with_horarios(request._request, usuario_id=usuario_id)

    @action(detail=False, methods=['get'], url_path=r'horarios/disponibles/supervisor/(?P<usuario_id>\d+)')
    def horarios_disponibles_supervisor(self, request, usuario_id=None):
        _exigir_ver_usuario(self.get_current_user(), usuario_id)
        return api.list_supervisor_espacios_disponibles_with_horarios(request._request, usuario_id=usuario_id)

    @action(detail=False, methods=['get'], url_path='apertura-cierre/proximos')
    def apertura_cierre_proximos(self, request):
        return api.proximos_apertura_cierre(request._request)

    @action(detail=True, methods=['get', 'put'], url_path='estado')
    def estado(self, request, pk=None):
        denied = self._deny_unassigned_space_for_supervisor(pk)
        if denied:
            return denied
        return api.get_estado_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_espacio(self, request, pk=None):
        """Cierra un espacio validando que no haya clase en curso."""
        denied = self._deny_unassigned_space_for_supervisor(pk)
        if denied:
            return denied
        return api.cerrar_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['post'], url_path='abrir')
    def abrir_espacio(self, request, pk=None):
        """Abre un espacio marcando su estado fisico como abierto."""
        denied = self._deny_unassigned_space_for_supervisor(pk)
        if denied:
            return denied
        return api.abrir_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['get'], url_path='horario')
    def horario(self, request, pk=None):
        denied = self._deny_unassigned_space_for_supervisor(pk)
        if denied:
            return denied
        return api.get_horario_espacio(request._request, espacio_id=pk)

    @action(detail=False, methods=['get'], url_path='ocupacion/semanal')
    def ocupacion_semanal(self, request):
        return api.ocupacion_semanal(request._request)

    @action(detail=False, methods=['post'], url_path='ocupacion/pdf')
    def ocupacion_pdf(self, request):
        return informes.generar_pdf_ocupacion_semanal(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/ocupacion')
    def reporte_ocupacion(self, request):
        return informes.reporte_ocupacion(request._request)

    @action(detail=False, methods=['post'], url_path='reporte/ocupacion/pdf')
    def reporte_ocupacion_pdf(self, request):
        return informes.generar_pdf_reporte_ocupacion(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/disponibilidad')
    def reporte_disponibilidad(self, request):
        return informes.reporte_disponibilidad(request._request)

    @action(detail=False, methods=['post'], url_path='reporte/disponibilidad/pdf')
    def reporte_disponibilidad_pdf(self, request):
        return informes.generar_pdf_reporte_disponibilidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/capacidad')
    def reporte_capacidad(self, request):
        return informes.reporte_capacidad(request._request)

    @action(detail=False, methods=['post'], url_path='reporte/capacidad/pdf')
    def reporte_capacidad_pdf(self, request):
        return informes.generar_pdf_reporte_capacidad(request._request)


class EspacioPermitidoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioPermitido.objects.select_related('espacio', 'usuario')
    serializer_class = EspacioPermitidoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def check_permissions(self, request):
        super().check_permissions(request)
        # Las asignaciones las define quien administra usuarios; un supervisor las ve, no las cambia
        if request.method not in permissions.SAFE_METHODS and alcance_espacios.esta_restringido(self.get_current_user()):
            raise PermissionDenied('Un supervisor de espacios no puede modificar las asignaciones de espacios.')

    @action(detail=False, methods=['get'], url_path=r'usuario/(?P<usuario_id>\d+)')
    def por_usuario(self, request, usuario_id=None):
        _exigir_ver_usuario(self.get_current_user(), usuario_id)
        return api.list_espacios_by_usuario(request._request, usuario_id=usuario_id)
