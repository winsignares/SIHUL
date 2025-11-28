from django.db import models

# Create your models here.

class Sede(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    ciudad = models.CharField(max_length=100, blank=True, null=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
