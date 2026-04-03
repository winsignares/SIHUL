from rest_framework import permissions, viewsets

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
from sedes.models import Seccional, Sede
from sedes.serializers import SeccionalSerializer, SedeSerializer
from usuarios.models import Rol, Usuario
from usuarios.serializers import RolSerializer, UsuarioSerializer

from .auth_helpers import is_admin_global
from .seccional_auth import SeccionalMixin
from .permissions import IsAdminGlobal


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


class EspacioPermitidoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioPermitido.objects.select_related('espacio', 'usuario')
    serializer_class = EspacioPermitidoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


class HorarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio')
    serializer_class = HorarioSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]


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
