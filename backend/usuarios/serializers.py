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
            'rol',
            'activo',
            'facultad',
            'sede',
            'seccional',
            'espacios_permitidos',
            'es_superusuario',
        ]

    def _sync_espacios_permitidos(self, usuario, espacios_ids):
        if espacios_ids is None:
            return

        ids_unicos = list(dict.fromkeys(espacios_ids))
        espacios = list(EspacioFisico.objects.filter(id__in=ids_unicos).select_related('sede', 'sede__seccional'))
        espacios_map = {espacio.id: espacio for espacio in espacios}
        faltantes = [espacio_id for espacio_id in ids_unicos if espacio_id not in espacios_map]
        if faltantes:
            raise serializers.ValidationError({'espacios_permitidos': f'IDs de espacios no válidos: {faltantes}'})

        usuario_sede = getattr(usuario, 'sede', None)
        usuario_seccional_id = getattr(usuario_sede, 'seccional_id', None)
        if ids_unicos and not usuario_seccional_id:
            raise serializers.ValidationError({
                'espacios_permitidos': 'El usuario debe tener una sede con seccional para asignarle espacios.'
            })

        fuera_seccional = [
            espacio_id
            for espacio_id in ids_unicos
            if getattr(getattr(espacios_map[espacio_id], 'sede', None), 'seccional_id', None) != usuario_seccional_id
        ]
        if fuera_seccional:
            raise serializers.ValidationError({
                'espacios_permitidos': f'Los espacios no pertenecen a la seccional del usuario: {fuera_seccional}'
            })

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


class UsuarioMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo']
