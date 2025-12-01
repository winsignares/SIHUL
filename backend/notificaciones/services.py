"""
Servicios para gestionar notificaciones del sistema
"""
from django.utils import timezone
from .models import Notificacion


class NotificacionService:
    """Servicio para crear y gestionar notificaciones"""
    
    @staticmethod
    def crear_notificacion(
        id_usuario,
        tipo_notificacion,
        mensaje,
        prioridad='media',
        id_relacion=None,
        tabla_relacion=None
    ):
        """
        Crea una nueva notificación automática
        
        Args:
            id_usuario: ID del usuario destinatario
            tipo_notificacion: Tipo de notificación
            mensaje: Mensaje de la notificación
            prioridad: Prioridad (baja, media, alta)
            id_relacion: ID del evento/clase/solicitud relacionado
            tabla_relacion: Tabla de la que proviene la relación
        
        Returns:
            Notificacion: La notificación creada
        """
        notificacion = Notificacion.objects.create(
            id_usuario=id_usuario,
            tipo_notificacion=tipo_notificacion,
            mensaje=mensaje,
            prioridad=prioridad,
            id_relacion=id_relacion,
            tabla_relacion=tabla_relacion
        )
        return notificacion
    
    @staticmethod
    def obtener_notificaciones_usuario(id_usuario, no_leidas=False):
        """
        Obtiene las notificaciones de un usuario
        
        Args:
            id_usuario: ID del usuario
            no_leidas: Si es True, solo obtiene las no leídas
        
        Returns:
            QuerySet: Notificaciones del usuario
        """
        queryset = Notificacion.objects.filter(id_usuario=id_usuario)
        if no_leidas:
            queryset = queryset.filter(es_leida=False)
        return queryset.order_by('-fecha_creacion')
    
    @staticmethod
    def marcar_como_leida(id_notificacion):
        """
        Marca una notificación como leída
        
        Args:
            id_notificacion: ID de la notificación
        
        Returns:
            bool: True si se marcó correctamente
        """
        try:
            notificacion = Notificacion.objects.get(pk=id_notificacion)
            notificacion.marcar_como_leida()
            return True
        except Notificacion.DoesNotExist:
            return False
    
    @staticmethod
    def marcar_todas_como_leidas(id_usuario):
        """
        Marca todas las notificaciones de un usuario como leídas
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            int: Cantidad de notificaciones marcadas
        """
        notificaciones = Notificacion.objects.filter(
            id_usuario=id_usuario,
            es_leida=False
        )
        count = notificaciones.count()
        notificaciones.update(
            es_leida=True,
            fecha_lectura=timezone.now()
        )
        return count
    
    @staticmethod
    def eliminar_notificacion(id_notificacion):
        """
        Elimina una notificación
        
        Args:
            id_notificacion: ID de la notificación
        
        Returns:
            bool: True si se eliminó correctamente
        """
        try:
            notificacion = Notificacion.objects.get(pk=id_notificacion)
            notificacion.delete()
            return True
        except Notificacion.DoesNotExist:
            return False
    
    @staticmethod
    def obtener_estadisticas_usuario(id_usuario):
        """
        Obtiene estadísticas de notificaciones de un usuario
        
        Args:
            id_usuario: ID del usuario
        
        Returns:
            dict: Estadísticas
        """
        notificaciones = Notificacion.objects.filter(id_usuario=id_usuario)
        return {
            'total': notificaciones.count(),
            'no_leidas': notificaciones.filter(es_leida=False).count(),
            'leidas': notificaciones.filter(es_leida=True).count(),
            'alta_prioridad': notificaciones.filter(prioridad='alta').count(),
        }
