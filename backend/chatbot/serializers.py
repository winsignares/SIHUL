from rest_framework import serializers

from .admin_views import PuedeGestionarChatbots
from .models import Agente, Conversacion, PreguntaSugerida


class AgenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agente
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Las instrucciones adicionales son configuración interna del asistente: solo las
        # ve quien puede gestionarlo.
        request = self.context.get('request')
        if not (request and PuedeGestionarChatbots().has_permission(request, None)):
            data.pop('instrucciones_adicionales', None)
        return data


class PreguntaSugeridaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreguntaSugerida
        fields = '__all__'


class ConversacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversacion
        fields = '__all__'
