from django.apps import apps
from django.db.models.signals import post_delete, post_save

from .publicar import publicar
from .registro import RECURSOS


def _al_guardar(recurso, audiencia, referencia):
    def _handler(sender, instance, created, raw=False, **kwargs):
        if raw:  # carga de fixtures
            return
        publicar(recurso, 'creado' if created else 'actualizado', instance, audiencia=audiencia, referencia=referencia)
    return _handler


def _al_borrar(recurso, audiencia, referencia):
    def _handler(sender, instance, **kwargs):
        publicar(recurso, 'eliminado', instance, audiencia=audiencia, referencia=referencia)
    return _handler


def conectar(app_label, nombre, recurso, audiencia=None, referencia=None):
    modelo = apps.get_model(app_label, nombre)
    clave = f'{app_label}.{nombre}.{recurso}'
    post_save.connect(_al_guardar(recurso, audiencia, referencia), sender=modelo, weak=False, dispatch_uid=f'evento-guardar-{clave}')
    post_delete.connect(_al_borrar(recurso, audiencia, referencia), sender=modelo, weak=False, dispatch_uid=f'evento-borrar-{clave}')


def registrar_senales_de_eventos():
    for (app_label, nombre), recurso in RECURSOS.items():
        conectar(app_label, nombre, recurso)
