"""Listado y alta de preguntas-respuestas."""
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
from ..models import PreguntaRespuesta
from .comunes import _como_bool
from .comunes import _guardar_anexos
from .comunes import _sede_de_la_peticion
from .comunes import _serializar
from .comunes import _sincronizar_al_confirmar
from .comunes import _validar_archivos
from .comunes import _validar_textos


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
