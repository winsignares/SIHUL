from django.shortcuts import render
from .models import Sede
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Sede CRUD ----------
@csrf_exempt
def create_sede(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            direccion = data.get('direccion')
            seccional_id = data.get('seccional_id')
            activa = data.get('activa', True)
            if not nombre:
                return JsonResponse({"error": "El nombre es requerido"}, status=400)
            s = Sede(nombre=nombre, direccion=direccion, seccional_id=seccional_id, activa=bool(activa))
            s.save()
            return JsonResponse({"message": "Sede creada", "id": s.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_sede(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            sede = Sede.objects.get(id=id)
            sede.nombre = data.get('nombre', sede.nombre)
            sede.direccion = data.get('direccion', sede.direccion)
            if 'seccional_id' in data:
                sede.seccional_id = data.get('seccional_id')
            if 'activa' in data:
                sede.activa = bool(data.get('activa'))
            sede.save()
            return JsonResponse({"message": "Sede actualizada", "id": sede.id}, status=200)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_sede(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            sede = Sede.objects.get(id=id)
            sede.delete()
            return JsonResponse({"message": "Sede eliminada"}, status=200)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_sede(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        sede = Sede.objects.get(id=id)
        return JsonResponse({
            "id": sede.id,
            "nombre": sede.nombre,
            "direccion": sede.direccion,
            "seccional_id": sede.seccional_id,
            "seccional_ciudad": sede.seccional.ciudad if sede.seccional else None,
            "activa": sede.activa,
        }, status=200)
    except Sede.DoesNotExist:
        return JsonResponse({"error": "Sede no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_sedes(request):
    if request.method == 'GET':
        user_sede = getattr(request, 'sede', None)
        if user_sede:
            sedes = Sede.objects.filter(seccional_id=user_sede.seccional_id)
        else:
            sedes = Sede.objects.all()
        lst = [{
            "id": s.id,
            "nombre": s.nombre,
            "direccion": s.direccion,
            "seccional_id": s.seccional_id,
            "seccional_ciudad": s.seccional.ciudad if s.seccional else None,
            "activa": s.activa,
        } for s in sedes]
        return JsonResponse({"sedes": lst}, status=200)

