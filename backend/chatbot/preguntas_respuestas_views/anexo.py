"""Descarga de anexos con enlace firmado."""
import logging
from django.http import FileResponse
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from ..anexos import leer_token
from ..models import AnexoRespuesta


logger = logging.getLogger(__name__)


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
