"""Chat de usuarios autenticados: preguntas e historial."""
import json
import uuid
from django.http import JsonResponse
from django.utils import timezone
from nucleo.vistas import VistaJson
from ...anexos import anexos_json
from ...models import Agente
from ...models import Conversacion
from .comunes import _anexos_de_respuesta
from .comunes import _registrar_uso_pregunta_sugerida
from .comunes import _resolve_user_sede_value
from .rag import _consultar_rag


class EnviarPreguntaView(VistaJson):
    def post(self, request):
        """Envía pregunta al endpoint RAG del agente y guarda la conversación completa"""
        usuario = getattr(request, 'user_obj', None)
        if usuario is None:
            return JsonResponse({'error': 'Autenticación requerida'}, status=401)

        try:
            data = json.loads(request.body)
            agente_id = data.get('agente_id')
            pregunta = data.get('pregunta')
            pregunta_sugerida_id = data.get('pregunta_sugerida_id')
            chat_id = data.get('chat_id')
            id_usuario = data.get('id_usuario')
            nombre_usuario = data.get('nombre_usuario')

            # Validaciones estrictas
            if not agente_id or not pregunta:
                return JsonResponse({'error': 'agente_id y pregunta son requeridos'}, status=400)

            if not nombre_usuario:
                return JsonResponse({'error': 'nombre_usuario es requerido'}, status=400)

            # La pregunta la hace quien tiene la sesión: el id del cuerpo, si llega, debe ser el suyo.
            if id_usuario and str(id_usuario) != str(usuario.id):
                return JsonResponse({'error': 'No puedes preguntar a nombre de otra persona'}, status=403)
            id_usuario = usuario.id

            sede_value = _resolve_user_sede_value(usuario)
            if not sede_value:
                return JsonResponse({'error': 'El usuario no tiene seccional configurada'}, status=400)

            # Obtener agente
            try:
                agente = Agente.objects.get(id=agente_id, activo=True)
            except Agente.DoesNotExist:
                return JsonResponse({'error': 'Agente no encontrado o inactivo'}, status=404)
            if not agente.disponible_en(sede_value):
                return JsonResponse({'error': 'Este chatbot no está disponible en esta seccional.'}, status=403)

            # Generar chat_id si no existe (nueva conversación)
            if not chat_id:
                chat_id = str(uuid.uuid4())

            _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente)

            # 1. Enviar pregunta al endpoint RAG (FastAPI)
            respuesta_texto, error_ia, ids_anexos = _consultar_rag(
                nombre_usuario, agente.id, sede_value, pregunta,
                chat_id=chat_id, id_usuario=usuario.id,
            )

            # Un intercambio fallido se muestra al usuario pero no se guarda: el historial
            # no debe contener "disculpas" en lugar de respuestas.
            if error_ia:
                return JsonResponse({
                    'id': f'error-{uuid.uuid4().hex[:8]}',
                    'chat_id': str(chat_id),
                    'respuesta': respuesta_texto,
                    'mensaje': pregunta,
                    'fecha': timezone.now().isoformat(),
                    'usuario': nombre_usuario,
                    'error': error_ia,
                    'anexos': [],
                }, status=200)

            # 2. Guardar conversación completa (pregunta + respuesta en un solo registro)
            conversacion = Conversacion.objects.create(
                chat_id=chat_id,
                chatbot=agente,
                id_usuario=id_usuario,
                usuario=nombre_usuario,
                mensaje=pregunta,
                respuesta=respuesta_texto,
                fecha=timezone.now()
            )
            anexos = _anexos_de_respuesta(ids_anexos, agente, sede_value)
            if anexos:
                conversacion.anexos.set(anexos)

            # 3. Devolver respuesta al frontend (con los anexos de soporte, si los hay)
            return JsonResponse({
                'id': conversacion.id,
                'chat_id': str(chat_id),
                'respuesta': respuesta_texto,
                'mensaje': pregunta,
                'fecha': conversacion.fecha.isoformat(),
                'usuario': nombre_usuario,
                'error': error_ia,
                'anexos': anexos_json(request, anexos),
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class ObtenerHistorialView(VistaJson):
    def get(self, request):
        """Obtiene el historial de conversaciones, por chat_id o por agente, de quien tiene la sesión"""
        usuario = getattr(request, 'user_obj', None)
        if usuario is None:
            return JsonResponse({'error': 'Autenticación requerida'}, status=401)
        try:
            chat_id = request.GET.get('chat_id')
            agente_id = request.GET.get('agente_id')
            id_usuario = request.GET.get('id_usuario')

            if not chat_id and not agente_id:
                return JsonResponse({'error': 'Se requiere chat_id o agente_id'}, status=400)

            # Solo las conversaciones propias: nadie lee las de otra persona, ni por chat_id ni por agente.
            if id_usuario and str(id_usuario) != str(usuario.id):
                return JsonResponse({'error': 'Solo puedes consultar tu propio historial'}, status=403)
            query = Conversacion.objects.filter(id_usuario=usuario.id)

            if chat_id:
                query = query.filter(chat_id=chat_id)

            if agente_id:
                query = query.filter(chatbot_id=agente_id)

            # Obtener conversaciones ordenadas por fecha
            conversaciones = (
                query.order_by('fecha')
                .select_related('chatbot')
                .prefetch_related('anexos__pregunta_respuesta')
            )

            # Formatear respuesta - Convertir cada conversación a par de mensajes para el frontend
            mensajes_lista = []
            for conv in conversaciones:
                # Mensaje del usuario
                mensajes_lista.append({
                    'id': f"{conv.id}-user",
                    'chat_id': str(conv.chat_id),
                    'tipo': 'user',
                    'texto': conv.mensaje,
                    'timestamp': conv.fecha.isoformat(),
                    'leido': True,
                    'usuario': conv.usuario
                })
                # Respuesta del agente, con enlaces nuevos (los firmados caducan) a los anexos
                # que la acompañaron y que siguen disponibles
                anexos = [a for a in conv.anexos.all() if a.pregunta_respuesta.activo]
                mensajes_lista.append({
                    'id': f"{conv.id}-bot",
                    'chat_id': str(conv.chat_id),
                    'tipo': 'bot',
                    'texto': conv.respuesta,
                    'timestamp': conv.fecha.isoformat(),
                    'leido': True,
                    'usuario': conv.chatbot.nombre,
                    'anexos': anexos_json(request, anexos),
                })

            return JsonResponse({
                'mensajes': mensajes_lista,
                'total': len(mensajes_lista)
            }, status=200)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
