"""Señales de la estructura académica: sedes, facultades, programas, asignaturas, periodos y grupos."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from sedes.models import Sede
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma
from periodos.models import PeriodoAcademico
from grupos.models import Grupo

from .base import crear_notificacion, es_origen_siul, obtener_id_usuario

# ==================== SEÑALES PARA SEDE ====================

@receiver(post_save, sender=Sede)
def sede_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza una sede"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='SEDE_CREADA',
            mensaje=f"Se ha creado la sede: {instance.nombre} en la seccional {instance.seccional.ciudad if instance.seccional else 'Sin seccional'}",
            prioridad='alta'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='SEDE_ACTUALIZADA',
            mensaje=f'Se ha actualizado la sede: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Sede)
def sede_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina una sede"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='SEDE_ELIMINADA',
        mensaje=f'Se ha eliminado la sede: {instance.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA FACULTAD ====================

@receiver(post_save, sender=Facultad)
def facultad_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza una facultad"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='FACULTAD_CREADA',
            mensaje=f'Se ha creado la facultad: {instance.nombre}',
            prioridad='alta'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='FACULTAD_ACTUALIZADA',
            mensaje=f'Se ha actualizado la facultad: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Facultad)
def facultad_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina una facultad"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='FACULTAD_ELIMINADA',
        mensaje=f'Se ha eliminado la facultad: {instance.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA PROGRAMA ====================

@receiver(post_save, sender=Programa)
def programa_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un programa"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PROGRAMA_CREADO',
            mensaje=f'Se ha creado el programa: {instance.nombre} ({instance.facultad.nombre})',
            prioridad='alta'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PROGRAMA_ACTUALIZADO',
            mensaje=f'Se ha actualizado el programa: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Programa)
def programa_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un programa"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='PROGRAMA_ELIMINADO',
        mensaje=f'Se ha eliminado el programa: {instance.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA ASIGNATURA ====================

@receiver(post_save, sender=Asignatura)
def asignatura_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza una asignatura"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ASIGNATURA_CREADA',
            mensaje=f'Se ha creado la asignatura: {instance.nombre} ({instance.codigo})',
            prioridad='media'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ASIGNATURA_ACTUALIZADA',
            mensaje=f'Se ha actualizado la asignatura: {instance.nombre}',
            prioridad='baja'
        )

@receiver(post_delete, sender=Asignatura)
def asignatura_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina una asignatura"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='ASIGNATURA_ELIMINADA',
        mensaje=f'Se ha eliminado la asignatura: {instance.nombre} ({instance.codigo})',
        prioridad='alta'
    )

# ==================== SEÑALES PARA ASIGNATURA PROGRAMA ====================

@receiver(post_save, sender=AsignaturaPrograma)
def asignatura_programa_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza una asignatura en un programa"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='ASIGNATURA_PROGRAMA_CREADA',
            mensaje=f'Se ha asignado {instance.asignatura.nombre} al programa {instance.programa.nombre} (Semestre {instance.semestre})',
            prioridad='media'
        )

@receiver(post_delete, sender=AsignaturaPrograma)
def asignatura_programa_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina una asignatura de un programa"""
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='ASIGNATURA_PROGRAMA_ELIMINADA',
        mensaje=f'Se ha removido {instance.asignatura.nombre} del programa {instance.programa.nombre}',
        prioridad='media'
    )

# ==================== SEÑALES PARA PERIODO ACADEMICO ====================

@receiver(post_save, sender=PeriodoAcademico)
def periodo_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un período académico"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PERIODO_CREADO',
            mensaje=f'Se ha creado el período académico: {instance.nombre}',
            prioridad='alta'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='PERIODO_ACTUALIZADO',
            mensaje=f'Se ha actualizado el período académico: {instance.nombre}',
            prioridad='alta'
        )

@receiver(post_delete, sender=PeriodoAcademico)
def periodo_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un período académico"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='PERIODO_ELIMINADO',
        mensaje=f'Se ha eliminado el período académico: {instance.nombre}',
        prioridad='alta'
    )

# ==================== SEÑALES PARA GRUPO ====================

@receiver(post_save, sender=Grupo)
def grupo_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un grupo"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='GRUPO_CREADO',
            mensaje=f'Se ha creado el grupo: {instance.nombre} - {instance.programa.nombre} (Semestre {instance.semestre})',
            prioridad='alta'
        )
    else:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='GRUPO_ACTUALIZADO',
            mensaje=f'Se ha actualizado el grupo: {instance.nombre}',
            prioridad='media'
        )

@receiver(post_delete, sender=Grupo)
def grupo_post_delete(sender, instance, **kwargs):
    """Notificación cuando se elimina un grupo"""
    if es_origen_siul(instance):
        return
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='GRUPO_ELIMINADO',
        mensaje=f'Se ha eliminado el grupo: {instance.nombre}',
        prioridad='alta'
    )

