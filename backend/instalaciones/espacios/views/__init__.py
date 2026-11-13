"""Vistas de espacios: una por informe, reexportadas para los viewsets."""
from .disponibles_horario import list_espacios_disponibles_por_horario
from .ocupacion import generar_pdf_ocupacion_semanal, reporte_ocupacion, generar_pdf_reporte_ocupacion
from .disponibilidad import reporte_disponibilidad, generar_pdf_reporte_disponibilidad
from .capacidad import reporte_capacidad, generar_pdf_reporte_capacidad

__all__ = [
    'list_espacios_disponibles_por_horario',
    'generar_pdf_ocupacion_semanal', 'reporte_ocupacion', 'generar_pdf_reporte_ocupacion',
    'reporte_disponibilidad', 'generar_pdf_reporte_disponibilidad',
    'reporte_capacidad', 'generar_pdf_reporte_capacidad',
]
