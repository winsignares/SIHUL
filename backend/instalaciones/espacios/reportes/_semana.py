"""Apoyo común de los reportes: la semana de lunes a sábado, estados de horario y carga de horarios y préstamos."""
import unicodedata
from collections import defaultdict
from datetime import timedelta

from django.utils import timezone

from academico.horario.models import Horario
from instalaciones.prestamos.models import PrestamoEspacio


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
