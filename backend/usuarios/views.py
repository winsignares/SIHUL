from django.shortcuts import render
from .models import Rol, Usuario
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import secrets
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
        facultad_id = data.get('facultad_id')
        activo = data.get('activo', True)
        espacios_permitidos = data.get('espacios_permitidos', []) # Lista de IDs de espacios

        if not nombre or not correo or not contrasena:
            return JsonResponse({"error": "nombre, correo y contrasena son requeridos"}, status=400)
        rol = None
        if rol_id:
            rol = Rol.objects.get(id=rol_id)
        facultad = None
        if facultad_id:
            from facultades.models import Facultad
            facultad = Facultad.objects.get(id=facultad_id)
        hashed = generate_password_hash(contrasena)
        u = Usuario(nombre=nombre, correo=correo, contrasena_hash=hashed, rol=rol, facultad=facultad, activo=bool(activo))
        u.save()

        # Manejar espacios permitidos
        if espacios_permitidos and isinstance(espacios_permitidos, list):
            from espacios.models import EspacioFisico, EspacioPermitido
            for espacio_id in espacios_permitidos:
                try:
                    espacio = EspacioFisico.objects.get(id=espacio_id)
                    EspacioPermitido.objects.create(usuario=u, espacio=espacio)
                except EspacioFisico.DoesNotExist:
                    pass # Ignorar si el espacio no existe

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
            nueva_contrasena = data.get('contrasena') or data.get('contrasena_hash')
            u.contrasena_hash = generate_password_hash(nueva_contrasena)
        if 'rol_id' in data:
            u.rol = Rol.objects.get(id=data.get('rol_id')) if data.get('rol_id') else None
        if 'facultad_id' in data:
            from facultades.models import Facultad
            u.facultad = Facultad.objects.get(id=data.get('facultad_id')) if data.get('facultad_id') else None
        if 'activo' in data:
            u.activo = bool(data.get('activo'))
        u.save()

        # Manejar espacios permitidos (si se envía la clave en el JSON)
        if 'espacios_permitidos' in data:
            espacios_permitidos = data.get('espacios_permitidos')
            if isinstance(espacios_permitidos, list):
                from espacios.models import EspacioFisico, EspacioPermitido
                # Eliminar permisos existentes
                EspacioPermitido.objects.filter(usuario=u).delete()
                # Crear nuevos permisos
                for espacio_id in espacios_permitidos:
                    try:
                        espacio = EspacioFisico.objects.get(id=espacio_id)
                        EspacioPermitido.objects.create(usuario=u, espacio=espacio)
                    except EspacioFisico.DoesNotExist:
                        pass

        return JsonResponse({"message": "Usuario actualizado", "id": u.id}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Rol.DoesNotExist:
        return JsonResponse({"error": "Rol no encontrado."}, status=404)
    except Exception as e:
        if 'Facultad' in str(type(e)):
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
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
        return JsonResponse({"id": u.id, "nombre": u.nombre, "correo": u.correo, "rol_id": (u.rol.id if u.rol else None), "facultad_id": (u.facultad.id if u.facultad else None), "activo": u.activo}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_usuarios(request):
    if request.method == 'GET':
        items = Usuario.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "correo": i.correo, "rol_id": (i.rol.id if i.rol else None), "facultad_id": (i.facultad.id if i.facultad else None), "activo": i.activo} for i in items]
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
            u = Usuario.objects.select_related('sede', 'rol', 'facultad').get(correo=correo)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        if not check_password_hash(u.contrasena_hash, contrasena):
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        
        print("Contraseña de planeacion: ", generate_password_hash("plan123"))
        print("Contraseña de docente:",generate_password_hash("doc123"))
        print("Contraseña de estudiante:",generate_password_hash("est123"))
        print("Contraseña de supervisor:",generate_password_hash("sup123"))
        
        # Obtener componentes del rol del usuario
        componentes = []
        if u.rol:
            from componentes.models import ComponenteRol
            componentes_rol = ComponenteRol.objects.filter(rol=u.rol).select_related('componente')
            componentes = [
                {
                    "id": cr.componente.id,
                    "nombre": cr.componente.nombre,
                    "descripcion": cr.componente.descripcion,
                    "permiso": cr.get_permiso_display()
                }
                for cr in componentes_rol
            ]
        
        # Obtener espacios permitidos para el usuario
        espacios_permitidos = []
        try:
            from espacios.models import EspacioPermitido
            espacios_permisos = EspacioPermitido.objects.filter(usuario=u).select_related('espacio', 'espacio__sede')
            espacios_permitidos = [
                {
                    "id": ep.espacio.id,
                    "tipo": ep.espacio.tipo,
                    "capacidad": ep.espacio.capacidad,
                    "ubicacion": ep.espacio.ubicacion,
                    "disponible": ep.espacio.disponible,
                    "sede_id": ep.espacio.sede.id,
                    "sede_nombre": ep.espacio.sede.nombre
                }
                for ep in espacios_permisos
            ]
        except Exception:
            pass
        
        request.session['user_id'] = u.id
        request.session['correo'] = u.correo
        request.session['is_authenticated'] = True
        token = secrets.token_urlsafe(32)
        request.session['token'] = token
        request.session['rol'] = u.rol.nombre if u.rol else None
        request.session['id_rol'] = u.rol.id if u.rol else None
        
        return JsonResponse({
            "message": "Login exitoso", 
            "id": u.id, 
            "nombre": u.nombre,
            "correo": u.correo,
            "rol": {
                "id": u.rol.id,
                "nombre": u.rol.nombre,
                "descripcion": u.rol.descripcion
            } if u.rol else None,
            "facultad": {
                "id": u.facultad.id,
                "nombre": u.facultad.nombre
            } if u.facultad else None,
            "sede": {
                "id": u.sede.id,
                "nombre": u.sede.nombre,
                "ciudad": u.sede.ciudad,
                "direccion": u.sede.direccion
            } if u.sede else None,
            "componentes": componentes,
            "espacios_permitidos": espacios_permitidos,
            "token": token
        }, status=200)
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
        if not check_password_hash(u.contrasena_hash, old_contrasena):
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        u.contrasena_hash = generate_password_hash(new_contrasena)
        u.save()
        return JsonResponse({"message": "Contraseña cambiada exitosamente"}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
