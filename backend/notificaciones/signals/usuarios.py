"""Señales de usuarios y roles."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from identidad.usuarios.models import Usuario, Rol

from .base import crear_notificacion, es_origen_siul, obtener_id_usuario

# ==================== SEÑALES PARA USUARIO ====================

@receiver(post_save, sender=Usuario)
def usuario_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un usuario"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='USUARIO_CREADO',
            mensaje=f'Se ha creado el usuario: {instance.nombre} ({instance.correo})',
            prioridad='alta'
        )
        # Notificar al usuario creado
        if instance.id != id_usuario:
            crear_notificacion(
                id_usuario=instance.id,
                tipo='CUENTA_CREADA',
                mensaje=f'Tu cuenta ha sido creada exitosamente. Bienvenido/a {instance.nombre}',
                prioridad='alta'
            )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='USUARIO_ACTUALIZADO',
            mensaje=f'Se ha actualizado el usuario: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Usuario)
def usuario_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un usuario"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='USUARIO_ELIMINADO',
        mensaje=f'Se ha eliminado el usuario: {instance.nombre} ({instance.correo})',
        prioridad='alta'
    )

# ==================== SEÑALES PARA ROL ====================

@receiver(post_save, sender=Rol)
def rol_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un rol"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ROL_CREADO',
            mensaje=f'Se ha creado el rol: {instance.nombre}',
            prioridad='media'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ROL_ACTUALIZADO',
            mensaje=f'Se ha actualizado el rol: {instance.nombre}',
            prioridad='baja'
        )

@receiver(post_delete, sender=Rol)
def rol_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un rol"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='ROL_ELIMINADO',
        mensaje=f'Se ha eliminado el rol: {instance.nombre}',
        prioridad='alta'
    )

