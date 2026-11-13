"""Validaciones y ayudas de las preguntas-respuestas."""
from django.db import transaction
from nucleo.auth_helpers import is_admin_global
from nucleo.auth_helpers import is_admin_sistema
from rest_framework.response import Response
from ..anexos import anexos_json
from ..anexos import sincronizar_rag
from ..anexos import validar_anexo
from ..models import AnexoRespuesta
from ..views import _normalize_sede_value
from ..views import _resolve_user_sede_value


MAX_PREGUNTA = 1000


MAX_RESPUESTA = 5000


_VERDADERO = {'true', '1', 'si', 'sí', 'on', 'yes'}


def _como_bool(valor, defecto=True):
    if valor is None or valor == '':
        return defecto
    if isinstance(valor, bool):
        return valor
    return str(valor).strip().lower() in _VERDADERO


def _puede_ver_todas_las_sedes(user):
    return is_admin_global(user) or is_admin_sistema(user)


def _sede_de_la_peticion(request, sede_solicitada):
    """
    Sede sobre la que se trabaja: la indicada (si el usuario puede gestionar otras) o la
    del propio usuario. Devuelve (sede, respuesta_de_error).
    """
    sede_usuario = _resolve_user_sede_value(request.user)
    if sede_solicitada:
        sede = _normalize_sede_value(sede_solicitada)
        if not sede:
            return None, Response({'error': 'Sede no válida'}, status=400)
        if sede != sede_usuario and not _puede_ver_todas_las_sedes(request.user):
            return None, Response({'error': 'Solo puedes gestionar la seccional de tu usuario'}, status=403)
        return sede, None
    if not sede_usuario:
        return None, Response({'error': 'El usuario no tiene seccional configurada'}, status=400)
    return sede_usuario, None


def _serializar(request, pareja):
    return {
        'id': pareja.id,
        'agente': pareja.agente_id,
        'agente_nombre': pareja.agente.nombre,
        'sede': pareja.sede,
        'pregunta': pareja.pregunta,
        'respuesta': pareja.respuesta,
        'activo': pareja.activo,
        'creado': pareja.creado.isoformat(),
        'actualizado': pareja.actualizado.isoformat(),
        # En la gestión se ven (y descargan) también los anexos de preguntas inactivas
        'anexos': anexos_json(request, pareja.anexos.all(), administracion=True),
    }


def _validar_textos(pregunta, respuesta):
    errores = {}
    if not pregunta:
        errores['pregunta'] = 'La pregunta es obligatoria.'
    elif len(pregunta) > MAX_PREGUNTA:
        errores['pregunta'] = f'La pregunta no puede superar {MAX_PREGUNTA} caracteres.'
    if not respuesta:
        errores['respuesta'] = 'La respuesta es obligatoria.'
    elif len(respuesta) > MAX_RESPUESTA:
        errores['respuesta'] = f'La respuesta no puede superar {MAX_RESPUESTA} caracteres.'
    return errores


def _validar_archivos(archivos):
    """Valida todos los archivos antes de guardar ninguno. Devuelve [(archivo, tipo_mime)]."""
    validados = []
    for archivo in archivos:
        validados.append((archivo, validar_anexo(archivo)))
    return validados


def _guardar_anexos(pareja, validados):
    creados = []
    try:
        for archivo, tipo_mime in validados:
            creados.append(AnexoRespuesta.objects.create(
                pregunta_respuesta=pareja,
                archivo=archivo,
                nombre=archivo.name[:255],
                tipo_mime=tipo_mime,
                tamano=archivo.size,
            ))
    except Exception:
        # La transacción revierte las filas, pero los archivos ya escritos en disco no:
        # se borran para no dejar huérfanos.
        for anexo in creados:
            anexo.archivo.delete(save=False)
        raise
    return creados


def _ids_a_eliminar(request):
    valores = request.data.getlist('anexos_eliminar') if hasattr(request.data, 'getlist') else request.data.get('anexos_eliminar', [])
    if isinstance(valores, (str, int)):
        valores = [valores]
    ids = set()
    for valor in valores:
        for parte in str(valor).split(','):
            parte = parte.strip()
            if parte.isdigit():
                ids.add(int(parte))
    return ids


def _sincronizar_al_confirmar(*claves):
    for agente_id, sede in set(claves):
        transaction.on_commit(lambda a=agente_id, s=sede: sincronizar_rag(a, s))
