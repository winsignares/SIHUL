"""Serializadores de la factura: lista, detalle, creación y sus ítems."""
from rest_framework import serializers
from .. import models
from ..sla import obtener_parametro_por_etapa
from identidad.usuarios.serializers import UsuarioSerializer
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from nucleo.xss_protection import sanitize_dict, FACTURA_SCHEMA
from ..documentos_sensibles import documento_es_sensible as _documento_es_sensible
from ..documentos_sensibles import usuario_puede_ver_documentos_sensibles as _usuario_puede_ver_documentos_sensibles
from .documentos import DocumentoAdjuntoSerializer
from .historial import HistorialFacturaSerializer, ComentarioFacturaSerializer
from .catalogos import ProveedorSerializer, DepartamentoSerializer, CuentaContableSerializer, CentroCostoSerializer


class ItemFacturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.ItemFactura
        fields = ['id', 'descripcion', 'cantidad', 'valor_unitario', 'porcentaje_iva', 'valor_subtotal', 'valor_iva', 'valor_total', 'orden']


# ============================================================
# SERIALIZER FACTURA (COMPLEJO)
# ============================================================

class FacturaListSerializer(serializers.ModelSerializer):
    proveedor = ProveedorSerializer(read_only=True)
    departamento = DepartamentoSerializer(read_only=True)
    cuenta_contable = CuentaContableSerializer(read_only=True)
    centro_costo = CentroCostoSerializer(read_only=True)
    departamento_id = serializers.IntegerField(source='departamento.id', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    indicador_riesgo_display = serializers.CharField(source='get_indicador_riesgo_display', read_only=True)
    valor_neto_pagar = serializers.ReadOnlyField()
    dias_transcurridos = serializers.ReadOnlyField()
    monto_alto = serializers.ReadOnlyField()
    sla_objetivo_dias = serializers.SerializerMethodField()
    items = ItemFacturaSerializer(read_only=True, many=True)

    class Meta:
        model = models.Factura
        fields = [
            'id', 'numero_factura', 'numero_radicado', 'proveedor', 'departamento', 'departamento_id', 'valor_total',
            'cuenta_contable', 'centro_costo', 'numero_proceso_pago', 'numero_confirmacion', 'numero_transaccion', 'numero_comprobante',
            'numero_operacion_contable', 'consecutivo_operacion', 'archivo_plano_generado',
            'valor_neto_pagar', 'estado', 'estado_display', 'etapa_actual', 'fecha_inicio_etapa',
            'tipo_documento', 'observaciones', 'identificacion_factura', 'fecha_factura', 'fecha_recepcion',
            'fecha_radicacion', 'fecha_causacion', 'fecha_alistamiento', 'fecha_aprobacion_auditoria',
            'fecha_revision_direccion', 'fecha_autorizacion', 'fecha_pago_aplicado', 'fecha_comprobante',
            'dias_transcurridos', 'indicador_riesgo',
            'indicador_riesgo_display', 'monto_alto', 'sla_cumplido', 'sla_objetivo_dias', 'items'
        ]

    def get_sla_objetivo_dias(self, obj):
        parametro = obtener_parametro_por_etapa(
            getattr(obj, 'etapa_actual', None),
            parametros_map=self.context.get('parametros_map'),
        )
        if not parametro or not parametro.activo:
            return None
        return int(parametro.dias_maximos or 0)


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
    documentos = serializers.SerializerMethodField()
    historial = HistorialFacturaSerializer(read_only=True, many=True)
    comentarios = ComentarioFacturaSerializer(read_only=True, many=True)
    items = ItemFacturaSerializer(read_only=True, many=True)
    valor_neto_pagar = serializers.ReadOnlyField()
    dias_transcurridos = serializers.ReadOnlyField()
    monto_alto = serializers.ReadOnlyField()
    sla_objetivo_dias = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    indicador_riesgo_display = serializers.CharField(source='get_indicador_riesgo_display', read_only=True)

    class Meta:
        model = models.Factura
        fields = '__all__'
        read_only_fields = [
            'fecha_creacion', 'fecha_modificacion', 'valor_neto_pagar',
            'dias_transcurridos', 'ciclo_documental_actual',
        ]

    def get_sla_objetivo_dias(self, obj):
        parametro = obtener_parametro_por_etapa(
            getattr(obj, 'etapa_actual', None),
            parametros_map=self.context.get('parametros_map'),
        )
        if not parametro or not parametro.activo:
            return None
        return int(parametro.dias_maximos or 0)

    def get_documentos(self, obj):
        documentos = (
            obj.documentos
            .filter(ciclo_documental=getattr(obj, 'ciclo_documental_actual', 1))
            .order_by('fecha_carga', 'id')
        )
        request = self.context.get('request')
        if request is not None and not _usuario_puede_ver_documentos_sensibles(request.user):
            documentos = [
                documento
                for documento in documentos
                if not _documento_es_sensible(documento)
            ]
        return DocumentoAdjuntoSerializer(documentos, many=True, context=self.context).data


class FacturaCreateSerializer(serializers.ModelSerializer):
    numero_factura = serializers.CharField(required=False, allow_blank=True)
    proveedor_id = serializers.IntegerField()
    departamento_id = serializers.IntegerField()
    cuenta_contable_id = serializers.IntegerField(required=False, allow_null=True)
    centro_costo_id = serializers.IntegerField(required=False, allow_null=True)
    usuario_responsable_id = serializers.IntegerField(required=False, allow_null=True)
    items = ItemFacturaSerializer(many=True, required=True, allow_empty=False, write_only=True)

    class Meta:
        model = models.Factura
        fields = [
            'id', 'numero_factura', 'tipo_documento', 'observaciones',
            'identificacion_factura',
            'proveedor_id', 'departamento_id', 'cuenta_contable_id', 'centro_costo_id',
            'valor_subtotal', 'valor_iva', 'valor_retencion_renta', 'valor_retencion_iva',
            'valor_retencion_ica', 'valor_total', 'fecha_factura', 'fecha_recepcion',
            'cuenta_bancaria_proveedor', 'usuario_responsable_id', 'urgente', 'items'
        ]

    def validate(self, data):
        # Sanitizar y validar inputs contra XSS
        try:
            sanitized_data = sanitize_dict(data, FACTURA_SCHEMA)
            # Actualizar data con valores sanitizados
            data.update(sanitized_data)
        except ValidationError as e:
            raise serializers.ValidationError(f"Validación fallida: {str(e)}")
        
        subtotal = Decimal(str(data.get('valor_subtotal', 0)))
        total = Decimal(str(data.get('valor_total', 0)))
        iva = Decimal(str(data.get('valor_iva', 0)))
        expected_subtotal = total - iva

        # Tolerancia de 2 centavos para evitar falsos negativos por redondeo de frontend.
        if abs(subtotal - expected_subtotal) > Decimal('0.02'):
            raise serializers.ValidationError("El subtotal no coincide con la suma de valor total y IVA")
        return data

    def _generate_numero_factura(self):
        year = timezone.now().year
        prefix = f"FAC-{year}-"
        last_number = (
            models.Factura.objects
            .filter(numero_factura__startswith=prefix)
            .order_by('-numero_factura')
            .values_list('numero_factura', flat=True)
            .first()
        )

        next_seq = 1
        if last_number:
            try:
                next_seq = int(str(last_number).split('-')[-1]) + 1
            except (TypeError, ValueError):
                next_seq = 1

        return f"{prefix}{next_seq:04d}"

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        # creado_por puede venir ya seteado por perform_create como objeto; si no, lo asignamos por id
        if 'creado_por' not in validated_data:
            validated_data['creado_por_id'] = self.context['request'].user.id
        provided_number = str(validated_data.get('numero_factura') or '').strip()

        factura = None
        for _ in range(5):
            if not provided_number:
                validated_data['numero_factura'] = self._generate_numero_factura()

            try:
                factura = super().create(validated_data)
                break
            except IntegrityError:
                if provided_number:
                    raise serializers.ValidationError("El numero de factura ya existe")
                validated_data['numero_factura'] = ''

        if factura is None:
            raise serializers.ValidationError("No fue posible generar un numero de factura unico")

        for orden, item_data in enumerate(items_data, start=1):
            item_data.pop('orden', None)
            models.ItemFactura.objects.create(factura=factura, orden=orden, **item_data)

        return factura


# ============================================================
# SERIALIZERS PARA BANCO Y TIPO DE CUENTA
# ============================================================

