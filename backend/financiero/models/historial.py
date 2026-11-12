from django.db import models
from django.db.models import Index
from usuarios.models import Usuario
from .facturas import Factura


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
