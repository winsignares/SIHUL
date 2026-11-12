import logging
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from mysite.auth_helpers import get_user_seccional_id
from ..models import Horario
from mysite.auth_helpers import SECCIONAL_PUBLICA_REQUERIDA, seccional_publica, ve_todas_las_seccionales
from mysite.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .acceso import _get_authenticated_seccional_scope, _get_request_user


logger = logging.getLogger(__name__)


@csrf_exempt
def list_horarios_extendidos(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    usuario = _get_request_user(request)
    es_consulta_publica = usuario is None
    include_pending = request.GET.get('include_pending', '').lower() in ('1', 'true', 'yes')
    estado_horario = (request.GET.get('estado_horario') or request.GET.get('estadoHorario') or '').strip().lower()

    qs = Horario.objects.select_related('grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa', 'grupo__periodo')
    # Ningún usuario público puede descubrir horarios pendientes, aunque el
    # frontend incluya el parámetro heredado include_pending=1.
    if es_consulta_publica:
        qs = qs.filter(estado='aprobado')
    elif estado_horario == 'pendiente':
        qs = qs.filter(estado='pendiente')
    elif estado_horario in ('todos', 'all') or include_pending:
        qs = qs.filter(estado__in=['aprobado', 'pendiente'])
    else:
        qs = qs.filter(estado='aprobado')

    if es_consulta_publica:
        # Consulta pública: solo los horarios de la seccional que eligió el visitante
        seccional_elegida = seccional_publica(request)
        if not seccional_elegida:
            return JsonResponse(SECCIONAL_PUBLICA_REQUERIDA, status=400)
        qs = qs.filter(espacio__sede__seccional_id=seccional_elegida)

    seccional_scope_id, is_superuser = _get_authenticated_seccional_scope(request)
    if not es_consulta_publica and not is_superuser:
        if seccional_scope_id:
            qs = qs.filter(espacio__sede__seccional_id=seccional_scope_id)
        else:
            return _missing_seccional_response()

    # Filtro opcional por rango de fecha_inicio (mismo criterio que el
    # frontend en useConsultaEspacios.ts): si vienen ambos parametros, solo
    # se incluyen horarios cuya fecha_inicio caiga en el rango, mas los que
    # no tienen fecha_inicio (manuales o sin sincronizar). Sin parametros no
    # filtra, para no romper otras pantallas que listan horarios completos.
    fecha_inicio_qs = request.GET.get('fecha_inicio')
    fecha_fin_qs = request.GET.get('fecha_fin')
    if fecha_inicio_qs and fecha_fin_qs:
        qs = qs.filter(
            Q(fecha_inicio__isnull=True)
            | Q(fecha_inicio__gte=fecha_inicio_qs, fecha_inicio__lte=fecha_fin_qs)
        )

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
                'periodo_id': grupo.periodo_id if grupo else None,
                'periodo_nombre': grupo.periodo.nombre if grupo and grupo.periodo else None,
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
                'fecha_inicio': str(i.fecha_inicio) if i.fecha_inicio else None,
                'fecha_fin': str(i.fecha_fin) if i.fecha_fin else None,
                'cantidad_estudiantes': i.cantidad_estudiantes,
                'estado': i.estado,
            }
        )

    return JsonResponse({'horarios': lst}, status=200)


@csrf_exempt
def list_horarios_asignacion_espacios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

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

    seccional_scope_id, is_superuser = _get_authenticated_seccional_scope(request)
    seccional_filter_id = seccional_id if is_superuser else seccional_scope_id

    if seccional_filter_id:
        qs = qs.filter(
            Q(espacio__sede__seccional_id=seccional_filter_id)
            | Q(espacio__isnull=True, grupo__programa__facultad__sede__seccional_id=seccional_filter_id)
        )
    elif not is_superuser:
        return _missing_seccional_response()

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
        # Sin sesión es una consulta pública: solo ve horarios aprobados (igual que list_horarios_extendidos).
        es_consulta_publica = _get_request_user(request) is None

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

        # Ningún usuario público puede descubrir horarios pendientes ni rechazados, aunque el frontend los pida.
        if es_consulta_publica:
            horarios_qs = horarios_qs.filter(estado='aprobado')

        # Con sesión, cada seccional ve solo sus horarios (por el espacio o, si aún no tiene, por el programa del grupo).
        # El administrador general ve todo. La consulta pública puede acotar con `seccional_id`.
        usuario = _get_request_user(request)
        seccional_pedida = seccional_publica(request)
        if usuario is None and not seccional_pedida:
            return JsonResponse(SECCIONAL_PUBLICA_REQUERIDA, status=400)
        if usuario is not None and not ve_todas_las_seccionales(usuario):
            seccional_id = get_user_seccional_id(usuario)
            if not seccional_id:
                return _missing_seccional_response()
            horarios_qs = horarios_qs.filter(
                Q(espacio__sede__seccional_id=seccional_id)
                | Q(espacio__isnull=True, grupo__programa__facultad__sede__seccional_id=seccional_id)
            )
        elif usuario is None:
            horarios_qs = horarios_qs.filter(
                Q(espacio__sede__seccional_id=seccional_pedida)
                | Q(espacio__isnull=True, grupo__programa__facultad__sede__seccional_id=seccional_pedida)
            )

        # Filtro opcional por rango de fecha_inicio (mismo criterio que el
        # frontend en useConsultaEspacios.ts): sin esto, esta consulta trae
        # TODOS los horarios del periodo completo (una fila por semana por
        # clase desde que migrate_horarios dejo de fusionar ocurrencias),
        # lo que puede superar decenas de miles de filas y provocar timeout.
        fecha_inicio_qs = request.GET.get('fecha_inicio')
        fecha_fin_qs = request.GET.get('fecha_fin')
        if fecha_inicio_qs and fecha_fin_qs:
            horarios_qs = horarios_qs.filter(
                Q(fecha_inicio__isnull=True)
                | Q(fecha_inicio__gte=fecha_inicio_qs, fecha_inicio__lte=fecha_fin_qs)
            )

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
                'fecha_inicio': str(h.fecha_inicio) if h.fecha_inicio else None,
                'fecha_fin': str(h.fecha_fin) if h.fecha_fin else None,
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

    except Exception:
        # Es una consulta pública: nunca se devuelve el texto del error interno.
        logger.exception('Error en horarios_por_periodo')
        return JsonResponse({'error': 'No se pudieron consultar los horarios'}, status=500)
