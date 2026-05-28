from django.shortcuts import render
from .models import Grupo
from programas.models import Programa
from periodos.models import PeriodoAcademico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from mysite.xss_protection import sanitize_dict, GRUPO_SCHEMA


def _get_request_user(request):
    return getattr(request, 'user_obj', None)


def _is_admin_user(user):
    if not user:
        return False
    if getattr(user, 'es_superusuario', False):
        return True
    role_name = get_role_name(user)
    return is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero'


def _require_auth(request):
    user = _get_request_user(request)
    if not user:
        return None, JsonResponse({"error": "Autenticación requerida"}, status=403)
    return user, None


def _require_admin(request):
    user, auth_error = _require_auth(request)
    if auth_error:
        return None, auth_error
    if not _is_admin_user(user):
        return None, JsonResponse({"error": "No autorizado"}, status=403)
    return user, None

# ---------- Grupo CRUD ----------
@csrf_exempt
def create_grupo(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, GRUPO_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            programa_id = sanitized_data.get('programa_id')
            periodo_id = sanitized_data.get('periodo_id')
            semestre = sanitized_data.get('semestre')
            activo = sanitized_data.get('activo', True)
            
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, GRUPO_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            g = Grupo.objects.get(id=id)
            if 'nombre' in sanitized_data:
                g.nombre = sanitized_data.get('nombre')
            if 'programa_id' in sanitized_data:
                g.programa = Programa.objects.get(id=sanitized_data.get('programa_id'))
            if 'periodo_id' in sanitized_data:
                g.periodo = PeriodoAcademico.objects.get(id=sanitized_data.get('periodo_id'))
            if 'semestre' in sanitized_data:
                g.semestre = int(sanitized_data.get('semestre'))
            if 'activo' in sanitized_data:
                g.activo = bool(sanitized_data.get('activo'))
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        #buscamos el grupo solo si su programa está en la misma seccional de la sede del usuario (a través de programa -> facultad -> sede)
        #obtenemos la sede del usuario desde el middleware
        user_sede = getattr(request, 'sede', None)
        #si el usuario tiene una sede con seccional, filtramos el grupo por esa seccional
        if user_sede and user_sede.seccional_id:
            g = Grupo.objects.filter(id=id, programa__facultad__sede__seccional_id=user_sede.seccional_id).first()
            if not g:
                return JsonResponse({"error": "Grupo no encontrado o no accesible."}, status=404)
        else:
            #si no tiene sede o seccional, buscamos el grupo sin filtro de seccional
            g = Grupo.objects.get(id=id)
        return JsonResponse({"id": g.id, "nombre": g.nombre, "programa_id": g.programa.id, "periodo_id": g.periodo.id, "semestre": g.semestre, "activo": g.activo}, status=200)
    except Grupo.DoesNotExist:
        return JsonResponse({"error": "Grupo no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_grupos(request):
    if request.method == 'GET':
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        # Obtener sede del usuario desde middleware
        user_sede = getattr(request, 'sede', None)
        
        # Filtrar grupos por la misma seccional de la sede del usuario (a través de programa -> facultad -> sede)
        if user_sede and user_sede.seccional_id:
            items = Grupo.objects.select_related('programa__facultad__sede').filter(
                programa__facultad__sede__seccional_id=user_sede.seccional_id
            )
        else:
            items = Grupo.objects.all()
        
        lst = [{"id": i.id, "nombre": i.nombre, "programa_id": i.programa.id, "periodo_id": i.periodo.id, "semestre": i.semestre, "activo": i.activo} for i in items]
        return JsonResponse({"grupos": lst}, status=200)

