from rest_framework import serializers

from .models import Componente, ComponenteRol, ComponenteUsuario


class ComponenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Componente
        fields = '__all__'


class ComponenteRolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteRol
        fields = '__all__'


class ComponenteUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteUsuario
        fields = '__all__'
