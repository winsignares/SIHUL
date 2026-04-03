from rest_framework import serializers

from .models import Agente, Conversacion, PreguntaSugerida


class AgenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agente
        fields = '__all__'


class PreguntaSugeridaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaSugerida
        fields = '__all__'


class ConversacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversacion
        fields = '__all__'
