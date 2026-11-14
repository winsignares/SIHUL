"""Acceso directo del navegador al servicio del chatbot (FastAPI) con un token firmado.

Django sigue siendo quien sabe quién es el usuario y con qué seccional se le responde: tras iniciar sesión entrega un
token de corta duración y el servicio del chatbot solo lo verifica (ver `chatbot/app/core/token.py`, que debe leer el
mismo formato). El token es un JWT HS256 firmado con `CHATBOT_TOKEN_SECRET`, que es la misma clave en los dos servicios.
Sin clave configurada el acceso directo queda desactivado y el chat sigue pasando por Django.
"""
import base64
import hashlib
import hmac
import json
import time

from django.conf import settings


class AccesoDirectoNoConfigurado(Exception):
    """No hay `CHATBOT_TOKEN_SECRET`: el acceso directo está desactivado."""


def _a_base64(datos):
    return base64.urlsafe_b64encode(datos).rstrip(b'=').decode('ascii')


def _firma(mensaje, secreto):
    return _a_base64(hmac.new(secreto.encode('utf-8'), mensaje.encode('ascii'), hashlib.sha256).digest())


def emitir_token(usuario, sede_value, ahora=None):
    """Token para `usuario` (que pregunta con la seccional `sede_value`). Devuelve (token, segundos de vigencia)."""
    secreto = getattr(settings, 'CHATBOT_TOKEN_SECRET', '')
    if not secreto:
        raise AccesoDirectoNoConfigurado()
    vigencia = settings.CHATBOT_TOKEN_VIGENCIA
    emitido = int(time.time() if ahora is None else ahora)
    datos = {
        'sub': str(usuario.id),
        'nombre': usuario.nombre,
        'sede': sede_value,
        'aud': settings.CHATBOT_TOKEN_AUDIENCIA,
        'iat': emitido,
        'exp': emitido + vigencia,
    }
    cabecera = _a_base64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode('utf-8'))
    cuerpo = _a_base64(json.dumps(datos, separators=(',', ':')).encode('utf-8'))
    mensaje = f'{cabecera}.{cuerpo}'
    return f'{mensaje}.{_firma(mensaje, secreto)}', vigencia
