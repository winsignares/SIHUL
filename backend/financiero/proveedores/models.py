from django.db import models
from django.db.models import Index
from django.utils import timezone
from unispace.usuarios.models import Usuario

class Proveedor(models.Model):
    TIPO_PERSONA_CHOICES = [
        ('Natural', 'Natural'),
        ('Jurídica', 'Jurídica'),
    ]
    TIPO_PROVEEDOR_CHOICES = [
        ('Bienes', 'Bienes'),
        ('Servicios', 'Servicios'),
    ]
    TIPO_CUENTA_CHOICES = [
        ('Ahorros', 'Ahorros'),
        ('Corriente', 'Corriente'),
    ]
    REGIMEN_TRIBUTARIO_CHOICES = [
        ('Responsable IVA', 'Responsable IVA'),
        ('No Responsable IVA', 'No Responsable IVA'),
        ('Régimen Simple de Tributación', 'Régimen Simple de Tributación'),
        ('Régimen Tributario Especial', 'Régimen Tributario Especial'),
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
        db_table = 'financiero_proveedor'
        indexes = [
            Index(fields=['nit'], name='idx_proveedor_nit'),
            Index(fields=['estado'], name='idx_proveedor_estado'),
            Index(fields=['razon_social'], name='idx_proveedor_razon_social'),
        ]
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return f"{self.nit} - {self.razon_social}"


class Pais(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=120, unique=True)
    codigo_iso = models.CharField(max_length=3, unique=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financiero_pais'
        indexes = [
            Index(fields=['nombre'], name='idx_pais_nombre'),
            Index(fields=['activo'], name='idx_pais_activo'),
        ]
        verbose_name = 'País'
        verbose_name_plural = 'Países'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class DepartamentoGeografico(models.Model):
    id = models.AutoField(primary_key=True)
    pais = models.ForeignKey(Pais, on_delete=models.CASCADE, related_name='departamentos_geograficos')
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=10, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financiero_departamentogeografico'
        indexes = [
            Index(fields=['nombre'], name='idx_geo_departamento_nombre'),
            Index(fields=['activo'], name='idx_geo_departamento_activo'),
        ]
        verbose_name = 'Departamento geográfico'
        verbose_name_plural = 'Departamentos geográficos'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(fields=['pais', 'nombre'], name='uq_geo_departamento_pais_nombre'),
        ]

    def __str__(self):
        return f'{self.nombre} - {self.pais.nombre}'


class Ciudad(models.Model):
    id = models.AutoField(primary_key=True)
    departamento = models.ForeignKey(DepartamentoGeografico, on_delete=models.CASCADE, related_name='ciudades')
    nombre = models.CharField(max_length=120)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financiero_ciudad'
        indexes = [
            Index(fields=['nombre'], name='idx_ciudad_nombre'),
            Index(fields=['activo'], name='idx_ciudad_activo'),
        ]
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(fields=['departamento', 'nombre'], name='uq_ciudad_departamento_nombre'),
        ]

    def __str__(self):
        return f'{self.nombre} - {self.departamento.nombre}'
