from django.shortcuts import render
from .models import Grupo
from programas.models import Programa
from periodos.models import PeriodoAcademico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Grupo CRUD ----------
@csrf_exempt
def create_grupo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            programa_id = data.get('programa_id')
            periodo_id = data.get('periodo_id')
            semestre = data.get('semestre')
            activo = data.get('activo', True)
            if not nombre or not programa_id or not periodo_id or semestre is None:
                return JsonResponse({"error": "nombre, programa_id, periodo_id y semestre son requeridos"}, status=400)
            programa = Programa.objects.get(id=programa_id)
            periodo = PeriodoAcademico.objects.get(id=periodo_id)
            g = Grupo(programa=programa, periodo=periodo, nombre=nombre, semestre=int(semestre), activo=bool(activo))
            g.save()
            return JsonResponse({"message": "Grupo creado", "id": g.id}, status=201)
        except (Programa.DoesNotExist, PeriodoAcademico.DoesNotExist):
            return JsonResponse({"error": "Programa o Periodo no encontrado."}, status=404)
        except ValueError:
            return JsonResponse({"error": "Semestre debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_grupo(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            g = Grupo.objects.get(id=id)
            if 'nombre' in data:
                g.nombre = data.get('nombre')
            if 'programa_id' in data:
                g.programa = Programa.objects.get(id=data.get('programa_id'))
            if 'periodo_id' in data:
                g.periodo = PeriodoAcademico.objects.get(id=data.get('periodo_id'))
            if 'semestre' in data:
                g.semestre = int(data.get('semestre'))
            if 'activo' in data:
                g.activo = bool(data.get('activo'))
            g.save()
            return JsonResponse({"message": "Grupo actualizado", "id": g.id}, status=200)
        except Grupo.DoesNotExist:
            return JsonResponse({"error": "Grupo no encontrado."}, status=404)
        except (Programa.DoesNotExist, PeriodoAcademico.DoesNotExist):
            return JsonResponse({"error": "Programa o Periodo no encontrado."}, status=404)
        except ValueError:
            return JsonResponse({"error": "Semestre debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_grupo(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            g = Grupo.objects.get(id=id)
            g.delete()
            return JsonResponse({"message": "Grupo eliminado"}, status=200)
        except Grupo.DoesNotExist:
            return JsonResponse({"error": "Grupo no encontrado."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_grupo(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        g = Grupo.objects.get(id=id)
        return JsonResponse({"id": g.id, "nombre": g.nombre, "programa_id": g.programa.id, "periodo_id": g.periodo.id, "semestre": g.semestre, "activo": g.activo}, status=200)
    except Grupo.DoesNotExist:
        return JsonResponse({"error": "Grupo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_grupos(request):
    if request.method == 'GET':
        items = Grupo.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "programa_id": i.programa.id, "periodo_id": i.periodo.id, "semestre": i.semestre, "activo": i.activo} for i in items]
        return JsonResponse({"grupos": lst}, status=200)
