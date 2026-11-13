"""Reporte de capacidad utilizada por tipo de espacio."""
from ._semana import DIAS_NOMBRE, fechas_de_la_semana, normalizar_dia_semana, preparar_datos


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
