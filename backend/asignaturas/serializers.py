from rest_framework import serializers

from .models import Asignatura, AsignaturaPrograma


class AsignaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asignatura
        fields = '__all__'


class AsignaturaProgramaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AsignaturaPrograma
        fields = '__all__'
