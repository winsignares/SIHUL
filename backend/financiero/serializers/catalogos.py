"""Serializadores de proveedores, catálogos geográficos y contables, parámetros, reportes generados y bancos."""
from rest_framework import serializers
from .. import models
from identidad.usuarios.serializers import UsuarioSerializer
from django.core.exceptions import ValidationError
from nucleo.xss_protection import sanitize_dict, PROVEEDOR_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA


class ProveedorSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True, allow_null=True)
    usuario_correo = serializers.EmailField(source='usuario.correo', read_only=True, allow_null=True)

    class Meta:
        model = models.Proveedor
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
        model = models.Pais
        fields = ['id', 'nombre', 'codigo_iso', 'activo']


class DepartamentoGeograficoSerializer(serializers.ModelSerializer):
    pais = PaisSerializer(read_only=True)
    pais_id = serializers.IntegerField(source='pais.id', read_only=True)

    class Meta:
        model = models.DepartamentoGeografico
        fields = ['id', 'nombre', 'codigo', 'activo', 'pais', 'pais_id']


class CiudadSerializer(serializers.ModelSerializer):
    departamento = DepartamentoGeograficoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(source='departamento.id', read_only=True)
    pais_id = serializers.IntegerField(source='departamento.pais.id', read_only=True)

    class Meta:
        model = models.Ciudad
        fields = ['id', 'nombre', 'activo', 'departamento', 'departamento_id', 'pais_id']


class DepartamentoSerializer(serializers.ModelSerializer):
    responsable = UsuarioSerializer(read_only=True)
    responsable_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = models.Departamento
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
        model = models.CuentaContable
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
        model = models.CentroCosto
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


class ParametroSLASerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ParametroSLA
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']


class ParametrosFinancieroSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ParametrosFinanciero
        fields = '__all__'
        read_only_fields = ['fecha_modificacion']


class ReporteGeneradoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ReporteGenerado
        fields = '__all__'
        read_only_fields = ['fecha_generacion']


# ============================================================
# SERIALIZERS ANIDADOS Y COMPLEJOS
# ============================================================



class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Banco
        fields = ['id', 'nombre', 'descripcion', 'codigo_bancario', 'activo', 'fecha_creacion', 'fecha_modificacion']
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']


class TipoCuentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.TipoCuenta
        fields = ['id', 'nombre', 'descripcion', 'activo', 'fecha_creacion', 'fecha_modificacion']
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']
