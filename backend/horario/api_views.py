import datetime
import json

from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from notificaciones.signals import crear_notificacion
from usuarios.models import Usuario

from .models import Horario, HorarioEstudiante, SolicitudEspacio


@csrf_exempt
def mi_horario_docente(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        if not usuario_id:
            return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

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
        usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
        if not usuario_id:
            return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

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
        lst.append(
            {
                'id': i.id,
                'grupo_id': i.grupo.id,
                'grupo_nombre': i.grupo.nombre,
                'programa_id': i.grupo.programa.id,
                'programa_nombre': i.grupo.programa.nombre,
                'semestre': i.grupo.semestre,
                'asignatura_id': i.asignatura.id,
                'asignatura_nombre': i.asignatura.nombre,
                'docente_id': (i.docente.id if i.docente else None),
                'docente_nombre': i.docente.nombre if i.docente else 'Sin asignar',
                'espacio_id': i.espacio.id,
                'espacio_nombre': i.espacio.nombre,
                'dia_semana': i.dia_semana,
                'hora_inicio': str(i.hora_inicio),
                'hora_fin': str(i.hora_fin),
                'cantidad_estudiantes': i.cantidad_estudiantes,
                'estado': i.estado,
            }
        )

    return JsonResponse({'horarios': lst}, status=200)


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
            lst.append({
                'id': h.id,
                'grupo_id': h.grupo.id,
                'grupo_nombre': h.grupo.nombre,
                'periodo_id': h.grupo.periodo.id,
                'periodo_nombre': h.grupo.periodo.nombre,
                'programa_id': h.grupo.programa.id,
                'programa_nombre': h.grupo.programa.nombre,
                'semestre': h.grupo.semestre,
                'asignatura_id': h.asignatura.id,
                'asignatura_nombre': h.asignatura.nombre,
                'docente_id': h.docente.id if h.docente else None,
                'docente_nombre': h.docente.nombre if h.docente else 'Sin asignar',
                'espacio_id': h.espacio.id,
                'espacio_nombre': h.espacio.nombre,
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

