from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import serializers

from espacios.models import EspacioFisico, EspacioPermitido
from facultades.models import Facultad
from sedes.models import Seccional, Sede
from .models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = '__all__'


class UsuarioSerializer(serializers.ModelSerializer):
    contrasena = serializers.CharField(write_only=True, required=False, allow_blank=False)
    espacios_permitidos = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        write_only=True,
    )
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
            'espacios_permitidos',
            'es_superusuario',
        ]
        extra_kwargs = {
            'contrasena_hash': {'read_only': True},
        }

    def _sync_espacios_permitidos(self, usuario, espacios_ids):
        if espacios_ids is None:
            return

        ids_unicos = list(dict.fromkeys(espacios_ids))
        espacios = list(EspacioFisico.objects.filter(id__in=ids_unicos).select_related('sede'))
        espacios_map = {espacio.id: espacio for espacio in espacios}
        faltantes = [espacio_id for espacio_id in ids_unicos if espacio_id not in espacios_map]
        if faltantes:
            raise serializers.ValidationError({'espacios_permitidos': f'IDs de espacios no válidos: {faltantes}'})

        EspacioPermitido.objects.filter(usuario=usuario).delete()
        if not ids_unicos:
            return

        nuevos = [EspacioPermitido(usuario=usuario, espacio=espacios_map[espacio_id]) for espacio_id in ids_unicos]
        EspacioPermitido.objects.bulk_create(nuevos)

    def create(self, validated_data):
        espacios_permitidos = validated_data.pop('espacios_permitidos', None)
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            validated_data['contrasena_hash'] = make_password(contrasena)

        with transaction.atomic():
            usuario = super().create(validated_data)
            self._sync_espacios_permitidos(usuario, espacios_permitidos)

        return usuario

    def update(self, instance, validated_data):
        espacios_permitidos = validated_data.pop('espacios_permitidos', None)
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            instance.contrasena_hash = make_password(contrasena)

        with transaction.atomic():
            usuario = super().update(instance, validated_data)
            self._sync_espacios_permitidos(usuario, espacios_permitidos)

        return usuario
