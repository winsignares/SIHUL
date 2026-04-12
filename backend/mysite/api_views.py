import datetime
import hashlib
import secrets

from django.contrib.auth.hashers import check_password, make_password
from django.core.exceptions import ValidationError
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
from notificaciones.signals import crear_notificacion
from usuarios.serializers import RolSerializer, UsuarioSerializer

from .auth_helpers import is_admin_global
from .seccional_auth import SeccionalMixin
from .permissions import IsAuthenticatedReadOnlyOrAdminWrite, IsAdminGlobal, IsAdminSistema

from espacios import api_adapters as espacios_api
from horario import api_adapters as horario_api


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
    seccional_lookup = 'id'
    permission_classes = [IsAuthenticatedReadOnlyOrAdminWrite]

    def get_queryset(self):
        user = self.get_current_user()

        if self.request.method == 'GET':
            if user and is_admin_global(user):
                return Seccional.objects.all()

            seccional = self.get_user_seccional()
            if seccional is None:
                return Seccional.objects.none()

            return Seccional.objects.filter(id=seccional.id)

        if user and is_admin_global(user):
            return super().get_queryset()
        return Seccional.objects.none()


class SedeViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Sede.objects.all()
    serializer_class = SedeSerializer
    seccional_lookup = 'seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Sede.objects.all()
        return super().get_queryset()


class FacultadViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Facultad.objects.all()
    serializer_class = FacultadSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Facultad.objects.all()
        return super().get_queryset()


class ProgramaViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Programa.objects.all()
    serializer_class = ProgramaSerializer
    seccional_lookup = 'facultad__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Programa.objects.all()
        return super().get_queryset()


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

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return Asignatura.objects.all()
        return super().get_queryset()


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

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return TipoEspacio.objects.all()
        return super().get_queryset()


class EspacioFisicoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioFisico.objects.select_related('sede', 'tipo').prefetch_related('espacio_recursos__recurso')
    serializer_class = EspacioFisicoSerializer
    seccional_lookup = 'sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return self.queryset
        return super().get_queryset()

    @action(detail=False, methods=['get'], url_path='horarios/all')
    def horarios_all(self, request):
        return espacios_api.list_all_espacios_with_horarios(request._request)

    @action(detail=False, methods=['get'], url_path='horarios/disponibles/all')
    def horarios_disponibles_all(self, request):
        return espacios_api.list_all_espacios_disponibles_with_horarios(request._request)

    @action(detail=False, methods=['get'], url_path=r'horarios/supervisor/(?P<usuario_id>\d+)')
    def horarios_supervisor(self, request, usuario_id=None):
        return espacios_api.list_supervisor_espacios_with_horarios(request._request, usuario_id=usuario_id)

    @action(detail=False, methods=['get'], url_path=r'horarios/disponibles/supervisor/(?P<usuario_id>\d+)')
    def horarios_disponibles_supervisor(self, request, usuario_id=None):
        return espacios_api.list_supervisor_espacios_disponibles_with_horarios(request._request, usuario_id=usuario_id)

    @action(detail=False, methods=['get'], url_path='apertura-cierre/proximos')
    def apertura_cierre_proximos(self, request):
        return espacios_api.proximos_apertura_cierre(request._request)

    @action(detail=True, methods=['get', 'put'], url_path='estado')
    def estado(self, request, pk=None):
        return espacios_api.get_estado_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['post'], url_path='cerrar')
    def cerrar_espacio(self, request, pk=None):
        """Cierra un espacio validando que no haya clase en curso."""
        return espacios_api.cerrar_espacio(request._request, espacio_id=pk)

    @action(detail=True, methods=['get'], url_path='horario')
    def horario(self, request, pk=None):
        return espacios_api.get_horario_espacio(request._request, espacio_id=pk)

    @action(detail=False, methods=['get'], url_path='ocupacion/semanal')
    def ocupacion_semanal(self, request):
        return espacios_api.ocupacion_semanal(request._request)

    @action(detail=False, methods=['post'], url_path='ocupacion/pdf')
    def ocupacion_pdf(self, request):
        return espacios_api.generar_pdf_ocupacion_semanal(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/ocupacion')
    def reporte_ocupacion(self, request):
        return espacios_api.reporte_ocupacion(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/ocupacion/pdf')
    def reporte_ocupacion_pdf(self, request):
        return espacios_api.generar_pdf_reporte_ocupacion(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/disponibilidad')
    def reporte_disponibilidad(self, request):
        return espacios_api.reporte_disponibilidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/disponibilidad/pdf')
    def reporte_disponibilidad_pdf(self, request):
        return espacios_api.generar_pdf_reporte_disponibilidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/capacidad')
    def reporte_capacidad(self, request):
        return espacios_api.reporte_capacidad(request._request)

    @action(detail=False, methods=['get'], url_path='reporte/capacidad/pdf')
    def reporte_capacidad_pdf(self, request):
        return espacios_api.generar_pdf_reporte_capacidad(request._request)


class EspacioPermitidoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = EspacioPermitido.objects.select_related('espacio', 'usuario')
    serializer_class = EspacioPermitidoSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path=r'usuario/(?P<usuario_id>\d+)')
    def por_usuario(self, request, usuario_id=None):
        return espacios_api.list_espacios_by_usuario(request._request, usuario_id=usuario_id)


class HorarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio')
    serializer_class = HorarioSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        public_actions = {
            'list_extendidos',
            'por_periodo',
            'exportar_pdf',
            'exportar_excel',
            'exportar_pdf_docente',
            'exportar_excel_docente',
        }
        if self.action in public_actions:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def create(self, request, *args, **kwargs):
        grupo_id = request.data.get('grupo') or request.data.get('grupo_id')
        asignatura_id = request.data.get('asignatura') or request.data.get('asignatura_id')
        espacio_id = request.data.get('espacio') or request.data.get('espacio_id')
        dia_semana = request.data.get('dia_semana')
        hora_inicio = request.data.get('hora_inicio')
        hora_fin = request.data.get('hora_fin')
        docente_id = request.data.get('docente') or request.data.get('docente_id')
        cantidad = request.data.get('cantidad_estudiantes')
        usuario_id = request.data.get('usuario_id')
        estado_payload = request.data.get('estado')

        if not grupo_id or not asignatura_id or not espacio_id or not dia_semana or not hora_inicio or not hora_fin:
            return Response({'error': 'Faltan campos requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            grupo = Grupo.objects.get(id=grupo_id)
            asignatura = Asignatura.objects.get(id=asignatura_id)
            espacio = EspacioFisico.objects.get(id=espacio_id)
            docente = Usuario.objects.get(id=docente_id) if docente_id else None
            usuario = Usuario.objects.get(id=usuario_id) if usuario_id else None

            hi = datetime.time.fromisoformat(str(hora_inicio))
            hf = datetime.time.fromisoformat(str(hora_fin))

            es_planificador = bool(usuario and usuario.rol and usuario.rol.nombre == 'planeacion_facultad')

            if es_planificador:
                solicitud = SolicitudEspacio(
                    grupo=grupo,
                    asignatura=asignatura,
                    docente=docente,
                    espacio_solicitado=espacio,
                    planificador=usuario,
                    dia_semana=dia_semana,
                    hora_inicio=hi,
                    hora_fin=hf,
                    cantidad_estudiantes=int(cantidad) if cantidad is not None else None,
                    estado='pendiente'
                )
                solicitud.save()

                administradores = Usuario.objects.filter(rol__nombre__in=['admin', 'admin_planeacion']).distinct()
                for admin in administradores:
                    crear_notificacion(
                        id_usuario=admin.id,
                        tipo='solicitud_espacio',
                        mensaje=(
                            f'Nueva solicitud de espacio (ID: {solicitud.id}): '
                            f'{asignatura.nombre} - Grupo {grupo.nombre} - Aula: {espacio.nombre} - '
                            f'{dia_semana} {hi}-{hf}'
                        ),
                        prioridad='alta'
                    )

                return Response(
                    {
                        'message': 'Solicitud de espacio creada exitosamente',
                        'id': solicitud.id,
                        'tipo': 'solicitud',
                    },
                    status=status.HTTP_201_CREATED,
                )

            estado_horario = estado_payload if estado_payload in ['aprobado', 'pendiente', 'rechazado'] else 'aprobado'
            horario = Horario(
                grupo=grupo,
                asignatura=asignatura,
                docente=docente,
                espacio=espacio,
                dia_semana=dia_semana,
                hora_inicio=hi,
                hora_fin=hf,
                cantidad_estudiantes=int(cantidad) if cantidad is not None else None,
                estado=estado_horario,
            )
            horario.save()

            return Response(
                {
                    'message': 'Horario creado',
                    'id': horario.id,
                    'tipo': 'horario',
                },
                status=status.HTTP_201_CREATED,
            )
        except ValidationError as e:
            return Response({'error': str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
        except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
            return Response({'error': 'Relacionada no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Formato de hora inválido o valor numérico incorrecto.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='list/extendidos')
    def list_extendidos(self, request):
        return horario_api.list_horarios_extendidos(request._request)

    @action(detail=False, methods=['get'], url_path='mi-horario')
    def mi_horario(self, request):
        return horario_api.mi_horario_docente(request._request)

    @action(detail=False, methods=['get'], url_path='mi-horario-estudiante')
    def mi_horario_estudiante(self, request):
        return horario_api.mi_horario_estudiante(request._request)

    @action(detail=False, methods=['get'], url_path='por-periodo')
    def por_periodo(self, request):
        return horario_api.horarios_por_periodo(request._request)

    @action(detail=False, methods=['post'], url_path='inscribir-estudiante')
    def inscribir_estudiante(self, request):
        return horario_api.inscribir_estudiante(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf')
    def exportar_pdf(self, request):
        return horario_api.exportar_horarios_pdf_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel')
    def exportar_excel(self, request):
        return horario_api.exportar_horarios_excel_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf-docente')
    def exportar_pdf_docente(self, request):
        return horario_api.exportar_horarios_pdf_docente(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel-docente')
    def exportar_excel_docente(self, request):
        return horario_api.exportar_horarios_excel_docente(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf-usuario')
    def exportar_pdf_usuario(self, request):
        return horario_api.exportar_pdf_usuario(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel-usuario')
    def exportar_excel_usuario(self, request):
        return horario_api.exportar_excel_usuario(request._request)


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
        return horario_api.aprobar_solicitud_espacio(request._request)

    @action(detail=False, methods=['post'], url_path='rechazar')
    def rechazar(self, request):
        return horario_api.rechazar_solicitud_espacio(request._request)


class RolViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    seccional_lookup = None
    permission_classes = [permissions.IsAuthenticated, IsAdminSistema]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return [permission() for permission in self.permission_classes]


class UsuarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional')
    serializer_class = UsuarioSerializer
    seccional_lookup = 'seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ('login', 'list_docentes'):
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        if self.action == 'list_docentes':
            user = self.get_current_user()
            if not user:
                return Usuario.objects.select_related('rol', 'facultad', 'sede', 'seccional').filter(
                    activo=True,
                    rol__nombre__iexact='docente'
                )
            return super().get_queryset().filter(activo=True, rol__nombre__iexact='docente')
        return super().get_queryset()

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

    @action(
        detail=False,
        methods=['post'],
        url_path='login',
        authentication_classes=[],
        permission_classes=[permissions.AllowAny],
    )
    def login(self, request):
        correo = request.data.get('correo')
        contrasena = request.data.get('contrasena')

        if not correo or not contrasena:
            return Response({'error': 'correo y contrasena son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            usuario = Usuario.objects.select_related('sede', 'sede__seccional', 'rol', 'facultad').get(correo=correo)
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
                'seccional_id': usuario.sede.seccional_id,
                'seccional_ciudad': usuario.sede.seccional.ciudad if usuario.sede.seccional else None,
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

    @action(detail=False, methods=['get'], url_path='docentes', permission_classes=[permissions.AllowAny])
    def list_docentes(self, request):
        docentes = self.get_queryset()
        data = [
            {
                'id': docente.id,
                'nombre': docente.nombre,
                'correo': docente.correo,
                'rol_id': docente.rol.id if docente.rol else None,
                'facultad_id': docente.facultad.id if docente.facultad else None,
                'activo': docente.activo,
            }
            for docente in docentes
        ]
        return Response({'usuarios': data}, status=status.HTTP_200_OK)


class RecursoViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    seccional_lookup = None
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
