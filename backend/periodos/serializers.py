from rest_framework import serializers

from .models import PeriodoAcademico


class PeriodoAcademicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PeriodoAcademico
        fields = '__all__'
