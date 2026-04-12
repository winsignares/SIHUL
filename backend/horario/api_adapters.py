"""API adapters for horario endpoints.

This module isolates API-facing code from the legacy module import path.
The underlying implementation is still delegated for behavioral parity.
"""

from horario import api_views
from horario import views as legacy_views


def list_horarios_extendidos(request):
    return api_views.list_horarios_extendidos(request)


def mi_horario_docente(request):
    return api_views.mi_horario_docente(request)


def mi_horario_estudiante(request):
    return api_views.mi_horario_estudiante(request)


def inscribir_estudiante(request):
    return api_views.inscribir_estudiante(request)


def horarios_por_periodo(request):
    return api_views.horarios_por_periodo(request)


def exportar_horarios_pdf_post(request):
    return legacy_views.exportar_horarios_pdf_post(request)


def exportar_horarios_excel_post(request):
    return legacy_views.exportar_horarios_excel_post(request)


def exportar_horarios_pdf_docente(request):
    return legacy_views.exportar_horarios_pdf_docente(request)


def exportar_horarios_excel_docente(request):
    return legacy_views.exportar_horarios_excel_docente(request)


def exportar_pdf_usuario(request):
    return legacy_views.exportar_pdf_usuario(request)


def exportar_excel_usuario(request):
    return legacy_views.exportar_excel_usuario(request)


def aprobar_solicitud_espacio(request):
    return api_views.aprobar_solicitud_espacio(request)


def rechazar_solicitud_espacio(request):
    return api_views.rechazar_solicitud_espacio(request)
