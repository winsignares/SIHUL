from notificaciones.models import Notificacion


def avisar_salida_del_radio(asignacion, distancia):
    """Avisa al responsable que el estudiante salió del lugar durante el horario de la práctica."""
    if not asignacion.responsable_id:
        return
    Notificacion.objects.create(
        id_usuario=asignacion.responsable_id,
        tipo_notificacion='asistencia_fuera_del_radio',
        mensaje=f'{asignacion.estudiante.nombre} salió de {asignacion.lugar.nombre} durante el horario de la práctica '
                f'(a {round(distancia)} m).',
        prioridad='alta',
    )
