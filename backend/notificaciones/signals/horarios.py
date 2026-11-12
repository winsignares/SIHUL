"""Señales de horarios, horarios fusionados y horarios de estudiantes."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from horario.models import Horario, HorarioFusionado, HorarioEstudiante

from .base import crear_notificacion, es_origen_siul, obtener_id_usuario

# ==================== SEÑALES PARA HORARIO ====================

@receiver(post_save, sender=Horario)
def horario_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un horario"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        mensaje = f'Nuevo horario creado: {instance.asignatura.nombre} - {instance.dia_semana} {instance.hora_inicio}-{instance.hora_fin}'
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='HORARIO_CREADO',
            mensaje=mensaje,
            prioridad='alta'
        )
        # Notificar al docente asignado
        if instance.docente:
            crear_notificacion(
                id_usuario=instance.docente.id,
                tipo='HORARIO_ASIGNADO',
                mensaje=f'Se te ha asignado un horario: {instance.asignatura.nombre} - {instance.dia_semana} {instance.hora_inicio}',
                prioridad='alta'
            )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='HORARIO_ACTUALIZADO',
            mensaje=f'Horario actualizado: {instance.asignatura.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Horario)
def horario_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un horario"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='HORARIO_ELIMINADO',
        mensaje=f'Se ha eliminado el horario: {instance.asignatura.nombre} - {instance.dia_semana}',
        prioridad='alta'
    )
    # Notificar al docente
    if instance.docente:
        crear_notificacion(
            id_usuario=instance.docente.id,
            tipo='HORARIO_CANCELADO',
            mensaje=f'Se ha cancelado tu horario: {instance.asignatura.nombre} - {instance.dia_semana}',
            prioridad='alta'
        )

# ==================== SEÑALES PARA HORARIO FUSIONADO ====================

@receiver(post_save, sender=HorarioFusionado)
def horario_fusionado_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un horario fusionado"""
    id_usuario = obtener_id_usuario()
    
    if created:
        grupos = f"{instance.grupo1.nombre}, {instance.grupo2.nombre}"
        if instance.grupo3:
            grupos += f", {instance.grupo3.nombre}"
        
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='HORARIO_FUSIONADO_CREADO',
            mensaje=f'Horario fusionado creado: {instance.asignatura.nombre} - Grupos: {grupos}',
            prioridad='alta'
        )
        # Notificar al docente
        if instance.docente:
            crear_notificacion(
                id_usuario=instance.docente.id,
                tipo='HORARIO_FUSIONADO_ASIGNADO',
                mensaje=f'Se te ha asignado un horario fusionado: {instance.asignatura.nombre} - {grupos}',
                prioridad='alta'
            )

@receiver(post_delete, sender=HorarioFusionado)
def horario_fusionado_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un horario fusionado"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='HORARIO_FUSIONADO_ELIMINADO',
        mensaje=f'Se ha eliminado el horario fusionado: {instance.asignatura.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA HORARIO ESTUDIANTE ====================

@receiver(post_save, sender=HorarioEstudiante)
def horario_estudiante_post_save(sender, instance, created, **kwargs):
    """Notificación cuando un estudiante se inscribe en un horario"""
    if created:
        crear_notificacion(
            id_usuario=instance.estudiante.id,
            tipo='INSCRIPCION_HORARIO',
            mensaje=f'Te has inscrito en: {instance.horario.asignatura.nombre} - {instance.horario.dia_semana} {instance.horario.hora_inicio}',
            prioridad='alta'
        )

@receiver(post_delete, sender=HorarioEstudiante)
def horario_estudiante_post_delete(sender, instance, **kwargs):
    """Notificación cuando un estudiante se desinscribe de un horario"""
    crear_notificacion(
        id_usuario=instance.estudiante.id,
        tipo='DESINSCRIPCION_HORARIO',
        mensaje=f'Has sido desinscrito de: {instance.horario.asignatura.nombre}',
        prioridad='alta'
    )

