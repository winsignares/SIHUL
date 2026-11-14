"""Vistas de espacios: una por informe, reexportadas para los viewsets."""
from .disponibles_horario import ListEspaciosDisponiblesPorHorarioView
from .ocupacion import GenerarPdfOcupacionSemanalView, ReporteOcupacionView, GenerarPdfReporteOcupacionView
from .disponibilidad import ReporteDisponibilidadView, GenerarPdfReporteDisponibilidadView
from .capacidad import ReporteCapacidadView, GenerarPdfReporteCapacidadView

__all__ = [
    'ListEspaciosDisponiblesPorHorarioView',
    'GenerarPdfOcupacionSemanalView', 'ReporteOcupacionView', 'GenerarPdfReporteOcupacionView',
    'ReporteDisponibilidadView', 'GenerarPdfReporteDisponibilidadView',
    'ReporteCapacidadView', 'GenerarPdfReporteCapacidadView',
]
