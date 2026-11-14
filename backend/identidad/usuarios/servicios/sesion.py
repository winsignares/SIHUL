"""
Sesión con correo y contraseña: iniciar sesión (con bloqueo por intentos), estado de la sesión y cambio de contraseña.

No reciben la petición HTTP: reciben los datos, la IP de quien entra y la sesión. Los errores se avisan con
excepciones y cada vista decide el código de respuesta.
"""
import hashlib
import secrets

from django.contrib.auth.hashers import make_password
from django.core.cache import cache

from instalaciones.espacios import alcance as alcance_espacios
from nucleo.auth_helpers import CUENTA_DESACTIVADA, construir_componentes, seccional_para_sesion, user_supervisa_espacios
from identidad.usuarios.servicios.contrasenas import password_valida
from identidad.usuarios.models import Usuario

MAX_LOGIN_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 2 * 60

CREDENCIALES_INVALIDAS = 'Credenciales inválidas'
DEMASIADOS_INTENTOS = 'Demasiados intentos. Intenta de nuevo en unos minutos.'


class SesionRechazada(Exception):
    """Base de los motivos por los que no se inicia sesión o no se cambia la contraseña."""

    def __init__(self, mensaje):
        super().__init__(mensaje)
        self.mensaje = mensaje


class DatosIncompletos(SesionRechazada):
    pass


class CredencialesInvalidas(SesionRechazada):
    def __init__(self):
        super().__init__(CREDENCIALES_INVALIDAS)


class DemasiadosIntentos(SesionRechazada):
    def __init__(self):
        super().__init__(DEMASIADOS_INTENTOS)


class CuentaDesactivada(SesionRechazada):
    def __init__(self):
        super().__init__(CUENTA_DESACTIVADA)


class ControlDeIntentos:
    """Cuenta los intentos fallidos de un correo desde una IP. Al llegar a MAX_LOGIN_ATTEMPTS bloquea ese correo
    desde esa IP durante LOGIN_LOCKOUT_SECONDS; los fallos sueltos vencen en el mismo tiempo."""

    def __init__(self, correo, ip):
        self.clave_bloqueo = f"login_lock:{correo}:{ip}"
        self.clave_intentos = f"login_attempts:{correo}:{ip}"

    def bloqueado(self):
        return bool(cache.get(self.clave_bloqueo))

    def registrar_fallo(self):
        """Suma un fallo. Devuelve True si con este fallo quedó bloqueado."""
        intentos = cache.get(self.clave_intentos, 0) + 1
        if intentos >= MAX_LOGIN_ATTEMPTS:
            cache.set(self.clave_bloqueo, True, LOGIN_LOCKOUT_SECONDS)
            cache.delete(self.clave_intentos)
            return True
        cache.set(self.clave_intentos, intentos, LOGIN_LOCKOUT_SECONDS)
        return False

    def reiniciar(self):
        cache.delete(self.clave_intentos)


def autenticar(correo, contrasena, ip):
    """Valida las credenciales y devuelve el usuario. Si su hash es heredado (werkzeug) lo migra al de Django.

    El correo se compara sin mayúsculas ni espacios alrededor. Un correo inexistente cuenta como fallo igual que
    una clave incorrecta, y la cuenta desactivada solo se revela con la clave correcta.
    """
    if not correo or not contrasena:
        raise DatosIncompletos('correo y contrasena son requeridos')

    correo = correo.strip().lower()
    intentos = ControlDeIntentos(correo, ip)
    if intentos.bloqueado():
        raise DemasiadosIntentos()

    try:
        usuario = Usuario.objects.select_related('sede', 'sede__seccional', 'rol', 'facultad').get(correo=correo)
    except Usuario.DoesNotExist:
        _fallo(intentos)
    password_ok, es_legacy = password_valida(usuario, contrasena)
    if not password_ok:
        _fallo(intentos)

    intentos.reiniciar()

    if not usuario.activo:
        raise CuentaDesactivada()

    if es_legacy:
        nuevo_hash = make_password(contrasena)
        usuario.contrasena_hash = nuevo_hash
        usuario.password = nuevo_hash
        usuario.save(update_fields=['contrasena_hash', 'password'])
    return usuario


def _fallo(intentos):
    if intentos.registrar_fallo():
        raise DemasiadosIntentos() from None
    raise CredencialesInvalidas() from None


def abrir_sesion(sesion, usuario):
    """Guarda el usuario en la sesión y devuelve el token nuevo."""
    sesion['user_id'] = usuario.id
    sesion['correo'] = usuario.correo
    sesion['is_authenticated'] = True
    token = secrets.token_urlsafe(32)
    sesion['token'] = token
    sesion['rol'] = usuario.rol.nombre if usuario.rol else None
    sesion['id_rol'] = usuario.rol.id if usuario.rol else None
    return token


def _rol(usuario):
    return {
        'id': usuario.rol.id,
        'nombre': usuario.rol.nombre,
        'descripcion': usuario.rol.descripcion,
        'supervisa_espacios': usuario.rol.supervisa_espacios,
    } if usuario.rol else None


def espacios_permitidos(usuario):
    """Espacios asignados al usuario, solo los de su sede si tiene una."""
    from instalaciones.espacios.models import EspacioPermitido

    espacios_permisos = EspacioPermitido.objects.filter(usuario=usuario).select_related('espacio', 'espacio__sede', 'espacio__tipo')
    if getattr(usuario, 'sede_id', None):
        espacios_permisos = espacios_permisos.filter(espacio__sede_id=usuario.sede_id)
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


def datos_de_inicio(usuario, token):
    """Lo que recibe el frontend al iniciar sesión: perfil, permisos, espacios y alcance."""
    componentes = construir_componentes(usuario)
    espacios = espacios_permitidos(usuario)
    return {
        'message': 'Login exitoso',
        'id': usuario.id,
        'nombre': usuario.nombre,
        'correo': usuario.correo,
        'rol': _rol(usuario),
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
        'espacios_permitidos': espacios,
        **alcance_espacios.resumen_sesion(usuario),
        'token': token,
    }


def estado_de_sesion(usuario, since=None):
    """Rol y permisos del usuario con una firma corta. Si `since` es la firma actual, no envía los permisos."""
    componentes = construir_componentes(usuario)
    parts = [f"{c['id']}:{c['permiso']}" for c in sorted(componentes, key=lambda item: (item['id'], item['permiso']))]
    role_part = str(usuario.rol.id) if usuario.rol else 'no-role'
    supervisa_part = 'supervisa-espacios' if user_supervisa_espacios(usuario) else 'no-supervisa-espacios'
    signature_source = f"{role_part}|{supervisa_part}|{'|'.join(parts)}"
    signature = hashlib.sha256(signature_source.encode('utf-8')).hexdigest()[:16]

    if since and since == signature:
        return {'changed': False, 'signature': signature}
    return {
        'changed': True,
        'signature': signature,
        'rol': _rol(usuario),
        'componentes': componentes,
    }


def cambiar_contrasena(correo, contrasena_actual, contrasena_nueva, ip):
    """Cambia la contraseña si la actual es correcta.

    Comparte el conteo de intentos con el inicio de sesión (mismo correo e IP): los fallos de los dos suman y el
    bloqueo aplica a los dos, para que no sirva para probar contraseñas sin límite.
    """
    if not correo or not contrasena_actual or not contrasena_nueva:
        raise DatosIncompletos('correo, old_contrasena y new_contrasena son requeridos')

    intentos = ControlDeIntentos(correo.strip().lower(), ip)
    if intentos.bloqueado():
        raise DemasiadosIntentos()

    try:
        usuario = Usuario.objects.get(correo=correo)
    except Usuario.DoesNotExist:
        _fallo(intentos)
    password_ok, _ = password_valida(usuario, contrasena_actual)
    if not password_ok:
        _fallo(intentos)

    intentos.reiniciar()
    usuario.contrasena_hash = make_password(contrasena_nueva)
    usuario.password = usuario.contrasena_hash
    usuario.save()
