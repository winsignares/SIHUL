from django.db import models
from django.db.models import Index
from django.utils import timezone
from unispace.usuarios.models import Usuario
from unispace.facultades.models import Facultad

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
        db_table = 'financiero_departamento'
        indexes = [
            Index(fields=['codigo'], name='idx_departamento_codigo'),
            Index(fields=['tipo'], name='idx_departamento_tipo'),
            Index(fields=['estado'], name='idx_departamento_estado'),
        ]
        verbose_name = 'Departamento'
        verbose_name_plural = 'Departamentos'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


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
        db_table = 'financiero_cuentacontable'
        indexes = [
            Index(fields=['codigo'], name='idx_cuenta_contable_codigo'),
            Index(fields=['tipo_cuenta'], name='idx_cuenta_contable_tipo'),
            Index(fields=['estado'], name='idx_cuenta_contable_estado'),
        ]
        verbose_name = 'Cuenta Contable'
        verbose_name_plural = 'Cuentas Contables'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


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
        db_table = 'financiero_centrocosto'
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


class Banco(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    codigo_bancario = models.CharField(max_length=10, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financiero_banco'
        indexes = [
            Index(fields=['nombre'], name='idx_banco_nombre'),
            Index(fields=['activo'], name='idx_banco_activo'),
        ]
        verbose_name = 'Banco'
        verbose_name_plural = 'Bancos'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class TipoCuenta(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'financiero_tipocuenta'
        indexes = [
            Index(fields=['activo'], name='idx_tipo_cuenta_activo'),
        ]
        verbose_name = 'Tipo de Cuenta'
        verbose_name_plural = 'Tipos de Cuenta'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre
