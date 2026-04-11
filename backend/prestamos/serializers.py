from rest_framework import serializers

from .models import PrestamoEspacio, PrestamoEspacioPublico, PrestamoRecurso, TipoActividad


class TipoActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoActividad
        fields = '__all__'


class PrestamoEspacioSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)

    class Meta:
        model = PrestamoEspacio
        fields = '__all__'


class PrestamoEspacioPublicoSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)
    solicitante_publico_nombre = serializers.CharField(source='nombre_solicitante', read_only=True)
    solicitante_publico_correo = serializers.CharField(source='correo_solicitante', read_only=True)
    solicitante_publico_telefono = serializers.CharField(source='telefono_solicitante', read_only=True)
    solicitante_publico_identificacion = serializers.CharField(source='identificacion_solicitante', read_only=True)

    class Meta:
        model = PrestamoEspacioPublico
        fields = '__all__'


class PrestamoRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrestamoRecurso
        fields = '__all__'
