"""Señales de agentes del chatbot y sus preguntas sugeridas."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from chatbot.models import Agente, PreguntaSugerida

from .base import crear_notificacion, obtener_id_usuario

# ==================== SEÑALES PARA AGENTE ====================

@receiver(post_save, sender=Agente)
def agente_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un agente de chatbot"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='AGENTE_CREADO',
            mensaje=f'Se ha creado el agente de chatbot: {instance.nombre}',
            prioridad='baja'
        )
    else:
        if not instance.activo:
            crear_notificacion(
                id_usuario=id_usuario,
                tipo='AGENTE_DESACTIVADO',
                mensaje=f'Se ha desactivado el agente: {instance.nombre}',
                prioridad='media'
            )

@receiver(post_delete, sender=Agente)
def agente_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un agente"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='AGENTE_ELIMINADO',
        mensaje=f'Se ha eliminado el agente: {instance.nombre}',
        prioridad='media'
    )

# ==================== SEÑALES PARA PREGUNTA SUGERIDA ====================

@receiver(post_save, sender=PreguntaSugerida)
def pregunta_sugerida_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea una pregunta sugerida"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PREGUNTA_SUGERIDA_CREADA',
            mensaje=f'Se ha creado una pregunta sugerida para el agente {instance.agente.nombre}',
            prioridad='baja'
        )

@receiver(post_delete, sender=PreguntaSugerida)
def pregunta_sugerida_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina una pregunta sugerida"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='PREGUNTA_SUGERIDA_ELIMINADA',
        mensaje=f'Se ha eliminado una pregunta sugerida del agente {instance.agente.nombre}',
        prioridad='baja'
    )
