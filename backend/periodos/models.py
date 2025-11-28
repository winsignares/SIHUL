from django.db import models

# Create your models here.

class PeriodoAcademico(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre
