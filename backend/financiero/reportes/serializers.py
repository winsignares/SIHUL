from rest_framework import serializers
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from config.xss_protection import sanitize_dict, PROVEEDOR_SCHEMA, FACTURA_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA
import os

from .models import ReporteGenerado


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReporteGenerado
        fields = '__all__'
        read_only_fields = ['fecha_generacion']
