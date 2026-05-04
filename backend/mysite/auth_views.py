import hashlib
import secrets

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_GET

from componentes.models import ComponenteRol, ComponenteUsuario
from espacios.models import EspacioPermitido
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
    signature_source = f"{role_part}|{'|'.join(parts)}"
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
        return JsonResponse({'error': 'No autenticado'}, status=401)

    usuario = Usuario.objects.select_related('sede', 'sede__seccional', 'rol', 'facultad').get(id=auth_user.id)

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
            'id': usuario.id,
            'nombre': usuario.nombre,
            'correo': usuario.correo,
            'rol': {
                'id': usuario.rol.id,
                'nombre': usuario.rol.nombre,
                'descripcion': usuario.rol.descripcion,
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
            'componentes': componentes,
            'espacios_permitidos': espacios_permitidos,
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
