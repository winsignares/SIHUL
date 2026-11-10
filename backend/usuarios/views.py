from .models import Usuario
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
import secrets
import hashlib
from mysite.auth_helpers import seccional_para_sesion, user_supervisa_espacios
from .contrasenas import password_valida as _password_valida


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
            u = Usuario.objects.select_related('sede', 'sede__seccional', 'seccional', 'rol', 'facultad').get(correo=correo)
        except Usuario.DoesNotExist:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        password_ok, es_legacy = _password_valida(u, contrasena)
        if not password_ok:
            return JsonResponse({"error": "Credenciales inválidas"}, status=401)
        if not u.activo:
            from mysite.auth_helpers import CUENTA_DESACTIVADA
            return JsonResponse({"error": CUENTA_DESACTIVADA}, status=403)
        if es_legacy:
            nuevo_hash = make_password(contrasena)
            u.contrasena_hash = nuevo_hash
            u.password = nuevo_hash
            u.save(update_fields=['contrasena_hash', 'password'])


        # Obtener componentes del rol del usuario
        from mysite.auth_helpers import construir_componentes
        componentes = construir_componentes(u)

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
                "descripcion": u.rol.descripcion,
                "supervisa_espacios": u.rol.supervisa_espacios
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
            "seccional": seccional_para_sesion(u),
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

        from mysite.auth_helpers import construir_componentes
        componentes = construir_componentes(u)

        # Firma estable para detectar cambios sin transferir payload completo.
        parts = []
        for c in sorted(componentes, key=lambda x: (x['id'], x['permiso'])):
            parts.append(f"{c['id']}:{c['permiso']}")
        role_part = str(u.rol.id) if u.rol else 'no-role'
        supervisa_part = 'supervisa-espacios' if user_supervisa_espacios(u) else 'no-supervisa-espacios'
        signature_source = f"{role_part}|{supervisa_part}|{'|'.join(parts)}"
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
                "descripcion": u.rol.descripcion,
                "supervisa_espacios": u.rol.supervisa_espacios
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
