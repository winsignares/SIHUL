from rest_framework import serializers

from .models import Seccional, Sede


class SeccionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seccional
        fields = '__all__'


class SedeSerializer(serializers.ModelSerializer):
    seccional_nombre = serializers.CharField(source='seccional.nombre', read_only=True)
    seccional_ciudad = serializers.CharField(source='seccional.ciudad', read_only=True)

    class Meta:
        model = Sede
        fields = '__all__'
