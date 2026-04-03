from django.contrib.auth.hashers import make_password
from rest_framework import serializers

from facultades.models import Facultad
from sedes.models import Seccional, Sede
from .models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, required=False, allow_blank=False)
    seccional = serializers.PrimaryKeyRelatedField(queryset=Seccional.objects.all(), required=False, allow_null=True)
    sede = serializers.PrimaryKeyRelatedField(queryset=Sede.objects.all(), required=False, allow_null=True)
    facultad = serializers.PrimaryKeyRelatedField(queryset=Facultad.objects.all(), required=False, allow_null=True)
    rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Usuario
        fields = [
            'id',
            'nombre',
            'correo',
            'contrasena',
            'contrasena_hash',
            'rol',
            'activo',
            'facultad',
            'sede',
            'seccional',
            'es_superusuario',
        ]
        extra_kwargs = {
            'contrasena_hash': {'read_only': True},
        }

    def create(self, validated_data):
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            validated_data['contrasena_hash'] = make_password(contrasena)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            instance.contrasena_hash = make_password(contrasena)
        return super().update(instance, validated_data)
