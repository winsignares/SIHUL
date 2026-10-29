import hashlib
import json
import logging
import secrets

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from componentes.models import ComponenteRol, ComponenteUsuario
from espacios.models import EspacioPermitido
from espacios import alcance as alcance_espacios
from mysite.auth_helpers import role_supervisa_espacios, seccional_para_sesion
from usuarios.models import Usuario


def _build_componentes(usuario: Usuario):
    if not usuario.rol:
        return []

    componentes_rol = ComponenteRol.objects.filter(rol=usuario.rol).select_related('componente')
    componentes_usuario = ComponenteUsuario.objects.filter(usuario=usuario).select_related('componente')
    overrides = {item.componente_id: item for item in componentes_usuario}

    componentes = []
    for cr in componentes_rol:
        override = overrides.get(cr.componente_id)
        if override and not override.activo:
            continue

        permiso = override.permiso if override else cr.permiso
        componentes.append(
            {
                'id': cr.componente.id,
                'nombre': cr.componente.nombre,
                'descripcion': cr.componente.descripcion,
                'permiso': permiso,
            }
        )

    componentes_por_id = {item['id']: item for item in componentes}
    for override in componentes_usuario:
        if not override.activo:
            continue

        if override.componente_id not in componentes_por_id:
            componentes_por_id[override.componente_id] = {
                'id': override.componente.id,
                'nombre': override.componente.nombre,
                'descripcion': override.componente.descripcion,
                'permiso': override.permiso,
            }

    return list(componentes_por_id.values())


def _build_espacios_permitidos(usuario: Usuario):
    espacios_permisos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio', 'espacio__sede', 'espacio__tipo')
    if getattr(getattr(usuario, 'sede', None), 'seccional_id', None):
        espacios_permisos = espacios_permisos.filter(espacio__sede__seccional_id=usuario.sede.seccional_id)
    return [
        {
            'id': ep.espacio.id,
            'tipo': ep.espacio.tipo.nombre if ep.espacio.tipo else None,
            'capacidad': ep.espacio.capacidad,
            'ubicacion': ep.espacio.ubicacion,
            'disponible': ep.espacio.estado == 'Disponible',
            'sede_id': ep.espacio.sede.id,
            'sede_nombre': ep.espacio.sede.nombre,
        }
        for ep in espacios_permisos
    ]


def _session_signature(rol, componentes):
    parts = [f"{c['id']}:{c['permiso']}" for c in sorted(componentes, key=lambda item: (item['id'], item['permiso']))]
    role_part = str(rol.id) if rol else 'no-role'
    supervisa_part = 'supervisa-espacios' if role_supervisa_espacios(rol) else 'no-supervisa-espacios'
    signature_source = f"{role_part}|{supervisa_part}|{'|'.join(parts)}"
    return hashlib.sha256(signature_source.encode('utf-8')).hexdigest()[:16]


def _get_authenticated_user(request):
    user = getattr(request, 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    return user


@require_GET
def user_view(request):
    auth_user = _get_authenticated_user(request)
    if not auth_user:
        return JsonResponse({'authenticated': False}, status=200)

    try:
        usuario = Usuario.objects.select_related(
            'sede',
            'sede__seccional',
            'seccional',
            'rol',
            'facultad',
        ).get(id=auth_user.id)
    except Usuario.DoesNotExist:
        # Cookies are shared by host, not by port. A session from another
        # environment can therefore reference a user absent from this DB.
        request.session.flush()
        return JsonResponse({'authenticated': False}, status=200)

    request.session['user_id'] = usuario.id
    request.session['correo'] = usuario.correo
    request.session['is_authenticated'] = True
    request.session['rol'] = usuario.rol.nombre if usuario.rol else None
    request.session['id_rol'] = usuario.rol.id if usuario.rol else None
    if not request.session.get('token'):
        request.session['token'] = secrets.token_urlsafe(32)

    componentes = _build_componentes(usuario)
    espacios_permitidos = _build_espacios_permitidos(usuario)

    return JsonResponse(
        {
            'authenticated': True,
            'id': usuario.id,
            'nombre': usuario.nombre,
            'correo': usuario.correo,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
                'supervisa_espacios': usuario.rol.supervisa_espacios,
            } if usuario.rol else None,
            'facultad': {
                'id': usuario.facultad.id,
                'nombre': usuario.facultad.nombre,
            } if usuario.facultad else None,
            'sede': {
                'id': usuario.sede.id,
                'nombre': usuario.sede.nombre,
                'seccional_id': usuario.sede.seccional_id,
                'seccional_ciudad': usuario.sede.seccional.ciudad if usuario.sede.seccional else None,
                'direccion': usuario.sede.direccion,
            } if usuario.sede else None,
            'seccional': seccional_para_sesion(usuario),
            'componentes': componentes,
            'espacios_permitidos': espacios_permitidos,
            **alcance_espacios.resumen_sesion(usuario),
            'token': request.session['token'],
            'signature': _session_signature(usuario.rol, componentes),
        },
        status=200,
    )


@require_http_methods(['GET', 'POST'])
def logout_view(request):
    # Logout idempotente: si no hay sesion activa, responder OK igual.
    if request.session.session_key:
        request.session.flush()
    return JsonResponse({'message': 'Logout exitoso'}, status=200)


@require_GET
def login_success(request):
    if not _get_authenticated_user(request):
        return redirect(f"{settings.FRONTEND_URL}/login")

    frontend_url = f"{settings.FRONTEND_URL}/login?oauth=success"
    return redirect(frontend_url)


# ---- Errores del navegador ---------------------------------------------------------------------
# Cuando la pantalla muestra «Algo salió mal», el navegador avisa aquí para que el log del servidor diga qué se rompió
# (sin esto solo lo ve la persona frente a su pantalla). Solo escribe una línea de log: limita por IP y recorta todo.

logger_cliente = logging.getLogger('sihul.cliente')
ERRORES_CLIENTE_POR_MINUTO = 20
_LIMITES_CAMPO = {'mensaje': 300, 'pila': 1500, 'ruta': 200, 'navegador': 200, 'origen': 30}


def _limpiar_texto(valor, maximo):
    # Una sola línea y sin caracteres de control: nada de lo que envíe el navegador puede falsear otras líneas del log
    texto = ' '.join(str(valor or '').split())
    return ''.join(ch for ch in texto if ch.isprintable())[:maximo]


@csrf_exempt
@require_POST
def error_cliente(request):
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'desconocida')).split(',')[0].strip()
    clave = f'error-cliente:{ip}'
    cache.add(clave, 0, 60)
    try:
        cuenta = cache.incr(clave)
    except ValueError:
        cuenta = 1
    if cuenta > ERRORES_CLIENTE_POR_MINUTO:
        return JsonResponse({'ok': False}, status=429)

    try:
        datos = json.loads(request.body[:8000] or b'{}')
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'ok': False}, status=400)
    if not isinstance(datos, dict):
        return JsonResponse({'ok': False}, status=400)

    campos = {nombre: _limpiar_texto(datos.get(nombre), maximo) for nombre, maximo in _LIMITES_CAMPO.items()}
    logger_cliente.warning(
        'ERROR_CLIENTE usuario=%s origen=%s ruta=%s mensaje=%s navegador=%s pila=%s',
        request.session.get('user_id', '-'), campos['origen'], campos['ruta'], campos['mensaje'],
        campos['navegador'], campos['pila'],
    )
    return JsonResponse({'ok': True})
