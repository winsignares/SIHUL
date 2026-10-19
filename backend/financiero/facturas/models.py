from django.db import models
from django.db.models import Index
from django.utils import timezone
from unispace.usuarios.models import Usuario
from financiero.proveedores.models import Proveedor
from financiero.contabilidad.models import Departamento, CuentaContable, CentroCosto
from financiero._upload_paths import documento_financiero_upload_to

class Factura(models.Model):
    TIPO_DOCUMENTO_CHOICES = [
        ('Factura Electrónica', 'Factura Electrónica'),
        ('Factura', 'Factura'),
        ('Cuenta de Cobro', 'Cuenta de Cobro'),
        ('Nota Débito', 'Nota Débito'),
        ('Otro', 'Otro'),
    ]
    ESTADO_CHOICES = [
        ('Recibida', 'Recibida'),
        ('Registrada', 'Registrada'),
        ('Radicada', 'Radicada'),
        ('Causada', 'Causada'),
        ('Alistada', 'Alistada'),
        ('Aprobada Auditoría', 'Aprobada Auditoría'),
        ('Rechazada Auditoría', 'Rechazada Auditoría'),
        ('Cargada', 'Cargada'),
        ('Revisada Dir. Financiera', 'Revisada Dir. Financiera'),
        ('Enviada Rectoría', 'Enviada Rectoría'),
        ('Autorizada', 'Autorizada'),
        ('Rechazada por Rectoría', 'Rechazada por Rectoría'),
        ('Rechazada', 'Rechazada'),
        ('Pago Aplicado', 'Pago Aplicado'),
        ('Pagada', 'Pagada'),
        ('Devuelta', 'Devuelta'),
        ('Detenida', 'Detenida'),
        ('Anulada', 'Anulada'),
    ]
    INDICADOR_RIESGO_CHOICES = [
        ('ok', 'OK'),
        ('atencion', 'Requiere Atención'),
        ('atrasada', 'Atrasada'),
        ('vencida', 'Vencida'),
    ]

    id = models.AutoField(primary_key=True)

    # Números de control
    numero_factura = models.CharField(max_length=50, unique=True)
    numero_radicado = models.CharField(max_length=50, unique=True, blank=True, null=True)
    numero_proceso_pago = models.CharField(max_length=50, unique=True, blank=True, null=True)
    numero_confirmacion = models.CharField(max_length=50, unique=True, blank=True, null=True)
    numero_transaccion = models.CharField(max_length=50, unique=True, blank=True, null=True)
    numero_comprobante = models.CharField(max_length=50, unique=True, blank=True, null=True)
    numero_operacion_contable = models.CharField(max_length=100, blank=True, null=True)
    consecutivo_operacion = models.CharField(max_length=100, blank=True, null=True)

    # Relaciones
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name='facturas')
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, related_name='facturas')
    cuenta_contable = models.ForeignKey(CuentaContable, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')
    centro_costo = models.ForeignKey(CentroCosto, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas')

    # Información financiera
    valor_subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    valor_iva = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_retencion_renta = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_retencion_iva = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_retencion_ica = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_total = models.DecimalField(max_digits=18, decimal_places=2)

    # Información del documento
    tipo_documento = models.CharField(max_length=50, choices=TIPO_DOCUMENTO_CHOICES)
    observaciones = models.TextField(blank=True, null=True)
    identificacion_factura = models.CharField(max_length=500, blank=True, null=True)

    # Fechas del proceso
    fecha_factura = models.DateField()
    fecha_recepcion = models.DateField()
    fecha_radicacion = models.DateField(blank=True, null=True)
    fecha_causacion = models.DateField(blank=True, null=True)
    fecha_alistamiento = models.DateField(blank=True, null=True)
    fecha_aprobacion_auditoria = models.DateField(blank=True, null=True)
    fecha_cargue = models.DateField(blank=True, null=True)
    fecha_revision_direccion = models.DateField(blank=True, null=True)
    fecha_envio_rectoria = models.DateField(blank=True, null=True)
    fecha_autorizacion = models.DateField(blank=True, null=True)
    fecha_pago_aplicado = models.DateField(blank=True, null=True)
    fecha_comprobante = models.DateField(blank=True, null=True)

    # Estado y control
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='Recibida')
    etapa_actual = models.CharField(max_length=100, blank=True, null=True)
    fecha_inicio_etapa = models.DateField(blank=True, null=True)
    indicador_riesgo = models.CharField(max_length=20, choices=INDICADOR_RIESGO_CHOICES, default='ok')
    sla_cumplido = models.BooleanField(default=True)

    # Usuario responsable
    usuario_responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas_asignadas')

    # Información bancaria del pago
    cuenta_bancaria_proveedor = models.CharField(max_length=255, blank=True, null=True)
    archivo_plano_generado = models.CharField(max_length=500, blank=True, null=True)

    # Auditoría y trazabilidad
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='facturas_creadas')

    # Flags de control
    requiere_autorizacion_especial = models.BooleanField(default=False)
    urgente = models.BooleanField(default=False)
    ciclo_documental_actual = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'financiero_factura'
        indexes = [
            Index(fields=['numero_factura'], name='idx_factura_numero'),
            Index(fields=['numero_radicado'], name='idx_factura_radicado'),
            Index(fields=['proveedor'], name='idx_factura_proveedor'),
            Index(fields=['estado'], name='idx_factura_estado'),
            Index(fields=['fecha_recepcion'], name='idx_factura_fecha_recepcion'),
            Index(fields=['indicador_riesgo'], name='idx_factura_riesgo'),
        ]
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'

    def __str__(self):
        return f"{self.numero_factura} - {self.proveedor.razon_social}"

    @property
    def valor_neto_pagar(self):
        return self.valor_total - self.valor_retencion_renta - self.valor_retencion_iva - self.valor_retencion_ica

    @property
    def dias_transcurridos(self):
        from datetime import date
        if not self.fecha_recepcion:
            return 0
        return max((date.today() - self.fecha_recepcion).days, 0)

    @property
    def monto_alto(self):
        return self.valor_total > 10000000


class ItemFactura(models.Model):
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='items')
    descripcion = models.TextField()
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    valor_unitario = models.DecimalField(max_digits=18, decimal_places=2)
    porcentaje_iva = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    valor_subtotal = models.DecimalField(max_digits=18, decimal_places=2)
    valor_iva = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    valor_total = models.DecimalField(max_digits=18, decimal_places=2)
    orden = models.IntegerField(default=1)

    class Meta:
        db_table = 'financiero_itemfactura'
        indexes = [
            Index(fields=['factura'], name='idx_item_factura'),
        ]
        ordering = ['orden']
        verbose_name = 'Item de Factura'
        verbose_name_plural = 'Items de Factura'

    def __str__(self):
        return f"{self.factura.numero_factura} - {self.descripcion}"


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
        db_table = 'financiero_documentoadjunto'
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
        db_table = 'financiero_documentounificado'
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


class HistorialFactura(models.Model):
    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='historial')
    fecha_accion = models.DateTimeField(auto_now_add=True)
    accion = models.CharField(max_length=100)
    estado_anterior = models.CharField(max_length=50, blank=True, null=True)
    estado_nuevo = models.CharField(max_length=50, blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='acciones_facturas')
    usuario_nombre = models.CharField(max_length=255, blank=True, null=True)
    usuario_rol = models.CharField(max_length=50, blank=True, null=True)
    observacion = models.TextField(blank=True, null=True)
    datos_adicionales = models.JSONField(blank=True, null=True)
    ip_address = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'financiero_historialfactura'
        indexes = [
            Index(fields=['factura'], name='idx_historial_factura'),
            Index(fields=['fecha_accion'], name='idx_historial_fecha'),
            Index(fields=['usuario'], name='idx_historial_usuario'),
            Index(fields=['accion'], name='idx_historial_accion'),
        ]
        verbose_name = 'Historial Factura'
        verbose_name_plural = 'Historiales Facturas'
        ordering = ['-fecha_accion']

    def __str__(self):
        return f"{self.factura.numero_factura} - {self.accion}"


class ComentarioFactura(models.Model):
    TIPO_CHOICES = [
        ('Observación', 'Observación'),
        ('Pregunta', 'Pregunta'),
        ('Aclaración', 'Aclaración'),
        ('Aprobación', 'Aprobación'),
        ('Rechazo', 'Rechazo'),
    ]

    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='comentarios_facturas')
    comentario = models.TextField()
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    comentario_padre = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='respuestas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    editado = models.BooleanField(default=False)
    fecha_edicion = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'financiero_comentariofactura'
        indexes = [
            Index(fields=['factura'], name='idx_comentario_factura'),
            Index(fields=['usuario'], name='idx_comentario_usuario'),
            Index(fields=['fecha_creacion'], name='idx_comentario_fecha'),
        ]
        verbose_name = 'Comentario Factura'
        verbose_name_plural = 'Comentarios Facturas'
        ordering = ['fecha_creacion']

    def __str__(self):
        return f"Comentario en {self.factura.numero_factura}"


class RechazoDevolucion(models.Model):
    TIPO_CHOICES = [
        ('Rechazo', 'Rechazo'),
        ('Devolución', 'Devolución'),
    ]
    ESTADO_CHOICES = [
        ('Pendiente Corrección', 'Pendiente Corrección'),
        ('En Corrección', 'En Corrección'),
        ('Corregida', 'Corregida'),
        ('Reenviada', 'Reenviada'),
    ]

    id = models.AutoField(primary_key=True)
    factura = models.ForeignKey(Factura, on_delete=models.CASCADE, related_name='rechazos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    etapa_rechazo = models.CharField(max_length=100)
    motivo = models.TextField()
    estado_devolucion = models.CharField(max_length=50, choices=ESTADO_CHOICES)
    usuario_rechaza = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='rechazos_realizados')
    fecha_rechazo = models.DateTimeField(auto_now_add=True)
    fecha_correccion = models.DateTimeField(blank=True, null=True)
    usuario_corrige = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='correcciones_realizadas')
    observaciones_correccion = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'financiero_rechazodevolucion'
        indexes = [
            Index(fields=['factura'], name='idx_rechazo_factura'),
            Index(fields=['tipo'], name='idx_rechazo_tipo'),
            Index(fields=['estado_devolucion'], name='idx_rechazo_estado'),
        ]
        verbose_name = 'Rechazo/Devolución'
        verbose_name_plural = 'Rechazos/Devoluciones'

    def __str__(self):
        return f"{self.tipo} - {self.factura.numero_factura}"
