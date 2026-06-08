from django.db import models
from django.db.models import Index
from usuarios.models import Usuario
from facultades.models import Facultad
from django.utils import timezone

# ============================================================
# 1. PROVEEDOR
# ============================================================
class Proveedor(models.Model):
    TIPO_PERSONA_CHOICES = [
        ('Natural', 'Natural'),
        ('Jurídica', 'Jurídica'),
    ]
    TIPO_PROVEEDOR_CHOICES = [
        ('Bienes', 'Bienes'),
        ('Servicios', 'Servicios'),
        ('Construcción', 'Construcción'),
        ('Mixto', 'Mixto'),
    ]
    TIPO_CUENTA_CHOICES = [
        ('Ahorros', 'Ahorros'),
        ('Corriente', 'Corriente'),
    ]
    REGIMEN_TRIBUTARIO_CHOICES = [
        ('Responsable IVA', 'Responsable IVA'),
        ('No responsable', 'No responsable'),
        ('Gran Contribuyente', 'Gran Contribuyente'),
    ]
    CALIFICACION_RIESGO_CHOICES = [
        ('Bajo', 'Bajo'),
        ('Medio', 'Medio'),
        ('Alto', 'Alto'),
    ]
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
        ('Bloqueado', 'Bloqueado'),
        ('Verificación', 'Verificación'),
    ]

    id = models.AutoField(primary_key=True)
    usuario = models.OneToOneField(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='perfil_proveedor'
    )
    nit = models.CharField(max_length=50, unique=True)
    razon_social = models.CharField(max_length=255)
    nombre_comercial = models.CharField(max_length=255, blank=True, null=True)
    tipo_persona = models.CharField(max_length=20, choices=TIPO_PERSONA_CHOICES, default='Jurídica')
    tipo_proveedor = models.CharField(max_length=50, choices=TIPO_PROVEEDOR_CHOICES)

    # Información de contacto
    direccion = models.CharField(max_length=255, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    departamento = models.CharField(max_length=100, blank=True, null=True)
    pais = models.CharField(max_length=100, default='Colombia')
    telefono = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    contacto_principal = models.CharField(max_length=255, blank=True, null=True)
    telefono_contacto = models.CharField(max_length=50, blank=True, null=True)

    # Información bancaria
    banco = models.CharField(max_length=100, blank=True, null=True)
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES, blank=True, null=True)
    numero_cuenta = models.CharField(max_length=50, blank=True, null=True)
    cuenta_bancaria_completa = models.CharField(max_length=255, blank=True, null=True)

    # Información tributaria
    regimen_tributario = models.CharField(max_length=50, choices=REGIMEN_TRIBUTARIO_CHOICES, blank=True, null=True)
    retencion_renta = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    retencion_iva = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    retencion_ica = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    autoretenedor = models.BooleanField(default=False)

    # Estado y control
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Activo')
    calificacion_riesgo = models.CharField(max_length=20, choices=CALIFICACION_RIESGO_CHOICES, blank=True, null=True)
    fecha_ultimo_pago = models.DateField(blank=True, null=True)
    total_pagado_historico = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    numero_facturas_procesadas = models.IntegerField(default=0)

    # Documentación
    rut_adjunto = models.CharField(max_length=500, blank=True, null=True)
    camara_comercio_adjunto = models.CharField(max_length=500, blank=True, null=True)
    certificacion_bancaria_adjunto = models.CharField(max_length=500, blank=True, null=True)

    # Auditoría
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='proveedores_creados')
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            Index(fields=['nit'], name='idx_proveedor_nit'),
            Index(fields=['estado'], name='idx_proveedor_estado'),
            Index(fields=['razon_social'], name='idx_proveedor_razon_social'),
        ]
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return f"{self.nit} - {self.razon_social}"


# ============================================================
# 2. DEPARTAMENTO (Nueva, reemplaza areas_departamentos)
# ============================================================
class Departamento(models.Model):
    TIPO_CHOICES = [
        ('Financiero', 'Financiero'),
        ('Académico', 'Académico'),
        ('Administrativo', 'Administrativo'),
    ]
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    id = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.SET_NULL, null=True, blank=True, related_name='departamentos')
    responsable = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='departamentos_responsable')
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES, default='Administrativo')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Activo')
    centro_costo_predeterminado = models.CharField(max_length=50, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['codigo'], name='idx_departamento_codigo'),
            Index(fields=['tipo'], name='idx_departamento_tipo'),
            Index(fields=['estado'], name='idx_departamento_estado'),
        ]
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ============================================================
# 3. CUENTA CONTABLE (PUC)
# ============================================================
class CuentaContable(models.Model):
    TIPO_CUENTA_CHOICES = [
        ('Activo', 'Activo'),
        ('Pasivo', 'Pasivo'),
        ('Patrimonio', 'Patrimonio'),
        ('Ingreso', 'Ingreso'),
        ('Gasto', 'Gasto'),
        ('Costo', 'Costo'),
    ]
    NATURALEZA_CHOICES = [
        ('Débito', 'Débito'),
        ('Crédito', 'Crédito'),
    ]
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    id = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=255)
    tipo_cuenta = models.CharField(max_length=50, choices=TIPO_CUENTA_CHOICES)
    nivel = models.IntegerField()  # 1=Clase, 2=Grupo, 3=Cuenta, 4=Subcuenta
    cuenta_padre = models.CharField(max_length=20, blank=True, null=True)
    naturaleza = models.CharField(max_length=20, choices=NATURALEZA_CHOICES)
    acepta_movimiento = models.BooleanField(default=True)
    requiere_tercero = models.BooleanField(default=True)
    requiere_centro_costo = models.BooleanField(default=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            Index(fields=['codigo'], name='idx_cuenta_contable_codigo'),
            Index(fields=['tipo_cuenta'], name='idx_cuenta_contable_tipo'),
            Index(fields=['estado'], name='idx_cuenta_contable_estado'),
        ]
        verbose_name = 'Cuenta Contable'
        verbose_name_plural = 'Cuentas Contables'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


# ============================================================
# 4. CENTRO DE COSTO
# ============================================================
class CentroCosto(models.Model):
    TIPO_CHOICES = [
        ('Administrativo', 'Administrativo'),
        ('Académico', 'Académico'),
        ('Operativo', 'Operativo'),
        ('Investigación', 'Investigación'),
        ('Extensión', 'Extensión'),
    ]
    ESTADO_CHOICES = [
        ('Activo', 'Activo'),
        ('Inactivo', 'Inactivo'),
    ]

    id = models.AutoField(primary_key=True)
    codigo = models.CharField(max_length=20, unique=True)
    nombre = models.CharField(max_length=255)
    tipo = models.CharField(max_length=50, choices=TIPO_CHOICES)
    departamento = models.ForeignKey(Departamento, on_delete=models.SET_NULL, null=True, blank=True, related_name='centros_costo')
    presupuesto_asignado = models.DecimalField(max_digits=18, decimal_places=2, blank=True, null=True)
    presupuesto_ejecutado = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['codigo'], name='idx_centro_costo_codigo'),
            Index(fields=['tipo'], name='idx_centro_costo_tipo'),
            Index(fields=['estado'], name='idx_centro_costo_estado'),
        ]
        verbose_name = 'Centro de Costo'
        verbose_name_plural = 'Centros de Costo'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    @property
    def porcentaje_ejecucion(self):
        if self.presupuesto_asignado and self.presupuesto_asignado > 0:
            return (self.presupuesto_ejecutado / self.presupuesto_asignado) * 100
        return 0


# ============================================================
# 5. FACTURA (TABLA PRINCIPAL)
# ============================================================
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
    descripcion = models.TextField()
    observaciones = models.TextField(blank=True, null=True)

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


# ============================================================
# 6. DOCUMENTO ADJUNTO
# ============================================================
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
    archivo = models.FileField(upload_to='documentos_financiero/%Y/%m/%d/', blank=True, null=True)
    hash_archivo = models.CharField(max_length=255, blank=True, null=True)
    obligatorio = models.BooleanField(default=False)
    verificado = models.BooleanField(default=False)
    verificado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_verificados')
    fecha_verificacion = models.DateTimeField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_carga = models.DateTimeField(auto_now_add=True)
    cargado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='documentos_cargados')

    class Meta:
        indexes = [
            Index(fields=['factura'], name='idx_documento_factura'),
            Index(fields=['tipo_documento'], name='idx_documento_tipo'),
        ]
        verbose_name = 'Documento Adjunto'
        verbose_name_plural = 'Documentos Adjuntos'

    def __str__(self):
        return f"{self.nombre_archivo} - {self.factura.numero_factura}"


# ============================================================
# 7. HISTORIAL FACTURA
# ============================================================
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


# ============================================================
# 8. PARÁMETRO SLA
# ============================================================
class ParametroSLA(models.Model):
    id = models.AutoField(primary_key=True)
    etapa = models.CharField(max_length=100, unique=True)
    rol_responsable = models.CharField(max_length=50)
    dias_maximos = models.IntegerField()
    alerta_amarillo_porcentaje = models.IntegerField(default=60)
    alerta_roja_porcentaje = models.IntegerField(default=80)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    aplica_dias_habiles = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    modificado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='parametros_sla_modificados')

    class Meta:
        indexes = [
            Index(fields=['etapa'], name='idx_sla_etapa'),
            Index(fields=['rol_responsable'], name='idx_sla_rol'),
        ]
        verbose_name = 'Parámetro SLA'
        verbose_name_plural = 'Parámetros SLA'

    def __str__(self):
        return f"{self.etapa} - {self.dias_maximos} días"


# ============================================================
# 9. PARÁMETROS FINANCIERO
# ============================================================
class ParametrosFinanciero(models.Model):
    TIPO_DATO_CHOICES = [
        ('string', 'Texto'),
        ('number', 'Número'),
        ('boolean', 'Booleano'),
        ('json', 'JSON'),
    ]
    CATEGORIA_CHOICES = [
        ('general', 'General'),
        ('sla', 'SLA'),
        ('autorizacion', 'Autorización'),
        ('email', 'Email'),
        ('sistema', 'Sistema'),
        ('reportes', 'Reportes'),
    ]

    id = models.AutoField(primary_key=True)
    clave = models.CharField(max_length=100, unique=True)
    valor = models.TextField()
    tipo_dato = models.CharField(max_length=20, choices=TIPO_DATO_CHOICES)
    descripcion = models.TextField(blank=True, null=True)
    editable = models.BooleanField(default=True)
    categoria = models.CharField(max_length=50, choices=CATEGORIA_CHOICES)
    fecha_modificacion = models.DateTimeField(auto_now=True)
    modificado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='parametros_modificados')

    class Meta:
        indexes = [
            Index(fields=['categoria'], name='idx_parametros_categoria'),
            Index(fields=['clave'], name='idx_parametros_clave'),
        ]
        verbose_name = 'Parámetro Financiero'
        verbose_name_plural = 'Parámetros Financieros'

    def __str__(self):
        return f"{self.clave} = {self.valor}"


# ============================================================
# 10. REPORTE GENERADO
# ============================================================
class ReporteGenerado(models.Model):
    FORMATO_CHOICES = [
        ('PDF', 'PDF'),
        ('Excel', 'Excel'),
        ('CSV', 'CSV'),
        ('JSON', 'JSON'),
    ]

    id = models.AutoField(primary_key=True)
    tipo_reporte = models.CharField(max_length=100)
    nombre_reporte = models.CharField(max_length=255)
    formato = models.CharField(max_length=20, choices=FORMATO_CHOICES)
    parametros_filtros = models.JSONField(blank=True, null=True)
    cantidad_registros = models.IntegerField(blank=True, null=True)
    tamano_archivo_bytes = models.BigIntegerField(blank=True, null=True)
    url_archivo = models.CharField(max_length=500, blank=True, null=True)
    fecha_generacion = models.DateTimeField(auto_now_add=True)
    generado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='reportes_generados')
    fecha_expiracion = models.DateTimeField(blank=True, null=True)
    descargado = models.BooleanField(default=False)
    fecha_descarga = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            Index(fields=['tipo_reporte'], name='idx_reporte_tipo'),
            Index(fields=['fecha_generacion'], name='idx_reporte_fecha'),
            Index(fields=['generado_por'], name='idx_reporte_usuario'),
        ]
        verbose_name = 'Reporte Generado'
        verbose_name_plural = 'Reportes Generados'

    def __str__(self):
        return f"{self.nombre_reporte} - {self.fecha_generacion}"


# ============================================================
# 11. COMENTARIO FACTURA
# ============================================================
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


# ============================================================
# 12. RECHAZO DEVOLUCIÓN
# ============================================================
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
        indexes = [
            Index(fields=['factura'], name='idx_rechazo_factura'),
            Index(fields=['tipo'], name='idx_rechazo_tipo'),
            Index(fields=['estado_devolucion'], name='idx_rechazo_estado'),
        ]
        verbose_name = 'Rechazo/Devolución'
        verbose_name_plural = 'Rechazos/Devoluciones'

    def __str__(self):
        return f"{self.tipo} - {self.factura.numero_factura}"


# ============================================================
# 13. BANCO
# ============================================================
class Banco(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    codigo_bancario = models.CharField(max_length=10, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['nombre'], name='idx_banco_nombre'),
            Index(fields=['activo'], name='idx_banco_activo'),
        ]
        verbose_name = 'Banco'
        verbose_name_plural = 'Bancos'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


# ============================================================
# 14. TIPO DE CUENTA BANCARIA
# ============================================================
class TipoCuenta(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['activo'], name='idx_tipo_cuenta_activo'),
        ]
        verbose_name = 'Tipo de Cuenta'
        verbose_name_plural = 'Tipos de Cuenta'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
