from django.db.models.signals import post_save
from django.dispatch import receiver

from .alcance import resincronizar_por_espacio
from .models import EspacioFisico


@receiver(post_save, sender=EspacioFisico)
def mantener_asignacion_por_tipo(sender, instance, **kwargs):
    """
    Un espacio nuevo (o cuyo tipo o sede cambió) entra al alcance de los supervisores que tienen
    asignado su tipo, y sale del de quienes ya no corresponden.
    """
    resincronizar_por_espacio(instance)
