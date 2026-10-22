"""
Preguntas-respuestas de los chatbots con anexos (documentos de soporte).

Gestión (requiere poder gestionar la documentación, ver PuedeGestionarDocumentosChatbots):
    GET    /api/chatbot/admin/preguntas-respuestas/?agente=&sede=   listar
    POST   /api/chatbot/admin/preguntas-respuestas/                 crear (multipart)
    GET    /api/chatbot/admin/preguntas-respuestas/<id>/            detalle
    PATCH  /api/chatbot/admin/preguntas-respuestas/<id>/            editar (multipart)
    DELETE /api/chatbot/admin/preguntas-respuestas/<id>/            eliminar (con sus anexos)

Campos del formulario: `agente`, `sede` (solo al crear), `pregunta`, `respuesta`,
`activo`, `anexos` (uno o varios archivos nuevos) y, al editar, `anexos_eliminar`
(ids de anexos a quitar).

Descarga (enlace firmado, ver chatbot/anexos.py):
    GET    /api/chatbot/anexos/<id>/descargar/?token=...
"""
import logging

from django.db import transaction
from django.http import FileResponse
from rest_framework import permissions
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.auth_helpers import is_admin_global, is_admin_sistema

from .admin_views import PuedeGestionarDocumentosChatbots, _chatbot_permitido, ids_chatbots_permitidos
from .anexos import (
    AnexoInvalido,
    anexos_json,
    leer_token,
    max_anexos_por_respuesta,
    sincronizar_rag,
    validar_anexo,
)
from .models import Agente, AnexoRespuesta, PreguntaRespuesta
from .views import _normalize_sede_value, _resolve_user_sede_value

logger = logging.getLogger(__name__)

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


class PreguntasRespuestasView(APIView):
    """Lista y crea preguntas-respuestas (con anexos) de los chatbots de una seccional."""

    permission_classes = [PuedeGestionarDocumentosChatbots]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        sede, error = _sede_de_la_peticion(request, request.query_params.get('sede'))
        if error:
            return error
        parejas = (
            PreguntaRespuesta.objects.filter(sede=sede)
            .select_related('agente')
            .prefetch_related('anexos')
        )
        permitidos = ids_chatbots_permitidos(request)
        if permitidos is not None:
            # Quien solo carga documentación ve únicamente las de sus chatbots asignados.
            parejas = parejas.filter(agente_id__in=permitidos)
        agente_id = request.query_params.get('agente')
        if agente_id:
            if not str(agente_id).isdigit():
                return Response({'error': 'agente no válido'}, status=400)
            if not _chatbot_permitido(permitidos, agente_id):
                return Response({'error': 'No tienes asignado este chatbot'}, status=403)
            parejas = parejas.filter(agente_id=int(agente_id))
        return Response([_serializar(request, p) for p in parejas])

    def post(self, request):
        sede, error = _sede_de_la_peticion(request, request.data.get('sede'))
        if error:
            return error
        agente_id = request.data.get('agente')
        if not agente_id or not str(agente_id).isdigit():
            return Response({'error': 'agente es requerido'}, status=400)
        agente = Agente.objects.filter(id=int(agente_id)).first()
        if not agente:
            return Response({'error': 'El chatbot no existe'}, status=404)
        if not _chatbot_permitido(ids_chatbots_permitidos(request), agente.id):
            return Response({'error': 'No tienes asignado este chatbot'}, status=403)
        if not agente.disponible_en(sede):
            return Response({'error': 'Este chatbot no está disponible en la seccional %s.' % sede}, status=400)

        pregunta = (request.data.get('pregunta') or '').strip()
        respuesta = (request.data.get('respuesta') or '').strip()
        errores = _validar_textos(pregunta, respuesta)
        if errores:
            return Response({'error': ' '.join(errores.values()), 'errores': errores}, status=400)

        archivos = request.FILES.getlist('anexos')
        if len(archivos) > max_anexos_por_respuesta():
            return Response({'error': f'Máximo {max_anexos_por_respuesta()} anexos por respuesta.'}, status=400)
        try:
            validados = _validar_archivos(archivos)
        except AnexoInvalido as exc:
            return Response({'error': str(exc)}, status=400)

        with transaction.atomic():
            pareja = PreguntaRespuesta.objects.create(
                agente=agente,
                sede=sede,
                pregunta=pregunta,
                respuesta=respuesta,
                activo=_como_bool(request.data.get('activo')),
            )
            _guardar_anexos(pareja, validados)
            _sincronizar_al_confirmar((agente.id, sede))
        return Response(_serializar(request, pareja), status=201)


class PreguntaRespuestaDetalleView(APIView):
    """Detalle, edición (textos, estado, agregar o quitar anexos) y borrado."""

    permission_classes = [PuedeGestionarDocumentosChatbots]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _obtener(self, request, pk):
        pareja = PreguntaRespuesta.objects.select_related('agente').prefetch_related('anexos').filter(pk=pk).first()
        if not pareja:
            return None, Response({'error': 'Pregunta-respuesta no encontrada'}, status=404)
        if not _puede_ver_todas_las_sedes(request.user) and pareja.sede != _resolve_user_sede_value(request.user):
            # Para quien no la puede gestionar es como si no existiera
            return None, Response({'error': 'Pregunta-respuesta no encontrada'}, status=404)
        if not _chatbot_permitido(ids_chatbots_permitidos(request), pareja.agente_id):
            return None, Response({'error': 'Pregunta-respuesta no encontrada'}, status=404)
        return pareja, None

    def get(self, request, pk):
        pareja, error = self._obtener(request, pk)
        if error:
            return error
        return Response(_serializar(request, pareja))

    def patch(self, request, pk):
        pareja, error = self._obtener(request, pk)
        if error:
            return error
        claves = {(pareja.agente_id, pareja.sede)}

        if 'agente' in request.data:
            agente_id = request.data.get('agente')
            agente = Agente.objects.filter(id=int(agente_id)).first() if str(agente_id).isdigit() else None
            if not agente:
                return Response({'error': 'El chatbot no existe'}, status=404)
            if not _chatbot_permitido(ids_chatbots_permitidos(request), agente.id):
                return Response({'error': 'No tienes asignado este chatbot'}, status=403)
            pareja.agente = agente
        if 'pregunta' in request.data:
            pareja.pregunta = (request.data.get('pregunta') or '').strip()
        if 'respuesta' in request.data:
            pareja.respuesta = (request.data.get('respuesta') or '').strip()
        if 'activo' in request.data:
            pareja.activo = _como_bool(request.data.get('activo'))
        errores = _validar_textos(pareja.pregunta, pareja.respuesta)
        if errores:
            return Response({'error': ' '.join(errores.values()), 'errores': errores}, status=400)

        eliminar = _ids_a_eliminar(request)
        actuales = {a.id for a in pareja.anexos.all()}
        archivos = request.FILES.getlist('anexos')
        if len(actuales - eliminar) + len(archivos) > max_anexos_por_respuesta():
            return Response({'error': f'Máximo {max_anexos_por_respuesta()} anexos por respuesta.'}, status=400)
        try:
            validados = _validar_archivos(archivos)
        except AnexoInvalido as exc:
            return Response({'error': str(exc)}, status=400)

        with transaction.atomic():
            pareja.save()
            # Solo los anexos de esta pareja: un id ajeno en `anexos_eliminar` se ignora.
            # El archivo en disco lo borra la señal post_delete al confirmar.
            for anexo in AnexoRespuesta.objects.filter(pregunta_respuesta=pareja, id__in=eliminar):
                anexo.delete()
            _guardar_anexos(pareja, validados)
            claves.add((pareja.agente_id, pareja.sede))
            _sincronizar_al_confirmar(*claves)

        pareja = PreguntaRespuesta.objects.select_related('agente').prefetch_related('anexos').get(pk=pareja.pk)
        return Response(_serializar(request, pareja))

    def delete(self, request, pk):
        pareja, error = self._obtener(request, pk)
        if error:
            return error
        with transaction.atomic():
            clave = (pareja.agente_id, pareja.sede)
            pareja.delete()  # los anexos (filas y archivos) se van en cascada
            _sincronizar_al_confirmar(clave)
        return Response(status=204)


class AnexoDescargaView(APIView):
    """
    Descarga de un anexo con un enlace firmado. No exige sesión porque el chat público
    también entrega anexos y un enlace <a href> no envía cabeceras de autenticación: la
    autorización es el token, que solo emite el sistema y caduca
    (CHATBOT_ANEXO_URL_MAX_AGE). Los enlaces del chat dejan de servir si la
    pregunta-respuesta o el agente se desactivan.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, pk):
        datos = leer_token(request.query_params.get('token'), pk)
        if not datos:
            return Response({'error': 'Enlace de descarga no válido o vencido'}, status=403)
        anexo = (
            AnexoRespuesta.objects.select_related('pregunta_respuesta__agente')
            .filter(pk=pk)
            .first()
        )
        if not anexo:
            return Response({'error': 'El anexo no existe'}, status=404)
        pareja = anexo.pregunta_respuesta
        if not datos.get('adm') and not (pareja.activo and pareja.agente.activo):
            return Response({'error': 'El anexo ya no está disponible'}, status=404)
        try:
            archivo = anexo.archivo.open('rb')
        except (FileNotFoundError, OSError):
            logger.warning('El archivo del anexo %s no está en el almacenamiento', anexo.pk)
            return Response({'error': 'El archivo del anexo no está disponible'}, status=404)

        respuesta = FileResponse(
            archivo,
            as_attachment=True,
            filename=anexo.nombre,
            content_type=anexo.tipo_mime,
        )
        respuesta['X-Content-Type-Options'] = 'nosniff'
        respuesta['Cache-Control'] = 'private, no-store'
        return respuesta
