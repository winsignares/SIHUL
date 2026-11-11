from . import ocupacion, reportes_pdf
from .models import EspacioFisico
from horario.models import Horario
from prestamos.models import PrestamoEspacio
from django.http import FileResponse, JsonResponse
from io import BytesIO
import json
from django.views.decorators.csrf import csrf_exempt
from datetime import timedelta, time
from django.utils import timezone
from collections import defaultdict
import unicodedata

from .api_views import (
    _calcular_duracion_horas,
    _distribuir_horas_en_jornadas,
    _filtrar_espacios_por_sede_usuario,
)


# Nombre en español de cada día, por su nombre en inglés (strftime('%A'))
DIAS_NOMBRE = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
}


def _semana(semana_offset):
    """Lunes y sábado de la semana actual desplazada semana_offset semanas."""
    hoy = timezone.now().date()
    lunes = hoy - timedelta(days=hoy.weekday()) + timedelta(weeks=semana_offset)
    return lunes, lunes + timedelta(days=5)


def _descarga_pdf(contenido, nombre):
    response = FileResponse(BytesIO(contenido), as_attachment=True, filename=nombre)
    response['Content-Type'] = 'application/pdf'
    return response


def _env_bool_param(value):
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on', 'si', 'sí'}


def _estados_horario_reporte(estado_horario='aprobado', include_pending=False):
    if isinstance(estado_horario, bool):
        include_pending = estado_horario
        estado_horario = 'todos' if include_pending else 'aprobado'

    estado_normalizado = str(estado_horario or '').strip().lower()
    if estado_normalizado == 'pendiente':
        return ['pendiente']
    if estado_normalizado in {'todos', 'all'} or include_pending:
        return ['aprobado', 'pendiente']
    return ['aprobado']


def _estado_horario_param(request, data=None):
    if data is not None:
        estado = data.get('estado_horario') or data.get('estadoHorario')
        include_pending = bool(data.get('include_pending') or data.get('includePending'))
    else:
        estado = request.GET.get('estado_horario') or request.GET.get('estadoHorario')
        include_pending = _env_bool_param(request.GET.get('include_pending') or request.GET.get('includePending'))

    if estado:
        return str(estado).strip().lower()
    return 'todos' if include_pending else 'aprobado'


def _normalizar_dia_semana(valor):
    texto = str(valor or '').strip().lower()
    return ''.join(
        char for char in unicodedata.normalize('NFD', texto)
        if unicodedata.category(char) != 'Mn'
    )


def _iterar_fechas_semana(lunes, sabado):
    fecha_actual = lunes
    while fecha_actual <= sabado:
        yield fecha_actual
        fecha_actual += timedelta(days=1)


def _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending=False):
    espacios_lista = list(espacios)
    espacios_ids = [espacio.id for espacio in espacios_lista]
    estados_horario = _estados_horario_reporte(include_pending)

    horarios_por_espacio_dia = defaultdict(list)
    if espacios_ids:
        horarios = Horario.objects.filter(
            espacio_id__in=espacios_ids,
            estado__in=estados_horario
        ).select_related('grupo')
        for horario in horarios:
            horarios_por_espacio_dia[
                (horario.espacio_id, _normalizar_dia_semana(horario.dia_semana))
            ].append(horario)

    prestamos_por_espacio_fecha = defaultdict(list)
    if espacios_ids:
        prestamos = PrestamoEspacio.objects.filter(
            espacio_id__in=espacios_ids,
            fecha__range=(lunes, sabado),
            estado='Aprobado'
        )
        for prestamo in prestamos:
            prestamos_por_espacio_fecha[(prestamo.espacio_id, prestamo.fecha)].append(prestamo)

    return {
        'espacios': espacios_lista,
        'horarios_por_espacio_dia': horarios_por_espacio_dia,
        'prestamos_por_espacio_fecha': prestamos_por_espacio_fecha,
    }


@csrf_exempt
def list_espacios_disponibles_por_horario(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)

    dia_semana = request.GET.get('dia_semana')
    hora_inicio_raw = request.GET.get('hora_inicio')
    hora_fin_raw = request.GET.get('hora_fin')
    seccional_id = request.GET.get('seccional_id')
    horario_id = request.GET.get('horario_id')

    if not dia_semana or not hora_inicio_raw or not hora_fin_raw:
        return JsonResponse({"error": "dia_semana, hora_inicio y hora_fin son requeridos"}, status=400)

    try:
        hora_inicio = time.fromisoformat(hora_inicio_raw)
        hora_fin = time.fromisoformat(hora_fin_raw)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido"}, status=400)

    espacios_qs = EspacioFisico.objects.select_related('sede', 'tipo').filter(estado='Disponible')

    espacios_qs = _filtrar_espacios_por_sede_usuario(request, espacios_qs)

    horarios_conflicto = Horario.objects.filter(
        estado='aprobado',
        dia_semana__iexact=dia_semana,
        hora_inicio__lt=hora_fin,
        hora_fin__gt=hora_inicio,
    )

    if horario_id:
        try:
            horarios_conflicto = horarios_conflicto.exclude(id=int(horario_id))
        except (TypeError, ValueError):
            return JsonResponse({"error": "horario_id inválido"}, status=400)

    espacios_ocupados = horarios_conflicto.values_list('espacio_id', flat=True)
    espacios_disponibles = espacios_qs.exclude(id__in=espacios_ocupados)

    lst = []
    for espacio in espacios_disponibles:
        sede = espacio.sede
        seccional = sede.seccional if sede else None
        lst.append({
            "id": espacio.id,
            "nombre": espacio.nombre,
            "tipo": espacio.tipo.nombre if espacio.tipo else "Sin tipo",
            "capacidad": espacio.capacidad,
            "sede_id": sede.id if sede else None,
            "sede_nombre": sede.nombre if sede else "Sin sede",
            "sede_seccional_id": seccional.id if seccional else None,
            "sede_seccional_ciudad": seccional.ciudad if seccional else None,
            "ubicacion": espacio.ubicacion,
            "estado": espacio.estado,
            "esta_abierto": espacio.esta_abierto,
        })

    return JsonResponse({"espacios": lst}, status=200)


@csrf_exempt
def generar_pdf_ocupacion_semanal(request):
    """
    Genera un PDF con el reporte de ocupación semanal.

    Parámetros POST:
    - tipo_espacio_id: ID del tipo de espacio (opcional)
    - semana_offset: 0 (semana actual), 1 (próxima semana), etc.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
        tipo_espacio_id = data.get('tipo_espacio_id')
        semana_offset = int(data.get('semana_offset', 0))
        lunes, sabado = _semana(semana_offset)

        # Obtener espacios filtrados
        espacios_query = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios_query = _filtrar_espacios_por_sede_usuario(request, espacios_query)
        if tipo_espacio_id:
            espacios_query = espacios_query.filter(tipo_id=tipo_espacio_id)

        espacios = list(espacios_query)
        dias = [(fecha, _get_dia_nombre(fecha), fecha.strftime('%A')) for fecha in _iterar_fechas_semana(lunes, sabado)]
        semana = ocupacion.cargar_semana([espacio.id for espacio in espacios], dias)

        detalles_espacios = []
        for espacio in espacios:
            horas_ocupadas = 0.0
            horas_manana = 0.0
            horas_tarde = 0.0
            horas_noche = 0.0
            for _fecha, horarios, prestamos in semana.get(espacio.id, []):
                for h in horarios:
                    horas_ocupadas += _calcular_duracion_horas(h.hora_inicio, h.hora_fin)
                    horas_en_jornadas = _distribuir_horas_en_jornadas(h.hora_inicio, h.hora_fin)
                    horas_manana += horas_en_jornadas['manana']
                    horas_tarde += horas_en_jornadas['tarde']
                    horas_noche += horas_en_jornadas['noche']

                for p in prestamos:
                    horas_ocupadas += _calcular_duracion_horas(p.hora_inicio, p.hora_fin)
                    horas_en_jornadas = _distribuir_horas_en_jornadas(p.hora_inicio, p.hora_fin)
                    horas_manana += horas_en_jornadas['manana']
                    horas_tarde += horas_en_jornadas['tarde']
                    horas_noche += horas_en_jornadas['noche']

            horas_manana = min(horas_manana, 36)
            horas_tarde = min(horas_tarde, 36)
            horas_noche = min(horas_noche, 24)
            porcentaje_manana = (horas_manana / 36) * 100 if horas_manana > 0 else 0
            porcentaje_tarde = (horas_tarde / 36) * 100 if horas_tarde > 0 else 0
            porcentaje_noche = (horas_noche / 24) * 100 if horas_noche > 0 else 0
            porcentaje_total = (horas_ocupadas / 96) * 100 if horas_ocupadas > 0 else 0
            detalles_espacios.append({
                'nombre': espacio.nombre,
                'tipo': espacio.tipo.nombre,
                'edificio': espacio.ubicacion.split('-')[0] if espacio.ubicacion and '-' in espacio.ubicacion else (espacio.ubicacion or 'N/A'),
                'capacidad': espacio.capacidad,
                'horasOcupadasSemana': round(horas_ocupadas, 1),
                'horasDisponibles': 96,
                'porcentajeOcupacion': round(porcentaje_total, 1),
                'porcentajeManana': round(porcentaje_manana, 1),
                'porcentajeTarde': round(porcentaje_tarde, 1),
                'porcentajeNoche': round(porcentaje_noche, 1)
            })

        contenido = reportes_pdf.ocupacion_semanal(detalles_espacios, lunes, sabado, semana_offset)
        return _descarga_pdf(contenido, f'ocupacion-semanal-{lunes.isoformat()}.pdf')
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def _get_dia_nombre(fecha):
    """Retorna el nombre del día en español."""
    dias_nombre = {
        0: 'Lunes',
        1: 'Martes',
        2: 'Miércoles',
        3: 'Jueves',
        4: 'Viernes',
        5: 'Sábado'
    }
    return dias_nombre.get(fecha.weekday(), '')


# ---------- REPORTE DE OCUPACIÓN ----------
@csrf_exempt
def reporte_ocupacion(request):
    """
    Endpoint para obtener datos de reporte de ocupación por jornada y espacios más usados.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "ocupacion_por_jornada": [
            {
                "jornada": "Mañana (07:00 - 12:00)",
                "ocupacion": 85,
                "espacios": 45
            },
            ...
        ],
        "espacios_mas_usados": [
            {
                "espacio": "Aula 101",
                "usos": 28,
                "ocupacion": 95
            },
            ...
        ]
    }
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        # Obtener parámetro de semana
        semana_offset = int(request.GET.get('semana_offset', 0))
        include_pending = _estado_horario_param(request)
        
        lunes, sabado = _semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "ocupacion_por_jornada": [],
                "espacios_mas_usados": []
            }, status=200)
        
        datos_reporte = _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending)

        # ======== OCUPACIÓN POR JORNADA ========
        ocupacion_por_jornada = _calcular_ocupacion_por_jornada_reporte(
            espacios, lunes, sabado, DIAS_NOMBRE, include_pending, datos_reporte
        )
        
        # ======== ESPACIOS MÁS USADOS ========
        espacios_mas_usados = _calcular_espacios_mas_usados_reporte(
            espacios, lunes, sabado, DIAS_NOMBRE, include_pending, datos_reporte
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "ocupacion_por_jornada": ocupacion_por_jornada,
            "espacios_mas_usados": espacios_mas_usados
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_ocupacion: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


def _calcular_ocupacion_por_jornada_reporte(espacios, lunes, sabado, dias_nombre, include_pending=False, datos_reporte=None):
    """
    Calcula el porcentaje de ocupación por jornada para todos los espacios.
    Usa la misma lógica que ocupacion_semanal para calcular horas.
    Retorna: lista con ocupación de cada jornada
    """
    try:
        # Inicializar contadores totales de horas por jornada
        horas_totales_manana = 0.0
        horas_totales_tarde = 0.0
        horas_totales_noche = 0.0
        datos_reporte = datos_reporte or _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending)
        espacios_lista = datos_reporte['espacios']
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        # Recorrer cada espacio
        for espacio in espacios_lista:
            horas_manana_espacio = 0.0
            horas_tarde_espacio = 0.0
            horas_noche_espacio = 0.0
            
            # Recorrer cada día de la semana
            for fecha_actual in _iterar_fechas_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, _normalizar_dia_semana(dia_nombre_es)),
                    []
                )
                prestamos_dia = prestamos_por_espacio_fecha.get((espacio.id, fecha_actual), [])
                
                # Calcular horas ocupadas por horarios
                for horario in horarios_dia:
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        horario.hora_inicio,
                        horario.hora_fin
                    )
                    horas_manana_espacio += horas_ocupadas_en_jornadas['manana']
                    horas_tarde_espacio += horas_ocupadas_en_jornadas['tarde']
                    horas_noche_espacio += horas_ocupadas_en_jornadas['noche']
                
                # Calcular horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    horas_ocupadas_en_jornadas = _distribuir_horas_en_jornadas(
                        prestamo.hora_inicio,
                        prestamo.hora_fin
                    )
                    horas_manana_espacio += horas_ocupadas_en_jornadas['manana']
                    horas_tarde_espacio += horas_ocupadas_en_jornadas['tarde']
                    horas_noche_espacio += horas_ocupadas_en_jornadas['noche']
                
            # Sumar las horas de este espacio al total
            horas_totales_manana += horas_manana_espacio
            horas_totales_tarde += horas_tarde_espacio
            horas_totales_noche += horas_noche_espacio
        
        # Calcular máximas horas posibles
        total_espacios = len(espacios_lista)
        horas_max_manana = 36 * total_espacios if total_espacios > 0 else 1
        horas_max_tarde = 36 * total_espacios if total_espacios > 0 else 1
        horas_max_noche = 24 * total_espacios if total_espacios > 0 else 1
        
        # Calcular porcentajes de ocupación
        ocupacion_manana = int((horas_totales_manana / horas_max_manana * 100)) if horas_max_manana > 0 else 0
        ocupacion_tarde = int((horas_totales_tarde / horas_max_tarde * 100)) if horas_max_tarde > 0 else 0
        ocupacion_noche = int((horas_totales_noche / horas_max_noche * 100)) if horas_max_noche > 0 else 0
        
        # Contar cuántos espacios tienen clases en cada jornada
        espacios_con_clase_manana = 0
        espacios_con_clase_tarde = 0
        espacios_con_clase_noche = 0
        
        for espacio in espacios_lista:
            tiene_manana = False
            tiene_tarde = False
            tiene_noche = False
            
            for fecha_actual in _iterar_fechas_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, _normalizar_dia_semana(dia_nombre_es)),
                    []
                )
                prestamos_dia = prestamos_por_espacio_fecha.get((espacio.id, fecha_actual), [])
                
                for horario in horarios_dia:
                    dist = _distribuir_horas_en_jornadas(horario.hora_inicio, horario.hora_fin)
                    if dist['manana'] > 0:
                        tiene_manana = True
                    if dist['tarde'] > 0:
                        tiene_tarde = True
                    if dist['noche'] > 0:
                        tiene_noche = True
                
                for prestamo in prestamos_dia:
                    dist = _distribuir_horas_en_jornadas(prestamo.hora_inicio, prestamo.hora_fin)
                    if dist['manana'] > 0:
                        tiene_manana = True
                    if dist['tarde'] > 0:
                        tiene_tarde = True
                    if dist['noche'] > 0:
                        tiene_noche = True
                
            if tiene_manana:
                espacios_con_clase_manana += 1
            if tiene_tarde:
                espacios_con_clase_tarde += 1
            if tiene_noche:
                espacios_con_clase_noche += 1
        
        ocupacion = [
            {
                "jornada": "Mañana (07:00 - 12:00)",
                "ocupacion": ocupacion_manana,
                "espacios": espacios_con_clase_manana
            },
            {
                "jornada": "Tarde (14:00 - 18:00)",
                "ocupacion": ocupacion_tarde,
                "espacios": espacios_con_clase_tarde
            },
            {
                "jornada": "Noche (18:00 - 21:00)",
                "ocupacion": ocupacion_noche,
                "espacios": espacios_con_clase_noche
            }
        ]
        
        return ocupacion
    except Exception as e:
        print(f"Error en _calcular_ocupacion_por_jornada_reporte: {str(e)}")
        return []


def _calcular_espacios_mas_usados_reporte(espacios, lunes, sabado, dias_nombre, include_pending=False, datos_reporte=None):
    """
    Calcula los espacios más utilizados durante la semana.
    Usa la misma lógica que ocupacion_semanal.
    Retorna: lista ordenada de espacios con más usos
    """
    try:
        espacios_uso = {}
        datos_reporte = datos_reporte or _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending)
        espacios_lista = datos_reporte['espacios']
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        # Recorrer cada espacio
        for espacio in espacios_lista:
            contador_usos = 0
            horas_ocupadas_total = 0.0
            horas_disponibles = 16 * 6  # 16 horas/día * 6 días = 96 horas
            
            # Recorrer cada día de la semana
            for fecha_actual in _iterar_fechas_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, _normalizar_dia_semana(dia_nombre_es)),
                    []
                )
                contador_usos += len(horarios_dia)
                
                # Sumar horas ocupadas por horarios
                for horario in horarios_dia:
                    duracion = _calcular_duracion_horas(horario.hora_inicio, horario.hora_fin)
                    horas_ocupadas_total += duracion
                
                prestamos_dia = prestamos_por_espacio_fecha.get((espacio.id, fecha_actual), [])
                contador_usos += len(prestamos_dia)
                
                # Sumar horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    duracion = _calcular_duracion_horas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_ocupadas_total += duracion
                
            # Calcular porcentaje de ocupación
            porcentaje_ocupacion = int((horas_ocupadas_total / horas_disponibles * 100)) if horas_disponibles > 0 else 0
            
            if contador_usos > 0:  # Solo incluir espacios que tengan usos
                espacios_uso[espacio.id] = {
                    "espacio": espacio.nombre,
                    "usos": contador_usos,
                    "ocupacion": porcentaje_ocupacion
                }
        
        # Ordenar por usos descendente y tomar top 5
        espacios_ordenados = sorted(
            espacios_uso.values(),
            key=lambda x: x['usos'],
            reverse=True
        )[:5]
        
        return espacios_ordenados
    except Exception as e:
        print(f"Error en _calcular_espacios_mas_usados_reporte: {str(e)}")
        return []


@csrf_exempt
def generar_pdf_reporte_ocupacion(request):
    """
    Genera un PDF para el reporte de ocupación (Ocupación por Jornada - Semana Actual
    y Espacios Más Utilizados).

    Parámetros POST (opcionales):
    - semana_offset: int (default 0)
    - tipo_espacio_id: int | null (filtra espacios por tipo)
    - espacios: lista de nombres de espacios (filtra por los espacios visibles en el frontend)

    Nota: Si se envía `espacios`, ese filtro tiene prioridad (para exportar exactamente
    lo que el usuario está viendo).
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        include_pending = _estado_horario_param(request, data)
        tipo_espacio_id = data.get('tipo_espacio_id')
        espacios_nombres = data.get('espacios')
        lunes, sabado = _semana(semana_offset)

        espacios_qs = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios_qs = _filtrar_espacios_por_sede_usuario(request, espacios_qs)

        if isinstance(espacios_nombres, list) and len(espacios_nombres) > 0:
            espacios_qs = espacios_qs.filter(nombre__in=espacios_nombres)
        elif tipo_espacio_id:
            espacios_qs = espacios_qs.filter(tipo_id=tipo_espacio_id)

        datos_reporte = _preparar_datos_reporte_espacios(espacios_qs, lunes, sabado, include_pending)
        ocupacion_por_jornada = _calcular_ocupacion_por_jornada_reporte(
            espacios_qs, lunes, sabado, DIAS_NOMBRE, include_pending, datos_reporte
        )
        espacios_mas_usados = _calcular_espacios_mas_usados_reporte(
            espacios_qs, lunes, sabado, DIAS_NOMBRE, include_pending, datos_reporte
        )

        contenido = reportes_pdf.ocupacion(ocupacion_por_jornada, espacios_mas_usados, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-ocupacion-{lunes.isoformat()}.pdf')
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_ocupacion: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def reporte_disponibilidad(request):
    """
    Endpoint para obtener datos de reporte de disponibilidad de espacios.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "disponibilidad": [
            {
                "nombre": "Aula 101",
                "tipo": "Aula",
                "horasDisponibles": 45,
                "horasOcupadas": 51,
                "porcentajeOcupacion": 53
            },
            ...
        ],
        "resumen": {
            "total_disponible": 450,
            "total_ocupado": 510,
            "promedio_ocupacion": 53
        }
    }
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        # Obtener parámetro de semana
        semana_offset = int(request.GET.get('semana_offset', 0))
        include_pending = _estado_horario_param(request)
        
        lunes, sabado = _semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "disponibilidad": [],
                "resumen": {
                    "total_disponible": 0,
                    "total_ocupado": 0,
                    "promedio_ocupacion": 0
                }
            }, status=200)
        
        # ======== CÁLCULO DE DISPONIBILIDAD ========
        disponibilidad, resumen = _calcular_disponibilidad_reporte(
            espacios, lunes, sabado, DIAS_NOMBRE, include_pending
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "disponibilidad": disponibilidad,
            "resumen": resumen
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_disponibilidad: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


def _calcular_disponibilidad_reporte(espacios, lunes, sabado, dias_nombre, include_pending=False, datos_reporte=None):
    """
    Calcula la disponibilidad (horas disponibles vs ocupadas) para cada espacio.
    Retorna: tupla (lista con disponibilidad de cada espacio, dict con resumen)
    """
    try:
        disponibilidad = []
        total_horas_disponibles = 0
        total_horas_ocupadas = 0
        datos_reporte = datos_reporte or _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending)
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        for espacio in datos_reporte['espacios']:
            horas_ocupadas_total = 0.0
            
            # Recorrer cada día de la semana
            for fecha_actual in _iterar_fechas_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, _normalizar_dia_semana(dia_nombre_es)),
                    []
                )
                
                # Sumar horas ocupadas por horarios
                for horario in horarios_dia:
                    duracion = _calcular_duracion_horas(horario.hora_inicio, horario.hora_fin)
                    horas_ocupadas_total += duracion
                
                prestamos_dia = prestamos_por_espacio_fecha.get((espacio.id, fecha_actual), [])
                
                # Sumar horas ocupadas por préstamos
                for prestamo in prestamos_dia:
                    duracion = _calcular_duracion_horas(prestamo.hora_inicio, prestamo.hora_fin)
                    horas_ocupadas_total += duracion
                
            # Calcular horas disponibles (16 horas/día * 6 días)
            horas_disponibles = 16 * 6  # 96 horas
            horas_libres = horas_disponibles - horas_ocupadas_total
            
            # Calcular porcentaje de ocupación
            porcentaje_ocupacion = int((horas_ocupadas_total / horas_disponibles * 100)) if horas_disponibles > 0 else 0
            
            # Acumular totales para el resumen
            total_horas_disponibles += horas_disponibles
            total_horas_ocupadas += horas_ocupadas_total
            
            disponibilidad.append({
                "nombre": espacio.nombre,
                "tipo": espacio.tipo.nombre,
                "horasDisponibles": max(0, int(horas_libres)),
                "horasOcupadas": int(horas_ocupadas_total),
                "porcentajeOcupacion": porcentaje_ocupacion
            })
        
        # Calcular promedio de ocupación general
        promedio_ocupacion = int((total_horas_ocupadas / total_horas_disponibles * 100)) if total_horas_disponibles > 0 else 0
        
        resumen = {
            "total_disponible": int(total_horas_disponibles - total_horas_ocupadas),
            "total_ocupado": int(total_horas_ocupadas),
            "promedio_ocupacion": promedio_ocupacion
        }
        
        return disponibilidad, resumen
    except Exception as e:
        print(f"Error en _calcular_disponibilidad_reporte: {str(e)}")
        return [], {"total_disponible": 0, "total_ocupado": 0, "promedio_ocupacion": 0}


@csrf_exempt
def reporte_capacidad(request):
    """
    Endpoint para obtener datos de reporte de capacidad utilizada.
    
    Parámetros GET opcionales:
    - semana_offset: 0 (semana actual), 1 (próxima semana), -1 (semana pasada)
    
    Retorna:
    {
        "periodo": "2025-1",
        "semana_inicio": "2025-01-XX",
        "semana_fin": "2025-01-XX",
        "capacidad": [
            {
                "tipo": "Aula",
                "capacidadTotal": 250,
                "capacidadUsada": 180,
                "porcentaje": 72
            },
            ...
        ]
    }
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)
    
    try:
        # Obtener parámetro de semana
        semana_offset = int(request.GET.get('semana_offset', 0))
        include_pending = _estado_horario_param(request)
        
        lunes, sabado = _semana(semana_offset)
        
        # Obtener todos los espacios
        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        
        if not espacios.exists():
            return JsonResponse({
                "periodo": "2025-1",
                "semana_inicio": lunes.isoformat(),
                "semana_fin": sabado.isoformat(),
                "capacidad": []
            }, status=200)
        
        # ======== CÁLCULO DE CAPACIDAD ========
        capacidad = _calcular_capacidad_reporte(
            espacios, lunes, sabado, DIAS_NOMBRE, include_pending
        )
        
        # Construcción del periodo
        periodo = "2025-1"  # TODO: Obtener del contexto actual
        
        return JsonResponse({
            "periodo": periodo,
            "semana_inicio": lunes.isoformat(),
            "semana_fin": sabado.isoformat(),
            "capacidad": capacidad
        }, status=200)
    
    except ValueError as e:
        return JsonResponse({"error": f"Error de valor: {str(e)}"}, status=400)
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en reporte_capacidad: {error_msg}")
        return JsonResponse({"error": f"Error del servidor: {str(e)}"}, status=500)


@csrf_exempt
def generar_pdf_reporte_disponibilidad(request):
    """Genera un PDF del reporte de disponibilidad general con estilo similar al UI."""
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        include_pending = _estado_horario_param(request, data)
        lunes, sabado = _semana(semana_offset)

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        disponibilidad, resumen = _calcular_disponibilidad_reporte(espacios, lunes, sabado, DIAS_NOMBRE, include_pending)

        contenido = reportes_pdf.disponibilidad(disponibilidad, resumen, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-disponibilidad-{lunes.isoformat()}.pdf')
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_disponibilidad: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def generar_pdf_reporte_capacidad(request):
    """Genera un PDF del reporte de capacidad utilizada con estilo similar al UI."""
    if request.method != 'POST':
        return JsonResponse({"error": "Solo se permite POST"}, status=405)

    try:
        data = json.loads(request.body) if request.body else {}
        semana_offset = int(data.get('semana_offset', 0))
        include_pending = _estado_horario_param(request, data)
        lunes, sabado = _semana(semana_offset)

        espacios = EspacioFisico.objects.all().select_related('tipo', 'sede')
        espacios = _filtrar_espacios_por_sede_usuario(request, espacios)
        capacidad = _calcular_capacidad_reporte(espacios, lunes, sabado, DIAS_NOMBRE, include_pending)

        contenido = reportes_pdf.capacidad(capacidad, lunes, sabado)
        return _descarga_pdf(contenido, f'reporte-capacidad-{lunes.isoformat()}.pdf')
    except Exception as e:
        import traceback
        error_msg = f"{str(e)}\n{traceback.format_exc()}"
        print(f"Error en generar_pdf_reporte_capacidad: {error_msg}")
        return JsonResponse({"error": str(e)}, status=500)


def _calcular_capacidad_reporte(espacios, lunes, sabado, dias_nombre, include_pending=False, datos_reporte=None):
    """
    Calcula la capacidad utilizada agrupada por tipo de espacio.
    Usa el promedio de estudiantes simultáneos en cada franja horaria.
    Retorna: lista con capacidad por tipo de espacio
    """
    try:
        capacidad_por_tipo = {}
        datos_reporte = datos_reporte or _preparar_datos_reporte_espacios(espacios, lunes, sabado, include_pending)
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        for espacio in datos_reporte['espacios']:
            tipo_nombre = espacio.tipo.nombre
            
            # Inicializar si es la primera vez que vemos este tipo
            if tipo_nombre not in capacidad_por_tipo:
                capacidad_por_tipo[tipo_nombre] = {
                    "capacidad_total": 0,
                    "ocupaciones": [],  # Lista de ocupaciones por espacio
                    "cantidad_espacios": 0
                }
            
            # Sumar la capacidad total de este espacio
            capacidad_por_tipo[tipo_nombre]["capacidad_total"] += espacio.capacidad
            capacidad_por_tipo[tipo_nombre]["cantidad_espacios"] += 1
            
            # Rastrear estudiantes únicos que usan este espacio
            estudiantes_por_dia = {}
            
            # Recorrer cada día de la semana
            for fecha_actual in _iterar_fechas_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = dias_nombre.get(dia_nombre_en, dia_nombre_en)
                
                estudiantes_este_dia = set()
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, _normalizar_dia_semana(dia_nombre_es)),
                    []
                )
                
                # Contar estudiantes en horarios
                for horario in horarios_dia:
                    if horario.grupo:
                        grupo_size = horario.cantidad_estudiantes or 30
                        estudiantes_este_dia.add(f"horario_{horario.id}")
                        estudiantes_por_dia[fecha_actual] = grupo_size
                
                prestamos_dia = prestamos_por_espacio_fecha.get((espacio.id, fecha_actual), [])
                
                # Contar préstamos (cada préstamo = ocupación)
                for prestamo in prestamos_dia:
                    estudiantes_este_dia.add(f"prestamo_{prestamo.id}")
                    if fecha_actual not in estudiantes_por_dia:
                        estudiantes_por_dia[fecha_actual] = int(espacio.capacidad * 0.3)  # 30% de ocupación
                
            # Calcular ocupación promedio para este espacio
            if estudiantes_por_dia:
                ocupacion_promedio = sum(estudiantes_por_dia.values()) / len(estudiantes_por_dia)
            else:
                ocupacion_promedio = 0
            
            capacidad_por_tipo[tipo_nombre]["ocupaciones"].append(ocupacion_promedio)
        
        # Convertir a lista y calcular porcentajes
        capacidad = []
        for tipo_nombre, datos in capacidad_por_tipo.items():
            # Calcular capacidad usada como el promedio de ocupaciones
            capacidad_usada_promedio = sum(datos["ocupaciones"]) if datos["ocupaciones"] else 0
            capacidad_usada_promedio = int(capacidad_usada_promedio)
            
            # Asegurar que no supere la capacidad total
            capacidad_usada_promedio = min(capacidad_usada_promedio, datos["capacidad_total"])
            
            porcentaje = int((capacidad_usada_promedio / datos["capacidad_total"] * 100)) if datos["capacidad_total"] > 0 else 0
            
            # Limitar porcentaje al 100%
            porcentaje = min(porcentaje, 100)
            
            capacidad.append({
                "tipo": tipo_nombre,
                "capacidadTotal": datos["capacidad_total"],
                "capacidadUsada": capacidad_usada_promedio,
                "porcentaje": porcentaje
            })
        
        # Ordenar por tipo alfabéticamente
        capacidad.sort(key=lambda x: x["tipo"])
        
        return capacidad
    except Exception as e:
        print(f"Error en _calcular_capacidad_reporte: {str(e)}")
        return []
