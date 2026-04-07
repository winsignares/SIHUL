from rest_framework import serializers

from .models import EspacioFisico, EspacioPermitido, TipoEspacio


class TipoEspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEspacio
        fields = '__all__'


class EspacioFisicoSerializer(serializers.ModelSerializer):
    sede_id = serializers.IntegerField(source='sede.id', read_only=True)
    tipo_id = serializers.IntegerField(source='tipo.id', read_only=True)
    tipo_espacio = TipoEspacioSerializer(source='tipo', read_only=True)

    class Meta:
        model = EspacioFisico
        fields = '__all__'


class EspacioPermitidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspacioPermitido
        fields = '__all__'
