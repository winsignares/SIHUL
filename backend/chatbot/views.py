from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from .models import Agente, PreguntaSugerida, Conversacion
from usuarios.models import Usuario
import json
import logging
import re
import requests
import unicodedata
import uuid

logger = logging.getLogger(__name__)

# Lo que ve el usuario cuando el RAG no responde. El detalle técnico va al log, no
# a la respuesta ni al historial.
RAG_ERROR_MESSAGE = 'Lo siento, en este momento no puedo responder tu pregunta. Intenta de nuevo en unos minutos.'

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


def fastapi_base_url():
    return getattr(settings, 'CHATBOT_FASTAPI_URL', 'http://chatbot:8001/api/v1').rstrip('/')


def _fastapi_chat_url():
    return f"{fastapi_base_url()}/chat/ask"


def _enviar_pregunta_fastapi(nombre, chatbot_id, sede, pregunta, chat_id=None, id_usuario=None):
    response = requests.post(
        _fastapi_chat_url(),
        json={
            'nombre': nombre,
            'chatbot_id': chatbot_id,
            'sede': sede,
            'question': pregunta,
            'chat_id': str(chat_id) if chat_id else None,
            'id_usuario': id_usuario,
        },
        headers={'Content-Type': 'application/json'},
        timeout=30,
    )
    response.raise_for_status()
    return response


def _consultar_rag(nombre, chatbot_id, sede, pregunta, chat_id=None, id_usuario=None):
    """
    Pregunta al servicio RAG. Devuelve (respuesta, None) o, si no se pudo obtener una
    respuesta válida, (RAG_ERROR_MESSAGE, código_de_error). Quien llama no debe
    guardar en el historial un intercambio que terminó en error.
    """
    try:
        response = _enviar_pregunta_fastapi(nombre, chatbot_id, sede, pregunta, chat_id=chat_id, id_usuario=id_usuario)
        data = response.json()
    except requests.exceptions.RequestException:
        logger.warning('El servicio RAG no respondió correctamente', exc_info=True)
        return RAG_ERROR_MESSAGE, 'servicio_no_disponible'
    except ValueError:
        logger.warning('El servicio RAG devolvió una respuesta que no es JSON', exc_info=True)
        return RAG_ERROR_MESSAGE, 'respuesta_invalida'

    respuesta = data.get('answer') or data.get('respuesta')
    if not respuesta:
        logger.warning('El servicio RAG devolvió una respuesta vacía: %s', data)
        return RAG_ERROR_MESSAGE, 'respuesta_vacia'
    return respuesta, None


def _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente):
    # UPDATE atómico: con "leer, sumar y guardar" dos usos simultáneos contaban uno
    if pregunta_sugerida_id:
        PreguntaSugerida.objects.filter(id=pregunta_sugerida_id, agente=agente).update(
            contador_uso=F('contador_uso') + 1
        )


def _agentes_activos_json():
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


def list_agentes(request):
    """Lista todos los agentes activos"""
    if request.method == 'GET':
        return _agentes_activos_json()
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
        
        _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente)

        # 1. Enviar pregunta al endpoint RAG (FastAPI)
        respuesta_texto, error_ia = _consultar_rag(
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
                'error': error_ia
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
        
        # Obtener chat_ids únicos (limpiando el ordering por defecto de Meta para compatibilidad con PostgreSQL distinct)
        chat_ids = query.order_by().values_list('chat_id', flat=True).distinct()
        
        # Una sola consulta para todos los hilos (antes eran cuatro por hilo) y se
        # agrupa en memoria
        hilos = {}
        filas = (
            Conversacion.objects.filter(chat_id__in=list(chat_ids))
            .only('chat_id', 'usuario', 'mensaje', 'fecha')
            .order_by('chat_id', 'fecha')
        )
        for conv in filas:
            hilos.setdefault(conv.chat_id, []).append(conv)

        conversaciones_lista = []
        for chat_id, convs in hilos.items():
            primera, ultima = convs[0], convs[-1]
            conversaciones_lista.append({
                'chat_id': str(chat_id),
                'agente_id': agente_id,
                'usuario': primera.usuario,
                'primer_mensaje': primera.mensaje[:100],
                'ultimo_mensaje': ultima.mensaje[:100],
                'fecha_inicio': primera.fecha.isoformat(),
                'fecha_actualizacion': ultima.fecha.isoformat(),
                'total_interacciones': len(convs)
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
        return _agentes_activos_json()
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
        client_chat_id = data.get('chat_id')
        
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
        chat_id = str(client_chat_id or uuid.uuid4())
        
        _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente)

        # Enviar pregunta al endpoint RAG (FastAPI); si falla, respuesta_texto ya es
        # el mensaje genérico para el usuario
        respuesta_texto, _error_ia = _consultar_rag(nombre_usuario, agente.id, sede_value, pregunta, chat_id=chat_id)

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