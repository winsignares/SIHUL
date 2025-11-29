from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
import json
from .models import Asignatura
from programas.models import Programa

# ---------- Asignatura CRUD ----------
@csrf_exempt
@require_http_methods(["POST"])
def create_asignatura(request):
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre')
        codigo = data.get('codigo')
        creditos = data.get('creditos')
        tipo = data.get('tipo', 'teórica')
        programa_id = data.get('programa_id')
        horas = data.get('horas', 0)

        if not all([nombre, codigo, creditos]):
            return JsonResponse({'error': 'Faltan campos obligatorios'}, status=400)
        
        programa = None
        if programa_id:
            try:
                programa = Programa.objects.get(id=programa_id)
            except Programa.DoesNotExist:
                return JsonResponse({'error': 'El programa especificado no existe'}, status=404)

        asignatura = Asignatura(
            nombre=nombre,
            codigo=codigo,
            creditos=int(creditos),
            tipo=tipo,
            programa=programa,
            horas=int(horas)
        )
        asignatura.save()

        return JsonResponse({'message': 'Asignatura creada exitosamente', 'id': asignatura.id}, status=201)
    except ValueError:
         return JsonResponse({'error': 'Créditos y horas deben ser números enteros'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["PUT"])
def update_asignatura(request, id=None):
    # Nota: El ID puede venir en la URL o en el body, dependiendo de la implementación del router.
    # Aquí asumimos que si no está en URL, buscamos en body, o adaptamos según el estilo anterior.
    # El código anterior del usuario usaba `def update_asignatura(request):` y leía ID del body.
    # Voy a mantener consistencia con el estilo de recibir request y extraer ID del body si id es None.
    
    try:
        data = json.loads(request.body)
        if id is None:
            id = data.get('id')
        
        if not id:
             return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura = Asignatura.objects.get(id=id)

        asignatura.nombre = data.get('nombre', asignatura.nombre)
        asignatura.codigo = data.get('codigo', asignatura.codigo)
        
        if 'creditos' in data:
            asignatura.creditos = int(data.get('creditos'))
            
        asignatura.tipo = data.get('tipo', asignatura.tipo)
        
        if 'horas' in data:
            asignatura.horas = int(data.get('horas'))
            
        if 'programa_id' in data:
            programa_id = data.get('programa_id')
            if programa_id:
                try:
                    programa = Programa.objects.get(id=programa_id)
                    asignatura.programa = programa
                except Programa.DoesNotExist:
                    return JsonResponse({'error': 'El programa especificado no existe'}, status=404)
            else:
                asignatura.programa = None

        asignatura.save()

        return JsonResponse({'message': 'Asignatura actualizada exitosamente', 'id': asignatura.id})
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except ValueError:
         return JsonResponse({'error': 'Créditos y horas deben ser números enteros'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_asignatura(request, id=None):
    try:
        if id is None:
            data = json.loads(request.body)
            id = data.get('id')
            
        if not id:
            return JsonResponse({'error': 'ID es requerido'}, status=400)

        asignatura = Asignatura.objects.get(id=id)
        asignatura.delete()
        return JsonResponse({'message': 'Asignatura eliminada exitosamente'})
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_asignatura(request, id):
    try:
        asignatura = Asignatura.objects.get(id=id)
        data = {
            'id': asignatura.id,
            'nombre': asignatura.nombre,
            'codigo': asignatura.codigo,
            'creditos': asignatura.creditos,
            'tipo': asignatura.tipo,
            'programa_id': asignatura.programa.id if asignatura.programa else None,
            'horas': asignatura.horas
        }
        return JsonResponse(data)
    except Asignatura.DoesNotExist:
        return JsonResponse({'error': 'Asignatura no encontrada'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def list_asignaturas(request):
    try:
        asignaturas = Asignatura.objects.all()
        data = []
        for asignatura in asignaturas:
            data.append({
                'id': asignatura.id,
                'nombre': asignatura.nombre,
                'codigo': asignatura.codigo,
                'creditos': asignatura.creditos,
                'tipo': asignatura.tipo,
                'programa_id': asignatura.programa.id if asignatura.programa else None,
                'horas': asignatura.horas
            })
        return JsonResponse({'asignaturas': data}, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
