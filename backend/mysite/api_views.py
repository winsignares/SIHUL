import hashlib
import secrets

from django.contrib.auth.hashers import check_password, make_password
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from werkzeug.security import check_password_hash

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


def _password_valida(usuario, password_plano):
    hash_actual = usuario.contrasena_hash or ''

    if check_password(password_plano, hash_actual):
        return True, False

    try:
        legacy_ok = check_password_hash(hash_actual, password_plano)
    except Exception:
        legacy_ok = False

    return legacy_ok, legacy_ok


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
    serializer_class = EspacioFisicoSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return EspacioFisico.objects.select_related('sede', 'tipo')

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

    def get_permissions(self):
        if self.action == 'login':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def _build_componentes(self, usuario):
        if not usuario.rol:
            return []

        from componentes.models import ComponenteRol

        componentes_rol = ComponenteRol.objects.filter(rol=usuario.rol).select_related('componente')
        return [
            {
                'id': cr.componente.id,
                'nombre': cr.componente.nombre,
                'descripcion': cr.componente.descripcion,
                'permiso': cr.permiso,
            }
            for cr in componentes_rol
        ]

    def _build_espacios_permitidos(self, usuario):
        from espacios.models import EspacioPermitido

        espacios_permisos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio', 'espacio__sede', 'espacio__tipo')
        return [
            {
                'id': ep.espacio.id,
                'tipo': ep.espacio.tipo.nombre if ep.espacio.tipo else None,
                'capacidad': ep.espacio.capacidad,
                'ubicacion': ep.espacio.ubicacion,
                'disponible': ep.espacio.estado == 'Disponible',
                'sede_id': ep.espacio.sede.id,
                'sede_nombre': ep.espacio.sede.nombre,
            }
            for ep in espacios_permisos
        ]

    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        correo = request.data.get('correo')
        contrasena = request.data.get('contrasena')

        if not correo or not contrasena:
            return Response({'error': 'correo y contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.select_related('sede', 'rol', 'facultad').get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        password_ok, es_legacy = _password_valida(usuario, contrasena)
        if not password_ok:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        if es_legacy:
            nuevo_hash = make_password(contrasena)
            usuario.contrasena_hash = nuevo_hash
            usuario.password = nuevo_hash
            usuario.save(update_fields=['contrasena_hash', 'password'])

        componentes = self._build_componentes(usuario)
        espacios_permitidos = self._build_espacios_permitidos(usuario)

        request.session['user_id'] = usuario.id
        request.session['correo'] = usuario.correo
        request.session['is_authenticated'] = True
        token = secrets.token_urlsafe(32)
        request.session['token'] = token
        request.session['rol'] = usuario.rol.nombre if usuario.rol else None
        request.session['id_rol'] = usuario.rol.id if usuario.rol else None

        return Response({
            'message': 'Login exitoso',
            'id': usuario.id,
            'nombre': usuario.nombre,
            'correo': usuario.correo,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
            } if usuario.rol else None,
            'facultad': {
                'id': usuario.facultad.id,
                'nombre': usuario.facultad.nombre,
            } if usuario.facultad else None,
            'sede': {
                'id': usuario.sede.id,
                'nombre': usuario.sede.nombre,
                'ciudad': usuario.sede.ciudad,
                'direccion': usuario.sede.direccion,
            } if usuario.sede else None,
            'componentes': componentes,
            'espacios_permitidos': espacios_permitidos,
            'token': token,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'], url_path='logout')
    def logout(self, request):
        request.session.flush()
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='session-auth-state')
    def session_auth_state(self, request):
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({'error': 'No autenticado'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            usuario = Usuario.objects.select_related('rol').get(id=user_id)
        except Usuario.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        componentes = self._build_componentes(usuario)
        parts = [f"{c['id']}:{c['permiso']}" for c in sorted(componentes, key=lambda item: (item['id'], item['permiso']))]
        role_part = str(usuario.rol.id) if usuario.rol else 'no-role'
        signature_source = f"{role_part}|{'|'.join(parts)}"
        signature = hashlib.sha256(signature_source.encode('utf-8')).hexdigest()[:16]

        since = request.query_params.get('since')
        if since and since == signature:
            return Response({'changed': False, 'signature': signature}, status=status.HTTP_200_OK)

        return Response({
            'changed': True,
            'signature': signature,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
            } if usuario.rol else None,
            'componentes': componentes,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='change-password')
    def change_password(self, request):
        correo = request.data.get('correo')
        old_contrasena = request.data.get('old_contrasena')
        new_contrasena = request.data.get('new_contrasena')

        if not correo or not old_contrasena or not new_contrasena:
            return Response({'error': 'correo, old_contrasena y new_contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        password_ok, _ = _password_valida(usuario, old_contrasena)
        if not password_ok:
            return Response({'error': 'Credenciales inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

        usuario.contrasena_hash = make_password(new_contrasena)
        usuario.password = usuario.contrasena_hash
        usuario.save()
        return Response({'message': 'Contraseña cambiada exitosamente'}, status=status.HTTP_200_OK)


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
