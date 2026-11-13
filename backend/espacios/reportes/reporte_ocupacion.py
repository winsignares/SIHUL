"""Reporte de ocupación: porcentaje por jornada y espacios más usados."""
from ..api.ocupacion import _calcular_duracion_horas, _distribuir_horas_en_jornadas
from ._semana import DIAS_NOMBRE, fechas_de_la_semana, normalizar_dia_semana, preparar_datos


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


