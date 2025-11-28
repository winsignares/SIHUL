from django.shortcuts import render
from .models import EspacioFisico
from sedes.models import Sede
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- EspacioFisico CRUD ----------
@csrf_exempt
def create_espacio(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            sede_id = data.get('sede_id')
            tipo = data.get('tipo')
            capacidad = data.get('capacidad')
            ubicacion = data.get('ubicacion')
            recursos = data.get('recursos')
            disponible = data.get('disponible', True)
            if not sede_id or not tipo or capacidad is None:
                return JsonResponse({"error": "sede_id, tipo y capacidad son requeridos"}, status=400)
            sede = Sede.objects.get(id=sede_id)
            e = EspacioFisico(sede=sede, tipo=tipo, capacidad=int(capacidad), ubicacion=ubicacion, recursos=recursos, disponible=bool(disponible))
            e.save()
            return JsonResponse({"message": "Espacio creado", "id": e.id}, status=201)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except ValueError:
            return JsonResponse({"error": "capacidad debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_espacio(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            e = EspacioFisico.objects.get(id=id)
            if 'sede_id' in data:
                e.sede = Sede.objects.get(id=data.get('sede_id'))
            if 'tipo' in data:
                e.tipo = data.get('tipo')
            if 'capacidad' in data:
                e.capacidad = int(data.get('capacidad'))
            if 'ubicacion' in data:
                e.ubicacion = data.get('ubicacion')
            if 'recursos' in data:
                e.recursos = data.get('recursos')
            if 'disponible' in data:
                e.disponible = bool(data.get('disponible'))
            e.save()
            return JsonResponse({"message": "Espacio actualizado", "id": e.id}, status=200)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado."}, status=404)
        except Sede.DoesNotExist:
            return JsonResponse({"error": "Sede no encontrada."}, status=404)
        except ValueError:
            return JsonResponse({"error": "capacidad debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_espacio(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            e = EspacioFisico.objects.get(id=id)
            e.delete()
            return JsonResponse({"message": "Espacio eliminado"}, status=200)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_espacio(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        e = EspacioFisico.objects.get(id=id)
        return JsonResponse({"id": e.id, "sede_id": e.sede.id, "tipo": e.tipo, "capacidad": e.capacidad, "ubicacion": e.ubicacion, "recursos": e.recursos, "disponible": e.disponible}, status=200)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({"error": "Espacio no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_espacios(request):
    if request.method == 'GET':
        items = EspacioFisico.objects.all()
        lst = [{"id": i.id, "sede_id": i.sede.id, "tipo": i.tipo, "capacidad": i.capacidad, "ubicacion": i.ubicacion, "recursos": i.recursos, "disponible": i.disponible} for i in items]
        return JsonResponse({"espacios": lst}, status=200)
