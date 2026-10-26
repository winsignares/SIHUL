"""Acceso público protegido al chat.

El chat público no pide inicio de sesión ni captcha, pero cada pregunta cuesta tokens de IA. Para que nadie
pueda gastarlos llamando al servicio directamente (sin pasar por la página), el servidor exige:

1. Una prueba de trabajo: el navegador resuelve en segundo plano un cálculo pequeño sobre un desafío firmado
   por el servidor (``emitir_desafio``). Resolverlo es barato para una persona y caro para quien lo automatiza.
2. Una sesión firmada y de corta vigencia que se entrega al resolverlo (``crear_sesion``) y que debe viajar en
   cada pregunta (cabecera ``X-Chatbot-Token``).
3. Límites: preguntas por sesión, por IP (minuto y día) y un tope diario global (``autorizar_pregunta``).

Los contadores viven en la caché (Redis en producción), compartida entre los procesos del servidor.
"""
import hashlib
import hmac
import secrets
import time

from django.conf import settings
from django.core import signing
from django.core.cache import cache
from django.utils import timezone

SAL_SESION = 'chatbot-publico-sesion'
PREFIJO_CACHE = 'chatbot-publico'


class AccesoPublicoError(Exception):
    """Rechazo del acceso público. ``estado`` es el código HTTP; ``mensaje`` es seguro de mostrar al usuario."""

    def __init__(self, estado, codigo, mensaje):
        super().__init__(mensaje)
        self.estado = estado
        self.codigo = codigo
        self.mensaje = mensaje


def _conf(nombre):
    return getattr(settings, f'CHATBOT_PUBLICO_{nombre}')


# ---------------------------------------------------------------- utilidades

def ip_cliente(request):
    """IP del visitante. Detrás del equipo de la Universidad puede ser la de ese equipo (ver límites generosos)."""
    reenviada = request.META.get('HTTP_X_FORWARDED_FOR')
    if reenviada:
        return reenviada.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'desconocida')


def _consumir(clave, limite, vigencia_segundos):
    """Suma 1 al contador y dice si todavía está dentro del límite."""
    clave = f'{PREFIJO_CACHE}:{clave}'
    cache.add(clave, 0, vigencia_segundos)
    try:
        usado = cache.incr(clave)
    except ValueError:  # la clave venció entre add e incr
        cache.set(clave, 1, vigencia_segundos)
        usado = 1
    return usado <= limite


def _firma(carga):
    return hmac.new(settings.SECRET_KEY.encode(), carga.encode(), hashlib.sha256).hexdigest()


def _ceros_iniciales(digest):
    """Cantidad de bits en cero al comienzo del digest."""
    bits = 0
    for byte in digest:
        if byte == 0:
            bits += 8
            continue
        bits += 8 - byte.bit_length()
        break
    return bits


# ---------------------------------------------------------- prueba de trabajo

def emitir_desafio(request):
    """Desafío firmado (con vencimiento) que el navegador debe resolver para pedir una sesión."""
    if not _consumir(f'ip-sesiones:{ip_cliente(request)}', _conf('SESIONES_POR_IP_MINUTO'), 60):
        raise AccesoPublicoError(429, 'limite_ip', 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
    vence = int(time.time()) + _conf('DESAFIO_VIGENCIA')
    carga = f'{secrets.token_hex(12)}.{vence}'
    return {
        'desafio': f'{carga}.{_firma(carga)}',
        'bits': _conf('DIFICULTAD_BITS'),
        'vence': vence,
    }


def _verificar_solucion(desafio, solucion):
    partes = str(desafio or '').split('.')
    if len(partes) != 3:
        raise AccesoPublicoError(400, 'desafio_invalido', 'No se pudo validar el acceso. Recarga la página.')
    nonce, vence, firma = partes
    if not hmac.compare_digest(firma, _firma(f'{nonce}.{vence}')):
        raise AccesoPublicoError(400, 'desafio_invalido', 'No se pudo validar el acceso. Recarga la página.')
    if not vence.isdigit() or int(vence) < time.time():
        raise AccesoPublicoError(400, 'desafio_vencido', 'El acceso venció. Recarga la página.')
    solucion = str(solucion or '')
    if not solucion.isdigit() or len(solucion) > 12:
        raise AccesoPublicoError(400, 'solucion_invalida', 'No se pudo validar el acceso. Recarga la página.')
    digest = hashlib.sha256(f'{desafio}:{solucion}'.encode()).digest()
    if _ceros_iniciales(digest) < _conf('DIFICULTAD_BITS'):
        raise AccesoPublicoError(400, 'solucion_invalida', 'No se pudo validar el acceso. Recarga la página.')
    # Un desafío resuelto sirve una sola vez.
    if not cache.add(f'{PREFIJO_CACHE}:desafio:{nonce}', 1, _conf('DESAFIO_VIGENCIA') + 5):
        raise AccesoPublicoError(400, 'desafio_usado', 'No se pudo validar el acceso. Recarga la página.')


def crear_sesion(request, desafio, solucion):
    """Verifica la prueba de trabajo y entrega la sesión firmada."""
    if not _consumir(f'ip-sesiones:{ip_cliente(request)}', _conf('SESIONES_POR_IP_MINUTO'), 60):
        raise AccesoPublicoError(429, 'limite_ip', 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.')
    _verificar_solucion(desafio, solucion)
    token = signing.dumps({'sid': secrets.token_hex(12)}, salt=SAL_SESION)
    return {
        'token': token,
        'vigencia': _conf('SESION_VIGENCIA'),
        'max_preguntas': _conf('MAX_PREGUNTAS_SESION'),
    }


# ---------------------------------------------------------- autorización de preguntas

def _sesion_valida(token):
    if not token:
        raise AccesoPublicoError(401, 'sesion_invalida', 'La sesión venció. Recarga la página.')
    try:
        datos = signing.loads(token, salt=SAL_SESION, max_age=_conf('SESION_VIGENCIA'))
    except signing.BadSignature:  # incluye SignatureExpired
        raise AccesoPublicoError(401, 'sesion_invalida', 'La sesión venció. Recarga la página.') from None
    return datos['sid']


def autorizar_pregunta(request, pregunta):
    """Valida sesión, tamaño y límites. Lanza ``AccesoPublicoError`` si hay que rechazar la pregunta."""
    sid = _sesion_valida(request.headers.get('X-Chatbot-Token'))

    pregunta = (pregunta or '').strip() if isinstance(pregunta, str) else ''
    if not pregunta:
        raise AccesoPublicoError(400, 'pregunta_vacia', 'Escribe una pregunta.')
    if len(pregunta) > _conf('MAX_CARACTERES'):
        raise AccesoPublicoError(400, 'pregunta_larga', f'La pregunta es demasiado larga (máximo {_conf("MAX_CARACTERES")} caracteres).')

    ip = ip_cliente(request)
    if not _consumir(f'sesion:{sid}', _conf('MAX_PREGUNTAS_SESION'), _conf('SESION_VIGENCIA') + 60):
        raise AccesoPublicoError(429, 'limite_sesion', 'Llegaste al máximo de preguntas de esta sesión. Recarga la página para continuar.')
    if not _consumir(f'ip-minuto:{ip}', _conf('PREGUNTAS_POR_IP_MINUTO'), 60):
        raise AccesoPublicoError(429, 'limite_ip', 'Estás preguntando muy rápido. Espera un momento.')
    if not _consumir(f'ip-dia:{ip}:{timezone.localdate().isoformat()}', _conf('PREGUNTAS_POR_IP_DIA'), 86400):
        raise AccesoPublicoError(429, 'limite_ip_dia', 'Llegaste al máximo de preguntas de hoy. Inténtalo mañana.')
    if not _consumir(f'dia:{timezone.localdate().isoformat()}', _conf('TOPE_DIARIO'), 86400 * 2):
        raise AccesoPublicoError(503, 'tope_diario', 'El asistente no está disponible por hoy. Inténtalo mañana.')
    return pregunta
