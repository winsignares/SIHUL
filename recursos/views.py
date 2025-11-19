from django.shortcuts import render
from .models import Recurso, EspacioRecurso
from espacios.models import EspacioFisico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Recurso CRUD ----------
@csrf_exempt
def create_recurso(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            descripcion = data.get('descripcion')
            r = Recurso(nombre=nombre, descripcion=descripcion)
            r.save()
            return JsonResponse({"message": "Recurso creado", "id": r.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_recurso(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            r = Recurso.objects.get(id=id)
            if 'nombre' in data:
                r.nombre = data.get('nombre')
            if 'descripcion' in data:
                r.descripcion = data.get('descripcion')
            r.save()
            return JsonResponse({"message": "Recurso actualizado", "id": r.id}, status=200)
        except Recurso.DoesNotExist:
            return JsonResponse({"error": "Recurso no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_recurso(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            r = Recurso.objects.get(id=id)
            r.delete()
            return JsonResponse({"message": "Recurso eliminado"}, status=200)
        except Recurso.DoesNotExist:
            return JsonResponse({"error": "Recurso no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_recurso(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        r = Recurso.objects.get(id=id)
        return JsonResponse({"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion}, status=200)
    except Recurso.DoesNotExist:
        return JsonResponse({"error": "Recurso no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_recursos(request):
    if request.method == 'GET':
        items = Recurso.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "descripcion": i.descripcion} for i in items]
        return JsonResponse({"recursos": lst}, status=200)


# ---------- EspacioRecurso CRUD ----------
@csrf_exempt
def create_espacio_recurso(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            recurso_id = data.get('recurso_id')
            disponible = data.get('disponible', True)
            if not espacio_id or not recurso_id:
                return JsonResponse({"error": "espacio_id y recurso_id son requeridos"}, status=400)
            espacio = EspacioFisico.objects.get(id=espacio_id)
            recurso = Recurso.objects.get(id=recurso_id)
            er = EspacioRecurso(espacio=espacio, recurso=recurso, disponible=bool(disponible))
            er.save()
            return JsonResponse({"message": "EspacioRecurso creado", "espacio_id": espacio.id, "recurso_id": recurso.id}, status=201)
        except EspacioFisico.DoesNotExist:
            return JsonResponse({"error": "Espacio no encontrado."}, status=404)
        except Recurso.DoesNotExist:
            return JsonResponse({"error": "Recurso no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_espacio_recurso(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            recurso_id = data.get('recurso_id')
            if not espacio_id or not recurso_id:
                return JsonResponse({"error": "espacio_id y recurso_id son requeridos"}, status=400)
            er = EspacioRecurso.objects.get(espacio_id=espacio_id, recurso_id=recurso_id)
            if 'disponible' in data:
                er.disponible = bool(data.get('disponible'))
            er.save()
            return JsonResponse({"message": "EspacioRecurso actualizado"}, status=200)
        except EspacioRecurso.DoesNotExist:
            return JsonResponse({"error": "Relación Espacio-Recurso no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_espacio_recurso(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            recurso_id = data.get('recurso_id')
            if not espacio_id or not recurso_id:
                return JsonResponse({"error": "espacio_id y recurso_id son requeridos"}, status=400)
            er = EspacioRecurso.objects.get(espacio_id=espacio_id, recurso_id=recurso_id)
            er.delete()
            return JsonResponse({"message": "EspacioRecurso eliminado"}, status=200)
        except EspacioRecurso.DoesNotExist:
            return JsonResponse({"error": "Relación Espacio-Recurso no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_espacio_recurso(request, espacio_id=None, recurso_id=None):
    if espacio_id is None or recurso_id is None:
        return JsonResponse({"error": "espacio_id y recurso_id son requeridos en la URL"}, status=400)
    try:
        er = EspacioRecurso.objects.get(espacio_id=espacio_id, recurso_id=recurso_id)
        return JsonResponse({"espacio_id": er.espacio.id, "recurso_id": er.recurso.id, "disponible": er.disponible}, status=200)
    except EspacioRecurso.DoesNotExist:
        return JsonResponse({"error": "Relación Espacio-Recurso no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_espacio_recursos(request):
    if request.method == 'GET':
        items = EspacioRecurso.objects.all()
        lst = [{"espacio_id": i.espacio.id, "recurso_id": i.recurso.id, "disponible": i.disponible} for i in items]
        return JsonResponse({"espacio_recursos": lst}, status=200)
