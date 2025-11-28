from django.db import models

# Create your models here.

class Facultad(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    activa = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
