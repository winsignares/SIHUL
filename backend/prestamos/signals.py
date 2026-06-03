from django.db.models.signals import pre_save
from django.dispatch import receiver

from .availability import validar_disponibilidad_prestamo
from .models import PrestamoEspacio, PrestamoEspacioPublico


@receiver(pre_save, sender=PrestamoEspacio)
@receiver(pre_save, sender=PrestamoEspacioPublico)
def validar_solapamiento_prestamo(sender, instance, **kwargs):
    validar_disponibilidad_prestamo(instance)
