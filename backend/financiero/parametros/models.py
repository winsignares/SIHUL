from django.db import models
from django.db.models import Index
from django.utils import timezone
from unispace.usuarios.models import Usuario

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
        db_table = 'financiero_parametrosla'
        indexes = [
            Index(fields=['etapa'], name='idx_sla_etapa'),
            Index(fields=['rol_responsable'], name='idx_sla_rol'),
        ]
        verbose_name = 'Parámetro SLA'
        verbose_name_plural = 'Parámetros SLA'

    def __str__(self):
        return f"{self.etapa} - {self.dias_maximos} días"


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
        db_table = 'financiero_parametrosfinanciero'
        indexes = [
            Index(fields=['categoria'], name='idx_parametros_categoria'),
            Index(fields=['clave'], name='idx_parametros_clave'),
        ]
        verbose_name = 'Parámetro Financiero'
        verbose_name_plural = 'Parámetros Financieros'

    def __str__(self):
        return f"{self.clave} = {self.valor}"
