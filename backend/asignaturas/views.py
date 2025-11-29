from django.shortcuts import render
from .models import Asignatura
from facultades.models import Facultad
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Asignatura CRUD ----------
@csrf_exempt
def create_asignatura(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            codigo = data.get('codigo')
            creditos = data.get('creditos')
            tipo = data.get('tipo', 'presencial')
            facultad_id = data.get('facultad_id')
            horas = data.get('horas', 0)

            if not nombre or not codigo or creditos is None:
                return JsonResponse({"error": "nombre, codigo y creditos son requeridos"}, status=400)
            
            facultad = None
            if facultad_id:
                try:
                    facultad = Facultad.objects.get(id=facultad_id)
                except Facultad.DoesNotExist:
                    return JsonResponse({"error": "Facultad no encontrada"}, status=404)

            a = Asignatura(
                nombre=nombre, 
                codigo=codigo, 
                creditos=int(creditos), 
                tipo=tipo,
                facultad=facultad,
                horas=int(horas)
            )
            a.save()
            return JsonResponse({"message": "Asignatura creada", "id": a.id}, status=201)
        except ValueError:
            return JsonResponse({"error": "creditos y horas deben ser enteros"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_asignatura(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            a = Asignatura.objects.get(id=id)
            if 'nombre' in data:
                a.nombre = data.get('nombre')
            if 'codigo' in data:
                a.codigo = data.get('codigo')
            if 'creditos' in data:
                a.creditos = int(data.get('creditos'))
            if 'tipo' in data:
                a.tipo = data.get('tipo')
            if 'horas' in data:
                a.horas = int(data.get('horas'))
            if 'facultad_id' in data:
                facultad_id = data.get('facultad_id')
                if facultad_id:
                    try:
                        a.facultad = Facultad.objects.get(id=facultad_id)
                    except Facultad.DoesNotExist:
                        return JsonResponse({"error": "Facultad no encontrada"}, status=404)
                else:
                    a.facultad = None
            
            a.save()
            return JsonResponse({"message": "Asignatura actualizada", "id": a.id}, status=200)
        except Asignatura.DoesNotExist:
            return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
        except ValueError:
            return JsonResponse({"error": "creditos y horas deben ser enteros"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_asignatura(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            a = Asignatura.objects.get(id=id)
            a.delete()
            return JsonResponse({"message": "Asignatura eliminada"}, status=200)
        except Asignatura.DoesNotExist:
            return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_asignatura(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        a = Asignatura.objects.get(id=id)
        return JsonResponse({
            "id": a.id, 
            "nombre": a.nombre, 
            "codigo": a.codigo, 
            "creditos": a.creditos, 
            "tipo": a.tipo,
            "facultad_id": a.facultad.id if a.facultad else None,
            "horas": a.horas
        }, status=200)
    except Asignatura.DoesNotExist:
        return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_asignaturas(request):
    if request.method == 'GET':
        items = Asignatura.objects.all()
        lst = [{
            "id": i.id, 
            "nombre": i.nombre, 
            "codigo": i.codigo, 
            "creditos": i.creditos, 
            "tipo": i.tipo,
            "facultad_id": i.facultad.id if i.facultad else None,
            "horas": i.horas
        } for i in items]
        return JsonResponse({"asignaturas": lst}, status=200)
