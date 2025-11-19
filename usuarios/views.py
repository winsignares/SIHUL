from django.shortcuts import render
from .models import Rol, Usuario
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import datetime

# ---------- Rol CRUD ----------

@csrf_exempt
def create_rol(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            descripcion = data.get('descripcion')
            if not nombre or not descripcion:
                return JsonResponse({"error": "El nombre y la descripción son requeridos"}, status=400)
            nuevo_rol = Rol(nombre=nombre, descripcion=descripcion)
            nuevo_rol.save()
            return JsonResponse({"message": "Rol creado", "id": nuevo_rol.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "El cuerpo de la solicitud no es un JSON válido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        
@csrf_exempt
def update_rol(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            nombre = data.get('nombre')
            descripcion = data.get('descripcion')
            if not id or not nombre or not descripcion:
                return JsonResponse({"error": "ID, nombre y descripción son requeridos"}, status=400)
            rol_existente = Rol.objects.get(id=id)
            rol_existente.nombre = nombre
            rol_existente.descripcion = descripcion
            rol_existente.save()
            return JsonResponse({"message": "Rol actualizado", "id": rol_existente.id}, status=200)
        
        except Rol.DoesNotExist:
            return JsonResponse({"error": "El rol con el ID proporcionado no existe."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "El cuerpo de la solicitud no es un JSON válido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_rol(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "El ID es requerido"}, status=400)
            rol_existente = Rol.objects.get(id=id)
            rol_existente.delete()
            return JsonResponse({"message": "Rol eliminado"}, status=200)
        except Rol.DoesNotExist:
            return JsonResponse({"error": "El rol con el ID proporcionado no existe."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "El cuerpo de la solicitud no es un JSON válido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_rol(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        rol_existente = Rol.objects.get(id=id)
        return JsonResponse({"id": rol_existente.id, "nombre": rol_existente.nombre, "descripcion": rol_existente.descripcion}, status=200)
    except Rol.DoesNotExist:
        return JsonResponse({"error": "El rol con el ID proporcionado no existe."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_roles(request):
    if request.method == 'GET':
        roles = Rol.objects.all()
        roles_list = [{"id": rol.id, "nombre": rol.nombre, "descripcion": rol.descripcion} for rol in roles]
        return JsonResponse({"roles": roles_list}, status=200)

# ---------- Usuario CRUD ----------
@csrf_exempt
def create_usuario(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        nombre = data.get('nombre')
        correo = data.get('correo')
        contrasena = data.get('contrasena') or data.get('contrasena_hash')
        rol_id = data.get('rol_id')
        activo = data.get('activo', True)
        if not nombre or not correo or not contrasena:
            return JsonResponse({"error": "nombre, correo y contrasena son requeridos"}, status=400)
        rol = None
        if rol_id:
            rol = Rol.objects.get(id=rol_id)
        u = Usuario(nombre=nombre, correo=correo, contrasena_hash=contrasena, rol=rol, activo=bool(activo))
        u.save()
        return JsonResponse({"message": "Usuario creado", "id": u.id}, status=201)
    except Rol.DoesNotExist:
        return JsonResponse({"error": "Rol no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_usuario(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        u = Usuario.objects.get(id=id)
        if 'nombre' in data:
            u.nombre = data.get('nombre')
        if 'correo' in data:
            u.correo = data.get('correo')
        if 'contrasena' in data or 'contrasena_hash' in data:
            u.contrasena_hash = data.get('contrasena') or data.get('contrasena_hash')
        if 'rol_id' in data:
            u.rol = Rol.objects.get(id=data.get('rol_id')) if data.get('rol_id') else None
        if 'activo' in data:
            u.activo = bool(data.get('activo'))
        u.save()
        return JsonResponse({"message": "Usuario actualizado", "id": u.id}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Rol.DoesNotExist:
        return JsonResponse({"error": "Rol no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_usuario(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        u = Usuario.objects.get(id=id)
        u.delete()
        return JsonResponse({"message": "Usuario eliminado"}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def get_usuario(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        u = Usuario.objects.get(id=id)
        return JsonResponse({"id": u.id, "nombre": u.nombre, "correo": u.correo, "rol_id": (u.rol.id if u.rol else None), "activo": u.activo}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_usuarios(request):
    if request.method == 'GET':
        items = Usuario.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "correo": i.correo, "rol_id": (i.rol.id if i.rol else None), "activo": i.activo} for i in items]
        return JsonResponse({"usuarios": lst}, status=200)

@csrf_exempt
def login(request):
    """
    POST JSON: { "correo": "...", "contrasena": "..." }
    Si las credenciales son correctas, se guarda user_id en la sesión.
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        correo = data.get('correo')
        contrasena = data.get('contrasena')
        if not correo or not contrasena:
            return JsonResponse({"error": "correo y contrasena son requeridos"}, status=400)
        try:
            u = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        if u.contrasena_hash != contrasena:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        request.session['user_id'] = u.id
        request.session['correo'] = u.correo
        request.session['is_authenticated'] = True
        return JsonResponse({"message": "Login exitoso", "id": u.id, "nombre": u.nombre}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def logout(request):
    """
    POST o GET para cerrar sesión: limpia la sesión del usuario.
    """
    if request.method not in ('POST', 'GET'):
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        request.session.flush()
        return JsonResponse({"message": "Logout exitoso"}, status=200)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def change_password(request):
    """
    POST JSON: { "correo": "...", "old_contrasena": "...", "new_contrasena": "..." }
    Cambia la contraseña si las credenciales son correctas.
    """
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        correo = data.get('correo')
        old_contrasena = data.get('old_contrasena')
        new_contrasena = data.get('new_contrasena')
        if not correo or not old_contrasena or not new_contrasena:
            return JsonResponse({"error": "correo, old_contrasena y new_contrasena son requeridos"}, status=400)
        try:
            u = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        if u.contrasena_hash != old_contrasena:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        u.contrasena_hash = new_contrasena
        u.save()
        return JsonResponse({"message": "Contraseña cambiada exitosamente"}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
