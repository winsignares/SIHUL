from django.db import models

class Notificacion(models.Model):
    id = models.AutoField(primary_key=True)
    id_usuario = models.BigIntegerField()
    tipo_notificacion = models.CharField(max_length=100)
    mensaje = models.TextField()
    es_leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    prioridad = models.CharField(max_length=20, default='media')

    def __str__(self):
        return f"{self.tipo_notificacion} - Usuario {self.id_usuario}"
