import re
import unicodedata
from django.db import models
from django.db.models import Index
from usuarios.models import Usuario
from django.utils import timezone
from .facturas import Factura


def _safe_path_segment(value, fallback='sin-dato'):
    text = unicodedata.normalize('NFKD', str(value or fallback))
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^A-Za-z0-9._-]+', '-', text).strip('.-')
    return text[:80] or fallback


def documento_financiero_upload_to(instance, filename):
    factura = getattr(instance, 'factura', None)
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    factura_label = _safe_path_segment(
        getattr(factura, 'numero_factura', None) or (f'factura-{getattr(factura, "id", "")}' if factura else 'sin-factura')
    )
    safe_filename = _safe_path_segment(filename, fallback='documento')
    return f'{date:%Y}/{date:%m}/{factura_label}/especificos/{safe_filename}'


class DocumentoAdjunto(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('Factura', 'Factura'),
        ('Orden de Compra', 'Orden de Compra'),
        ('Contrato', 'Contrato'),
        ('Acta de Entrega', 'Acta de Entrega'),
        ('Certificado de Disponibilidad', 'Certificado de Disponibilidad'),
        ('RUT Proveedor', 'RUT Proveedor'),
        ('Certificación Bancaria', 'Certificación Bancaria'),
        ('Informe Técnico', 'Informe Técnico'),
        ('Soporte Adicional', 'Soporte Adicional'),
        ('Soporte Operacion', 'Soporte Operacion'),
        ('Soporte Causacion Seven', 'Soporte Causacion Seven'),
        ('Archivo Plano Bancario', 'Archivo Plano Bancario'),
        ('Comprobante de Pago', 'Comprobante de Pago'),
    ]

    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='documentos')
    nombre_archivo = models.CharField(max_length=255)
    tipo_documento = models.CharField(max_length=50, choices=TIPO_DOCUMENTO_CHOICES)
    tipo_mime = models.CharField(max_length=100, blank=True, null=True)
    tamano_bytes = models.BigIntegerField(blank=True, null=True)
    url_storage = models.CharField(max_length=500, blank=True)
    archivo = models.FileField(upload_to=documento_financiero_upload_to, blank=True, null=True)
    contenido_archivo = models.BinaryField(blank=True, null=True, editable=False)
    hash_archivo = models.CharField(max_length=255, blank=True, null=True)
    ciclo_documental = models.PositiveIntegerField(default=1)
    obligatorio = models.BooleanField(default=False)
    verificado = models.BooleanField(default=False)
    verificado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_verificados')
    fecha_verificacion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    cargado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_cargados')

    NAS_STATUS_STORED = 'stored'
    NAS_STATUS_FAILED = 'failed'
    NAS_STATUS_SKIPPED = 'skipped'
    NAS_STATUS_DISABLED = 'disabled'

    nas_relative_path = models.CharField(
        max_length=500, blank=True, null=True,
        help_text='Ruta relativa dentro del NAS (desde la raíz configurada). Ejemplo: facturas/2026/06/FAC-000123/documentos_especificos/001_rut.pdf',
    )
    nas_storage_status = models.CharField(
        max_length=20, blank=True, null=True,
        help_text='Estado de copia al NAS: stored, failed, skipped, disabled',
    )

    class Meta:
        indexes = [
            Index(fields=['factura'], name='idx_documento_factura'),
            Index(fields=['tipo_documento'], name='idx_documento_tipo'),
        ]
        verbose_name = 'Documento Adjunto'
        verbose_name_plural = 'Documentos Adjuntos'

    def __str__(self):
        return f"{self.nombre_archivo} - {self.factura.numero_factura}"


class DocumentoUnificado(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='documentos_unificados')
    scope = models.CharField(max_length=50, default='all')
    ciclo_documental = models.PositiveIntegerField(default=1)
    nombre_archivo = models.CharField(max_length=255)
    tipo_mime = models.CharField(max_length=100, default='application/pdf')
    tamano_bytes = models.BigIntegerField(blank=True, null=True)
    contenido_archivo = models.BinaryField(blank=True, null=True, editable=False)
    hash_archivo = models.CharField(max_length=255, blank=True, null=True)
    fecha_generacion = models.DateTimeField(auto_now=True)
    nas_relative_path = models.CharField(
        max_length=500, blank=True, null=True,
        help_text='Ruta relativa dentro del NAS (desde la raíz configurada) del PDF unificado.',
    )
    nas_storage_status = models.CharField(
        max_length=20, blank=True, null=True,
        help_text='Estado de copia al NAS del PDF unificado: stored, failed, skipped, disabled',
    )

    class Meta:
        indexes = [
            Index(fields=['factura', 'scope'], name='idx_doc_unificado_fact_scope'),
            Index(fields=['factura', 'ciclo_documental'], name='idx_doc_unificado_fact_ciclo'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['factura', 'scope', 'ciclo_documental'],
                name='uniq_doc_unificado_fact_scope_ciclo',
            ),
        ]
        verbose_name = 'Documento Unificado'
        verbose_name_plural = 'Documentos Unificados'

    def __str__(self):
        return f"{self.factura.numero_factura} - {self.scope} - ciclo {self.ciclo_documental}"
