from django.core.exceptions import ValidationError
from django.db.models import Q

from horario.models import Horario

from .models import PrestamoEspacio, PrestamoEspacioPublico


DIAS_SEMANA = {
    0: 'Lunes',
    1: 'Martes',
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo',
}


def validar_disponibilidad_prestamo(prestamo):
    if prestamo.estado not in ['Pendiente', 'Aprobado']:
        return

    if prestamo.hora_fin <= prestamo.hora_inicio:
        raise ValidationError('La hora fin debe ser mayor que la hora inicio.')

    if prestamo.asistentes > prestamo.espacio.capacidad:
        raise ValidationError(
            f'El número de asistentes ({prestamo.asistentes}) excede la capacidad '
            f'del espacio ({prestamo.espacio.capacidad}).'
        )

    filtros_prestamos = {
        'espacio_id': prestamo.espacio_id,
        'fecha': prestamo.fecha,
        'estado__in': ['Pendiente', 'Aprobado'],
        'hora_inicio__lt': prestamo.hora_fin,
        'hora_fin__gt': prestamo.hora_inicio,
    }

    for modelo in (PrestamoEspacio, PrestamoEspacioPublico):
        conflictos = modelo.objects.filter(**filtros_prestamos)
        if isinstance(prestamo, modelo) and prestamo.pk:
            conflictos = conflictos.exclude(pk=prestamo.pk)

        conflicto = conflictos.order_by('hora_inicio').first()
        if conflicto:
            raise ValidationError(
                f'El espacio ya está reservado el {prestamo.fecha} '
                f'de {conflicto.hora_inicio.strftime("%H:%M")} a '
                f'{conflicto.hora_fin.strftime("%H:%M")} por un préstamo activo.'
            )

    conflicto_horario = Horario.objects.filter(
        espacio_id=prestamo.espacio_id,
        dia_semana__iexact=DIAS_SEMANA[prestamo.fecha.weekday()],
        estado__in=['pendiente', 'aprobado'],
    ).filter(
        Q(hora_inicio__lt=prestamo.hora_fin, hora_fin__gt=prestamo.hora_inicio)
    ).order_by('hora_inicio').first()

    if conflicto_horario:
        raise ValidationError(
            f'El espacio está ocupado por la clase {conflicto_horario.asignatura.nombre} '
            f'de {conflicto_horario.hora_inicio.strftime("%H:%M")} a '
            f'{conflicto_horario.hora_fin.strftime("%H:%M")}.'
        )
