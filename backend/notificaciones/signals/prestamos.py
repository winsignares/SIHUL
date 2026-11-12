"""Señales de préstamos de espacios y recursos."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from prestamos.models import PrestamoEspacio, TipoActividad, PrestamoRecurso

from .base import crear_notificacion, obtener_id_usuario

# ==================== SEÑALES PARA TIPO ACTIVIDAD ====================

@receiver(post_save, sender=TipoActividad)
def tipo_actividad_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un tipo de actividad"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='TIPO_ACTIVIDAD_CREADO',
            mensaje=f'Se ha creado el tipo de actividad: {instance.nombre}',
            prioridad='baja'
        )

# ==================== SEÑALES PARA PRESTAMO ESPACIO ====================

@receiver(post_save, sender=PrestamoEspacio)
def prestamo_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un préstamo"""
    if created:
        # Notificar al solicitante
        if instance.usuario:
            crear_notificacion(
                id_usuario=instance.usuario.id,
                tipo='PRESTAMO_SOLICITADO',
                mensaje=f'Has solicitado el préstamo del espacio: {instance.espacio.nombre} para el {instance.fecha}',
                prioridad='alta'
            )
        # Notificar al administrador
        id_admin = obtener_id_usuario()
        crear_notificacion(
            id_usuario=id_admin,
            tipo='PRESTAMO_NUEVA_SOLICITUD',
            mensaje=f'Nueva solicitud de préstamo: {instance.espacio.nombre} - {instance.fecha} ({instance.tipo_actividad.nombre})',
            prioridad='alta'
        )
    else:
        # Cambio de estado
        if instance.usuario:
            if instance.estado == 'Aprobado':
                crear_notificacion(
                    id_usuario=instance.usuario.id,
                    tipo='PRESTAMO_APROBADO',
                    mensaje=f'Tu préstamo del espacio {instance.espacio.nombre} ha sido aprobado para el {instance.fecha}',
                    prioridad='alta'
                )
            elif instance.estado == 'Rechazado':
                crear_notificacion(
                    id_usuario=instance.usuario.id,
                    tipo='PRESTAMO_RECHAZADO',
                    mensaje=f'Tu préstamo del espacio {instance.espacio.nombre} ha sido rechazado',
                    prioridad='alta'
                )

@receiver(post_delete, sender=PrestamoEspacio)
def prestamo_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un préstamo"""
    if instance.usuario:
        crear_notificacion(
            id_usuario=instance.usuario.id,
            tipo='PRESTAMO_CANCELADO',
            mensaje=f'Se ha cancelado el préstamo del espacio: {instance.espacio.nombre} ({instance.fecha})',
            prioridad='alta'
        )

# ==================== SEÑALES PARA PRESTAMO RECURSO ====================

@receiver(post_save, sender=PrestamoRecurso)
def prestamo_recurso_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se añade un recurso a un préstamo"""
    if created and instance.prestamo.usuario:
        crear_notificacion(
            id_usuario=instance.prestamo.usuario.id,
            tipo='RECURSO_AGREGADO',
            mensaje=f'Se ha agregado {instance.recurso.nombre} (x{instance.cantidad}) a tu préstamo',
            prioridad='media'
        )

