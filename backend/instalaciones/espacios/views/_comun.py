"""Ayudas compartidas por las vistas de espacios."""
from io import BytesIO
from django.http import FileResponse


def _descarga_pdf(contenido, nombre):
    response = FileResponse(BytesIO(contenido), as_attachment=True, filename=nombre)
    response['Content-Type'] = 'application/pdf'
    return response


def _env_bool_param(value):
    return str(value).strip().lower() in {'1', 'true', 'yes', 'on', 'si', 'sí'}


def _estado_horario_param(request, data=None):
    if data is not None:
        estado = data.get('estado_horario') or data.get('estadoHorario')
        include_pending = bool(data.get('include_pending') or data.get('includePending'))
    else:
        estado = request.GET.get('estado_horario') or request.GET.get('estadoHorario')
        include_pending = _env_bool_param(request.GET.get('include_pending') or request.GET.get('includePending'))

    if estado:
        return str(estado).strip().lower()
    return 'todos' if include_pending else 'aprobado'
