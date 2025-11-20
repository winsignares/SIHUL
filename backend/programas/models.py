from django.db import models
from facultades.models import Facultad

# Create your models here.

class Programa(models.Model):
    id = models.AutoField(primary_key=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, related_name='programas')
    nombre = models.CharField(max_length=100)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
