from django.shortcuts import render
from .models import Componente
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Componente CRUD ----------

@csrf_exempt
def create_componente(request):
    """Crear un nuevo componente"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            descripcion = data.get('descripcion')
            
            if not nombre:
                return JsonResponse({"error": "El nombre es requerido"}, status=400)
            
            componente = Componente(nombre=nombre, descripcion=descripcion)
            componente.save()
            return JsonResponse({
                "message": "Componente creado exitosamente",
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite POST"}, status=405)


@csrf_exempt
def list_componentes(request):
    """Listar todos los componentes"""
    if request.method == 'GET':
        try:
            componentes = Componente.objects.all()
            lista = [
                {
                    "id": c.id,
                    "nombre": c.nombre,
                    "descripcion": c.descripcion
                }
                for c in componentes
            ]
            return JsonResponse({"componentes": lista}, status=200)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def retrieve_componente(request, id):
    """Obtener un componente por ID"""
    if request.method == 'GET':
        try:
            componente = Componente.objects.get(id=id)
            return JsonResponse({
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite GET"}, status=405)


@csrf_exempt
def update_componente(request):
    """Actualizar un componente"""
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente = Componente.objects.get(id=id)
            
            if 'nombre' in data:
                componente.nombre = data.get('nombre')
            if 'descripcion' in data:
                componente.descripcion = data.get('descripcion')
            
            componente.save()
            return JsonResponse({
                "message": "Componente actualizado exitosamente",
                "id": componente.id,
                "nombre": componente.nombre,
                "descripcion": componente.descripcion
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite PUT"}, status=405)


@csrf_exempt
def delete_componente(request):
    """Eliminar un componente"""
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            
            componente = Componente.objects.get(id=id)
            componente.delete()
            return JsonResponse({
                "message": "Componente eliminado exitosamente"
            }, status=200)
        except Componente.DoesNotExist:
            return JsonResponse({"error": "Componente no encontrado"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Solo se permite DELETE"}, status=405)
