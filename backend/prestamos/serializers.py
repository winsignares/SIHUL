from rest_framework import serializers

from .availability import validar_disponibilidad_prestamo
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
    recursos = serializers.SerializerMethodField()

    class Meta:
        model = PrestamoEspacio
        fields = '__all__'

    def get_recursos(self, obj):
        return [
            {
                'recurso_id': pr.recurso_id,
                'recurso_nombre': pr.recurso.nombre if pr.recurso else '',
                'cantidad': pr.cantidad,
            }
            for pr in obj.prestamo_recursos.all()
        ]

    def validate(self, attrs):
        instance = self.instance or PrestamoEspacio()
        for field, value in attrs.items():
            setattr(instance, field, value)
        validar_disponibilidad_prestamo(instance)
        return attrs


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

    def validate(self, attrs):
        instance = self.instance or PrestamoEspacioPublico()
        for field, value in attrs.items():
            setattr(instance, field, value)
        validar_disponibilidad_prestamo(instance)
        return attrs


class PrestamoRecursoSerializer(serializers.ModelSerializer):
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)

    class Meta:
        model = PrestamoRecurso
        fields = '__all__'


class PrestamoRecursoInlineSerializer(serializers.ModelSerializer):
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)

    class Meta:
        model = PrestamoRecurso
        fields = ['recurso_id', 'recurso_nombre', 'cantidad']
