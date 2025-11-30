from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Agente, PreguntaSugerida
import json
import requests

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
    """Envía pregunta al endpoint RAG del agente"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        agente_id = data.get('agente_id')
        pregunta = data.get('pregunta')
        pregunta_sugerida_id = data.get('pregunta_sugerida_id')
        
        if not agente_id or not pregunta:
            return JsonResponse({'error': 'agente_id y pregunta son requeridos'}, status=400)
        
        # Obtener agente
        try:
            agente = Agente.objects.get(id=agente_id, activo=True)
        except Agente.DoesNotExist:
            return JsonResponse({'error': 'Agente no encontrado o inactivo'}, status=404)
        
        # Incrementar contador si es pregunta sugerida
        if pregunta_sugerida_id:
            try:
                preg = PreguntaSugerida.objects.get(id=pregunta_sugerida_id, agente=agente)
                preg.contador_uso += 1
                preg.save()
            except PreguntaSugerida.DoesNotExist:
                pass
        
        # Enviar pregunta al endpoint RAG
        try:
            response = requests.post(
                agente.endpoint_url,
                json={'pregunta': pregunta},
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            response.raise_for_status()
            
            respuesta_data = response.json()
            return JsonResponse({
                'respuesta': respuesta_data.get('response', 'No se recibió respuesta')
            }, status=200)
            
        except requests.exceptions.RequestException as e:
            return JsonResponse({
                'error': 'Error al comunicarse con el agente',
                'detalle': str(e)
            }, status=500)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON inválido'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
