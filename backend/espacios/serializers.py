from rest_framework import serializers

from .models import EspacioFisico, EspacioPermitido, TipoEspacio


class TipoEspacioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEspacio
        fields = '__all__'


class EspacioFisicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspacioFisico
        fields = '__all__'


class EspacioPermitidoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EspacioPermitido
        fields = '__all__'
