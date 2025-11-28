from django.db import models

# Create your models here.

class Asignatura(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    creditos = models.PositiveIntegerField()
    tipo = models.CharField(max_length=20, choices=[('teórica', 'Teórica'), ('práctica', 'Práctica'), ('mixta', 'Mixta')], default='presencial')

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.tipo})"
