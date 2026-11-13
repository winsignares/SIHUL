"""Ocupación semanal por espacio, para el PDF."""
from .. import ocupacion
from ..api.ocupacion import _calcular_duracion_horas, _distribuir_horas_en_jornadas
from ._semana import dia_nombre, fechas_de_la_semana


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
