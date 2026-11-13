import datetime

from django.core.exceptions import ValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from academico.asignaturas.models import Asignatura
from instalaciones.espacios.models import EspacioFisico
from academico.grupos.models import Grupo
from academico.horario.models import Horario, HorarioEstudiante, HorarioFusionado, SolicitudEspacio
from academico.horario.serializers import (
    HorarioEstudianteSerializer,
    HorarioFusionadoSerializer,
    HorarioSerializer,
    SolicitudEspacioSerializer,
)
from identidad.usuarios.models import Usuario
from notificaciones.signals import crear_notificacion

from mysite.seccional_auth import SeccionalMixin

from academico.horario import api
from academico.horario import views


class HorarioViewSet(SeccionalMixin, viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio')
    serializer_class = HorarioSerializer
    seccional_lookup = 'espacio__sede__seccional'
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # La consulta pública muestra únicamente horarios aprobados. Las demás
        # operaciones del módulo (incluidos horarios pendientes) continúan
        # requiriendo una sesión autenticada.
        if self.action in ('list_extendidos', 'por_periodo'):
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
        return api.list_horarios_extendidos(request._request)

    @action(detail=False, methods=['get'], url_path='sin-espacio')
    def sin_espacio(self, request):
        return api.list_horarios_asignacion_espacios(request._request)

    @action(detail=False, methods=['post'], url_path='asignar-espacio')
    def asignar_espacio(self, request):
        return api.asignar_espacio_horario(request._request)


    @action(detail=False, methods=['get'], url_path='mi-horario')
    def mi_horario(self, request):
        return api.mi_horario_docente(request._request)

    @action(detail=False, methods=['get'], url_path='mi-horario-estudiante')
    def mi_horario_estudiante(self, request):
        return api.mi_horario_estudiante(request._request)

    @action(detail=False, methods=['get'], url_path='por-periodo')
    def por_periodo(self, request):
        return api.horarios_por_periodo(request._request)

    @action(detail=False, methods=['post'], url_path='inscribir-estudiante')
    def inscribir_estudiante(self, request):
        return api.inscribir_estudiante(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf')
    def exportar_pdf(self, request):
        return views.exportar_horarios_pdf_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel')
    def exportar_excel(self, request):
        return views.exportar_horarios_excel_post(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-pdf-docente')
    def exportar_pdf_docente(self, request):
        return views.exportar_horarios_pdf_docente(request._request)

    @action(detail=False, methods=['post'], url_path='exportar-excel-docente')
    def exportar_excel_docente(self, request):
        return views.exportar_horarios_excel_docente(request._request)

    @action(detail=False, methods=['get'], url_path='exportar-pdf-usuario')
    def exportar_pdf_usuario(self, request):
        return api.exportar_mi_horario(request._request, 'pdf')

    @action(detail=False, methods=['get'], url_path='exportar-excel-usuario')
    def exportar_excel_usuario(self, request):
        return api.exportar_mi_horario(request._request, 'excel')


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
        return api.aprobar_solicitud_espacio(request._request)

    @action(detail=False, methods=['post'], url_path='rechazar')
    def rechazar(self, request):
        return api.rechazar_solicitud_espacio(request._request)
