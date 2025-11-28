from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Index
from programas.models import Programa
from periodos.models import PeriodoAcademico

class Grupo(models.Model):
    id = models.AutoField(primary_key=True)
    programa = models.ForeignKey(Programa, on_delete=models.CASCADE, related_name='grupos')
    periodo = models.ForeignKey(PeriodoAcademico, on_delete=models.CASCADE, related_name='grupos')
    nombre = models.CharField(max_length=50)
    semestre = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
    activo = models.BooleanField(default=True)

    class Meta:
        indexes = [
            Index(fields=['periodo'], name='idx_grupo_periodo'),
        ]

    def __str__(self):
        return self.nombre
