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
    seccional_nombre = serializers.CharField(source='seccional.ciudad', read_only=True)

    class Meta:
        model = ComponenteRol
        fields = ['id', 'componente', 'rol', 'seccional', 'seccional_nombre', 'permiso']

    def validate(self, attrs):
        attrs = super().validate(attrs)
        rol = attrs.get('rol', getattr(self.instance, 'rol', None))
        seccional = attrs.get('seccional', getattr(self.instance, 'seccional', None))

        if rol and seccional and rol.seccional_id and rol.seccional_id != seccional.id:
            raise serializers.ValidationError({'seccional': 'La seccional del permiso debe coincidir con la seccional del rol.'})

        return attrs


class ComponenteUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponenteUsuario
        fields = '__all__'
