"""
Signals para crear notificaciones automáticas en operaciones CRUD
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth.models import AnonymousUser
from threading import local
import logging

# Importar modelos
from usuarios.models import Usuario, Rol
from sedes.models import Sede
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma
from periodos.models import PeriodoAcademico
from grupos.models import Grupo
from espacios.models import EspacioFisico, TipoEspacio, EspacioPermitido
from horario.models import Horario, HorarioFusionado, HorarioEstudiante
from prestamos.models import PrestamoEspacio, TipoActividad, PrestamoRecurso
from componentes.models import Componente, ComponenteRol
from chatbot.models import Agente, PreguntaSugerida
from notificaciones.models import Notificacion

logger = logging.getLogger(__name__)

# Thread-local storage para el usuario actual
_thread_locals = local()

def get_current_user():
    """Obtiene el usuario actual del thread local"""
    return getattr(_thread_locals, 'user', None)

def set_current_user(user):
    """Establece el usuario actual en el thread local"""
    _thread_locals.user = user

class CurrentUserMiddleware:
    """
    Middleware para capturar el usuario actual en cada request
    Agregar a MIDDLEWARE en settings.py:
    'notificaciones.signals.CurrentUserMiddleware'
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if hasattr(request, 'user') and not isinstance(request.user, AnonymousUser):
            set_current_user(request.user)
        else:
            set_current_user(None)
        
        response = self.get_response(request)
        set_current_user(None)
        return response

def crear_notificacion(id_usuario, tipo, mensaje, prioridad='media'):
    """Función helper para crear notificaciones"""
    try:
        if id_usuario:
            Notificacion.objects.create(
                id_usuario=id_usuario,
                tipo_notificacion=tipo,
                mensaje=mensaje,
                prioridad=prioridad
            )
    except Exception as e:
        logger.error(f"Error creando notificación: {e}")

def obtener_id_usuario():
    """Obtiene el ID del usuario actual o retorna 1 (admin) por defecto"""
    user = get_current_user()
    if user and hasattr(user, 'id'):
        return user.id
    # Usuario por defecto (admin o sistema)
    return 1

# ==================== SEÑALES PARA USUARIO ====================

@receiver(post_save, sender=Usuario)
def usuario_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un usuario"""
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

# ==================== SEÑALES PARA SEDE ====================

@receiver(post_save, sender=Sede)
def sede_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza una sede"""
    id_usuario = obtener_id_usuario()
    
    if created:
        crear_notificacion(
            id_usuario=id_usuario,
            tipo='SEDE_CREADA',
            mensaje=f'Se ha creado la sede: {instance.nombre} en {instance.ciudad}',
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
    id_usuario = obtener_id_usuario()
    crear_notificacion(
        id_usuario=id_usuario,
        tipo='GRUPO_ELIMINADO',
        mensaje=f'Se ha eliminado el grupo: {instance.nombre}',
        prioridad='alta'
    )

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

# ==================== SEÑALES PARA HORARIO ====================

@receiver(post_save, sender=Horario)
def horario_post_save(sender, instance, created, **kwargs):
    """Notificación cuando se crea o actualiza un horario"""
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
