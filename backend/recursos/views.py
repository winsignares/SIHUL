from django.shortcuts import render
from .models import Recurso, EspacioRecurso
from espacios.models import EspacioFisico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from mysite.xss_protection import sanitize_dict, RECURSO_SCHEMA


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

# ---------- Recurso CRUD ----------
@csrf_exempt
def create_recurso(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, RECURSO_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            descripcion = sanitized_data.get('descripcion')
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, RECURSO_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            r = Recurso.objects.get(id=id)
            if 'nombre' in sanitized_data:
                r.nombre = sanitized_data.get('nombre')
            if 'descripcion' in sanitized_data:
                r.descripcion = sanitized_data.get('descripcion')
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        user_sede = getattr(request, 'sede', None)
        if user_sede and user_sede.seccional_id:
            r = Recurso.objects.filter(
                id=id,
                recurso_espacios__espacio__sede__seccional_id=user_sede.seccional_id
            ).first()
        else:
            r = Recurso.objects.filter(id=id).first()

        if not r:
            return JsonResponse({"error": "Recurso no encontrado o no accesible."}, status=404)

        return JsonResponse({"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion}, status=200)
    except Recurso.DoesNotExist:
        return JsonResponse({"error": "Recurso no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_recursos(request):
    if request.method == 'GET':
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        items = Recurso.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "descripcion": i.descripcion} for i in items]
        return JsonResponse({"recursos": lst}, status=200)


# ---------- EspacioRecurso CRUD ----------
@csrf_exempt
def create_espacio_recurso(request):
    if request.method == 'POST':
        try:
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            recurso_id = data.get('recurso_id')
            estado = data.get('estado', 'disponible')
            if not espacio_id or not recurso_id:
                return JsonResponse({"error": "espacio_id y recurso_id son requeridos"}, status=400)
            espacio = EspacioFisico.objects.get(id=espacio_id)
            recurso = Recurso.objects.get(id=recurso_id)
            er = EspacioRecurso(espacio=espacio, recurso=recurso, estado=estado)
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

            data = json.loads(request.body)
            espacio_id = data.get('espacio_id')
            recurso_id = data.get('recurso_id')
            if not espacio_id or not recurso_id:
                return JsonResponse({"error": "espacio_id y recurso_id son requeridos"}, status=400)
            er = EspacioRecurso.objects.get(espacio_id=espacio_id, recurso_id=recurso_id)
            if 'estado' in data:
                er.estado = data.get('estado')
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
            user, auth_error = _require_admin(request)
            if auth_error:
                return auth_error

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
        user, auth_error = _require_auth(request)
        if auth_error:
            return auth_error

        usuario_actual = getattr(request, 'user_obj', None)
        sede_actual = getattr(request, 'sede', None)

        if usuario_actual and sede_actual and sede_actual.seccional_id:
            er = EspacioRecurso.objects.select_related('espacio', 'recurso', 'espacio__sede').get(
                espacio_id=espacio_id,
                recurso_id=recurso_id,
                espacio__sede__seccional_id=sede_actual.seccional_id
            )
        else:
            er = EspacioRecurso.objects.select_related('espacio', 'recurso', 'espacio__sede').get(
                espacio_id=espacio_id,
                recurso_id=recurso_id
            )

        return JsonResponse({"espacio_id": er.espacio.id, "recurso_id": er.recurso.id, "estado": er.estado}, status=200)
    except EspacioRecurso.DoesNotExist:
        return JsonResponse({"error": "Relación Espacio-Recurso no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_espacio_recursos(request):
    if request.method == 'GET':
        usuario_actual = getattr(request, 'user_obj', None)
        sede_actual = getattr(request, 'sede', None)

        if usuario_actual and sede_actual and sede_actual.seccional_id:
            items = EspacioRecurso.objects.select_related('espacio', 'recurso', 'espacio__sede').filter(
                espacio__sede__seccional_id=sede_actual.seccional_id
            )
        else:
            items = EspacioRecurso.objects.select_related('espacio', 'recurso', 'espacio__sede').all()

        lst = [{"espacio_id": i.espacio.id, "recurso_id": i.recurso.id, "estado": i.estado} for i in items]
        return JsonResponse({"espacio_recursos": lst}, status=200)

