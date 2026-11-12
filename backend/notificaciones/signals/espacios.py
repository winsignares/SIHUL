"""Señales de espacios físicos, sus tipos y los espacios permitidos."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from espacios.models import EspacioFisico, TipoEspacio, EspacioPermitido

from .base import crear_notificacion, es_origen_siul, obtener_id_usuario

# ==================== SEÑALES PARA TIPO ESPACIO ====================

@receiver(post_save, sender=TipoEspacio)
def tipo_espacio_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un tipo de espacio"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='TIPO_ESPACIO_CREADO',
            mensaje=f'Se ha creado el tipo de espacio: {instance.nombre}',
            prioridad='baja'
        )

@receiver(post_delete, sender=TipoEspacio)
def tipo_espacio_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un tipo de espacio"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='TIPO_ESPACIO_ELIMINADO',
        mensaje=f'Se ha eliminado el tipo de espacio: {instance.nombre}',
        prioridad='media'
    )

# ==================== SEÑALES PARA ESPACIO FISICO ====================

@receiver(post_save, sender=EspacioFisico)
def espacio_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un espacio físico"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ESPACIO_CREADO',
            mensaje=f'Se ha creado el espacio: {instance.nombre} - {instance.tipo.nombre} (Capacidad: {instance.capacidad})',
            prioridad='media'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ESPACIO_ACTUALIZADO',
            mensaje=f'Se ha actualizado el espacio: {instance.nombre} - Estado: {instance.estado}',
            prioridad='media'
        )

@receiver(post_delete, sender=EspacioFisico)
def espacio_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un espacio físico"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='ESPACIO_ELIMINADO',
        mensaje=f'Se ha eliminado el espacio: {instance.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA ESPACIO PERMITIDO ====================

@receiver(post_save, sender=EspacioPermitido)
def espacio_permitido_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se asigna un espacio a un usuario"""
    if created:
        crear_notificacion(
            id_usuario=instance.usuario.id,
            tipo='ESPACIO_ASIGNADO',
            mensaje=f'Se te ha asignado acceso al espacio: {instance.espacio.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=EspacioPermitido)
def espacio_permitido_post_delete(sender, instance, **kwargs):
    """Notificación cuando se revoca el acceso a un espacio"""
    crear_notificacion(
        id_usuario=instance.usuario.id,
        tipo='ESPACIO_REVOCADO',
        mensaje=f'Se ha revocado tu acceso al espacio: {instance.espacio.nombre}',
        prioridad='media'
    )

