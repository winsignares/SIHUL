from django.shortcuts import render
from .models import PeriodoAcademico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import datetime

# ---------- PeriodoAcademico CRUD ----------
@csrf_exempt
def create_periodo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            fecha_inicio = data.get('fecha_inicio')
            fecha_fin = data.get('fecha_fin')
            activo = data.get('activo', True)
            if not nombre or not fecha_inicio or not fecha_fin:
                return JsonResponse({"error": "nombre, fecha_inicio y fecha_fin son requeridos"}, status=400)
            fi = datetime.date.fromisoformat(fecha_inicio)
            ff = datetime.date.fromisoformat(fecha_fin)
            p = PeriodoAcademico(nombre=nombre, fecha_inicio=fi, fecha_fin=ff, activo=bool(activo))
            p.save()
            return JsonResponse({"message": "Periodo creado", "id": p.id}, status=201)
        except ValueError:
            return JsonResponse({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_periodo(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            p = PeriodoAcademico.objects.get(id=id)
            if 'nombre' in data:
                p.nombre = data.get('nombre')
            if 'fecha_inicio' in data:
                p.fecha_inicio = datetime.date.fromisoformat(data.get('fecha_inicio'))
            if 'fecha_fin' in data:
                p.fecha_fin = datetime.date.fromisoformat(data.get('fecha_fin'))
            if 'activo' in data:
                p.activo = bool(data.get('activo'))
            p.save()
            return JsonResponse({"message": "Periodo actualizado", "id": p.id}, status=200)
        except PeriodoAcademico.DoesNotExist:
            return JsonResponse({"error": "Periodo no encontrado."}, status=404)
        except ValueError:
            return JsonResponse({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_periodo(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            p = PeriodoAcademico.objects.get(id=id)
            p.delete()
            return JsonResponse({"message": "Periodo eliminado"}, status=200)
        except PeriodoAcademico.DoesNotExist:
            return JsonResponse({"error": "Periodo no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_periodo(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        p = PeriodoAcademico.objects.get(id=id)
        return JsonResponse({"id": p.id, "nombre": p.nombre, "fecha_inicio": str(p.fecha_inicio), "fecha_fin": str(p.fecha_fin), "activo": p.activo}, status=200)
    except PeriodoAcademico.DoesNotExist:
        return JsonResponse({"error": "Periodo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_periodos(request):
    if request.method == 'GET':
        items = PeriodoAcademico.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "fecha_inicio": str(i.fecha_inicio), "fecha_fin": str(i.fecha_fin), "activo": i.activo} for i in items]
        return JsonResponse({"periodos": lst}, status=200)
