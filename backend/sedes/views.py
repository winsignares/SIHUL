from django.shortcuts import render
from .models import Sede
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from mysite.xss_protection import sanitize_dict, SEDE_SCHEMA


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

# ---------- Sede CRUD ----------
@csrf_exempt
def create_sede(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, SEDE_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            direccion = sanitized_data.get('direccion')
            seccional_id = sanitized_data.get('seccional_id')
            activa = sanitized_data.get('activa', True)
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, SEDE_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            sede = Sede.objects.get(id=id)
            if 'nombre' in sanitized_data:
                sede.nombre = sanitized_data.get('nombre')
            if 'direccion' in sanitized_data:
                sede.direccion = sanitized_data.get('direccion')
            if 'seccional_id' in sanitized_data:
                sede.seccional_id = sanitized_data.get('seccional_id')
            if 'activa' in sanitized_data:
                sede.activa = bool(sanitized_data.get('activa'))
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

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

