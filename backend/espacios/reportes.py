"""Cálculos de los reportes de espacios (Estado de Recursos y Reportes), sin depender de la petición HTTP.

Recorren la semana de lunes a sábado. Cuentan los horarios del día (aprobados, pendientes o todos, según el estado
pedido) y los préstamos 'Aprobado' de la fecha:
- detalle_ocupacion_semanal: filas del PDF de ocupación semanal;
- ocupacion_por_jornada y espacios_mas_usados: reporte de ocupación;
- disponibilidad: horas disponibles y ocupadas por espacio, con su resumen;
- capacidad: capacidad utilizada por tipo de espacio.
Las vistas de espacios/views.py leen los parámetros, filtran los espacios visibles y arman la respuesta.
"""
import unicodedata
from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

from horario.models import Horario
from prestamos.models import PrestamoEspacio

from . import ocupacion
from .api.ocupacion import _calcular_duracion_horas, _distribuir_horas_en_jornadas


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


def semana(semana_offset):
    """Lunes y sábado de la semana actual desplazada semana_offset semanas."""
    hoy = timezone.now().date()
    lunes = hoy - timedelta(days=hoy.weekday()) + timedelta(weeks=semana_offset)
    return lunes, lunes + timedelta(days=5)


def dia_nombre(fecha):
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


def estados_horario(estado_horario='aprobado', include_pending=False):
    if isinstance(estado_horario, bool):
        include_pending = estado_horario
        estado_horario = 'todos' if include_pending else 'aprobado'

    estado_normalizado = str(estado_horario or '').strip().lower()
    if estado_normalizado == 'pendiente':
        return ['pendiente']
    if estado_normalizado in {'todos', 'all'} or include_pending:
        return ['aprobado', 'pendiente']
    return ['aprobado']


def normalizar_dia_semana(valor):
    texto = str(valor or '').strip().lower()
    return ''.join(
        char for char in unicodedata.normalize('NFD', texto)
        if unicodedata.category(char) != 'Mn'
    )


def fechas_de_la_semana(lunes, sabado):
    fecha_actual = lunes
    while fecha_actual <= sabado:
        yield fecha_actual
        fecha_actual += timedelta(days=1)


def preparar_datos(espacios, lunes, sabado, estado_horario='aprobado'):
    espacios_lista = list(espacios)
    espacios_ids = [espacio.id for espacio in espacios_lista]
    estados = estados_horario(estado_horario)

    horarios_por_espacio_dia = defaultdict(list)
    if espacios_ids:
        horarios = Horario.objects.filter(
            espacio_id__in=espacios_ids,
            estado__in=estados
        ).select_related('grupo')
        for horario in horarios:
            horarios_por_espacio_dia[
                (horario.espacio_id, normalizar_dia_semana(horario.dia_semana))
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


def detalle_ocupacion_semanal(espacios, lunes, sabado):
    """Fila por espacio del PDF de ocupación semanal: horas y porcentajes por jornada (topes 36/36/24 h)
    y del total sobre 96 h, contando los horarios aprobados y los préstamos aprobados de la semana."""
    espacios = list(espacios)
    dias = [(fecha, dia_nombre(fecha), fecha.strftime('%A')) for fecha in fechas_de_la_semana(lunes, sabado)]
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
    return detalles_espacios


def ocupacion_por_jornada(espacios, lunes, sabado, estado_horario='aprobado', datos_reporte=None):
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
        datos_reporte = datos_reporte or preparar_datos(espacios, lunes, sabado, estado_horario)
        espacios_lista = datos_reporte['espacios']
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        # Recorrer cada espacio
        for espacio in espacios_lista:
            horas_manana_espacio = 0.0
            horas_tarde_espacio = 0.0
            horas_noche_espacio = 0.0
            
            # Recorrer cada día de la semana
            for fecha_actual in fechas_de_la_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = DIAS_NOMBRE.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, normalizar_dia_semana(dia_nombre_es)),
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
            
            for fecha_actual in fechas_de_la_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = DIAS_NOMBRE.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, normalizar_dia_semana(dia_nombre_es)),
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
        print(f"Error en reportes.ocupacion_por_jornada: {str(e)}")
        return []


def espacios_mas_usados(espacios, lunes, sabado, estado_horario='aprobado', datos_reporte=None):
    """
    Calcula los espacios más utilizados durante la semana.
    Usa la misma lógica que ocupacion_semanal.
    Retorna: lista ordenada de espacios con más usos
    """
    try:
        espacios_uso = {}
        datos_reporte = datos_reporte or preparar_datos(espacios, lunes, sabado, estado_horario)
        espacios_lista = datos_reporte['espacios']
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        # Recorrer cada espacio
        for espacio in espacios_lista:
            contador_usos = 0
            horas_ocupadas_total = 0.0
            horas_disponibles = 16 * 6  # 16 horas/día * 6 días = 96 horas
            
            # Recorrer cada día de la semana
            for fecha_actual in fechas_de_la_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = DIAS_NOMBRE.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, normalizar_dia_semana(dia_nombre_es)),
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
        print(f"Error en reportes.espacios_mas_usados: {str(e)}")
        return []


def disponibilidad(espacios, lunes, sabado, estado_horario='aprobado', datos_reporte=None):
    """
    Calcula la disponibilidad (horas disponibles vs ocupadas) para cada espacio.
    Retorna: tupla (lista con disponibilidad de cada espacio, dict con resumen)
    """
    try:
        disponibilidad = []
        total_horas_disponibles = 0
        total_horas_ocupadas = 0
        datos_reporte = datos_reporte or preparar_datos(espacios, lunes, sabado, estado_horario)
        horarios_por_espacio_dia = datos_reporte['horarios_por_espacio_dia']
        prestamos_por_espacio_fecha = datos_reporte['prestamos_por_espacio_fecha']
        
        for espacio in datos_reporte['espacios']:
            horas_ocupadas_total = 0.0
            
            # Recorrer cada día de la semana
            for fecha_actual in fechas_de_la_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = DIAS_NOMBRE.get(dia_nombre_en, dia_nombre_en)
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, normalizar_dia_semana(dia_nombre_es)),
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
        print(f"Error en reportes.disponibilidad: {str(e)}")
        return [], {"total_disponible": 0, "total_ocupado": 0, "promedio_ocupacion": 0}


def capacidad(espacios, lunes, sabado, estado_horario='aprobado', datos_reporte=None):
    """
    Calcula la capacidad utilizada agrupada por tipo de espacio.
    Usa el promedio de estudiantes simultáneos en cada franja horaria.
    Retorna: lista con capacidad por tipo de espacio
    """
    try:
        capacidad_por_tipo = {}
        datos_reporte = datos_reporte or preparar_datos(espacios, lunes, sabado, estado_horario)
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
            for fecha_actual in fechas_de_la_semana(lunes, sabado):
                dia_nombre_en = fecha_actual.strftime('%A')
                dia_nombre_es = DIAS_NOMBRE.get(dia_nombre_en, dia_nombre_en)
                
                estudiantes_este_dia = set()
                horarios_dia = horarios_por_espacio_dia.get(
                    (espacio.id, normalizar_dia_semana(dia_nombre_es)),
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
        print(f"Error en reportes.capacidad: {str(e)}")
        return []
