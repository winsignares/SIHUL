from rest_framework import serializers

from .models import PrestamoEspacio, PrestamoEspacioPublico, PrestamoRecurso, TipoActividad


class TipoActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoActividad
        fields = '__all__'


class PrestamoEspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrestamoEspacio
        fields = '__all__'


class PrestamoEspacioPublicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrestamoEspacioPublico
        fields = '__all__'


class PrestamoRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrestamoRecurso
        fields = '__all__'
