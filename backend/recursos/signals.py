from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import EspacioRecurso

@receiver(post_save, sender=EspacioRecurso)
def actualizar_estado_espacio_on_save(sender, instance, **kwargs):
    """
    Cuando se guarda un EspacioRecurso, actualiza el estado del espacio.
    Si el recurso está en mantenimiento (disponible=False), 
    el espacio pasa a mantenimiento.
    """
    instance.espacio.actualizar_estado_por_recursos()

@receiver(post_delete, sender=EspacioRecurso)
def actualizar_estado_espacio_on_delete(sender, instance, **kwargs):
    """
    Cuando se elimina un EspacioRecurso, actualiza el estado del espacio.
    """
    instance.espacio.actualizar_estado_por_recursos()
