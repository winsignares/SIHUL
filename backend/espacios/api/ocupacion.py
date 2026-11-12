from datetime import timedelta
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .. import ocupacion
from ..models import EspacioFisico
from mysite.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .filtros import _filtrar_espacios_por_sede_usuario, _usuario_sin_seccional


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

        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

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

        espacios = list(espacios_query)
        dias = []
        fecha_actual = lunes
        while fecha_actual <= sabado:
            dia_nombre_en = fecha_actual.strftime('%A')
            dias.append((fecha_actual, dias_nombre.get(dia_nombre_en, dia_nombre_en), dia_nombre_en))
            fecha_actual += timedelta(days=1)
        semana = ocupacion.cargar_semana([espacio.id for espacio in espacios], dias)

        ocupacion_list = []
        for espacio in espacios:
            horas_manana = 0.0
            horas_tarde = 0.0
            horas_noche = 0.0
            horas_disponibles = 16 * 6

            for _fecha, horarios_dia, prestamos_dia in semana.get(espacio.id, []):
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
