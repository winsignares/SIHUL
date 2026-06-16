from rest_framework import serializers
from . import models
from .sla import obtener_parametro_por_etapa
from usuarios.serializers import UsuarioSerializer
from decimal import Decimal
from django.db import IntegrityError
from django.utils import timezone
from django.core.exceptions import ValidationError
from mysite.xss_protection import sanitize_dict, PROVEEDOR_SCHEMA, FACTURA_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA
import os
import re
import uuid
from urllib.parse import urlparse
import unicodedata


ALLOWED_DOC_EXTENSIONS = {'pdf', 'xml', 'png', 'jpg', 'jpeg', 'txt'}
ALLOWED_DOC_MIME_TYPES = {
    'application/pdf',
    'application/xml',
    'text/xml',
    'image/png',
    'image/jpeg',
    'text/plain',
    'application/octet-stream',  # .txt desde Windows/Chrome
}
MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024


DOCUMENTOS_SENSIBLES_POR_ROL = {
    'archivo plano bancario',
    'soporte causacion seven',
}

ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES = {
    'auditoria',
    'direccion financiera',
}


def _normalizar_texto_permiso(value):
    normalized = unicodedata.normalize('NFD', str(value or '').strip().lower())
    without_marks = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
    return ' '.join(without_marks.replace('_', ' ').replace('-', ' ').split())


def _usuario_puede_ver_documentos_sensibles(user):
    rol = _normalizar_texto_permiso(getattr(getattr(user, 'rol', None), 'nombre', ''))
    return rol in ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES


def _documento_es_sensible(documento):
    tipo = _normalizar_texto_permiso(getattr(documento, 'tipo_documento', ''))
    nombre = _normalizar_texto_permiso(getattr(documento, 'nombre_archivo', ''))
    return tipo in DOCUMENTOS_SENSIBLES_POR_ROL or 'archivo plano' in nombre


# ============================================================
# SERIALIZERS SIMPLES
# ============================================================

class ProveedorSerializer(serializers.ModelSerializer):
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

class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False, allow_null=True)
    cargado_por = UsuarioSerializer(read_only=True)
    cargado_por_id = serializers.IntegerField(write_only=True, required=False)
    verificado_por = UsuarioSerializer(read_only=True)
    archivo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = models.DocumentoAdjunto
        fields = [
            'id', 'factura', 'nombre_archivo', 'tipo_documento', 'tipo_mime', 'tamano_bytes',
            'url_storage', 'archivo', 'hash_archivo', 'obligatorio', 'verificado',
            'verificado_por', 'fecha_verificacion', 'observaciones', 'fecha_carga',
            'cargado_por', 'cargado_por_id', 'archivo_url', 'nas_relative_path',
            'nas_storage_status', 'ciclo_documental',
        ]
        read_only_fields = [
            'fecha_carga', 'archivo_url', 'hash_archivo', 'nas_relative_path',
            'nas_storage_status', 'ciclo_documental',
        ]

    def get_archivo_url(self, obj):
        request = self.context.get('request')
        relative_url = f'/api/financiero/documentos/{obj.id}/contenido/'
        if request:
            return request.build_absolute_uri(relative_url)
        return relative_url

    def validate_archivo(self, archivo):
        filename = (getattr(archivo, 'name', '') or '').strip()
        extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

        if extension not in ALLOWED_DOC_EXTENSIONS:
            raise serializers.ValidationError('Tipo de archivo no permitido. Use PDF, XML, PNG o JPG.')

        if getattr(archivo, 'size', 0) > MAX_DOC_SIZE_BYTES:
            raise serializers.ValidationError('El archivo supera el tamaño máximo permitido (10 MB).')

        content_type = (getattr(archivo, 'content_type', '') or '').split(';', 1)[0].strip().lower()
        if content_type and content_type not in ALLOWED_DOC_MIME_TYPES:
            raise serializers.ValidationError('El tipo MIME del archivo no es válido para documentos financieros.')

        head = archivo.read(512)
        archivo.seek(0)
        stripped = head.lstrip()

        if stripped.startswith(b'<!doctype html') or stripped.startswith(b'<html'):
            raise serializers.ValidationError('El archivo no es un documento válido; se detectó contenido HTML.')

        if extension == 'pdf' and not head.startswith(b'%PDF-'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a un PDF válido.')

        if extension == 'png' and not head.startswith(b'\x89PNG\r\n\x1a\n'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a una imagen PNG válida.')

        if extension in {'jpg', 'jpeg'} and not head.startswith(b'\xff\xd8\xff'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a una imagen JPG válida.')

        if extension == 'xml' and not stripped.startswith((b'<?xml', b'<')):
            raise serializers.ValidationError('El contenido del archivo no corresponde a un XML válido.')

        return archivo

    def validate_nombre_archivo(self, value):
        base = os.path.basename((value or '').strip())
        if not base:
            raise serializers.ValidationError('El nombre del archivo es requerido.')
        # Sustituir caracteres peligrosos
        safe = re.sub(r'[^A-Za-z0-9._-]+', '_', base)
        return safe[:255]

    def validate_url_storage(self, value):
        v = (value or '').strip()
        if not v:
            return ''
        parsed = urlparse(v)
        # Solo permitir http/https o rutas relativas
        if parsed.scheme and parsed.scheme.lower() not in ('http', 'https'):
            raise serializers.ValidationError('Esquema de URL no permitido para url_storage.')
        return v

    def _safe_filename(self, original_name: str) -> str:
        base = os.path.basename((original_name or '').strip())
        ext = base.rsplit('.', 1)[-1].lower() if '.' in base else ''
        if ext not in ALLOWED_DOC_EXTENSIONS:
            ext = 'bin'
        return f"{uuid.uuid4().hex}.{ext}"

    def validate(self, data):
        archivo = data.get('archivo')
        url_storage = (data.get('url_storage') or '').strip()

        if not archivo and not url_storage:
            raise serializers.ValidationError('Debe adjuntar un archivo o especificar url_storage.')

        # Asegurar nombre_archivo legible y seguro
        nombre = data.get('nombre_archivo') or getattr(archivo, 'name', '')
        if nombre:
            data['nombre_archivo'] = self.validate_nombre_archivo(nombre)

        # Randomizar el nombre físico almacenado para evitar colisiones/filtración de nombres
        if archivo is not None and hasattr(archivo, 'name'):
            archivo.name = self._safe_filename(archivo.name)
            data['archivo'] = archivo

        return data

    def create(self, validated_data):
        # Revalidar url_storage cuando es pasado via kwargs en serializer.save(...)
        if 'url_storage' in validated_data:
            validated_data['url_storage'] = self.validate_url_storage(validated_data.get('url_storage'))
        return super().create(validated_data)


class HistorialFacturaSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    numero_factura = serializers.CharField(source='factura.numero_factura', read_only=True)

    class Meta:
        model = models.HistorialFactura
        fields = '__all__'
        read_only_fields = ['fecha_accion']


class ComentarioFacturaSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    usuario_id = serializers.IntegerField(write_only=True, required=False)
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
            'tipo_documento', 'descripcion', 'observaciones', 'identificacion_factura', 'fecha_factura', 'fecha_recepcion',
            'fecha_radicacion', 'fecha_causacion', 'fecha_alistamiento', 'fecha_aprobacion_auditoria',
            'fecha_revision_direccion', 'fecha_autorizacion', 'fecha_pago_aplicado', 'fecha_comprobante',
            'dias_transcurridos', 'indicador_riesgo',
            'indicador_riesgo_display', 'monto_alto', 'sla_cumplido', 'sla_objetivo_dias', 'items'
        ]

    def get_sla_objetivo_dias(self, obj):
        parametro = obtener_parametro_por_etapa(getattr(obj, 'etapa_actual', None))
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
        parametro = obtener_parametro_por_etapa(getattr(obj, 'etapa_actual', None))
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
    items = ItemFacturaSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = models.Factura
        fields = [
            'id', 'numero_factura', 'tipo_documento', 'descripcion', 'observaciones',
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
