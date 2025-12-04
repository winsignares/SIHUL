from django.db import models
from sedes.models import Sede

# Create your models here.

class Facultad(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, null=True, blank=True, related_name='facultades')
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
