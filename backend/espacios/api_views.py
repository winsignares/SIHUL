from datetime import datetime, timedelta
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .models import EspacioFisico, EspacioPermitido
from horario.models import Horario
from prestamos.models import PrestamoEspacio
from usuarios.models import Usuario


def _filtrar_espacios_por_sede_usuario(request, queryset):
    user_sede = getattr(request, 'sede', None)
    if user_sede and user_sede.seccional_id:
        return queryset.filter(sede__seccional_id=user_sede.seccional_id)
    return queryset


def get_dia_semana_actual():
    dias = {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado',
        6: 'Domingo',
    }
    return dias[datetime.now().weekday()]


@csrf_exempt
def list_all_espacios_with_horarios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        from django.db.models import Prefetch

        user_sede = getattr(request, 'sede', None)
        base = EspacioFisico.objects.all()
        if user_sede and user_sede.seccional_id:
            base = base.filter(sede__seccional_id=user_sede.seccional_id)

        espacios = base.select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_supervisor_espacios_with_horarios(request, usuario_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if not usuario_id:
        return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

    try:
        from django.db.models import Prefetch

        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related(
            'espacio', 'espacio__sede', 'espacio__tipo'
        )

        if not espacios_permitidos.exists():
            return JsonResponse({'espacios': []}, status=200)

        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        espacios = EspacioFisico.objects.filter(id__in=espacios_ids).select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_all_espacios_disponibles_with_horarios(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        from django.db.models import Prefetch

        user_sede = getattr(request, 'sede', None)
        base = EspacioFisico.objects.all()
        if user_sede and user_sede.seccional_id:
            base = base.filter(sede__seccional_id=user_sede.seccional_id)

        espacios = base.filter(estado='Disponible').select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_supervisor_espacios_disponibles_with_horarios(request, usuario_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if not usuario_id:
        return JsonResponse({'error': 'usuario_id es requerido'}, status=400)

    try:
        from django.db.models import Prefetch

        try:
            usuario = Usuario.objects.get(id=usuario_id)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related(
            'espacio', 'espacio__sede', 'espacio__tipo'
        )

        if not espacios_permitidos.exists():
            return JsonResponse({'espacios': []}, status=200)

        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        espacios = EspacioFisico.objects.filter(id__in=espacios_ids, estado='Disponible').select_related('sede', 'tipo').prefetch_related(
            Prefetch(
                'horarios',
                queryset=Horario.objects.filter(estado='aprobado').select_related('asignatura', 'docente', 'grupo'),
            )
        )

        lista = []
        for espacio in espacios:
            horarios = []
            for h in espacio.horarios.all():
                horarios.append(
                    {
                        'dia': h.dia_semana,
                        'hora_inicio': h.hora_inicio.hour,
                        'hora_fin': h.hora_fin.hour,
                        'materia': h.asignatura.nombre if h.asignatura else 'Sin asignatura',
                        'docente': h.docente.nombre if h.docente else 'Sin docente',
                        'grupo': h.grupo.nombre if h.grupo else 'Sin grupo',
                    }
                )

            lista.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre if espacio.tipo else 'Sin tipo',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion or 'Sin ubicación',
                    'estado': espacio.estado,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'esta_abierto': espacio.esta_abierto,
                    'horarios': horarios,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def list_espacios_by_usuario(request, usuario_id=None):
    if usuario_id is None:
        return JsonResponse({'error': 'El usuario_id es requerido en la URL'}, status=400)

    try:
        usuario = Usuario.objects.get(id=usuario_id)
        espacios_permitidos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio')

        lista = []
        for ep in espacios_permitidos:
            recursos = []
            for er in ep.espacio.espacio_recursos.all():
                recursos.append({'id': er.recurso.id, 'nombre': er.recurso.nombre, 'estado': er.estado})

            lista.append(
                {
                    'id': ep.espacio.id,
                    'tipo_id': ep.espacio.tipo.id,
                    'tipo_espacio': {
                        'id': ep.espacio.tipo.id,
                        'nombre': ep.espacio.tipo.nombre,
                        'descripcion': ep.espacio.tipo.descripcion,
                    },
                    'nombre': ep.espacio.nombre,
                    'capacidad': ep.espacio.capacidad,
                    'ubicacion': ep.espacio.ubicacion,
                    'estado': ep.espacio.estado,
                    'sede_id': ep.espacio.sede.id,
                    'recursos': recursos,
                }
            )

        return JsonResponse({'espacios': lista}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def proximos_apertura_cierre(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        usuario_id = request.session.get('user_id') or request.COOKIES.get('user_id') or request.GET.get('user_id')

        if not usuario_id:
            return JsonResponse(
                {
                    'error': 'Usuario no autenticado. Por favor inicia sesión.',
                    'espacios': [],
                    'horaActual': datetime.now().strftime('%H:%M'),
                    'diaActual': get_dia_semana_actual(),
                    'fechaActual': datetime.now().date().strftime('%Y-%m-%d'),
                },
                status=200,
            )

        ahora = datetime.now()
        hora_actual = ahora.time()
        fecha_actual = ahora.date()
        dia_actual = get_dia_semana_actual()

        espacios_permitidos = EspacioPermitido.objects.filter(usuario_id=usuario_id).select_related(
            'espacio', 'espacio__sede', 'espacio__tipo'
        )

        if not espacios_permitidos.exists():
            return JsonResponse(
                {
                    'espacios': [],
                    'horaActual': hora_actual.strftime('%H:%M'),
                    'diaActual': dia_actual,
                    'fechaActual': fecha_actual.strftime('%Y-%m-%d'),
                },
                status=200,
            )

        espacios_ids = [ep.espacio.id for ep in espacios_permitidos]
        espacios_map = {ep.espacio.id: ep.espacio for ep in espacios_permitidos}
        espacios_data = {}

        horarios = Horario.objects.filter(
            espacio_id__in=espacios_ids,
            dia_semana=dia_actual,
            estado='aprobado',
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'asignatura', 'docente')

        for horario in horarios:
            espacio = espacios_map.get(horario.espacio.id)
            if not espacio:
                continue

            datetime_inicio = datetime.combine(fecha_actual, horario.hora_inicio)
            segundos_hasta_inicio = int((datetime_inicio - ahora).total_seconds())
            datetime_fin = datetime.combine(fecha_actual, horario.hora_fin)
            segundos_hasta_fin = int((datetime_fin - ahora).total_seconds())

            proxima_accion = None
            tiempo_restante_segundos = None
            minutos_restantes = 0
            segundos_restantes = 0

            if segundos_hasta_inicio > 0:
                proxima_accion = 'apertura'
                tiempo_restante_segundos = segundos_hasta_inicio
                minutos_restantes = segundos_hasta_inicio // 60
                segundos_restantes = segundos_hasta_inicio % 60
            elif segundos_hasta_fin > 0:
                proxima_accion = 'cierre'
                tiempo_restante_segundos = segundos_hasta_fin
                minutos_restantes = segundos_hasta_fin // 60
                segundos_restantes = segundos_hasta_fin % 60

            if proxima_accion and tiempo_restante_segundos:
                if espacio.id not in espacios_data:
                    espacios_data[espacio.id] = {
                        'idEspacio': espacio.id,
                        'nombreEspacio': espacio.nombre,
                        'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                        'piso': espacio.ubicacion or 'No especificado',
                        'esta_abierto': espacio.esta_abierto,
                        'estadoActual': espacio.estado,
                        'horarios': [],
                    }

                espacios_data[espacio.id]['horarios'].append(
                    {
                        'tipoUso': 'Clase',
                        'asignatura': horario.asignatura.nombre if horario.asignatura else 'Sin asignatura',
                        'docente': horario.docente.nombre if horario.docente else 'Sin docente',
                        'horaInicio': horario.hora_inicio.strftime('%H:%M'),
                        'horaFin': horario.hora_fin.strftime('%H:%M'),
                        'diaSemana': dia_actual,
                        'proximaAccion': proxima_accion,
                        'minutosRestantes': minutos_restantes,
                        'segundosRestantes': segundos_restantes,
                        'tiempoRestanteTotal': tiempo_restante_segundos,
                    }
                )

        prestamos = PrestamoEspacio.objects.filter(
            espacio_id__in=espacios_ids,
            fecha=fecha_actual,
            estado='Aprobado',
        ).select_related('espacio', 'espacio__sede', 'espacio__tipo', 'usuario', 'tipo_actividad')

        for prestamo in prestamos:
            espacio = espacios_map.get(prestamo.espacio.id)
            if not espacio:
                continue

            datetime_inicio = datetime.combine(fecha_actual, prestamo.hora_inicio)
            segundos_hasta_inicio = int((datetime_inicio - ahora).total_seconds())
            datetime_fin = datetime.combine(fecha_actual, prestamo.hora_fin)
            segundos_hasta_fin = int((datetime_fin - ahora).total_seconds())

            proxima_accion = None
            tiempo_restante_segundos = None
            minutos_restantes = 0
            segundos_restantes = 0

            if segundos_hasta_inicio > 0:
                proxima_accion = 'apertura'
                tiempo_restante_segundos = segundos_hasta_inicio
                minutos_restantes = segundos_hasta_inicio // 60
                segundos_restantes = segundos_hasta_inicio % 60
            elif segundos_hasta_fin > 0:
                proxima_accion = 'cierre'
                tiempo_restante_segundos = segundos_hasta_fin
                minutos_restantes = segundos_hasta_fin // 60
                segundos_restantes = segundos_hasta_fin % 60

            if proxima_accion and tiempo_restante_segundos:
                if espacio.id not in espacios_data:
                    espacios_data[espacio.id] = {
                        'idEspacio': espacio.id,
                        'nombreEspacio': espacio.nombre,
                        'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                        'piso': espacio.ubicacion or 'No especificado',
                        'esta_abierto': espacio.esta_abierto,
                        'estadoActual': espacio.estado,
                        'horarios': [],
                    }

                espacios_data[espacio.id]['horarios'].append(
                    {
                        'tipoUso': 'Préstamo',
                        'tipoActividad': prestamo.tipo_actividad.nombre if prestamo.tipo_actividad else 'Sin especificar',
                        'solicitante': prestamo.usuario.nombre if prestamo.usuario else 'Sin solicitante',
                        'horaInicio': prestamo.hora_inicio.strftime('%H:%M'),
                        'horaFin': prestamo.hora_fin.strftime('%H:%M'),
                        'fecha': prestamo.fecha.strftime('%Y-%m-%d'),
                        'proximaAccion': proxima_accion,
                        'minutosRestantes': minutos_restantes,
                        'segundosRestantes': segundos_restantes,
                        'tiempoRestanteTotal': tiempo_restante_segundos,
                    }
                )

        espacios_list = list(espacios_data.values())
        for espacio in espacios_list:
            espacio['horarios'].sort(key=lambda x: x['tiempoRestanteTotal'])
        espacios_list.sort(key=lambda x: x['horarios'][0]['tiempoRestanteTotal'] if x['horarios'] else float('inf'))

        return JsonResponse(
            {
                'espacios': espacios_list,
                'horaActual': hora_actual.strftime('%H:%M'),
                'diaActual': dia_actual,
                'fechaActual': fecha_actual.strftime('%Y-%m-%d'),
            },
            status=200,
        )
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_estado_espacio(request, espacio_id=None):
    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    if request.method == 'PUT':
        try:
            data = json.loads(request.body.decode('utf-8'))
            nuevo_estado = data.get('estado')

            estados_validos = ['Disponible', 'No Disponible', 'Mantenimiento']
            if nuevo_estado not in estados_validos:
                return JsonResponse({'error': f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"}, status=400)

            if nuevo_estado == 'Disponible':
                ahora = datetime.now()
                hora_actual = ahora.time()
                hora_limite = (ahora + timedelta(hours=1)).time()
                dia_actual = get_dia_semana_actual()

                hay_clase_proxima_hora = Horario.objects.filter(
                    espacio_id=espacio_id,
                    dia_semana=dia_actual,
                    estado='aprobado',
                    hora_inicio__gte=hora_actual,
                    hora_inicio__lt=hora_limite,
                ).exists()

                if hay_clase_proxima_hora:
                    return JsonResponse(
                        {'error': 'No se puede cambiar a Disponible porque hay clases programadas en la próxima hora.'}, status=400
                    )

            espacio = EspacioFisico.objects.get(id=espacio_id)
            estado_anterior = espacio.estado
            espacio.estado = nuevo_estado
            espacio.save()

            return JsonResponse(
                {
                    'message': f"Estado del espacio '{espacio.nombre}' cambiado de '{estado_anterior}' a '{nuevo_estado}' correctamente",
                    'espacio_id': espacio.id,
                    'estado_anterior': estado_anterior,
                    'estado_nuevo': nuevo_estado,
                },
                status=200,
            )
        except EspacioFisico.DoesNotExist:
            return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido en el body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET o PUT'}, status=405)

    try:
        espacio = EspacioFisico.objects.get(id=espacio_id)

        if espacio.estado == 'Mantenimiento':
            return JsonResponse({'estado': 'mantenimiento', 'texto_estado': 'En Mantenimiento', 'proxima_clase': None}, status=200)

        ahora = datetime.now()
        hora_actual = ahora.time()
        dia_actual = get_dia_semana_actual()
        clases_hoy = Horario.objects.filter(espacio=espacio, dia_semana=dia_actual, estado='aprobado').select_related(
            'asignatura', 'docente', 'grupo'
        ).order_by('hora_inicio')

        estado_actual = 'disponible'
        texto_estado = 'Disponible'
        proxima_clase_data = None

        for clase in clases_hoy:
            if clase.hora_inicio <= hora_actual < clase.hora_fin:
                estado_actual = 'ocupado'
                texto_estado = 'Ocupado'
                proxima_clase_data = {
                    'asignatura': clase.asignatura.nombre,
                    'docente': clase.docente.nombre if clase.docente else 'Sin docente',
                    'hora_inicio': clase.hora_inicio.strftime('%H:%M'),
                    'hora_fin': clase.hora_fin.strftime('%H:%M'),
                    'grupo': clase.grupo.nombre,
                }
                break

            if clase.hora_inicio > hora_actual and proxima_clase_data is None:
                proxima_clase_data = {
                    'asignatura': clase.asignatura.nombre,
                    'docente': clase.docente.nombre if clase.docente else 'Sin docente',
                    'hora_inicio': clase.hora_inicio.strftime('%H:%M'),
                    'hora_fin': clase.hora_fin.strftime('%H:%M'),
                    'grupo': clase.grupo.nombre,
                }
                inicio_dt = datetime.combine(ahora.date(), clase.hora_inicio)
                if (inicio_dt - ahora).total_seconds() <= 3600:
                    texto_estado = f"Próxima clase a las {clase.hora_inicio.strftime('%H:%M')}"

        if estado_actual == 'disponible' and proxima_clase_data is None:
            texto_estado = 'Sin clases pendientes hoy'
        elif estado_actual == 'disponible' and proxima_clase_data:
            texto_estado = f"Próxima clase a las {proxima_clase_data['hora_inicio']}"

        return JsonResponse({'estado': estado_actual, 'texto_estado': texto_estado, 'proxima_clase': proxima_clase_data}, status=200)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_horario_espacio(request, espacio_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    try:
        if not EspacioFisico.objects.filter(id=espacio_id).exists():
            return JsonResponse({'error': 'Espacio no encontrado'}, status=404)

        user_sede = getattr(request, 'sede', None)
        if user_sede and user_sede.seccional_id:
            if not EspacioFisico.objects.filter(id=espacio_id, sede__seccional_id=user_sede.seccional_id).exists():
                return JsonResponse({'error': 'No tienes permiso para ver el horario de este espacio'}, status=403)

        horarios = Horario.objects.filter(espacio_id=espacio_id, estado='aprobado').select_related('asignatura', 'docente', 'grupo')
        lista_horarios = []
        for h in horarios:
            lista_horarios.append(
                {
                    'dia': h.dia_semana,
                    'hora_inicio': h.hora_inicio.hour,
                    'hora_fin': h.hora_fin.hour,
                    'materia': h.asignatura.nombre,
                    'docente': h.docente.nombre if h.docente else 'Sin docente',
                    'grupo': h.grupo.nombre,
                    'estado': 'ocupado',
                }
            )

        return JsonResponse({'horario': lista_horarios}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def _calcular_duracion_horas(hora_inicio, hora_fin):
    from datetime import datetime as dt, time

    inicio_dt = dt.combine(dt.today(), hora_inicio) if isinstance(hora_inicio, time) else hora_inicio
    fin_dt = dt.combine(dt.today(), hora_fin) if isinstance(hora_fin, time) else hora_fin
    duracion = (fin_dt - inicio_dt).total_seconds() / 3600
    return max(0, duracion)


def _calcular_interseccion_horas(inicio1, fin1, inicio2, fin2):
    inicio_interseccion = max(inicio1, inicio2)
    fin_interseccion = min(fin1, fin2)
    if inicio_interseccion >= fin_interseccion:
        return 0
    duracion = (fin_interseccion - inicio_interseccion).total_seconds() / 3600
    return max(0, duracion)


def _distribuir_horas_en_jornadas(hora_inicio, hora_fin):
    from datetime import datetime as dt, time

    hora_6 = time(6, 0)
    hora_12 = time(12, 0)
    hora_18 = time(18, 0)
    hora_22 = time(22, 0)

    inicio_dt = dt.combine(dt.today(), hora_inicio) if isinstance(hora_inicio, time) else hora_inicio
    fin_dt = dt.combine(dt.today(), hora_fin) if isinstance(hora_fin, time) else hora_fin

    manana_inicio = dt.combine(dt.today(), hora_6)
    manana_fin = dt.combine(dt.today(), hora_12)
    tarde_inicio = dt.combine(dt.today(), hora_12)
    tarde_fin = dt.combine(dt.today(), hora_18)
    noche_inicio = dt.combine(dt.today(), hora_18)
    noche_fin = dt.combine(dt.today(), hora_22)

    return {
        'manana': _calcular_interseccion_horas(inicio_dt, fin_dt, manana_inicio, manana_fin),
        'tarde': _calcular_interseccion_horas(inicio_dt, fin_dt, tarde_inicio, tarde_fin),
        'noche': _calcular_interseccion_horas(inicio_dt, fin_dt, noche_inicio, noche_fin),
    }


@csrf_exempt
def ocupacion_semanal(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    try:
        from django.utils import timezone

        tipo_espacio_id = request.GET.get('tipo_espacio_id')
        espacio_id = request.GET.get('espacio_id')
        semana_offset = int(request.GET.get('semana_offset', 0))

        hoy = timezone.now().date()
        dias_hasta_lunes = (hoy.weekday() - 0) % 7
        lunes = hoy - timedelta(days=dias_hasta_lunes)
        lunes += timedelta(weeks=semana_offset)
        sabado = lunes + timedelta(days=5)

        dias_nombre = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo',
        }

        espacios_query = _filtrar_espacios_por_sede_usuario(request, EspacioFisico.objects.all().select_related('tipo', 'sede'))
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)
        if espacio_id:
            espacios_query = espacios_query.filter(id=espacio_id)

        ocupacion_list = []
        for espacio in espacios_query:
            horas_manana = 0.0
            horas_tarde = 0.0
            horas_noche = 0.0
            horas_disponibles = 16 * 6

            fecha_actual = lunes
            while fecha_actual <= sabado:
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)

                horarios_dia = Horario.objects.filter(espacio=espacio, dia_semana__iexact=dia_nombre_es, estado='aprobado')
                if not horarios_dia.exists():
                    horarios_dia = Horario.objects.filter(espacio=espacio, dia_semana__iexact=dia_nombre_en, estado='aprobado')

                prestamos_dia = PrestamoEspacio.objects.filter(espacio=espacio, fecha=fecha_actual, estado='Aprobado')

                for horario in horarios_dia:
                    horas_ocupadas = _distribuir_horas_en_jornadas(horario.hora_inicio, horario.hora_fin)
                    horas_manana += horas_ocupadas['manana']
                    horas_tarde += horas_ocupadas['tarde']
                    horas_noche += horas_ocupadas['noche']

                for prestamo in prestamos_dia:
                    horas_ocupadas = _distribuir_horas_en_jornadas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_manana += horas_ocupadas['manana']
                    horas_tarde += horas_ocupadas['tarde']
                    horas_noche += horas_ocupadas['noche']

                fecha_actual += timedelta(days=1)

            horas_manana = min(horas_manana, 36)
            horas_tarde = min(horas_tarde, 36)
            horas_noche = min(horas_noche, 24)
            horas_totales = horas_manana + horas_tarde + horas_noche

            porcentaje_manana = (horas_manana / 36) * 100 if horas_manana > 0 else 0
            porcentaje_tarde = (horas_tarde / 36) * 100 if horas_tarde > 0 else 0
            porcentaje_noche = (horas_noche / 24) * 100 if horas_noche > 0 else 0
            porcentaje_ocupacion = (horas_totales / horas_disponibles) * 100 if horas_totales > 0 else 0

            ocupacion_list.append(
                {
                    'id': espacio.id,
                    'nombre': espacio.nombre,
                    'tipo': espacio.tipo.nombre,
                    'ubicacion': espacio.ubicacion or 'Sin ubicación',
                    'capacidad': espacio.capacidad,
                    'sede': espacio.sede.nombre if espacio.sede else 'Sin sede',
                    'edificio': espacio.ubicacion.split('-')[0] if espacio.ubicacion and '-' in espacio.ubicacion else 'N/A',
                    'horasOcupadasSemana': round(horas_totales, 2),
                    'horasDisponibles': horas_disponibles,
                    'horasOcupadasManana': round(horas_manana, 2),
                    'horasOcupadasTarde': round(horas_tarde, 2),
                    'horasOcupadasNoche': round(horas_noche, 2),
                    'porcentajeOcupacion': round(porcentaje_ocupacion, 2),
                    'porcentajeManana': round(porcentaje_manana, 2),
                    'porcentajeTarde': round(porcentaje_tarde, 2),
                    'porcentajeNoche': round(porcentaje_noche, 2),
                    'jornada': {
                        'manana': round(porcentaje_manana, 1),
                        'tarde': round(porcentaje_tarde, 1),
                        'noche': round(porcentaje_noche, 1),
                    },
                    'estado': espacio.estado,
                }
            )

        return JsonResponse({'semana_inicio': lunes.isoformat(), 'semana_fin': sabado.isoformat(), 'ocupacion': ocupacion_list}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

