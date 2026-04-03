from rest_framework import serializers

from .models import Facultad


class FacultadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Facultad
        fields = '__all__'
