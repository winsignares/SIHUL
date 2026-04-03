from rest_framework import serializers

from .models import Componente, ComponenteRol


class ComponenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Componente
        fields = '__all__'


class ComponenteRolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteRol
        fields = '__all__'
