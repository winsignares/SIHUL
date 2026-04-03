from rest_framework import serializers

from .models import EspacioRecurso, Recurso


class RecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recurso
        fields = '__all__'


class EspacioRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspacioRecurso
        fields = '__all__'
