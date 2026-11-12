"""Endpoints de horarios: un archivo por tema (acceso, mi horario, inscripciones, consultas y asignación de espacios)."""
from .asignacion_espacios import aprobar_solicitud_espacio, asignar_espacio_horario, rechazar_solicitud_espacio  # noqa: F401
from .consultas import horarios_por_periodo, list_horarios_asignacion_espacios, list_horarios_extendidos  # noqa: F401
from .inscripciones import inscribir_estudiante  # noqa: F401
from .mi_horario import exportar_mi_horario, mi_horario_docente, mi_horario_estudiante  # noqa: F401
