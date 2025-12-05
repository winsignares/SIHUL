"""
Signals para la app de horarios
Maneja la creación automática de HorarioFusionado cuando múltiples grupos comparten una clase
y valida solapamientos/capacidad antes de guardar
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
from .models import Horario, HorarioFusionado


def time_to_minutes(time_obj):
    """Convierte un objeto time a minutos desde medianoche"""
    return time_obj.hour * 60 + time_obj.minute


def hay_solapamiento(inicio1, fin1, inicio2, fin2):
    """Verifica si dos rangos de tiempo se solapan"""
    inicio1_min = time_to_minutes(inicio1)
    fin1_min = time_to_minutes(fin1)
    inicio2_min = time_to_minutes(inicio2)
    fin2_min = time_to_minutes(fin2)
    
    return (
        (inicio1_min >= inicio2_min and inicio1_min < fin2_min) or
        (fin1_min > inicio2_min and fin1_min <= fin2_min) or
        (inicio1_min < inicio2_min and fin1_min > fin2_min)
    )


@receiver(pre_save, sender=Horario)
def validar_horario(sender, instance, **kwargs):
    """
    Signal que se ejecuta ANTES de guardar un Horario.
    Valida:
    1. Que no haya solapamiento de horarios en el mismo espacio (excepto si es la misma clase)
    2. Que la capacidad del espacio sea suficiente si grupos comparten la misma clase
    """
    # Solo validar si es un nuevo horario (no tiene pk) o si cambiaron campos relevantes
    if instance.pk is None:
        # Es un nuevo horario, validar
        pass
    else:
        # Es una actualización, verificar si cambiaron campos relevantes
        try:
            horario_anterior = Horario.objects.get(pk=instance.pk)
            # Si no cambiaron los campos relevantes, no validar
            if (horario_anterior.espacio_id == instance.espacio_id and
                horario_anterior.dia_semana == instance.dia_semana and
                horario_anterior.hora_inicio == instance.hora_inicio and
                horario_anterior.hora_fin == instance.hora_fin and
                horario_anterior.asignatura_id == instance.asignatura_id and
                horario_anterior.docente_id == instance.docente_id and
                horario_anterior.cantidad_estudiantes == instance.cantidad_estudiantes):
                return
        except Horario.DoesNotExist:
            pass
    
    # Buscar horarios que usan el mismo espacio en el mismo día
    horarios_mismo_espacio = Horario.objects.filter(
        espacio_id=instance.espacio_id,
        dia_semana=instance.dia_semana
    ).exclude(pk=instance.pk if instance.pk else None)
    
    # Verificar solapamientos
    for horario_existente in horarios_mismo_espacio:
        if hay_solapamiento(
            instance.hora_inicio,
            instance.hora_fin,
            horario_existente.hora_inicio,
            horario_existente.hora_fin
        ):
            # Hay solapamiento, verificar si es la misma clase
            es_misma_clase = (
                instance.asignatura_id == horario_existente.asignatura_id and
                instance.docente_id == horario_existente.docente_id and
                instance.hora_inicio == horario_existente.hora_inicio and
                instance.hora_fin == horario_existente.hora_fin
            )
            
            if es_misma_clase:
                # Es la misma clase, verificar capacidad del espacio
                from espacios.models import EspacioFisico
                
                espacio = EspacioFisico.objects.get(pk=instance.espacio_id)
                
                # Sumar estudiantes de todos los horarios que comparten exactamente la misma clase
                horarios_misma_clase = Horario.objects.filter(
                    espacio_id=instance.espacio_id,
                    dia_semana=instance.dia_semana,
                    asignatura_id=instance.asignatura_id,
                    docente_id=instance.docente_id,
                    hora_inicio=instance.hora_inicio,
                    hora_fin=instance.hora_fin
                ).exclude(pk=instance.pk if instance.pk else None)
                
                total_estudiantes_existentes = sum(
                    h.cantidad_estudiantes or 0 for h in horarios_misma_clase
                )
                total_estudiantes = total_estudiantes_existentes + (instance.cantidad_estudiantes or 0)
                
                if total_estudiantes > espacio.capacidad:
                    grupos_compartiendo = ', '.join([
                        h.grupo.nombre for h in horarios_misma_clase
                    ])
                    raise ValidationError(
                        f"El espacio {espacio.nombre} no tiene capacidad suficiente. "
                        f"Ya hay {total_estudiantes_existentes} estudiantes del grupo(s) {grupos_compartiendo} "
                        f"en esta clase. Total: {total_estudiantes}/{espacio.capacidad}"
                    )
                # Si la capacidad es suficiente, permitir compartir el espacio
            else:
                # No es la misma clase, hay conflicto
                from espacios.models import EspacioFisico
                espacio = EspacioFisico.objects.get(pk=instance.espacio_id)
                raise ValidationError(
                    f"El espacio {espacio.nombre} ya está ocupado el {instance.dia_semana} "
                    f"de {horario_existente.hora_inicio.strftime('%H:%M')} a "
                    f"{horario_existente.hora_fin.strftime('%H:%M')} "
                    f"por el grupo {horario_existente.grupo.nombre}"
                )


@receiver(post_save, sender=Horario)
def crear_horario_fusionado(sender, instance, created, **kwargs):
    """
    Signal que se ejecuta después de guardar un Horario.
    Si detecta que hay otros grupos con la misma clase (asignatura, docente, día, hora),
    crea o actualiza un registro en HorarioFusionado.
    """
    if not created:
        # Solo procesar cuando se crea un nuevo horario
        return
    
    # Buscar horarios que compartan la misma clase
    horarios_compartidos = Horario.objects.filter(
        asignatura_id=instance.asignatura_id,
        docente_id=instance.docente_id,
        dia_semana=instance.dia_semana,
        hora_inicio=instance.hora_inicio,
        hora_fin=instance.hora_fin,
        espacio_id=instance.espacio_id
    ).exclude(
        id=instance.id  # Excluir el horario recién creado
    ).order_by('id')
    
    if horarios_compartidos.count() == 0:
        # No hay otros grupos compartiendo esta clase
        return
    
    # Hay al menos un grupo compartiendo la clase
    grupos_ids = [instance.grupo_id] + list(horarios_compartidos.values_list('grupo_id', flat=True))
    
    # Limitar a máximo 3 grupos
    grupo1_id = grupos_ids[0] if len(grupos_ids) > 0 else None
    grupo2_id = grupos_ids[1] if len(grupos_ids) > 1 else None
    grupo3_id = grupos_ids[2] if len(grupos_ids) > 2 else None
    
    if grupo1_id is None or grupo2_id is None:
        # Se necesitan al menos 2 grupos para fusionar
        return
    
    # Calcular cantidad total de estudiantes
    horarios_para_sumar = Horario.objects.filter(
        grupo_id__in=[g for g in [grupo1_id, grupo2_id, grupo3_id] if g is not None],
        asignatura_id=instance.asignatura_id,
        docente_id=instance.docente_id,
        dia_semana=instance.dia_semana,
        hora_inicio=instance.hora_inicio,
        hora_fin=instance.hora_fin
    )
    
    cantidad_total = sum(h.cantidad_estudiantes or 0 for h in horarios_para_sumar)
    
    # Verificar si ya existe un HorarioFusionado con estos grupos
    # Buscamos cualquier combinación que incluya estos grupos
    from django.db.models import Q
    
    fusionado_existente = HorarioFusionado.objects.filter(
        asignatura_id=instance.asignatura_id,
        docente_id=instance.docente_id,
        dia_semana=instance.dia_semana,
        hora_inicio=instance.hora_inicio,
        hora_fin=instance.hora_fin
    ).filter(
        Q(grupo1_id__in=grupos_ids[:3]) | 
        Q(grupo2_id__in=grupos_ids[:3]) | 
        Q(grupo3_id__in=grupos_ids[:3])
    ).first()
    
    if fusionado_existente:
        # Actualizar el existente si es necesario
        actualizar = False
        
        # Obtener los grupos que ya están en el fusionado
        grupos_existentes = {
            fusionado_existente.grupo1_id,
            fusionado_existente.grupo2_id,
            fusionado_existente.grupo3_id
        }
        grupos_existentes.discard(None)  # Remover None si existe
        
        # Combinar con los nuevos grupos
        todos_grupos = list(grupos_existentes.union(set(grupos_ids[:3])))
        
        # Reasignar si hay cambios
        if len(todos_grupos) > len(grupos_existentes):
            fusionado_existente.grupo1_id = todos_grupos[0] if len(todos_grupos) > 0 else None
            fusionado_existente.grupo2_id = todos_grupos[1] if len(todos_grupos) > 1 else None
            fusionado_existente.grupo3_id = todos_grupos[2] if len(todos_grupos) > 2 else None
            actualizar = True
        
        if fusionado_existente.cantidad_estudiantes != cantidad_total:
            fusionado_existente.cantidad_estudiantes = cantidad_total
            actualizar = True
        
        if actualizar:
            fusionado_existente.save()
            print(f"✅ HorarioFusionado actualizado: ID {fusionado_existente.id}")
    else:
        # Crear nuevo HorarioFusionado
        try:
            fusionado = HorarioFusionado.objects.create(
                grupo1_id=grupo1_id,
                grupo2_id=grupo2_id,
                grupo3_id=grupo3_id,
                asignatura_id=instance.asignatura_id,
                docente_id=instance.docente_id,
                espacio_id=instance.espacio_id,
                dia_semana=instance.dia_semana,
                hora_inicio=instance.hora_inicio,
                hora_fin=instance.hora_fin,
                cantidad_estudiantes=cantidad_total,
                comentario=f"Clase compartida entre {len([g for g in [grupo1_id, grupo2_id, grupo3_id] if g is not None])} grupos"
            )
            print(f"✅ HorarioFusionado creado automáticamente: ID {fusionado.id} para grupos {grupo1_id}, {grupo2_id}" + (f", {grupo3_id}" if grupo3_id else ""))
        except Exception as e:
            print(f"⚠️ Error al crear HorarioFusionado: {e}")
