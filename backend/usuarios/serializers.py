from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import serializers

from espacios.models import EspacioFisico, EspacioPermitido
from facultades.models import Facultad
from sedes.models import Seccional, Sede
from .models import Rol, Usuario
from mysite.auth_helpers import get_user_seccional_id, is_admin_global


class RolSerializer(serializers.ModelSerializer):
    seccional_nombre = serializers.CharField(source='seccional.ciudad', read_only=True)

    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'supervisa_espacios', 'seccional', 'seccional_nombre']


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
            'origen',
        ]
        read_only_fields = ['origen']

    def _sync_espacios_permitidos(self, usuario, espacios_ids):
        if espacios_ids is None:
            return

        ids_unicos = list(dict.fromkeys(espacios_ids))
        espacios = list(EspacioFisico.objects.filter(id__in=ids_unicos).select_related('sede', 'sede__seccional'))
        espacios_map = {espacio.id: espacio for espacio in espacios}
        faltantes = [espacio_id for espacio_id in ids_unicos if espacio_id not in espacios_map]
        if faltantes:
            raise serializers.ValidationError({'espacios_permitidos': f'IDs de espacios no válidos: {faltantes}'})

        usuario_sede_id = getattr(usuario, 'sede_id', None)
        if ids_unicos and not usuario_sede_id:
            raise serializers.ValidationError({
                'espacios_permitidos': 'El usuario debe tener una sede para asignarle espacios.'
            })

        fuera_sede = [
            espacio_id
            for espacio_id in ids_unicos
            if getattr(espacios_map[espacio_id], 'sede_id', None) != usuario_sede_id
        ]
        if fuera_sede:
            raise serializers.ValidationError({
                'espacios_permitidos': f'Los espacios no pertenecen a la sede del usuario: {fuera_sede}'
            })

        EspacioPermitido.objects.filter(usuario=usuario).delete()
        if not ids_unicos:
            return

        nuevos = [EspacioPermitido(usuario=usuario, espacio=espacios_map[espacio_id]) for espacio_id in ids_unicos]
        EspacioPermitido.objects.bulk_create(nuevos)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        current_user = getattr(request, 'user', None) if request else None
        target_sede = attrs.get('sede', getattr(self.instance, 'sede', None))
        target_rol = attrs.get('rol', getattr(self.instance, 'rol', None))

        if current_user and getattr(current_user, 'is_authenticated', False) and not is_admin_global(current_user):
            current_seccional_id = get_user_seccional_id(current_user)
            if not current_seccional_id:
                raise serializers.ValidationError('El usuario autenticado no tiene una seccional asignada.')

            if target_sede and target_sede.seccional_id != current_seccional_id:
                raise serializers.ValidationError({'sede': 'La sede seleccionada no pertenece a la seccional del usuario autenticado.'})

        target_seccional_id = getattr(target_sede, 'seccional_id', None)
        rol_seccional_id = getattr(target_rol, 'seccional_id', None)
        if target_seccional_id and rol_seccional_id and rol_seccional_id != target_seccional_id:
            raise serializers.ValidationError({'rol': 'El rol seleccionado no pertenece a la seccional de la sede del usuario.'})

        return attrs

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
            validated_data['contrasena_hash'] = make_password(contrasena)

        with transaction.atomic():
            usuario = super().update(instance, validated_data)
            self._sync_espacios_permitidos(usuario, espacios_permitidos)

        return usuario


class UsuarioMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo']
