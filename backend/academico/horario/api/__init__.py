"""Endpoints de horarios: un archivo por tema (acceso, mi horario, inscripciones, consultas y asignación de espacios)."""
from .asignacion_espacios import AprobarSolicitudEspacioView, AsignarEspacioHorarioView, RechazarSolicitudEspacioView  # noqa: F401
from .consultas import HorariosPorPeriodoView, ListHorariosAsignacionEspaciosView, ListHorariosExtendidosView  # noqa: F401
from .inscripciones import InscribirEstudianteView  # noqa: F401
from .mi_horario import ExportarMiHorarioView, MiHorarioDocenteView, MiHorarioEstudianteView  # noqa: F401
