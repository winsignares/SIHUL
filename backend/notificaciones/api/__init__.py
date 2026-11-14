"""Vistas de notificaciones, reexportadas para api_urls."""
from .crud import NotificacionListCreateAPIView, NotificacionDetailAPIView
from .consultas import NotificacionEstadisticasAPIView, NotificacionListAPIView, NotificacionMisNotificacionesAPIView
from .marcado import NotificacionMarcarLeidaAPIView, NotificacionMarcarTodasLeidasAPIView

__all__ = [
    'NotificacionListCreateAPIView',
    'NotificacionDetailAPIView',
    'NotificacionEstadisticasAPIView',
    'NotificacionListAPIView',
    'NotificacionMisNotificacionesAPIView',
    'NotificacionMarcarLeidaAPIView',
    'NotificacionMarcarTodasLeidasAPIView',
]
