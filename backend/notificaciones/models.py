from django.db import models
from usuarios.models import Usuario

class Notificacion(models.Model):
    id = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, null=True, blank=True, related_name='notificaciones')
    id_usuario = models.BigIntegerField()
    tipo_notificacion = models.CharField(max_length=100)
    mensaje = models.TextField()
    es_leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    prioridad = models.CharField(max_length=20, default='media')

    def save(self, *args, **kwargs):
        if self.usuario_id and not self.id_usuario:
            self.id_usuario = self.usuario_id
        elif self.id_usuario and not self.usuario_id:
            self.usuario = Usuario.objects.filter(id=self.id_usuario).first()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.tipo_notificacion} - Usuario {self.usuario_id or self.id_usuario}"
