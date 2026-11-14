"""Vistas de espacios: una por informe, reexportadas para los viewsets."""
from .disponibles_horario import ListEspaciosDisponiblesPorHorarioView
from .ocupacion import GenerarPdfOcupacionSemanalView, ReporteOcupacionView, GenerarPdfReporteOcupacionView
from .disponibilidad import ReporteDisponibilidadView, GenerarPdfReporteDisponibilidadView
from .capacidad import ReporteCapacidadView, GenerarPdfReporteCapacidadView

__all__ = [
    'ListEspaciosDisponiblesPorHorarioView',
    'GenerarPdfOcupacionSemanalView', 'reporte_ocupacion', 'generar_pdf_reporte_ocupacion',
    'ReporteDisponibilidadView', 'generar_pdf_reporte_disponibilidad',
    'ReporteCapacidadView', 'generar_pdf_reporte_capacidad',
]
