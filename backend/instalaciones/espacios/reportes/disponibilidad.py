"""Reporte de disponibilidad: horas disponibles y ocupadas por espacio."""
from ..api.ocupacion import _calcular_duracion_horas
from ._semana import DIAS_NOMBRE, fechas_de_la_semana, normalizar_dia_semana, preparar_datos


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


