"""
Vistas para gestionar notificaciones
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Notificacion
from .serializers import (
    NotificacionSerializer,
    NotificacionCreateSerializer,
    NotificacionUpdateSerializer,
    NotificacionListSerializer
)
from .services import NotificacionService


class NotificacionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar notificaciones"""
    
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Retorna el serializer según la acción"""
        if self.action == 'create':
            return NotificacionCreateSerializer
        elif self.action == 'partial_update':
            return NotificacionUpdateSerializer
        elif self.action == 'list':
            return NotificacionListSerializer
        return NotificacionSerializer
    
    def get_queryset(self):
        """Filtra notificaciones por usuario"""
        user_id = self.request.query_params.get('id_usuario')
        if user_id:
            return Notificacion.objects.filter(id_usuario=user_id).order_by('-fecha_creacion')
        return Notificacion.objects.all().order_by('-fecha_creacion')
    
    @action(detail=False, methods=['get'])
    def mis_notificaciones(self, request):
        """Obtiene las notificaciones del usuario autenticado"""
        id_usuario = request.query_params.get('id_usuario')
        no_leidas = request.query_params.get('no_leidas', 'false').lower() == 'true'
        
        if not id_usuario:
            return Response(
                {'error': 'id_usuario es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notificaciones = NotificacionService.obtener_notificaciones_usuario(
            int(id_usuario),
            no_leidas=no_leidas
        )
        
        serializer = self.get_serializer(notificaciones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtiene estadísticas de notificaciones del usuario"""
        id_usuario = request.query_params.get('id_usuario')
        
        if not id_usuario:
            return Response(
                {'error': 'id_usuario es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stats = NotificacionService.obtener_estadisticas_usuario(int(id_usuario))
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def marcar_como_leida(self, request, pk=None):
        """Marca una notificación como leída"""
        notificacion = self.get_object()
        notificacion.marcar_como_leida()
        serializer = self.get_serializer(notificacion)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def marcar_todas_como_leidas(self, request):
        """Marca todas las notificaciones del usuario como leídas"""
        id_usuario = request.data.get('id_usuario')
        
        if not id_usuario:
            return Response(
                {'error': 'id_usuario es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        count = NotificacionService.marcar_todas_como_leidas(int(id_usuario))
        return Response({
            'mensaje': f'{count} notificación(es) marcada(s) como leída(s)',
            'cantidad': count
        })
    
    @action(detail=False, methods=['post'])
    def crear_notificacion(self, request):
        """Crea una nueva notificación automática"""
        serializer = NotificacionCreateSerializer(data=request.data)
        if serializer.is_valid():
            notificacion = NotificacionService.crear_notificacion(
                **serializer.validated_data
            )
            return Response(
                NotificacionSerializer(notificacion).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        """Elimina una notificación"""
        notificacion = self.get_object()
        notificacion.delete()
        return Response(
            {'mensaje': 'Notificación eliminada correctamente'},
            status=status.HTTP_204_NO_CONTENT
        )
