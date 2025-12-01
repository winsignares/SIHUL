from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from grupos.models import Grupo


@receiver(post_save, sender=Grupo)
def activar_programa_al_crear_grupo(sender, instance, created, **kwargs):
    """
    Activa automáticamente un programa cuando se le asigna un grupo
    """
    if created:
        programa = instance.programa
        if not programa.activo:
            programa.activo = True
            programa.save(update_fields=['activo'])
            print(f"✅ Programa '{programa.nombre}' activado automáticamente (nuevo grupo asignado)")


@receiver(post_delete, sender=Grupo)
def desactivar_programa_sin_grupos(sender, instance, **kwargs):
    """
    Desactiva automáticamente un programa cuando se elimina su último grupo
    """
    programa = instance.programa
    
    # Verificar si el programa tiene otros grupos
    grupos_restantes = Grupo.objects.filter(programa=programa).exists()
    
    if not grupos_restantes and programa.activo:
        programa.activo = False
        programa.save(update_fields=['activo'])
        print(f"⚠️ Programa '{programa.nombre}' desactivado automáticamente (sin grupos asignados)")


@receiver(post_save, sender=Grupo)
def verificar_estado_programa_al_actualizar(sender, instance, created, **kwargs):
    """
    Verifica el estado del programa cuando se actualiza un grupo
    Si el grupo cambió de programa, actualiza el estado de ambos programas
    """
    if not created and hasattr(instance, '_old_programa_id'):
        old_programa_id = instance._old_programa_id
        
        if old_programa_id and old_programa_id != instance.programa_id:
            # Verificar el programa anterior
            try:
                from programas.models import Programa
                old_programa = Programa.objects.get(id=old_programa_id)
                
                # Si el programa anterior no tiene más grupos, desactivarlo
                if not Grupo.objects.filter(programa=old_programa).exists():
                    old_programa.activo = False
                    old_programa.save(update_fields=['activo'])
                    print(f"⚠️ Programa '{old_programa.nombre}' desactivado automáticamente (sin grupos)")
                
                # Activar el nuevo programa si no está activo
                if not instance.programa.activo:
                    instance.programa.activo = True
                    instance.programa.save(update_fields=['activo'])
                    print(f"✅ Programa '{instance.programa.nombre}' activado automáticamente")
            except Exception as e:
                print(f"Error al verificar estado de programas: {e}")
