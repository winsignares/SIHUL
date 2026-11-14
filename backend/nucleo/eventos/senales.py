from django.apps import apps
from django.db.models.signals import post_delete, post_save

from .publicar import publicar
from .registro import RECURSOS


def _al_guardar(recurso):
    def _handler(sender, instance, created, raw=False, **kwargs):
        if raw:  # carga de fixtures
            return
        publicar(recurso, 'creado' if created else 'actualizado', instance)
    return _handler


def _al_borrar(recurso):
    def _handler(sender, instance, **kwargs):
        publicar(recurso, 'eliminado', instance)
    return _handler


def registrar_senales_de_eventos():
    for (app_label, nombre), recurso in RECURSOS.items():
        modelo = apps.get_model(app_label, nombre)
        post_save.connect(_al_guardar(recurso), sender=modelo, weak=False, dispatch_uid=f'evento-guardar-{recurso}')
        post_delete.connect(_al_borrar(recurso), sender=modelo, weak=False, dispatch_uid=f'evento-borrar-{recurso}')
