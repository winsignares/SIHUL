from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from asignaturas.models import Asignatura, AsignaturaPrograma
from asignaturas.serializers import AsignaturaProgramaSerializer, AsignaturaSerializer
from espacios.models import EspacioFisico, EspacioPermitido, TipoEspacio
from espacios.serializers import EspacioFisicoSerializer, EspacioPermitidoSerializer, TipoEspacioSerializer
from facultades.models import Facultad
from facultades.serializers import FacultadSerializer
from grupos.models import Grupo
from grupos.serializers import GrupoSerializer
from horario.models import Horario, HorarioEstudiante, HorarioFusionado, SolicitudEspacio
from horario.serializers import (
    HorarioEstudianteSerializer,
    HorarioFusionadoSerializer,
    HorarioSerializer,
    SolicitudEspacioSerializer,
)
from programas.models import Programa
from programas.serializers import ProgramaSerializer
from recursos.models import EspacioRecurso, Recurso
from recursos.serializers import EspacioRecursoSerializer, RecursoSerializer
from sedes.models import Seccional, Sede
from sedes.serializers import SeccionalSerializer, SedeSerializer
from usuarios.models import Rol, Usuario
from usuarios.serializers import RolSerializer, UsuarioSerializer

from .auth_helpers import is_admin_global
from .seccional_auth import SeccionalMixin
from .permissions import IsAdminGlobal

from espacios import views as espacios_legacy_views
from horario import views as horario_legacy_views


class SeccionalViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Seccional.objects.all()
    serializer_class = SeccionalSerializer
    seccional_lookup = None
    permission_classes = [permissions.IsAuthenticated, IsAdminGlobal]

    def get_queryset(self):
        user = self.get_current_user()
        if user and is_admin_global(user):
            return super().get_queryset()
        return Seccional.objects.none()


class SedeViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer
    seccional_lookup = 'seccional'
    permission_classes = [permissions.IsAuthenticated]


class FacultadViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Facultad.objects.all()
    serializer_class = FacultadSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class ProgramaViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer
    seccional_lookup = 'facultad__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class GrupoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Grupo.objects.all()
    serializer_class = GrupoSerializer
    seccional_lookup = 'programa__facultad__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class AsignaturaViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Asignatura.objects.all()
    serializer_class = AsignaturaSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class AsignaturaProgramaViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = AsignaturaPrograma.objects.select_related('programa', 'asignatura')
    serializer_class = AsignaturaProgramaSerializer
    seccional_lookup = 'asignatura__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class TipoEspacioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = TipoEspacio.objects.all()
    serializer_class = TipoEspacioSerializer
    seccional_lookup = None
    permission_classes = [permissions.IsAuthenticated]


class EspacioFisicoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioFisico.objects.select_related('sede', 'tipo')
    serializer_class = EspacioFisicoSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='horarios/all')
    def horarios_all(self, request):
        return espacios_legacy_views.list_all_espacios_with_horarios(request._request)

    @action(detail=False, methods=['get'], url_path=r'horarios/supervisor/(?P<usuario_id>\d+)')
    def horarios_supervisor(self, request, usuario_id=None):
        return espacios_legacy_views.list_supervisor_espacios_with_horarios(request._request, usuario_id=usuario_id)

    @action(detail=False, methods=['get'], url_path='apertura-cierre/proximos')
    def apertura_cierre_proximos(self, request):
        return espacios_legacy_views.proximos_apertura_cierre(request._request)

    @action(detail=True, methods=['get'], url_path='estado')
    def estado(self, request, pk=None):
        return espacios_legacy_views.get_estado_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['get'], url_path='horario')
    def horario(self, request, pk=None):
        return espacios_legacy_views.get_horario_espacio(request._request, espacio_id=pk)

    @action(detail=False, methods=['get'], url_path='ocupacion/semanal')
    def ocupacion_semanal(self, request):
        return espacios_legacy_views.ocupacion_semanal(request._request)

    @action(detail=False, methods=['post'], url_path='ocupacion/pdf')
    def ocupacion_pdf(self, request):
        return espacios_legacy_views.generar_pdf_ocupacion_semanal(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/ocupacion')
    def reporte_ocupacion(self, request):
        return espacios_legacy_views.reporte_ocupacion(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/ocupacion/pdf')
    def reporte_ocupacion_pdf(self, request):
        return espacios_legacy_views.generar_pdf_reporte_ocupacion(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/disponibilidad')
    def reporte_disponibilidad(self, request):
        return espacios_legacy_views.reporte_disponibilidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/disponibilidad/pdf')
    def reporte_disponibilidad_pdf(self, request):
        return espacios_legacy_views.generar_pdf_reporte_disponibilidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/capacidad')
    def reporte_capacidad(self, request):
        return espacios_legacy_views.reporte_capacidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/capacidad/pdf')
    def reporte_capacidad_pdf(self, request):
        return espacios_legacy_views.generar_pdf_reporte_capacidad(request._request)


class EspacioPermitidoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioPermitido.objects.select_related('espacio', 'usuario')
    serializer_class = EspacioPermitidoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path=r'usuario/(?P<usuario_id>\d+)')
    def por_usuario(self, request, usuario_id=None):
        return espacios_legacy_views.list_espacios_by_usuario(request._request, usuario_id=usuario_id)


class HorarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio')
    serializer_class = HorarioSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='list/extendidos')
    def list_extendidos(self, request):
        return horario_legacy_views.list_horarios_extendidos(request._request)

    @action(detail=False, methods=['get'], url_path='mi-horario')
    def mi_horario(self, request):
        return horario_legacy_views.mi_horario_docente(request._request)

    @action(detail=False, methods=['get'], url_path='mi-horario-estudiante')
    def mi_horario_estudiante(self, request):
        return horario_legacy_views.mi_horario_estudiante(request._request)

    @action(detail=False, methods=['post'], url_path='inscribir-estudiante')
    def inscribir_estudiante(self, request):
        return horario_legacy_views.inscribir_estudiante(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf')
    def exportar_pdf(self, request):
        return horario_legacy_views.exportar_horarios_pdf_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel')
    def exportar_excel(self, request):
        return horario_legacy_views.exportar_horarios_excel_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf-docente')
    def exportar_pdf_docente(self, request):
        return horario_legacy_views.exportar_horarios_pdf_docente(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel-docente')
    def exportar_excel_docente(self, request):
        return horario_legacy_views.exportar_horarios_excel_docente(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf-usuario')
    def exportar_pdf_usuario(self, request):
        return horario_legacy_views.exportar_pdf_usuario(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel-usuario')
    def exportar_excel_usuario(self, request):
        return horario_legacy_views.exportar_excel_usuario(request._request)


class HorarioFusionadoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = HorarioFusionado.objects.select_related('grupo1', 'grupo2', 'grupo3', 'asignatura', 'docente', 'espacio')
    serializer_class = HorarioFusionadoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class HorarioEstudianteViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = HorarioEstudiante.objects.select_related('horario', 'estudiante')
    serializer_class = HorarioEstudianteSerializer
    seccional_lookup = 'horario__espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class SolicitudEspacioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = SolicitudEspacio.objects.select_related('grupo', 'asignatura', 'docente', 'espacio_solicitado', 'planificador')
    serializer_class = SolicitudEspacioSerializer
    seccional_lookup = 'espacio_solicitado__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='aprobar')
    def aprobar(self, request):
        return horario_legacy_views.aprobar_solicitud_espacio(request._request)

    @action(detail=False, methods=['post'], url_path='rechazar')
    def rechazar(self, request):
        return horario_legacy_views.rechazar_solicitud_espacio(request._request)


class RolViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    seccional_lookup = None
    permission_classes = [permissions.IsAuthenticated, IsAdminGlobal]


class UsuarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional')
    serializer_class = UsuarioSerializer
    seccional_lookup = 'seccional'
    permission_classes = [permissions.IsAuthenticated]


class RecursoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    seccional_lookup = 'recurso_espacios__espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset().distinct().order_by('nombre')


class EspacioRecursoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioRecurso.objects.select_related('espacio', 'recurso').all()
    serializer_class = EspacioRecursoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path=r'por-ids/(?P<espacio_id>\d+)/(?P<recurso_id>\d+)')
    def por_ids(self, request, espacio_id=None, recurso_id=None):
        queryset = self.filter_queryset(self.get_queryset())
        instance = get_object_or_404(queryset, espacio_id=espacio_id, recurso_id=recurso_id)
        return Response(self.get_serializer(instance).data)
