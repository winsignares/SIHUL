from django.db import models

# Create your models here.

from programas.models import Programa

class Asignatura(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)
    creditos = models.PositiveIntegerField()
    tipo = models.CharField(max_length=20, choices=[('teórica', 'Teórica'), ('práctica', 'Práctica'), ('mixta', 'Mixta')], default='presencial')
    programa = models.ForeignKey(Programa, on_delete=models.CASCADE, related_name='asignaturas', null=True, blank=True)
    horas = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.codigo} - {self.nombre} ({self.tipo})"


class AsignaturaPrograma(models.Model):
    """
    Tabla intermedia para relacionar asignaturas con programas,
    incluyendo información adicional como semestre y tipo de asignatura
    """
    id = models.AutoField(primary_key=True)
    programa = models.ForeignKey(Programa, on_delete=models.CASCADE, related_name='asignaturas_programa')
    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE, related_name='programas_asignatura')
    semestre = models.PositiveIntegerField()
    tipo = models.CharField(
        max_length=20, 
        choices=[
            ('electiva', 'Electiva'),
            ('optativa', 'Optativa'),
            ('profesional', 'Profesional'),
            ('humanística', 'Humanística'),
            ('básica', 'Básica')
        ], 
        default='profesional'
    )

    class Meta:
        unique_together = ('programa', 'asignatura', 'semestre')
        verbose_name = 'Asignatura por Programa'
        verbose_name_plural = 'Asignaturas por Programa'

    def __str__(self):
        return f"{self.asignatura.nombre} - {self.programa.nombre} (Sem. {self.semestre})"
