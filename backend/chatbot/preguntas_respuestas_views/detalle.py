"""Detalle, edición y baja de una pregunta-respuesta."""
from django.db import transaction
from rest_framework.parsers import FormParser
from rest_framework.parsers import JSONParser
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from ..admin_views import PuedeGestionarDocumentosChatbots
from ..admin_views import _chatbot_permitido
from ..admin_views import ids_chatbots_permitidos
from ..anexos import AnexoInvalido
from ..anexos import max_anexos_por_respuesta
from ..models import Agente
from ..models import AnexoRespuesta
from ..models import PreguntaRespuesta
from ..views import _resolve_user_sede_value
from .comunes import _como_bool
from .comunes import _guardar_anexos
from .comunes import _ids_a_eliminar
from .comunes import _puede_ver_todas_las_sedes
from .comunes import _serializar
from .comunes import _sincronizar_al_confirmar
from .comunes import _validar_archivos
from .comunes import _validar_textos


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
