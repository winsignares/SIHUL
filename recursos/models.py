from django.db import models

# Create your models here.

class Recurso(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=255, blank=True, null=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre or str(self.id)

class EspacioRecurso(models.Model):
    espacio = models.ForeignKey('espacios.EspacioFisico', on_delete=models.CASCADE, related_name='espacio_recursos')
    recurso = models.ForeignKey(Recurso, on_delete=models.CASCADE, related_name='recurso_espacios')
    disponible = models.BooleanField(default=True)

    class Meta:
        unique_together = (('espacio', 'recurso'),)

    def __str__(self):
        return f"{self.espacio} - {self.recurso}"
