from django.contrib.auth.hashers import check_password
from werkzeug.security import check_password_hash


def password_valida(usuario, password_plano):
    """Valida la contraseña del usuario. Devuelve (es_valida, hay_que_migrar_el_hash).

    Acepta los hashes de Django y, como respaldo, los heredados de werkzeug; en ese caso
    indica que el hash debe migrarse al formato de Django.
    """
    hash_actual = usuario.contrasena_hash or ''

    if check_password(password_plano, hash_actual):
        return True, False

    try:
        legacy_ok = check_password_hash(hash_actual, password_plano)
    except Exception:
        legacy_ok = False

    return legacy_ok, legacy_ok
