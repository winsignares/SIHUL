from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import serializers

from espacios import alcance
from espacios.models import EspacioFisico, EspacioPermitido, TipoEspacio
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
    # Asignación por tipo: los tipos de espacio que gestiona el supervisor (ver espacios/alcance.py).
    # Lista vacía = asignación individual. Se lee en to_representation.
    tipos_espacio_permitidos = serializers.ListField(
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
            'tipos_espacio_permitidos',
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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['tipos_espacio_permitidos'] = sorted(t.tipo_id for t in instance.tipos_espacio_permitidos.all())
        return data

    def _sync_tipos_espacio(self, usuario, tipos_ids, espacios_ids):
        """
        Con tipos, los espacios del usuario pasan a ser los de esos tipos en su sede (también los
        que se creen luego). Sin tipos pero con espacios (asignación individual), se quitan los
        tipos para que los espacios sueltos no se reemplacen. Sin ninguno, solo se actualiza.
        """
        if tipos_ids is not None:
            existentes = set(TipoEspacio.objects.filter(id__in=tipos_ids).values_list('id', flat=True))
            invalidos = [i for i in dict.fromkeys(tipos_ids) if i not in existentes]
            if invalidos:
                raise serializers.ValidationError({'tipos_espacio_permitidos': f'IDs de tipos no válidos: {invalidos}'})
            if tipos_ids and not getattr(usuario, 'sede_id', None):
                raise serializers.ValidationError({
                    'tipos_espacio_permitidos': 'El usuario debe tener una sede para asignarle tipos de espacio.'
                })
            alcance.asignar_tipos(usuario, tipos_ids)
        elif espacios_ids is not None:
            alcance.asignar_tipos(usuario, [])
        else:
            alcance.sincronizar_por_tipos(usuario)  # p. ej. cambió su sede

    def create(self, validated_data):
        espacios_permitidos = validated_data.pop('espacios_permitidos', None)
        tipos_permitidos = validated_data.pop('tipos_espacio_permitidos', None)
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            validated_data['contrasena_hash'] = make_password(contrasena)

        with transaction.atomic():
            usuario = super().create(validated_data)
            self._sync_espacios_permitidos(usuario, espacios_permitidos)
            self._sync_tipos_espacio(usuario, tipos_permitidos, espacios_permitidos)

        return usuario

    def update(self, instance, validated_data):
        espacios_permitidos = validated_data.pop('espacios_permitidos', None)
        tipos_permitidos = validated_data.pop('tipos_espacio_permitidos', None)
        contrasena = validated_data.pop('contrasena', None)
        if contrasena:
            validated_data['contrasena_hash'] = make_password(contrasena)

        with transaction.atomic():
            usuario = super().update(instance, validated_data)
            self._sync_espacios_permitidos(usuario, espacios_permitidos)
            self._sync_tipos_espacio(usuario, tipos_permitidos, espacios_permitidos)

        return usuario


class UsuarioMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo']
