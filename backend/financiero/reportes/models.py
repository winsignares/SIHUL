from django.db import models
from django.db.models import Index
from django.utils import timezone
from unispace.usuarios.models import Usuario

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
        db_table = 'financiero_reportegenerado'
        indexes = [
            Index(fields=['tipo_reporte'], name='idx_reporte_tipo'),
            Index(fields=['fecha_generacion'], name='idx_reporte_fecha'),
            Index(fields=['generado_por'], name='idx_reporte_usuario'),
        ]
        verbose_name = 'Reporte Generado'
        verbose_name_plural = 'Reportes Generados'

    def __str__(self):
        return f"{self.nombre_reporte} - {self.fecha_generacion}"
