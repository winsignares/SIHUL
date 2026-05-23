from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.utils import timezone
from .models import Agente, PreguntaSugerida, Conversacion
from usuarios.models import Usuario
import json
import re
import requests
import unicodedata
import uuid

FASTAPI_SEDES = {
    'nacional',
    'virtual',
    'el_socorro',
    'cali',
    'barranquilla',
    'bogota',
    'cucuta',
    'cartagena',
    'pereira',
}


def _normalize_sede_value(raw_value):
    if not raw_value:
        return None

    normalized = unicodedata.normalize('NFKD', str(raw_value))
    normalized = normalized.encode('ascii', 'ignore').decode('ascii')
    normalized = normalized.strip().lower().replace(' ', '_')
    normalized = re.sub(r'[^a-z0-9_]+', '', normalized)
    normalized = re.sub(r'_+', '_', normalized)
    if normalized in FASTAPI_SEDES:
        return normalized
    return None


def _resolve_user_sede_value(usuario):
    seccional = getattr(usuario, 'seccional', None)
    if seccional and getattr(seccional, 'ciudad', None):
        return _normalize_sede_value(seccional.ciudad)

    sede = getattr(usuario, 'sede', None)
    if sede and getattr(sede, 'seccional', None) and getattr(sede.seccional, 'ciudad', None):
        return _normalize_sede_value(sede.seccional.ciudad)

    return None


def _fastapi_chat_url():
    base_url = getattr(settings, 'CHATBOT_FASTAPI_URL', 'http://chatbot:8001/api/v1')
    return f"{base_url.rstrip('/')}/chat/ask"


def _enviar_pregunta_fastapi(nombre, sede, pregunta):
    response = requests.post(
        _fastapi_chat_url(),
        json={
            'nombre': nombre,
            'sede': sede,
            'question': pregunta,
        },
        headers={'Content-Type': 'application/json'},
        timeout=30,
    )
    response.raise_for_status()
    return response

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

        try:
            usuario = Usuario.objects.select_related('sede', 'seccional', 'sede__seccional').get(id=id_usuario)
        except Usuario.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)

        sede_value = _resolve_user_sede_value(usuario)
        if not sede_value:
            return JsonResponse({'error': 'El usuario no tiene seccional configurada'}, status=400)
        
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
        
        # 1. Enviar pregunta al endpoint RAG (FastAPI)
        respuesta_texto = ''
        error_ia = None
        
        try:
            response = _enviar_pregunta_fastapi(nombre_usuario, sede_value, pregunta)
            
            # Verificar que la respuesta tenga contenido
            if not response.text or response.text.strip() == '':
                raise ValueError('El servidor devolvió una respuesta vacía')
            
            # Intentar parsear JSON
            try:
                respuesta_data = response.json()
                respuesta_texto = (
                    respuesta_data.get('answer')
                    or respuesta_data.get('respuesta')
                    or 'No se recibió respuesta'
                )
            except json.JSONDecodeError as je:
                # Si no es JSON válido, mostrar lo que devolvió
                error_ia = f'Respuesta inválida del servidor: {response.text[:200]}'
                respuesta_texto = 'Lo siento, el servidor devolvió una respuesta inválida.'
            
        except requests.exceptions.RequestException as e:
            error_ia = str(e)
            respuesta_texto = f'Lo siento, hubo un error al procesar tu pregunta: {str(e)}'
        except ValueError as ve:
            error_ia = str(ve)
            respuesta_texto = f'Lo siento, el servidor no respondió correctamente: {str(ve)}'
        
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
        seccional_raw = data.get('seccional') or data.get('sede')
        nombre_usuario = data.get('nombre_usuario') or 'Invitado'
        
        # Validaciones mínimas
        if not agente_id or not pregunta:
            return JsonResponse({'error': 'agente_id y pregunta son requeridos'}, status=400)

        sede_value = _normalize_sede_value(seccional_raw)
        if not sede_value:
            return JsonResponse({'error': 'seccional es requerida para usuarios públicos'}, status=400)
        
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
        
        # Enviar pregunta al endpoint RAG (FastAPI)
        respuesta_texto = ''
        error_ia = None
        
        try:
            response = _enviar_pregunta_fastapi(nombre_usuario, sede_value, pregunta)
            
            # Verificar que la respuesta tenga contenido
            if not response.text or response.text.strip() == '':
                raise ValueError('El servidor devolvió una respuesta vacía')
            
            # Intentar parsear JSON
            try:
                respuesta_data = response.json()
                respuesta_texto = (
                    respuesta_data.get('answer')
                    or respuesta_data.get('respuesta')
                    or 'No se recibió respuesta'
                )
            except json.JSONDecodeError as je:
                # Si no es JSON válido, mostrar lo que devolvió
                error_ia = f'Respuesta inválida del servidor: {response.text[:200]}'
                respuesta_texto = 'Lo siento, el servidor devolvió una respuesta inválida.'
            
        except requests.exceptions.RequestException as e:
            error_ia = str(e)
            respuesta_texto = f'Lo siento, hubo un error al procesar tu pregunta: {str(e)}'
        except ValueError as ve:
            error_ia = str(ve)
            respuesta_texto = f'Lo siento, el servidor no respondió correctamente: {str(ve)}'
        
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
