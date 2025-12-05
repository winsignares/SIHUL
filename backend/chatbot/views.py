from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Agente, PreguntaSugerida, Conversacion
import json
import requests
import uuid
from django.utils import timezone

def list_agentes(request):
    """Lista todos los agentes activos"""
    if request.method == 'GET':
        agentes = Agente.objects.filter(activo=True).prefetch_related('preguntas')
        
        lst = []
        for agente in agentes:
            preguntas = agente.preguntas.filter(activo=True).order_by('-contador_uso', 'orden')[:5]
            
            lst.append({
                'id': agente.id,
                'nombre': agente.nombre,
                'subtitulo': agente.subtitulo,
                'descripcion': agente.descripcion,
                'icono': agente.icono,
                'color': agente.color,
                'bgGradient': agente.bg_gradient,
                'activo': agente.activo,
                'mensajeBienvenida': agente.mensaje_bienvenida,
                'preguntasRapidas': [p.pregunta for p in preguntas]
            })
        
        return JsonResponse({'agentes': lst}, status=200)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def enviar_pregunta(request):
    """Envía pregunta al endpoint RAG del agente y guarda la conversación completa"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
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
        
        if not id_usuario:
            return JsonResponse({'error': 'id_usuario es requerido'}, status=400)
        
        if not nombre_usuario:
            return JsonResponse({'error': 'nombre_usuario es requerido'}, status=400)
        
        # Obtener agente
        try:
            agente = Agente.objects.get(id=agente_id, activo=True)
        except Agente.DoesNotExist:
            return JsonResponse({'error': 'Agente no encontrado o inactivo'}, status=404)
        
        # Generar chat_id si no existe (nueva conversación)
        if not chat_id:
            chat_id = str(uuid.uuid4())
        
        # Incrementar contador si es pregunta sugerida
        if pregunta_sugerida_id:
            try:
                preg = PreguntaSugerida.objects.get(id=pregunta_sugerida_id, agente=agente)
                preg.contador_uso += 1
                preg.save()
            except PreguntaSugerida.DoesNotExist:
                pass
        
        # 1. Enviar pregunta al endpoint RAG
        respuesta_texto = ''
        error_ia = None
        
        try:
            response = requests.post(
                agente.endpoint_url,
                json={'pregunta': pregunta},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            
            respuesta_data = response.json()
            respuesta_texto = respuesta_data.get('response', 'No se recibió respuesta')
            
        except requests.exceptions.RequestException as e:
            error_ia = str(e)
            respuesta_texto = f'Lo siento, hubo un error al procesar tu pregunta: {str(e)}'
        
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
        
        # 3. Devolver respuesta al frontend
        return JsonResponse({
            'id': conversacion.id,
            'chat_id': str(chat_id),
            'respuesta': respuesta_texto,
            'mensaje': pregunta,
            'fecha': conversacion.fecha.isoformat(),
            'usuario': nombre_usuario,
            'error': error_ia
        }, status=200)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def obtener_historial(request):
    """Obtiene el historial de conversaciones por chat_id o por agente"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        chat_id = request.GET.get('chat_id')
        agente_id = request.GET.get('agente_id')
        id_usuario = request.GET.get('id_usuario')
        
        if not chat_id and not agente_id:
            return JsonResponse({'error': 'Se requiere chat_id o agente_id'}, status=400)
        
        # Construir query base
        query = Conversacion.objects.all()
        
        if chat_id:
            query = query.filter(chat_id=chat_id)
        
        if agente_id:
            query = query.filter(chatbot_id=agente_id)
        
        if id_usuario:
            query = query.filter(id_usuario=id_usuario)
        
        # Obtener conversaciones ordenadas por fecha
        conversaciones = query.order_by('fecha').select_related('chatbot')
        
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
            # Respuesta del agente
            mensajes_lista.append({
                'id': f"{conv.id}-bot",
                'chat_id': str(conv.chat_id),
                'tipo': 'bot',
                'texto': conv.respuesta,
                'timestamp': conv.fecha.isoformat(),
                'leido': True,
                'usuario': conv.chatbot.nombre
            })
        
        return JsonResponse({
            'mensajes': mensajes_lista,
            'total': len(mensajes_lista)
        }, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def listar_conversaciones(request):
    """Lista todas las conversaciones de un usuario con un agente"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        agente_id = request.GET.get('agente_id')
        id_usuario = request.GET.get('id_usuario')
        
        if not agente_id:
            return JsonResponse({'error': 'Se requiere agente_id'}, status=400)
        
        # Obtener conversaciones
        query = Conversacion.objects.filter(chatbot_id=agente_id)
        
        if id_usuario:
            query = query.filter(id_usuario=id_usuario)
        
        # Obtener chat_ids únicos
        chat_ids = query.values_list('chat_id', flat=True).distinct()
        
        # Agrupar por chat_id y obtener info de cada hilo
        conversaciones_lista = []
        for chat_id in chat_ids:
            convs = Conversacion.objects.filter(chat_id=chat_id).order_by('fecha')
            if convs.exists():
                primera = convs.first()
                ultima = convs.last()
                total = convs.count()
                
                conversaciones_lista.append({
                    'chat_id': str(chat_id),
                    'agente_id': agente_id,
                    'usuario': primera.usuario,
                    'primer_mensaje': primera.mensaje[:100],
                    'ultimo_mensaje': ultima.mensaje[:100],
                    'fecha_inicio': primera.fecha.isoformat(),
                    'fecha_actualizacion': ultima.fecha.isoformat(),
                    'total_interacciones': total
                })
        
        # Ordenar por fecha más reciente
        conversaciones_lista.sort(key=lambda x: x['fecha_actualizacion'], reverse=True)
        
        return JsonResponse({
            'conversaciones': conversaciones_lista,
            'total': len(conversaciones_lista)
        }, status=200)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ========== ENDPOINTS PARA USUARIOS PÚBLICOS ==========

@csrf_exempt
def list_agentes_publico(request):
    """Lista todos los agentes activos para usuarios públicos"""
    if request.method == 'GET':
        agentes = Agente.objects.filter(activo=True).prefetch_related('preguntas')
        
        lst = []
        for agente in agentes:
            preguntas = agente.preguntas.filter(activo=True).order_by('-contador_uso', 'orden')[:5]
            
            lst.append({
                'id': agente.id,
                'nombre': agente.nombre,
                'subtitulo': agente.subtitulo,
                'descripcion': agente.descripcion,
                'icono': agente.icono,
                'color': agente.color,
                'bgGradient': agente.bg_gradient,
                'activo': agente.activo,
                'mensajeBienvenida': agente.mensaje_bienvenida,
                'preguntasRapidas': [p.pregunta for p in preguntas]
            })
        
        return JsonResponse({'agentes': lst}, status=200)
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def enviar_pregunta_publico(request):
    """Envía pregunta al endpoint RAG sin guardar historial - Solo para usuarios públicos"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        agente_id = data.get('agente_id')
        pregunta = data.get('pregunta')
        pregunta_sugerida_id = data.get('pregunta_sugerida_id')
        
        # Validaciones mínimas
        if not agente_id or not pregunta:
            return JsonResponse({'error': 'agente_id y pregunta son requeridos'}, status=400)
        
        # Obtener agente
        try:
            agente = Agente.objects.get(id=agente_id, activo=True)
        except Agente.DoesNotExist:
            return JsonResponse({'error': 'Agente no encontrado o inactivo'}, status=404)
        
        # Generar chat_id temporal (no se guardará)
        chat_id = str(uuid.uuid4())
        
        # Incrementar contador si es pregunta sugerida
        if pregunta_sugerida_id:
            try:
                preg = PreguntaSugerida.objects.get(id=pregunta_sugerida_id, agente=agente)
                preg.contador_uso += 1
                preg.save()
            except PreguntaSugerida.DoesNotExist:
                pass
        
        # Enviar pregunta al endpoint RAG
        respuesta_texto = ''
        
        try:
            response = requests.post(
                agente.endpoint_url,
                json={'pregunta': pregunta},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            
            respuesta_data = response.json()
            respuesta_texto = respuesta_data.get('response', 'No se recibió respuesta')
            
        except requests.exceptions.RequestException as e:
            respuesta_texto = f'Lo siento, hubo un error al procesar tu pregunta: {str(e)}'
        
        # NO guardamos la conversación para usuarios públicos
        # Retornamos directamente la respuesta
        
        return JsonResponse({
            'chat_id': chat_id,
            'respuesta': respuesta_texto,
            'timestamp': timezone.now().isoformat()
        }, status=200)
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
