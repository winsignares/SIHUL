"""Señales de componentes y de su asignación a roles."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from identidad.componentes.models import Componente, ComponenteRol

from .base import crear_notificacion, obtener_id_usuario

# ==================== SEÑALES PARA COMPONENTE ====================

@receiver(post_save, sender=Componente)
def componente_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un componente"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='COMPONENTE_CREADO',
            mensaje=f'Se ha creado el componente: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Componente)
def componente_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un componente"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='COMPONENTE_ELIMINADO',
        mensaje=f'Se ha eliminado el componente: {instance.nombre}',
        prioridad='media'
    )

# ==================== SEÑALES PARA COMPONENTE ROL ====================

@receiver(post_save, sender=ComponenteRol)
def componente_rol_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se asigna un permiso a un rol"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PERMISO_ASIGNADO',
            mensaje=f'Se ha asignado permiso {instance.get_permiso_display()} al rol {instance.rol.nombre} para {instance.componente.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=ComponenteRol)
def componente_rol_post_delete(sender, instance, **kwargs):
    """Notificación cuando se revoca un permiso"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='PERMISO_REVOCADO',
        mensaje=f'Se ha revocado el permiso del rol {instance.rol.nombre} para {instance.componente.nombre}',
        prioridad='media'
    )

