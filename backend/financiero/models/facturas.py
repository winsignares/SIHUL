from django.db import models
from django.db.models import Index
from identidad.usuarios.models import Usuario
from .catalogos import CentroCosto, CuentaContable, Departamento
from .proveedores import Proveedor


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
        indexes = [
            Index(fields=['factura'], name='idx_item_factura'),
        ]
        ordering = ['orden']
        verbose_name = 'Item de Factura'
        verbose_name_plural = 'Items de Factura'

    def __str__(self):
        return f"{self.factura.numero_factura} - {self.descripcion}"
