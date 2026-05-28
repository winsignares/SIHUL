from django.shortcuts import render
from .models import Rol, Usuario
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from werkzeug.security import check_password_hash
import logging
import datetime
import secrets
import hashlib
from django.core.cache import cache
from django.core.exceptions import ValidationError
from mysite.xss_protection import sanitize_dict, ROL_SCHEMA, USUARIO_SCHEMA


def _password_valida(usuario, password_plano):
    hash_actual = usuario.contrasena_hash or ''

    if check_password(password_plano, hash_actual):
        return True, False

    try:
        legacy_ok = check_password_hash(hash_actual, password_plano)
    except Exception:
        legacy_ok = False

    return legacy_ok, legacy_ok
# ---------- Protección Auth ----------

MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 2 * 60


def _get_client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')
# ---------- Rol CRUD ----------

@csrf_exempt
def create_rol(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, ROL_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            nombre = sanitized_data.get('nombre')
            descripcion = sanitized_data.get('descripcion')
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
            
            # Sanitizar y validar inputs contra XSS
            try:
                sanitized_data = sanitize_dict(data, ROL_SCHEMA)
            except ValidationError as e:
                return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
            
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            nombre = sanitized_data.get('nombre')
            descripcion = sanitized_data.get('descripcion')
            if not nombre or not descripcion:
                return JsonResponse({"error": "nombre y descripción son requeridos"}, status=400)
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


def _is_admin_user(user):
    if not user:
        return False
    if getattr(user, 'es_superusuario', False):
        return True
    role_name = (getattr(getattr(user, 'rol', None), 'nombre', '') or '').strip().lower()
    role_name = role_name.replace('_', ' ')
    return role_name in {'admin', 'admin global', 'admin sistema', 'admin financiero'}


def _require_admin(request):
    user = getattr(request, 'user_obj', None)
    if not user:
        return JsonResponse({"error": "Autenticación requerida"}, status=403)
    if not _is_admin_user(user):
        return JsonResponse({"error": "No autorizado"}, status=403)
    return None

@csrf_exempt
def list_roles(request):
    auth_error = _require_admin(request)
    if auth_error:
        return auth_error
    if request.method == 'GET':
        roles = Rol.objects.all()
        roles_list = [{"id": rol.id, "nombre": rol.nombre, "descripcion": rol.descripcion} for rol in roles]
        return JsonResponse({"roles": roles_list}, status=200)

# ---------- Usuario CRUD ----------
@csrf_exempt
def create_usuario(request):
    auth_error = _require_admin(request)
    if auth_error:
        return auth_error
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        
        # Sanitizar y validar inputs contra XSS
        try:
            sanitized_data = sanitize_dict(data, USUARIO_SCHEMA)
        except ValidationError as e:
            return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
        
        nombre = sanitized_data.get('nombre')
        correo = sanitized_data.get('correo')
        contrasena = data.get('contrasena') or data.get('contrasena_hash')
        rol_id = data.get('rol_id')
        facultad_id = data.get('facultad_id')
        sede = sanitized_data.get('sede')  # Agregar campo sede
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
        
        # Manejar campo sede
        sede_obj = None
        if sede:
            from sedes.models import Sede
            # Buscar sede por nombre o crear si no existe
            try:
                sede_obj = Sede.objects.get(nombre__icontains=sede)
            except Sede.DoesNotExist:
                # Crear nueva sede si no existe
                sede_obj = Sede.objects.create(nombre=sede, direccion='', telefono='')
        
        hashed = generate_password_hash(contrasena)
        u = Usuario(nombre=nombre, correo=correo, contrasena_hash=hashed, rol=rol, facultad=facultad, sede=sede_obj, activo=bool(activo))
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
    auth_error = _require_admin(request)
    if auth_error:
        return auth_error
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        
        # Sanitizar y validar inputs contra XSS
        try:
            sanitized_data = sanitize_dict(data, USUARIO_SCHEMA)
        except ValidationError as e:
            return JsonResponse({"error": f"Validación fallida: {str(e)}"}, status=400)
        
        u = Usuario.objects.get(id=id)
        if 'nombre' in data:
            u.nombre = sanitized_data.get('nombre')
        if 'correo' in data:
            u.correo = sanitized_data.get('correo')
        if 'contrasena' in data or 'contrasena_hash' in data:
            nueva_contrasena = data.get('contrasena') or data.get('contrasena_hash')
            u.contrasena_hash = make_password(nueva_contrasena)
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
    auth_error = _require_admin(request)
    if auth_error:
        return auth_error
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
        usuario_actual = getattr(request, 'user_obj', None)
        if not usuario_actual:
            return JsonResponse({"error": "Autenticación requerida"}, status=403)

        if not _is_admin_user(usuario_actual) and usuario_actual.id != int(id):
            return JsonResponse({"error": "No autorizado"}, status=403)

        sede_actual = getattr(request, 'sede', None)

        if usuario_actual and sede_actual and sede_actual.seccional_id:
            u = Usuario.objects.select_related('sede').get(id=id, sede__seccional_id=sede_actual.seccional_id)
        else:
            u = Usuario.objects.select_related('sede').get(id=id)

        return JsonResponse({"id": u.id, "nombre": u.nombre, "correo": u.correo, "rol_id": (u.rol.id if u.rol else None), "facultad_id": (u.facultad.id if u.facultad else None), "activo": u.activo}, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_usuarios(request):
    if request.method == 'GET':
        usuario_actual = getattr(request, 'user_obj', None)
        if not usuario_actual:
            return JsonResponse({"error": "Autenticación requerida"}, status=403)

        sede_actual = getattr(request, 'sede', None)

        if _is_admin_user(usuario_actual):
            if sede_actual and sede_actual.seccional_id:
                items = Usuario.objects.select_related('sede').filter(sede__seccional_id=sede_actual.seccional_id)
            else:
                items = Usuario.objects.all()
        else:
            items = Usuario.objects.select_related('sede').filter(id=usuario_actual.id)

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
        correo_normalizado = correo.strip().lower()
        ip_cliente = _get_client_ip(request)
        lock_key = f"login_lock:{correo_normalizado}:{ip_cliente}"
        if cache.get(lock_key):
            return JsonResponse(
                {"error": "Demasiados intentos. Intenta de nuevo en unos minutos."},
                status=429,
            )
        try:
            u = Usuario.objects.select_related('sede', 'sede__seccional', 'rol', 'facultad').get(correo=correo_normalizado)
        except Usuario.DoesNotExist:
            attempts_key = f"login_attempts:{correo_normalizado}:{ip_cliente}"
            attempts = cache.get(attempts_key, 0) + 1
            if attempts >= MAX_LOGIN_ATTEMPTS:
                cache.set(lock_key, True, LOGIN_LOCKOUT_SECONDS)
                cache.delete(attempts_key)
                return JsonResponse(
                    {"error": "Demasiados intentos. Intenta de nuevo en unos minutos."},
                    status=429,
                )
            cache.set(attempts_key, attempts, LOGIN_LOCKOUT_SECONDS)
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        password_ok, es_legacy = _password_valida(u, contrasena)
        if not password_ok:
            attempts_key = f"login_attempts:{correo_normalizado}:{ip_cliente}"
            attempts = cache.get(attempts_key, 0) + 1
            if attempts >= MAX_LOGIN_ATTEMPTS:
                cache.set(lock_key, True, LOGIN_LOCKOUT_SECONDS)
                cache.delete(attempts_key)
                return JsonResponse(
                    {"error": "Demasiados intentos. Intenta de nuevo en unos minutos."},
                    status=429,
                )
            cache.set(attempts_key, attempts, LOGIN_LOCKOUT_SECONDS)
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        cache.delete(f"login_attempts:{correo_normalizado}:{ip_cliente}")
        if es_legacy:
            nuevo_hash = make_password(contrasena)
            u.contrasena_hash = nuevo_hash
            u.password = nuevo_hash
            u.save(update_fields=['contrasena_hash', 'password'])
        
        
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
                    "permiso": cr.permiso  # Enviar valor crudo ('VER' o 'EDITAR')
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
            logger = logging.getLogger(__name__)
            logger.warning(
                "No se pudieron cargar espacios permitidos para usuario %s",
                u.id,
                exc_info=True,
            )
        
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
                "seccional_id": u.sede.seccional_id,
                "seccional_ciudad": u.sede.seccional.ciudad if u.sede.seccional else None,
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
def session_auth_state(request):
    """
    GET: retorna estado de rol/componentes del usuario en sesión.
    Query opcional: ?since=<signature>
    Si no hubo cambios, responde changed=false sin enviar lista completa.
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        user_id = request.session.get('user_id')
        if not user_id:
            return JsonResponse({"error": "No autenticado"}, status=401)

        u = Usuario.objects.select_related('rol').get(id=user_id)

        componentes = []
        if u.rol:
            from componentes.models import ComponenteRol
            componentes_rol = ComponenteRol.objects.filter(rol=u.rol).select_related('componente')
            componentes = [
                {
                    "id": cr.componente.id,
                    "nombre": cr.componente.nombre,
                    "descripcion": cr.componente.descripcion,
                    "permiso": cr.permiso
                }
                for cr in componentes_rol
            ]

        # Firma estable para detectar cambios sin transferir payload completo.
        parts = []
        for c in sorted(componentes, key=lambda x: (x['id'], x['permiso'])):
            parts.append(f"{c['id']}:{c['permiso']}")
        role_part = str(u.rol.id) if u.rol else 'no-role'
        signature_source = f"{role_part}|{'|'.join(parts)}"
        signature = hashlib.sha256(signature_source.encode('utf-8')).hexdigest()[:16]

        since = request.GET.get('since')
        if since and since == signature:
            return JsonResponse({
                "changed": False,
                "signature": signature
            }, status=200)

        return JsonResponse({
            "changed": True,
            "signature": signature,
            "rol": {
                "id": u.rol.id,
                "nombre": u.rol.nombre,
                "descripcion": u.rol.descripcion
            } if u.rol else None,
            "componentes": componentes
        }, status=200)
    except Usuario.DoesNotExist:
        return JsonResponse({"error": "Usuario no encontrado"}, status=404)
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
        password_ok, _ = _password_valida(u, old_contrasena)
        if not password_ok:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        u.contrasena_hash = make_password(new_contrasena)
        u.password = u.contrasena_hash
        u.save()
        return JsonResponse({"message": "Contraseña cambiada exitosamente"}, status=200)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

