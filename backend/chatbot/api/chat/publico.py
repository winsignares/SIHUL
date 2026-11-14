"""Chat público: desafío, sesión, agentes y preguntas."""
import json
import logging
import uuid
from django.http import JsonResponse
from django.utils import timezone
from nucleo.vistas import VistaJson
from ... import acceso_publico
from ...anexos import anexos_json
from ...models import Agente
from ...sedes import normalizar_sede as _normalize_sede_value
from .comunes import _agentes_activos_json
from .comunes import _anexos_de_respuesta
from .comunes import _registrar_uso_pregunta_sugerida
from .rag import _consultar_rag


logger = logging.getLogger(__name__)


def _rechazo_publico(rechazo):
    return JsonResponse({'error': rechazo.mensaje, 'codigo': rechazo.codigo}, status=rechazo.estado)


class DesafioPublicoView(VistaJson):
    def post(self, request):
        """Entrega un desafío de prueba de trabajo para pedir una sesión pública (ver acceso_publico.py)."""
        try:
            return JsonResponse(acceso_publico.emitir_desafio(request))
        except acceso_publico.AccesoPublicoError as rechazo:
            return _rechazo_publico(rechazo)


class SesionPublicaView(VistaJson):
    def post(self, request):
        """Verifica el desafío resuelto y entrega la sesión firmada que exige la pregunta pública."""
        try:
            data = json.loads(request.body or b'{}')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        if not isinstance(data, dict):
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        try:
            return JsonResponse(acceso_publico.crear_sesion(request, data.get('desafio'), data.get('solucion')))
        except acceso_publico.AccesoPublicoError as rechazo:
            return _rechazo_publico(rechazo)


class ListAgentesPublicoView(VistaJson):
    def get(self, request):
        """Agentes activos disponibles en la seccional elegida (?seccional=); sin ella, solo los de todas."""
        return _agentes_activos_json(_normalize_sede_value(request.GET.get('seccional') or request.GET.get('sede')))


class EnviarPreguntaPublicoView(VistaJson):
    def post(self, request):
        """Envía pregunta al endpoint RAG sin guardar historial - Solo para usuarios públicos"""

        try:
            data = json.loads(request.body)
            if not isinstance(data, dict):
                return JsonResponse({'error': 'JSON inválido'}, status=400)
            # Sesión firmada, tamaño de la pregunta y límites de uso (antes de gastar nada de IA)
            try:
                pregunta = acceso_publico.autorizar_pregunta(request, data.get('pregunta'))
            except acceso_publico.AccesoPublicoError as rechazo:
                return _rechazo_publico(rechazo)
            agente_id = data.get('agente_id')
            pregunta_sugerida_id = data.get('pregunta_sugerida_id')
            seccional_raw = data.get('seccional') or data.get('sede')
            nombre_usuario = str(data.get('nombre_usuario') or 'Invitado')[:60]
            client_chat_id = data.get('chat_id')

            # Validaciones mínimas
            if not agente_id:
                return JsonResponse({'error': 'agente_id es requerido'}, status=400)

            sede_value = _normalize_sede_value(seccional_raw)
            if not sede_value:
                return JsonResponse({'error': 'seccional es requerida para usuarios públicos'}, status=400)

            # Obtener agente
            try:
                agente = Agente.objects.get(id=agente_id, activo=True)
            except Agente.DoesNotExist:
                return JsonResponse({'error': 'Agente no encontrado o inactivo'}, status=404)
            if not agente.disponible_en(sede_value):
                return JsonResponse({'error': 'Este chatbot no está disponible en esta seccional.'}, status=403)

            # Generar chat_id temporal (no se guardará)
            try:
                chat_id = str(uuid.UUID(str(client_chat_id))) if client_chat_id else str(uuid.uuid4())
            except ValueError:
                chat_id = str(uuid.uuid4())

            _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente)

            # Enviar pregunta al endpoint RAG (FastAPI); si falla, respuesta_texto ya es
            # el mensaje genérico para el usuario
            respuesta_texto, _error_ia, ids_anexos = _consultar_rag(nombre_usuario, agente.id, sede_value, pregunta, chat_id=chat_id)
            anexos = _anexos_de_respuesta(ids_anexos, agente, sede_value)

            # NO guardamos la conversación para usuarios públicos
            # Retornamos directamente la respuesta

            return JsonResponse({
                'chat_id': chat_id,
                'respuesta': respuesta_texto,
                'timestamp': timezone.now().isoformat(),
                'anexos': anexos_json(request, anexos),
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception:
            logger.exception('Error inesperado en el chat público')
            return JsonResponse({'error': 'No se pudo procesar tu pregunta. Inténtalo de nuevo.'}, status=500)
