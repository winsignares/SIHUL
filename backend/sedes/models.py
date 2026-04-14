from django.db import models

# Create your models here.


class Seccional(models.Model):
    id = models.AutoField(primary_key=True)
    ciudad = models.CharField(max_length=100, unique=True)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.ciudad

class Sede(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    direccion = models.CharField(max_length=150, blank=True, null=True)
    seccional = models.ForeignKey(
        Seccional,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sedes',
    )
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
