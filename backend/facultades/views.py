from django.shortcuts import render
from .models import Facultad
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from mysite.xss_protection import sanitize_dict, FACULTAD_SCHEMA


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

# ---------- Facultad CRUD ----------
@csrf_exempt
def create_facultad(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, FACULTAD_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            activa = sanitized_data.get('activa', True)
            if not nombre:
                return JsonResponse({"error": "El nombre es requerido"}, status=400)
            f = Facultad(nombre=nombre, activa=bool(activa))
            f.save()
            return JsonResponse({"message": "Facultad creada", "id": f.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_facultad(request):
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
                sanitized_data = sanitize_dict(data, FACULTAD_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            f = Facultad.objects.get(id=id)
            if 'nombre' in sanitized_data:
                f.nombre = sanitized_data.get('nombre')
            if 'activa' in sanitized_data:
                f.activa = bool(sanitized_data.get('activa'))
            f.save()
            return JsonResponse({"message": "Facultad actualizada", "id": f.id}, status=200)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_facultad(request):
    if request.method == 'DELETE':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            f = Facultad.objects.get(id=id)
            f.delete()
            return JsonResponse({"message": "Facultad eliminada"}, status=200)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_facultad(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        usuario_actual = getattr(request, 'user_obj', None)
        sede_actual = getattr(request, 'sede', None)

        if usuario_actual and sede_actual and sede_actual.seccional_id:
            f = Facultad.objects.select_related('sede').get(id=id, sede__seccional_id=sede_actual.seccional_id)
        else:
            f = Facultad.objects.select_related('sede').get(id=id)

        return JsonResponse({
            "id": f.id,
            "nombre": f.nombre,
            "activa": f.activa,
            "sede_id": f.sede_id,
            "sede_nombre": f.sede.nombre if f.sede else None,
            "sede_seccional_id": f.sede.seccional_id if f.sede else None,
            "sede_seccional_ciudad": f.sede.seccional.ciudad if f.sede and f.sede.seccional else None,
        }, status=200)
    except Facultad.DoesNotExist:
        return JsonResponse({"error": "Facultad no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_facultades(request):
    if request.method == 'GET':
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        usuario_actual = getattr(request, 'user_obj', None)
        sede_actual = getattr(request, 'sede', None)

        if usuario_actual and sede_actual and sede_actual.seccional_id:
            items = Facultad.objects.filter(sede__seccional_id=sede_actual.seccional_id).select_related('sede')
        else:
            items = Facultad.objects.all().select_related('sede')

        lst = [{
            "id": i.id,
            "nombre": i.nombre,
            "activa": i.activa,
            "sede_id": i.sede_id,
            "sede_nombre": i.sede.nombre if i.sede else None,
            "sede_seccional_id": i.sede.seccional_id if i.sede else None,
            "sede_seccional_ciudad": i.sede.seccional.ciudad if i.sede and i.sede.seccional else None
        } for i in items]
        return JsonResponse({"facultades": lst}, status=200)

