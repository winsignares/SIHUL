from rest_framework import serializers
from django.core.exceptions import ValidationError

from mysite.xss_protection import COMPONENTE_SCHEMA, sanitize_dict
from .models import Componente, ComponenteRol, ComponenteUsuario


class ComponenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Componente
        fields = '__all__'

    def validate(self, data):
        try:
            sanitized_data = sanitize_dict(data, COMPONENTE_SCHEMA)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data


class ComponenteRolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteRol
        fields = '__all__'


class ComponenteUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteUsuario
        fields = '__all__'
