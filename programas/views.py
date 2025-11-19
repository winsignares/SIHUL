from django.shortcuts import render
from .models import Programa
from facultades.models import Facultad
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Programa CRUD ----------
@csrf_exempt
def create_programa(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            facultad_id = data.get('facultad_id')
            activo = data.get('activo', True)
            if not nombre or not facultad_id:
                return JsonResponse({"error": "nombre y facultad_id son requeridos"}, status=400)
            facultad = Facultad.objects.get(id=facultad_id)
            p = Programa(nombre=nombre, facultad=facultad, activo=bool(activo))
            p.save()
            return JsonResponse({"message": "Programa creado", "id": p.id}, status=201)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_programa(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            p = Programa.objects.get(id=id)
            if 'nombre' in data:
                p.nombre = data.get('nombre')
            if 'facultad_id' in data:
                p.facultad = Facultad.objects.get(id=data.get('facultad_id'))
            if 'activo' in data:
                p.activo = bool(data.get('activo'))
            p.save()
            return JsonResponse({"message": "Programa actualizado", "id": p.id}, status=200)
        except Programa.DoesNotExist:
            return JsonResponse({"error": "Programa no encontrado."}, status=404)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_programa(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            p = Programa.objects.get(id=id)
            p.delete()
            return JsonResponse({"message": "Programa eliminado"}, status=200)
        except Programa.DoesNotExist:
            return JsonResponse({"error": "Programa no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_programa(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        p = Programa.objects.get(id=id)
        return JsonResponse({"id": p.id, "nombre": p.nombre, "facultad": p.facultad.id, "activo": p.activo}, status=200)
    except Programa.DoesNotExist:
        return JsonResponse({"error": "Programa no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_programas(request):
    if request.method == 'GET':
        items = Programa.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "facultad_id": i.facultad.id, "activo": i.activo} for i in items]
        return JsonResponse({"programas": lst}, status=200)
