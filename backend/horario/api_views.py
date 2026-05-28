import datetime
import json

from django.db.models import Q
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from notificaciones.signals import crear_notificacion
from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from usuarios.models import Usuario
from espacios.models import EspacioFisico

from .models import Horario, HorarioEstudiante, SolicitudEspacio


def _get_request_user(request):
    user = getattr(request, 'user_obj', None)
    if user:
        return user
    user = getattr(request, 'user', None)
    if user and getattr(user, 'is_authenticated', False):
        return user
    return None


def _is_admin_user(user):
    if not user:
        return False
    if getattr(user, 'es_superusuario', False):
        return True
    role_name = get_role_name(user)
    return is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero'


def _require_auth(request):
    user = _get_request_user(request)
    if not user:
        return None, JsonResponse({'error': 'Autenticación requerida'}, status=403)
    return user, None


@csrf_exempt
def mi_horario_docente(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        if not usuario_id:
            return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

        if not _is_admin_user(user) and user.id != int(usuario_id):
            return JsonResponse({'error': 'No autorizado'}, status=403)

        try:
            docente = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        horarios = Horario.objects.filter(docente=docente, estado='aprobado').select_related(
            'grupo', 'asignatura', 'espacio', 'grupo__programa'
        )

        lst = []
        for h in horarios:
            lst.append(
                {
                    'id': h.id,
                    'diaSemana': h.dia_semana,
                    'horaInicio': str(h.hora_inicio),
                    'horaFin': str(h.hora_fin),
                    'asignaturaId': h.asignatura.id,
                    'asignatura': h.asignatura.nombre,
                    'grupoId': h.grupo.id,
                    'grupo': h.grupo.nombre,
                    'espacioId': h.espacio.id,
                    'espacio': h.espacio.nombre,
                    'docenteId': h.docente.id if h.docente else None,
                    'docente': h.docente.nombre if h.docente else 'Sin asignar',
                    'cantidadEstudiantes': h.cantidad_estudiantes,
                    'programa': h.grupo.programa.nombre if h.grupo.programa else None,
                    'semestre': h.grupo.semestre,
                }
            )

        return JsonResponse({'horarios': lst}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def mi_horario_estudiante(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        if not usuario_id:
            return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

        if not _is_admin_user(user) and user.id != int(usuario_id):
            return JsonResponse({'error': 'No autorizado'}, status=403)

        try:
            estudiante = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        inscripciones = HorarioEstudiante.objects.filter(estudiante=estudiante).select_related(
            'horario',
            'horario__grupo',
            'horario__asignatura',
            'horario__espacio',
            'horario__docente',
            'horario__grupo__programa',
        )

        lst = []
        for insc in inscripciones:
            h = insc.horario
            lst.append(
                {
                    'id': h.id,
                    'diaSemana': h.dia_semana,
                    'horaInicio': str(h.hora_inicio),
                    'horaFin': str(h.hora_fin),
                    'asignaturaId': h.asignatura.id,
                    'asignatura': h.asignatura.nombre,
                    'grupoId': h.grupo.id,
                    'grupo': h.grupo.nombre,
                    'espacioId': h.espacio.id,
                    'espacio': h.espacio.nombre,
                    'docenteId': h.docente.id if h.docente else None,
                    'docente': h.docente.nombre if h.docente else 'Sin asignar',
                    'cantidadEstudiantes': h.cantidad_estudiantes,
                    'programa': h.grupo.programa.nombre if h.grupo.programa else None,
                    'semestre': h.grupo.semestre,
                }
            )

        return JsonResponse({'horarios': lst}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def inscribir_estudiante(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        usuario_id = data.get('usuario_id')
        horario_id = data.get('horario_id')

        if not usuario_id or not horario_id:
            return JsonResponse({'error': 'usuario_id y horario_id son requeridos'}, status=400)

        estudiante = Usuario.objects.get(id=usuario_id)
        horario = Horario.objects.get(id=horario_id)
        _, created = HorarioEstudiante.objects.get_or_create(estudiante=estudiante, horario=horario)

        if created:
            return JsonResponse({'message': 'Estudiante inscrito correctamente'}, status=201)
        return JsonResponse({'message': 'El estudiante ya estaba inscrito'}, status=200)

    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Estudiante no encontrado'}, status=404)
    except Horario.DoesNotExist:
        return JsonResponse({'error': 'Horario no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_horarios_extendidos(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    user_sede = getattr(request, 'sede', None)
    include_pending = request.GET.get('include_pending', '').lower() in ('1', 'true', 'yes')

    qs = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa')
    if include_pending:
        qs = qs.filter(estado__in=['aprobado', 'pendiente'])
    else:
        qs = qs.filter(estado='aprobado')

    if user_sede and user_sede.seccional_id:
        qs = qs.filter(espacio__sede__seccional_id=user_sede.seccional_id)

    lst = []
    for i in qs:
        grupo = i.grupo
        programa = grupo.programa if grupo else None
        asignatura = i.asignatura
        espacio = i.espacio
        lst.append(
            {
                'id': i.id,
                'grupo_id': grupo.id if grupo else None,
                'grupo_nombre': grupo.nombre if grupo else 'Sin grupo',
                'programa_id': programa.id if programa else None,
                'programa_nombre': programa.nombre if programa else 'Sin programa',
                'semestre': grupo.semestre if grupo else None,
                'asignatura_id': asignatura.id if asignatura else None,
                'asignatura_nombre': asignatura.nombre if asignatura else 'Sin asignatura',
                'docente_id': (i.docente.id if i.docente else None),
                'docente_nombre': i.docente.nombre if i.docente else 'Sin asignar',
                'espacio_id': espacio.id if espacio else None,
                'espacio_nombre': espacio.nombre if espacio else 'Sin espacio',
                'dia_semana': i.dia_semana,
                'hora_inicio': str(i.hora_inicio),
                'hora_fin': str(i.hora_fin),
                'cantidad_estudiantes': i.cantidad_estudiantes,
                'estado': i.estado,
            }
        )

    return JsonResponse({'horarios': lst}, status=200)


@csrf_exempt
def list_horarios_asignacion_espacios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    user_sede = getattr(request, 'sede', None)

    seccional_id = request.GET.get('seccional_id')
    programa_id = request.GET.get('programa_id')
    grupo_id = request.GET.get('grupo_id')
    docente_id = request.GET.get('docente_id')
    asignatura_id = request.GET.get('asignatura_id')
    periodo_id = request.GET.get('periodo_id')
    dia_semana = request.GET.get('dia_semana')
    estado = request.GET.get('estado')
    solo_sin_espacio = request.GET.get('solo_sin_espacio', '1').lower() in ('1', 'true', 'yes')

    qs = Horario.objects.select_related(
        'grupo',
        'grupo__programa',
        'grupo__programa__facultad',
        'grupo__programa__facultad__sede',
        'asignatura',
        'docente',
        'espacio',
        'espacio__sede',
    )

    if estado:
        estados = [item.strip() for item in estado.split(',') if item.strip()]
        if estados:
            qs = qs.filter(estado__in=estados)
    else:
        qs = qs.filter(estado__in=['aprobado', 'pendiente'])

    if solo_sin_espacio:
        qs = qs.filter(espacio__isnull=True)

    if programa_id:
        qs = qs.filter(grupo__programa_id=programa_id)

    if grupo_id:
        qs = qs.filter(grupo_id=grupo_id)

    if docente_id:
        qs = qs.filter(docente_id=docente_id)

    if asignatura_id:
        qs = qs.filter(asignatura_id=asignatura_id)

    if periodo_id:
        qs = qs.filter(grupo__periodo_id=periodo_id)

    if dia_semana:
        qs = qs.filter(dia_semana__iexact=dia_semana)

    seccional_filter_id = None
    if user_sede and user_sede.seccional_id:
        seccional_filter_id = user_sede.seccional_id

    if seccional_filter_id:
        qs = qs.filter(
            Q(espacio__sede__seccional_id=seccional_filter_id)
            | Q(espacio__isnull=True, grupo__programa__facultad__sede__seccional_id=seccional_filter_id)
        )

    def resolve_sede(horario):
        if horario.espacio and horario.espacio.sede:
            return horario.espacio.sede

        grupo = horario.grupo
        programa = grupo.programa if grupo else None
        facultad = programa.facultad if programa else None
        return facultad.sede if facultad else None

    lst = []
    for i in qs:
        grupo = i.grupo
        programa = grupo.programa if grupo else None
        asignatura = i.asignatura
        espacio = i.espacio
        sede = resolve_sede(i)
        seccional = sede.seccional if sede else None

        lst.append(
            {
                'id': i.id,
                'grupo_id': grupo.id if grupo else None,
                'grupo_nombre': grupo.nombre if grupo else 'Sin grupo',
                'programa_id': programa.id if programa else None,
                'programa_nombre': programa.nombre if programa else 'Sin programa',
                'semestre': grupo.semestre if grupo else None,
                'asignatura_id': asignatura.id if asignatura else None,
                'asignatura_nombre': asignatura.nombre if asignatura else 'Sin asignatura',
                'docente_id': (i.docente.id if i.docente else None),
                'docente_nombre': i.docente.nombre if i.docente else 'Sin asignar',
                'espacio_id': espacio.id if espacio else None,
                'espacio_nombre': espacio.nombre if espacio else 'Sin espacio',
                'dia_semana': i.dia_semana,
                'hora_inicio': str(i.hora_inicio),
                'hora_fin': str(i.hora_fin),
                'cantidad_estudiantes': i.cantidad_estudiantes,
                'estado': i.estado,
                'sede_id': sede.id if sede else None,
                'sede_nombre': sede.nombre if sede else None,
                'seccional_id': seccional.id if seccional else None,
                'seccional_nombre': seccional.ciudad if seccional else None,
                'periodo_id': grupo.periodo_id if grupo else None,
            }
        )

    return JsonResponse({'horarios': lst}, status=200)


@csrf_exempt
def asignar_espacio_horario(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        horario_id = data.get('horario_id')
        espacio_id = data.get('espacio_id')

        if not horario_id or not espacio_id:
            return JsonResponse({'error': 'horario_id y espacio_id son requeridos'}, status=400)

        horario = Horario.objects.select_related(
            'grupo',
            'grupo__programa',
            'grupo__programa__facultad',
            'grupo__programa__facultad__sede',
            'espacio',
            'espacio__sede',
        ).get(id=horario_id)
        espacio = EspacioFisico.objects.select_related('sede').get(id=espacio_id)

        user_sede = getattr(request, 'sede', None)
        espacio_seccional_id = espacio.sede.seccional_id if espacio.sede else None

        horario_sede = None
        if horario.espacio and horario.espacio.sede:
            horario_sede = horario.espacio.sede
        else:
            grupo = horario.grupo
            programa = grupo.programa if grupo else None
            facultad = programa.facultad if programa else None
            horario_sede = facultad.sede if facultad else None

        horario_seccional_id = horario_sede.seccional_id if horario_sede else None

        if horario_seccional_id and espacio_seccional_id and horario_seccional_id != espacio_seccional_id:
            return JsonResponse({'error': 'El espacio no pertenece a la misma seccional del horario.'}, status=400)

        if user_sede and user_sede.seccional_id and espacio_seccional_id and user_sede.seccional_id != espacio_seccional_id:
            return JsonResponse({'error': 'El espacio no pertenece a la seccional del usuario.'}, status=403)

        horario.espacio = espacio
        horario.save()

        return JsonResponse(
            {
                'message': 'Espacio asignado correctamente',
                'horario_id': horario.id,
                'espacio_id': espacio.id,
                'espacio_nombre': espacio.nombre,
            },
            status=200,
        )
    except ValidationError as e:
        return JsonResponse({'error': str(e.message)}, status=400)
    except Horario.DoesNotExist:
        return JsonResponse({'error': 'Horario no encontrado'}, status=404)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def aprobar_solicitud_espacio(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        solicitud_id = data.get('solicitud_id')
        admin_id = data.get('admin_id')
        comentario = data.get('comentario', '')

        if not solicitud_id or not admin_id:
            return JsonResponse({'error': 'solicitud_id y admin_id son requeridos'}, status=400)

        solicitud = SolicitudEspacio.objects.get(id=solicitud_id)
        admin = Usuario.objects.get(id=admin_id)

        if solicitud.horario_generado:
            solicitud.horario_generado.delete()
            solicitud.horario_generado = None

        horario = Horario(
            grupo=solicitud.grupo,
            asignatura=solicitud.asignatura,
            docente=solicitud.docente,
            espacio=solicitud.espacio_solicitado,
            dia_semana=solicitud.dia_semana,
            hora_inicio=solicitud.hora_inicio,
            hora_fin=solicitud.hora_fin,
            cantidad_estudiantes=solicitud.cantidad_estudiantes,
            estado='aprobado',
        )
        horario.save()

        solicitud.estado = 'aprobada'
        solicitud.horario_generado = horario
        solicitud.aprobado_por = admin
        solicitud.fecha_aprobacion = datetime.datetime.now()
        solicitud.comentario = comentario
        solicitud.save()

        if solicitud.planificador:
            crear_notificacion(
                id_usuario=solicitud.planificador.id,
                tipo='solicitud_aprobada',
                mensaje=f'✅ Tu solicitud de espacio para {solicitud.asignatura.nombre} - Grupo {solicitud.grupo.nombre} ha sido aprobada',
                prioridad='alta',
            )

        return JsonResponse({'message': 'Solicitud aprobada y horario creado', 'solicitud_id': solicitud.id, 'horario_id': horario.id}, status=200)
    except ValidationError as e:
        return JsonResponse({'error': str(e.message)}, status=400)
    except SolicitudEspacio.DoesNotExist:
        return JsonResponse({'error': 'Solicitud no encontrada'}, status=404)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Admin no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def rechazar_solicitud_espacio(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        solicitud_id = data.get('solicitud_id')
        admin_id = data.get('admin_id')
        comentario = data.get('comentario', '')

        if not solicitud_id or not admin_id:
            return JsonResponse({'error': 'solicitud_id y admin_id son requeridos'}, status=400)

        solicitud = SolicitudEspacio.objects.get(id=solicitud_id)
        admin = Usuario.objects.get(id=admin_id)

        if solicitud.horario_generado:
            solicitud.horario_generado.delete()
            solicitud.horario_generado = None

        solicitud.estado = 'rechazada'
        solicitud.aprobado_por = admin
        solicitud.fecha_aprobacion = datetime.datetime.now()
        solicitud.comentario = comentario
        solicitud.save()

        if solicitud.planificador:
            mensaje_rechazo = (
                f'❌ Tu solicitud de espacio para {solicitud.asignatura.nombre} - Grupo {solicitud.grupo.nombre} ha sido rechazada'
            )
            if comentario:
                mensaje_rechazo += f'\n\n📋 Motivo:\n{comentario}'

            crear_notificacion(
                id_usuario=solicitud.planificador.id,
                tipo='solicitud_rechazada',
                mensaje=mensaje_rechazo,
                prioridad='alta',
            )

        return JsonResponse({'message': 'Solicitud rechazada', 'solicitud_id': solicitud.id}, status=200)
    except SolicitudEspacio.DoesNotExist:
        return JsonResponse({'error': 'Solicitud no encontrada'}, status=404)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Admin no encontrado'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def horarios_por_periodo(request):
    """Lista todos los horarios asociados a un período académico específico.
    
    Query params:
    - periodo_id: int (requerido) - ID del período académico
    - estado: str (opcional) - Estado único o lista CSV (ej: 'aprobado,pendiente')
    - estados[]: str[] (opcional) - Estados múltiples repetidos en query
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        periodo_id = request.GET.get('periodo_id')
        estado_raw = request.GET.get('estado')
        estados_array = request.GET.getlist('estados[]') or request.GET.getlist('estados')

        if not periodo_id:
            return JsonResponse({'error': 'periodo_id es requerido'}, status=400)

        from periodos.models import PeriodoAcademico
        from grupos.models import Grupo

        try:
            periodo = PeriodoAcademico.objects.get(id=periodo_id)
        except PeriodoAcademico.DoesNotExist:
            return JsonResponse({'error': 'Período no encontrado'}, status=404)

        grupos_del_periodo = Grupo.objects.filter(periodo=periodo).values_list('id', flat=True)

        horarios_qs = Horario.objects.filter(
            grupo_id__in=grupos_del_periodo
        ).select_related(
            'grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa'
        )

        estados = []

        if estado_raw:
            estados.extend([s.strip().lower() for s in estado_raw.split(',') if s.strip()])

        if estados_array:
            for estado_item in estados_array:
                estados.extend([s.strip().lower() for s in estado_item.split(',') if s.strip()])

        if estados:
            estados_validos = {'aprobado', 'pendiente', 'rechazado'}
            estados_filtrados = [e for e in dict.fromkeys(estados) if e in estados_validos]

            if not estados_filtrados:
                return JsonResponse(
                    {'error': 'estado inválido. Valores permitidos: aprobado, pendiente, rechazado'},
                    status=400
                )

            horarios_qs = horarios_qs.filter(estado__in=estados_filtrados)

        lst = []
        for h in horarios_qs:
            grupo = h.grupo
            periodo_grupo = grupo.periodo if grupo else None
            programa = grupo.programa if grupo else None
            asignatura = h.asignatura
            espacio = h.espacio
            lst.append({
                'id': h.id,
                'grupo_id': grupo.id if grupo else None,
                'grupo_nombre': grupo.nombre if grupo else 'Sin grupo',
                'periodo_id': periodo_grupo.id if periodo_grupo else None,
                'periodo_nombre': periodo_grupo.nombre if periodo_grupo else None,
                'programa_id': programa.id if programa else None,
                'programa_nombre': programa.nombre if programa else 'Sin programa',
                'semestre': grupo.semestre if grupo else None,
                'asignatura_id': asignatura.id if asignatura else None,
                'asignatura_nombre': asignatura.nombre if asignatura else 'Sin asignatura',
                'docente_id': h.docente.id if h.docente else None,
                'docente_nombre': h.docente.nombre if h.docente else 'Sin asignar',
                'espacio_id': espacio.id if espacio else None,
                'espacio_nombre': espacio.nombre if espacio else 'Sin espacio',
                'dia_semana': h.dia_semana,
                'hora_inicio': str(h.hora_inicio),
                'hora_fin': str(h.hora_fin),
                'cantidad_estudiantes': h.cantidad_estudiantes,
                'estado': h.estado,
            })

        return JsonResponse({
            'periodo_id': periodo.id,
            'periodo_nombre': periodo.nombre,
            'fecha_inicio': str(periodo.fecha_inicio),
            'fecha_fin': str(periodo.fecha_fin),
            'activo': periodo.activo,
            'total_horarios': len(lst),
            'horarios': lst
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

