"""Eventos en tiempo real de asistencia: cada práctica la ven el estudiante y su responsable."""
from nucleo.eventos.registro import registrar_recurso


def _audiencia_de_la_asignacion(asignacion):
    return {'usuarios': {asignacion.estudiante_id, asignacion.responsable_id}, 'roles': set()}


def registrar_eventos_de_asistencia():
    registrar_recurso('asistencia', 'LugarPractica', 'lugares-practica')
    registrar_recurso('asistencia', 'AsignacionPractica', 'asignaciones-practica', audiencia=_audiencia_de_la_asignacion)
    registrar_recurso(
        'asistencia', 'RegistroAsistencia', 'registros-asistencia',
        audiencia=_audiencia_de_la_asignacion, referencia=lambda registro: registro.asignacion,
    )
