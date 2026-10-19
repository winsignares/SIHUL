from rest_framework import serializers
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from mysite.xss_protection import sanitize_dict, PROVEEDOR_SCHEMA, FACTURA_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA
import os

from .models import Ciudad, DepartamentoGeografico, Pais, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True, allow_null=True)
    usuario_correo = serializers.EmailField(source='usuario.correo', read_only=True, allow_null=True)

    class Meta:
        model = Proveedor
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion', 'numero_facturas_procesadas', 'total_pagado_historico']
    
    def validate(self, data):
        # Sanitizar y validar inputs contra XSS
        # En PATCH (partial=True) solo validar campos presentes en el payload
        try:
            is_partial = self.partial
            schema = {k: v for k, v in PROVEEDOR_SCHEMA.items() if k in data} if is_partial else PROVEEDOR_SCHEMA
            sanitized_data = sanitize_dict(data, schema)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data
class PaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pais
        fields = ['id', 'nombre', 'codigo_iso', 'activo']
class DepartamentoGeograficoSerializer(serializers.ModelSerializer):
    pais = PaisSerializer(read_only=True)
    pais_id = serializers.IntegerField(source='pais.id', read_only=True)

    class Meta:
        model = DepartamentoGeografico
        fields = ['id', 'nombre', 'codigo', 'activo', 'pais', 'pais_id']
class CiudadSerializer(serializers.ModelSerializer):
    departamento = DepartamentoGeograficoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(source='departamento.id', read_only=True)
    pais_id = serializers.IntegerField(source='departamento.pais.id', read_only=True)

    class Meta:
        model = Ciudad
        fields = ['id', 'nombre', 'activo', 'departamento', 'departamento_id', 'pais_id']
