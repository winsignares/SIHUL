from django.db.models import Count
from rest_framework import serializers

from .admin_views import PuedeGestionarChatbots
from .models import Agente, Conversacion, PreguntaSugerida


class AgenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agente
        fields = '__all__'

    def validate_max_documentos(self, value):
        # El límite se aplica por seccional: no puede quedar por debajo de los documentos que
        # el agente ya tiene en la seccional que más tenga (no se borra nada automáticamente).
        if value is None or self.instance is None:
            return value
        mayor = (
            self.instance.documentos.values('sede').annotate(n=Count('id')).order_by('-n').first()
        )
        if mayor and value < mayor['n']:
            raise serializers.ValidationError(
                f"No puedes bajar el límite a {value}: este chatbot ya tiene {mayor['n']} documentos "
                f"en la seccional {mayor['sede']}. Elimina documentos antes de reducirlo."
            )
        return value

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
