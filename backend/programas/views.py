from django.shortcuts import render
from .models import Programa
from facultades.models import Facultad
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from mysite.auth_helpers import MISSING_SECCIONAL_MESSAGE, get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema, is_superuser_effective
from mysite.xss_protection import sanitize_dict, PROGRAMA_SCHEMA


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


def _get_seccional_scope(user):
    if is_superuser_effective(user):
        return None, True
    return get_user_seccional_id(user), False


def _missing_seccional_response():
    return JsonResponse({'code': 'usuario_sin_seccional', 'error': MISSING_SECCIONAL_MESSAGE}, status=403)

# ---------- Programa CRUD ----------
@csrf_exempt
def create_programa(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, PROGRAMA_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            facultad_id = sanitized_data.get('facultad_id')
            semestres = sanitized_data.get('semestres', 10)
            activo = sanitized_data.get('activo', True)
            if not nombre or not facultad_id:
                return JsonResponse({"error": "nombre y facultad_id son requeridos"}, status=400)
            facultad = Facultad.objects.get(id=facultad_id)
            p = Programa(nombre=nombre, facultad=facultad, semestres=int(semestres), activo=bool(activo))
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, PROGRAMA_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            p = Programa.objects.get(id=id)
            if 'nombre' in sanitized_data:
                p.nombre = sanitized_data.get('nombre')
            if 'facultad_id' in sanitized_data:
                p.facultad = Facultad.objects.get(id=sanitized_data.get('facultad_id'))
            if 'semestres' in sanitized_data:
                p.semestres = int(sanitized_data.get('semestres'))
            if 'activo' in sanitized_data:
                p.activo = bool(sanitized_data.get('activo'))
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        seccional_id, is_superuser = _get_seccional_scope(user)
        if is_superuser:
            p = Programa.objects.get(id=id)
        elif seccional_id:
            p = Programa.objects.filter(id=id, facultad__sede__seccional_id=seccional_id).first()
            if not p:
                return JsonResponse({"error": "Programa no encontrado o no accesible."}, status=404)
        else:
            return _missing_seccional_response()
        return JsonResponse({
            "id": p.id, 
            "nombre": p.nombre, 
            "facultad_id": p.facultad.id if p.facultad else None, 
            "semestres": p.semestres,
            "activo": p.activo
        }, status=200)
    except Programa.DoesNotExist:
        return JsonResponse({"error": "Programa no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_programas(request):
    if request.method == 'GET':
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        seccional_id, is_superuser = _get_seccional_scope(user)

        if is_superuser:
            items = Programa.objects.all()
        elif seccional_id:
            items = Programa.objects.filter(facultad__sede__seccional_id=seccional_id)
        else:
            return _missing_seccional_response()
            
        lst = [{
            "id": i.id, 
            "nombre": i.nombre, 
            "facultad_id": i.facultad.id if i.facultad else None,
            "semestres": i.semestres,
            "activo": i.activo
        } for i in items]
        return JsonResponse({"programas": lst}, status=200)
