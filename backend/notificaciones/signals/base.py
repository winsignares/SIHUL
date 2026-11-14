"""Apoyo de las señales: usuario actual por hilo, middleware que lo captura y creación de notificaciones."""
from django.contrib.auth.models import AnonymousUser
from threading import local
import logging

from notificaciones.models import Notificacion

logger = logging.getLogger('notificaciones.signals')

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

def es_origen_siul(instance):
    """
    True si el registro proviene del ETL de Oracle (origen='SIUL').
    Los cambios masivos del ETL no deben generar notificaciones individuales.
    """
    return getattr(instance, 'origen', None) == 'SIUL'
