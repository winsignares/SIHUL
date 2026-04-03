from rest_framework import serializers

from .models import Horario, HorarioEstudiante, HorarioFusionado, SolicitudEspacio


class HorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Horario
        fields = '__all__'


class HorarioFusionadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioFusionado
        fields = '__all__'


class HorarioEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = HorarioEstudiante
        fields = '__all__'


class SolicitudEspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudEspacio
        fields = '__all__'
