from django.db import transaction
from rest_framework import serializers

from .availability import validar_disponibilidad_prestamo
from .models import PrestamoEspacio, PrestamoEspacioPublico, PrestamoRecurso, TipoActividad
from recursos.models import Recurso


class TipoActividadSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoActividad
        fields = '__all__'


class RecursoPrestamoInputSerializer(serializers.Serializer):
    recurso_id = serializers.PrimaryKeyRelatedField(
        queryset=Recurso.objects.all(),
        source='recurso',
    )
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)
    cantidad = serializers.IntegerField(min_value=1, default=1)


class PrestamoEspacioSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)
    recursos = RecursoPrestamoInputSerializer(
        source='prestamo_recursos',
        many=True,
        required=False,
    )

    class Meta:
        model = PrestamoEspacio
        fields = '__all__'

    def validate(self, attrs):
        instance = self.instance or PrestamoEspacio()
        for field, value in attrs.items():
            if field == 'prestamo_recursos':
                continue
            setattr(instance, field, value)
        validar_disponibilidad_prestamo(instance)
        return attrs

    def validate_recursos(self, recursos):
        recurso_ids = [item['recurso'].id for item in recursos]
        if len(recurso_ids) != len(set(recurso_ids)):
            raise serializers.ValidationError('No se puede solicitar el mismo recurso más de una vez.')
        return recursos

    @staticmethod
    def _guardar_recursos(prestamo, recursos):
        PrestamoRecurso.objects.bulk_create([
            PrestamoRecurso(
                prestamo=prestamo,
                recurso=item['recurso'],
                cantidad=item['cantidad'],
            )
            for item in recursos
        ])

    @transaction.atomic
    def create(self, validated_data):
        recursos = validated_data.pop('prestamo_recursos', [])
        prestamo = super().create(validated_data)
        self._guardar_recursos(prestamo, recursos)
        return prestamo

    @transaction.atomic
    def update(self, instance, validated_data):
        recursos = validated_data.pop('prestamo_recursos', None)
        prestamo = super().update(instance, validated_data)
        if recursos is not None:
            prestamo.prestamo_recursos.all().delete()
            self._guardar_recursos(prestamo, recursos)
        return prestamo


class PrestamoEspacioPublicoSerializer(serializers.ModelSerializer):
    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)
    solicitante_publico_nombre = serializers.CharField(source='nombre_solicitante', read_only=True)
    solicitante_publico_correo = serializers.CharField(source='correo_solicitante', read_only=True)
    solicitante_publico_telefono = serializers.CharField(source='telefono_solicitante', read_only=True)
    solicitante_publico_identificacion = serializers.CharField(source='identificacion_solicitante', read_only=True)

    class Meta:
        model = PrestamoEspacioPublico
        fields = '__all__'

    def validate(self, attrs):
        instance = self.instance or PrestamoEspacioPublico()
        for field, value in attrs.items():
            setattr(instance, field, value)
        validar_disponibilidad_prestamo(instance)
        return attrs


class PrestamoRecursoSerializer(serializers.ModelSerializer):
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)

    class Meta:
        model = PrestamoRecurso
        fields = '__all__'


class PrestamoRecursoInlineSerializer(serializers.ModelSerializer):
    recurso_nombre = serializers.CharField(source='recurso.nombre', read_only=True)

    class Meta:
        model = PrestamoRecurso
        fields = ['recurso_id', 'recurso_nombre', 'cantidad']
