"""
Serializers para las notificaciones
"""
from rest_framework import serializers
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    
    tipo_notificacion_display = serializers.CharField(
        source='get_tipo_notificacion_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    
    class Meta:
        model = Notificacion
        fields = [
            'id',
            'id_usuario',
            'tipo_notificacion',
            'tipo_notificacion_display',
            'mensaje',
            'id_relacion',
            'tabla_relacion',
            'es_leida',
            'fecha_lectura',
            'prioridad',
            'prioridad_display',
            'fecha_creacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_lectura']


class NotificacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear notificaciones"""
    
    class Meta:
        model = Notificacion
        fields = [
            'id_usuario',
            'tipo_notificacion',
            'mensaje',
            'id_relacion',
            'tabla_relacion',
            'prioridad'
        ]


class NotificacionUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar notificaciones"""
    
    class Meta:
        model = Notificacion
        fields = ['es_leida', 'prioridad']


class NotificacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar notificaciones"""
    
    tipo_notificacion_display = serializers.CharField(
        source='get_tipo_notificacion_display',
        read_only=True
    )
    prioridad_display = serializers.CharField(
        source='get_prioridad_display',
        read_only=True
    )
    
    class Meta:
        model = Notificacion
        fields = [
            'id',
            'tipo_notificacion',
            'tipo_notificacion_display',
            'mensaje',
            'es_leida',
            'prioridad',
            'prioridad_display',
            'fecha_creacion'
        ]
