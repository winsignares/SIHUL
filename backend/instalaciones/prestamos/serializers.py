from django.db import transaction
from rest_framework import serializers

from nucleo.auth_helpers import is_authenticated_user
from . import privacidad
from . import reglas
from .availability import validar_disponibilidad_prestamo
from .models import (
    PrestamoEspacio,
    PrestamoEspacioPublico,
    PrestamoRecurso,
    PrestamoRecursoPublico,
    TipoActividad,
)
from instalaciones.recursos.models import Recurso


def _administra_prestamos(request):
    """Si quien consulta administra préstamos (se calcula una vez por petición)."""
    valor = getattr(request, '_administra_prestamos', None)
    if valor is None:
        valor = privacidad.administra_prestamos(getattr(request, 'user', None))
        request._administra_prestamos = valor
    return valor


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


class _ReglasDePrestamoMixin:
    """Validación y guardado comunes a los préstamos internos y públicos.

    Cada serializer indica en `modelo_recurso` dónde se guardan sus recursos.
    """
    modelo_recurso = None

    def _usuario(self):
        request = self.context.get('request')
        return getattr(request, 'user', None) if request else None

    def validate(self, attrs):
        self._estado_original = getattr(self.instance, 'estado', None)
        if self.context.get('request') is not None:
            reglas.proteger_aprobacion(attrs, self.instance, self._usuario())
        instance = self.instance or self.Meta.model()
        for field, value in attrs.items():
            if field == 'prestamo_recursos':
                continue
            setattr(instance, field, value)
        validar_disponibilidad_prestamo(instance)
        return attrs

    def validate_recursos(self, recursos):
        if reglas.recursos_repetidos(recursos):
            raise serializers.ValidationError('No se puede solicitar el mismo recurso más de una vez.')
        return recursos

    def _guardar_recursos(self, prestamo, recursos):
        self.modelo_recurso.objects.bulk_create([
            self.modelo_recurso(
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
        estado_original = getattr(self, '_estado_original', None)
        reglas.reevaluar_estado_si_estaba_aprobado(
            estado_original if estado_original is not None else instance.estado,
            instance.estado, validated_data, self._usuario())
        prestamo = super().update(instance, validated_data)
        if recursos is not None:
            prestamo.prestamo_recursos.all().delete()
            self._guardar_recursos(prestamo, recursos)
        return prestamo


class PrestamoEspacioSerializer(_ReglasDePrestamoMixin, serializers.ModelSerializer):
    modelo_recurso = PrestamoRecurso

    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    usuario_correo = serializers.CharField(source='usuario.correo', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    recursos = RecursoPrestamoInputSerializer(
        source='prestamo_recursos',
        many=True,
        required=False,
    )

    class Meta:
        model = PrestamoEspacio
        fields = '__all__'
        read_only_fields = ['periodo']

    def to_representation(self, instance):
        datos = super().to_representation(instance)
        request = self.context.get('request')
        if request is not None and not _administra_prestamos(request):
            user = getattr(request, 'user', None)
            if not (is_authenticated_user(user) and instance.usuario_id == user.id):
                privacidad.ocultar_campos(datos, privacidad.CAMPOS_PERSONALES_PRIVADO)
        return datos


class PrestamoEspacioPublicoSerializer(_ReglasDePrestamoMixin, serializers.ModelSerializer):
    modelo_recurso = PrestamoRecursoPublico

    espacio_nombre = serializers.CharField(source='espacio.nombre', read_only=True)
    espacio_tipo = serializers.CharField(source='espacio.tipo.nombre', read_only=True)
    administrador_nombre = serializers.CharField(source='administrador.nombre', read_only=True)
    tipo_actividad_nombre = serializers.CharField(source='tipo_actividad.nombre', read_only=True)
    periodo_nombre = serializers.CharField(source='periodo.nombre', read_only=True)
    solicitante_publico_nombre = serializers.CharField(source='nombre_solicitante', read_only=True)
    solicitante_publico_correo = serializers.CharField(source='correo_solicitante', read_only=True)
    solicitante_publico_telefono = serializers.CharField(source='telefono_solicitante', read_only=True)
    solicitante_publico_identificacion = serializers.CharField(source='identificacion_solicitante', read_only=True)
    recursos = RecursoPrestamoInputSerializer(
        source='prestamo_recursos',
        many=True,
        required=False,
    )

    class Meta:
        model = PrestamoEspacioPublico
        fields = '__all__'
        read_only_fields = ['periodo']

    def to_representation(self, instance):
        datos = super().to_representation(instance)
        request = self.context.get('request')
        if request is not None:
            privacidad.ocultar_campos(datos, ('token_publico',))
            if not _administra_prestamos(request) and not privacidad.coincide_solicitante_publico(request, instance):
                privacidad.ocultar_campos(datos, privacidad.CAMPOS_PERSONALES_PUBLICO)
        return datos


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
