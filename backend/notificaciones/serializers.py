from rest_framework import serializers
from django.core.exceptions import ValidationError

from mysite.xss_protection import NOTIFICACION_SCHEMA, sanitize_dict
from .models import Notificacion


class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = '__all__'

    def validate(self, data):
        try:
            sanitized_data = sanitize_dict(data, NOTIFICACION_SCHEMA)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data
