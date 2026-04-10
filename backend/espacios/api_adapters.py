"""API adapters for espacios endpoints.

This module isolates API-facing code from the legacy module import path.
The underlying implementation is still delegated for behavioral parity.
"""

from espacios import api_views
from espacios import views as legacy_views


def list_all_espacios_with_horarios(request):
    return api_views.list_all_espacios_with_horarios(request)


def list_supervisor_espacios_with_horarios(request, usuario_id=None):
    return api_views.list_supervisor_espacios_with_horarios(request, usuario_id=usuario_id)


def proximos_apertura_cierre(request):
    return api_views.proximos_apertura_cierre(request)


def get_estado_espacio(request, espacio_id=None):
    return api_views.get_estado_espacio(request, espacio_id=espacio_id)


def cerrar_espacio(request, espacio_id=None):
    return api_views.cerrar_espacio(request, espacio_id=espacio_id)


def get_horario_espacio(request, espacio_id=None):
    return api_views.get_horario_espacio(request, espacio_id=espacio_id)


def ocupacion_semanal(request):
    return api_views.ocupacion_semanal(request)


def generar_pdf_ocupacion_semanal(request):
    return legacy_views.generar_pdf_ocupacion_semanal(request)


def reporte_ocupacion(request):
    return legacy_views.reporte_ocupacion(request)


def generar_pdf_reporte_ocupacion(request):
    return legacy_views.generar_pdf_reporte_ocupacion(request)


def reporte_disponibilidad(request):
    return legacy_views.reporte_disponibilidad(request)


def generar_pdf_reporte_disponibilidad(request):
    return legacy_views.generar_pdf_reporte_disponibilidad(request)


def reporte_capacidad(request):
    return legacy_views.reporte_capacidad(request)


def generar_pdf_reporte_capacidad(request):
    return legacy_views.generar_pdf_reporte_capacidad(request)


def list_espacios_by_usuario(request, usuario_id=None):
    return api_views.list_espacios_by_usuario(request, usuario_id=usuario_id)
