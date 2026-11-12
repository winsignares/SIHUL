import logging
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from usuarios.models import Usuario
from .. import exportaciones
from ..models import Horario, HorarioEstudiante
from .acceso import _is_admin_user, _require_auth


logger = logging.getLogger(__name__)


def _clase_de_mi_horario(h):
    return {
        'id': h.id,
        'diaSemana': h.dia_semana,
        'horaInicio': str(h.hora_inicio),
        'horaFin': str(h.hora_fin),
        'asignaturaId': h.asignatura.id,
        'asignatura': h.asignatura.nombre,
        'grupoId': h.grupo.id,
        'grupo': h.grupo.nombre,
        'espacioId': h.espacio.id,
        'espacio': h.espacio.nombre,
        'docenteId': h.docente.id if h.docente else None,
        'docente': h.docente.nombre if h.docente else 'Sin asignar',
        'cantidadEstudiantes': h.cantidad_estudiantes,
        'programa': h.grupo.programa.nombre if h.grupo.programa else None,
        'semestre': h.grupo.semestre,
    }


def _clases_docente(docente):
    """Clases aprobadas que dicta el docente."""
    horarios = Horario.objects.filter(docente=docente, estado='aprobado').select_related(
        'grupo', 'asignatura', 'espacio', 'grupo__programa'
    )
    return [_clase_de_mi_horario(h) for h in horarios]


def _clases_estudiante(estudiante):
    """Clases en las que está inscrito el estudiante."""
    inscripciones = HorarioEstudiante.objects.filter(estudiante=estudiante).select_related(
        'horario',
        'horario__grupo',
        'horario__asignatura',
        'horario__espacio',
        'horario__docente',
        'horario__grupo__programa',
    )
    return [_clase_de_mi_horario(insc.horario) for insc in inscripciones]


def _usuario_de_mi_horario(request):
    """El usuario cuyo horario se pide (usuario_id). Cada persona ve el suyo; un administrador, el de cualquiera.

    Devuelve (usuario, respuesta_de_error).
    """
    user, auth_error = _require_auth(request)
    if auth_error:
        return None, auth_error

    usuario_id = request.GET.get('usuario_id') or request.headers.get('X-Usuario-Id')
    if not usuario_id:
        return None, JsonResponse({'error': 'usuario_id es requerido'}, status=400)

    if not _is_admin_user(user) and user.id != int(usuario_id):
        return None, JsonResponse({'error': 'No autorizado'}, status=403)

    try:
        return Usuario.objects.get(id=usuario_id), None
    except Usuario.DoesNotExist:
        return None, JsonResponse({'error': 'Usuario no encontrado'}, status=404)


def _mi_horario(request, clases_de):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        usuario, error = _usuario_de_mi_horario(request)
        if error:
            return error
        return JsonResponse({'horarios': clases_de(usuario)}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def mi_horario_docente(request):
    return _mi_horario(request, _clases_docente)


@csrf_exempt
def mi_horario_estudiante(request):
    return _mi_horario(request, _clases_estudiante)


def _para_exportar(clase):
    """Una clase de Mi horario con los nombres de campo que usa horario/exportaciones.py."""
    return {
        'grupo_nombre': clase['grupo'],
        'programa_nombre': clase['programa'] or 'N/A',
        'asignatura_nombre': clase['asignatura'],
        'docente_nombre': clase['docente'],
        'espacio_nombre': clase['espacio'],
        'dia_semana': clase['diaSemana'],
        'hora_inicio': clase['horaInicio'],
        'hora_fin': clase['horaFin'],
    }


_FORMATOS_MI_HORARIO = {
    # formato: (generador para estudiante, generador para docente, content type, nombre del archivo)
    'pdf': (exportaciones.pdf_por_grupo, exportaciones.pdf_por_docente, 'application/pdf', 'mi_horario.pdf'),
    'excel': (exportaciones.excel_por_grupo, exportaciones.excel_por_docente,
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'mi_horario.xlsx'),
}


def exportar_mi_horario(request, formato):
    """Descarga de Mi horario: exporta lo mismo que muestra la pantalla.

    Al estudiante (rol «estudiante», como decide el frontend), las clases en que está inscrito, una página u hoja
    por grupo; a los demás, sus clases aprobadas como docente, en una página u hoja.
    """
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        usuario, error = _usuario_de_mi_horario(request)
        if error:
            return error

        para_estudiante, para_docente, content_type, nombre = _FORMATOS_MI_HORARIO[formato]
        if usuario.rol and usuario.rol.nombre == 'estudiante':
            clases, generar = _clases_estudiante(usuario), para_estudiante
        else:
            clases, generar = _clases_docente(usuario), para_docente
        if not clases:
            return JsonResponse({'error': 'No hay horarios registrados'}, status=400)

        response = HttpResponse(generar([_para_exportar(c) for c in clases]), content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{nombre}"'
        return response
    except Exception as e:
        logger.exception('Error al exportar Mi horario')
        return JsonResponse({'error': str(e)}, status=500)
