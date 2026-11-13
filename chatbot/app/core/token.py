"""Token firmado (JWT HS256) con el que Django autoriza al navegador a hablar directo con este servicio.

Django lo emite al usuario que ya inició sesión y este servicio solo lo verifica: no consulta a Django ni guarda
sesiones. Lleva el usuario, su nombre y la seccional con la que se le responde; dura pocos minutos. Se implementa con
la biblioteca estándar (hmac) para no sumar dependencias.
"""
import base64
import hashlib
import hmac
import json
import time

from app.core.sedes import Sede

ALGORITMO = "HS256"


class TokenInvalido(Exception):
    """El token no sirve; `codigo` es el HTTP que corresponde y `mensaje` apto para mostrarse."""

    def __init__(self, mensaje: str, codigo: int = 401):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.codigo = codigo


def _a_base64(datos: bytes) -> str:
    return base64.urlsafe_b64encode(datos).rstrip(b"=").decode("ascii")


def _de_base64(texto: str) -> bytes:
    return base64.urlsafe_b64decode(texto + "=" * (-len(texto) % 4))


def _firma(mensaje: str, secreto: str) -> str:
    return _a_base64(hmac.new(secreto.encode("utf-8"), mensaje.encode("ascii"), hashlib.sha256).digest())


def firmar_token(datos: dict, secreto: str) -> str:
    """Emite un token (lo usa Django con el mismo formato; aquí sirve a las pruebas y a quien lo documente)."""
    cabecera = _a_base64(json.dumps({"alg": ALGORITMO, "typ": "JWT"}, separators=(",", ":")).encode("utf-8"))
    cuerpo = _a_base64(json.dumps(datos, separators=(",", ":")).encode("utf-8"))
    mensaje = f"{cabecera}.{cuerpo}"
    return f"{mensaje}.{_firma(mensaje, secreto)}"


def verificar_token(token: str, secreto: str, audiencia: str, ahora: float | None = None) -> dict:
    """Devuelve los datos del token si la firma, la audiencia y la vigencia son válidas; si no, `TokenInvalido`."""
    partes = (token or "").split(".")
    if len(partes) != 3:
        raise TokenInvalido("Token inválido.")
    cabecera_txt, cuerpo_txt, firma = partes
    try:
        cabecera = json.loads(_de_base64(cabecera_txt))
        datos = json.loads(_de_base64(cuerpo_txt))
    except (ValueError, UnicodeDecodeError):
        raise TokenInvalido("Token inválido.")
    # Solo se acepta el algoritmo esperado: nunca «none» ni uno que cambie quien emite el token
    if not isinstance(cabecera, dict) or cabecera.get("alg") != ALGORITMO:
        raise TokenInvalido("Token inválido.")
    if not isinstance(datos, dict):
        raise TokenInvalido("Token inválido.")
    if not hmac.compare_digest(firma, _firma(f"{cabecera_txt}.{cuerpo_txt}", secreto)):
        raise TokenInvalido("Token inválido.")

    if datos.get("aud") != audiencia:
        raise TokenInvalido("Token inválido.")
    vence = datos.get("exp")
    if isinstance(vence, bool) or not isinstance(vence, (int, float)):
        raise TokenInvalido("Token inválido.")
    if (time.time() if ahora is None else ahora) >= vence:
        raise TokenInvalido("La sesión del chat venció. Vuelve a intentarlo.")

    usuario = datos.get("sub")
    # `sub` viaja como texto (es lo que exige el estándar JWT); aquí es el id numérico del usuario
    if isinstance(usuario, bool) or not isinstance(usuario, (int, str)) or not str(usuario).isdigit():
        raise TokenInvalido("Token inválido.")
    sede = datos.get("sede")
    if sede not in Sede.list():
        raise TokenInvalido("Token inválido.")
    nombre = str(datos.get("nombre") or "").strip()[:150]
    if not nombre:
        raise TokenInvalido("Token inválido.")
    return {"id_usuario": int(usuario), "nombre": nombre, "sede": sede}
