from django.http import JsonResponse, HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
import sys

from . import exportaciones


def _estados_exportables_horario(data):
    estado = str(data.get('estado_horario') or data.get('estadoHorario') or '').strip().lower()
    include_pending = bool(data.get('include_pending') or data.get('includePending'))

    if estado == 'pendiente':
        return {'pendiente'}
    if estado in {'todos', 'all'} or include_pending:
        return {'aprobado', 'pendiente'}
    return {'aprobado'}


def _horarios_exportables(request):
    """Lee la lista de horarios del cuerpo y deja los exportables. Devuelve (horarios, respuesta_de_error)."""
    data = json.loads(request.body)
    horarios_data = data.get('horarios', [])

    if not horarios_data:
        return None, JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

    estados_exportables = _estados_exportables_horario(data)
    horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

    if not horarios_data:
        return None, JsonResponse({"error": "No hay horarios para exportar"}, status=400)
    return horarios_data, None


def _descarga(contenido, content_type, nombre):
    response = HttpResponse(contenido, content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{nombre}"'
    return response


def _exportar_post(request, generar, content_type, nombre, etiqueta_error):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        horarios_data, error = _horarios_exportables(request)
        if error:
            return error
        return _descarga(generar(horarios_data), content_type, nombre)
    except Exception as e:
        import traceback
        print(f"{etiqueta_error}: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


# -------- Exportaciones del Centro de Horarios (POST con la lista de horarios) --------
@csrf_exempt
def exportar_horarios_pdf_post(request):
    """PDF con una página por grupo."""
    return _exportar_post(request, exportaciones.pdf_por_grupo, 'application/pdf',
                          'horarios_centro.pdf', 'ERROR en PDF')


@csrf_exempt
def exportar_horarios_excel_post(request):
    """Excel con una hoja por grupo."""
    return _exportar_post(request, exportaciones.excel_por_grupo, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'horarios_centro.xlsx', 'ERROR en Excel')


@csrf_exempt
def exportar_horarios_pdf_docente(request):
    """PDF con una página por docente."""
    return _exportar_post(request, exportaciones.pdf_por_docente, 'application/pdf',
                          'horarios_docentes.pdf', 'ERROR en exportar_horarios_pdf_docente')


@csrf_exempt
def exportar_horarios_excel_docente(request):
    """Excel con una hoja por docente."""
    return _exportar_post(request, exportaciones.excel_por_docente, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'horarios_docentes.xlsx', 'ERROR en exportar_horarios_excel_docente')
