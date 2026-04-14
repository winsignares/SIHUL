from rest_framework import serializers
from . import models
from usuarios.serializers import UsuarioSerializer


# ============================================================
# SERIALIZERS SIMPLES
# ============================================================

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Proveedor
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion', 'numero_facturas_procesadas', 'total_pagado_historico']


class DepartamentoSerializer(serializers.ModelSerializer):
    responsable = UsuarioSerializer(read_only=True)
    responsable_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = models.Departamento
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']


class CuentaContableSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CuentaContable
        fields = '__all__'
        read_only_fields = ['fecha_creacion']


class CentroCostoSerializer(serializers.ModelSerializer):
    porcentaje_ejecucion_display = serializers.ReadOnlyField(source='porcentaje_ejecucion')

    class Meta:
        model = models.CentroCosto
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion']


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

class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    cargado_por = UsuarioSerializer(read_only=True)
    cargado_por_id = serializers.IntegerField(write_only=True, required=False)
    verificado_por = UsuarioSerializer(read_only=True)

    class Meta:
        model = models.DocumentoAdjunto
        fields = '__all__'
        read_only_fields = ['fecha_carga']


class HistorialFacturaSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = models.HistorialFactura
        fields = '__all__'
        read_only_fields = ['fecha_accion']


class ComentarioFacturaSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    usuario_id = serializers.IntegerField(write_only=True)
    respuestas = serializers.SerializerMethodField()

    class Meta:
        model = models.ComentarioFactura
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_edicion', 'editado']

    def get_respuestas(self, obj):
        respuestas = obj.respuestas.all()
        return ComentarioFacturaSerializer(respuestas, many=True).data


class RechazoDevolacionSerializer(serializers.ModelSerializer):
    usuario_rechaza = UsuarioSerializer(read_only=True)
    usuario_corrige = UsuarioSerializer(read_only=True)

    class Meta:
        model = models.RechazoDevolucion
        fields = '__all__'
        read_only_fields = ['fecha_rechazo']


# ============================================================
# SERIALIZER FACTURA (COMPLEJO)
# ============================================================

class FacturaListSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    indicador_riesgo_display = serializers.CharField(source='get_indicador_riesgo_display', read_only=True)
    valor_neto_pagar = serializers.ReadOnlyField()
    dias_transcurridos = serializers.ReadOnlyField()
    monto_alto = serializers.ReadOnlyField()

    class Meta:
        model = models.Factura
        fields = [
            'id', 'numero_factura', 'numero_radicado', 'proveedor', 'valor_total',
            'valor_neto_pagar', 'estado', 'estado_display', 'etapa_actual',
            'fecha_recepcion', 'dias_transcurridos', 'indicador_riesgo',
            'indicador_riesgo_display', 'monto_alto', 'sla_cumplido'
        ]


class FacturaDetailSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    proveedor_id = serializers.IntegerField(write_only=True)
    departamento = DepartamentoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(write_only=True)
    cuenta_contable = CuentaContableSerializer(read_only=True)
    cuenta_contable_id = serializers.IntegerField(write_only=True, required=False)
    centro_costo = CentroCostoSerializer(read_only=True)
    centro_costo_id = serializers.IntegerField(write_only=True, required=False)
    creado_por = UsuarioSerializer(read_only=True)
    usuario_responsable = UsuarioSerializer(read_only=True)
    usuario_responsable_id = serializers.IntegerField(write_only=True, required=False)
    documentos = DocumentoAdjuntoSerializer(read_only=True, many=True)
    historial = HistorialFacturaSerializer(read_only=True, many=True)
    comentarios = ComentarioFacturaSerializer(read_only=True, many=True)
    valor_neto_pagar = serializers.ReadOnlyField()
    dias_transcurridos = serializers.ReadOnlyField()
    monto_alto = serializers.ReadOnlyField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    indicador_riesgo_display = serializers.CharField(source='get_indicador_riesgo_display', read_only=True)

    class Meta:
        model = models.Factura
        fields = '__all__'
        read_only_fields = ['fecha_creacion', 'fecha_modificacion', 'valor_neto_pagar', 'dias_transcurridos']


class FacturaCreateSerializer(serializers.ModelSerializer):
    proveedor_id = serializers.IntegerField()
    departamento_id = serializers.IntegerField()
    cuenta_contable_id = serializers.IntegerField(required=False, allow_null=True)
    centro_costo_id = serializers.IntegerField(required=False, allow_null=True)
    usuario_responsable_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = models.Factura
        fields = [
            'numero_factura', 'tipo_documento', 'descripcion', 'observaciones',
            'proveedor_id', 'departamento_id', 'cuenta_contable_id', 'centro_costo_id',
            'valor_subtotal', 'valor_iva', 'valor_retencion_renta', 'valor_retencion_iva',
            'valor_retencion_ica', 'valor_total', 'fecha_factura', 'fecha_recepcion',
            'cuenta_bancaria_proveedor', 'usuario_responsable_id', 'urgente'
        ]

    def validate(self, data):
        if data['valor_subtotal'] != (data['valor_total'] - data['valor_iva']):
            raise serializers.ValidationError("El subtotal no coincide con la suma de valor total y IVA")
        return data

    def create(self, validated_data):
        validated_data['creado_por_id'] = self.context['request'].user.id
        return super().create(validated_data)
