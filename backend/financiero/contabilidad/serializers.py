from rest_framework import serializers
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from mysite.xss_protection import sanitize_dict, PROVEEDOR_SCHEMA, FACTURA_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA
import os

from .models import Banco, CentroCosto, CuentaContable, Departamento, TipoCuenta
from unispace.usuarios.serializers import UsuarioSerializer


class DepartamentoSerializer(serializers.ModelSerializer):
    responsable = UsuarioSerializer(read_only=True)
    responsable_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Departamento
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']
    
    def validate(self, data):
        try:
            is_partial = self.partial
            schema = {k: v for k, v in DEPARTAMENTO_SCHEMA.items() if k in data} if is_partial else DEPARTAMENTO_SCHEMA
            sanitized_data = sanitize_dict(data, schema)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data
class CuentaContableSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaContable
        fields = '__all__'
        read_only_fields = ['fecha_creacion']
    
    def validate(self, data):
        try:
            is_partial = self.partial
            schema = {k: v for k, v in CUENTA_CONTABLE_SCHEMA.items() if k in data} if is_partial else CUENTA_CONTABLE_SCHEMA
            sanitized_data = sanitize_dict(data, schema)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data
class CentroCostoSerializer(serializers.ModelSerializer):
    porcentaje_ejecucion_display = serializers.ReadOnlyField(source='porcentaje_ejecucion')

    class Meta:
        model = CentroCosto
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']
    
    def validate(self, data):
        try:
            is_partial = self.partial
            schema = {k: v for k, v in CENTRO_COSTO_SCHEMA.items() if k in data} if is_partial else CENTRO_COSTO_SCHEMA
            sanitized_data = sanitize_dict(data, schema)
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        return data
class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = ['id', 'nombre', 'descripcion', 'codigo_bancario', 'activo', 'fecha_creacion', 'fecha_modificacion']
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']
class TipoCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoCuenta
        fields = ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion', 'fecha_modificacion']
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']
