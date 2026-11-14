"""Publicación de eventos de cambio. Un fallo aquí nunca debe romper el guardado de un registro."""
import json
import logging

from django.db import transaction

from . import canal
from .registro import RECURSOS_PERSONALES, RUTAS_SECCIONAL

logger = logging.getLogger(__name__)


def seccional_de(instancia):
    """Id de la seccional a la que pertenece el registro, o None si no depende de una."""
    for ruta in RUTAS_SECCIONAL:
        valor = instancia
        try:
            for parte in ruta.split('.'):
                valor = getattr(valor, parte, None)
                if valor is None:
                    break
        except Exception:  # relación rota o inexistente
            valor = None
        if valor is not None:
            return valor
    return None


def construir_evento(recurso, accion, instancia, audiencia=None, referencia=None):
    objetivo = referencia(instancia) if referencia else instancia
    campo_personal = RECURSOS_PERSONALES.get(recurso)
    evento = {
        'recurso': recurso,
        'accion': 'actualizado' if referencia else accion,  # un hijo que cambia es un cambio de su registro
        'id': objetivo.pk,
        'seccional': None if campo_personal or audiencia else seccional_de(objetivo),
        'usuario': getattr(objetivo, campo_personal, None) if campo_personal else None,
    }
    if audiencia:
        reglas = audiencia(objetivo)
        evento['usuarios'] = sorted(i for i in reglas.get('usuarios', ()) if i is not None)
        evento['roles'] = sorted(reglas.get('roles', ()))
    return evento


def publicar(recurso, accion, instancia, audiencia=None, referencia=None):
    """Publica el evento cuando la transacción termina, para que quien lo reciba ya vea los datos."""
    if not canal.disponible():
        return
    try:
        texto = json.dumps(construir_evento(recurso, accion, instancia, audiencia=audiencia, referencia=referencia))
    except Exception:
        logger.exception('No se pudo armar el evento de %s', recurso)
        return

    def _enviar():
        try:
            canal.publicar_mensaje(texto)
        except Exception:
            logger.warning('No se pudo publicar el evento de %s', recurso, exc_info=True)

    transaction.on_commit(_enviar)
