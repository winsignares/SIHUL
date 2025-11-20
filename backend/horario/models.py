from django.db import models
from django.db.models import F, CheckConstraint, Q, Index
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico

class Horario(models.Model):
    id = models.AutoField(primary_key=True)
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='horarios')
    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE, related_name='horarios')
    docente = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='horarios_docente')
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='horarios')
    dia_semana = models.CharField(max_length=15)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    cantidad_estudiantes = models.IntegerField(null=True, blank=True)

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(hora_fin__gt=F('hora_inicio')),
                name='chk_horario_horas',
            ),
        ]
        indexes = [
            Index(fields=['espacio'], name='idx_horario_espacio'),
            Index(fields=['docente'], name='idx_horario_docente'),
        ]

    def __str__(self):
        return f"{self.dia_semana} {self.hora_inicio}-{self.hora_fin}"

class HorarioFusionado(models.Model):
    id = models.AutoField(primary_key=True)
    grupo1 = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='horarios_fusionados_1')
    grupo2 = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name='horarios_fusionados_2')
    grupo3 = models.ForeignKey(Grupo, on_delete=models.CASCADE, null=True, blank=True, related_name='horarios_fusionados_3')
    asignatura = models.ForeignKey(Asignatura, on_delete=models.CASCADE, related_name='horarios_fusionados')
    docente = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='horarios_fusionados')
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='horarios_fusionados')
    dia_semana = models.CharField(max_length=15)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    cantidad_estudiantes = models.IntegerField(null=True, blank=True)
    comentario = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        constraints = [
            CheckConstraint(
                check=Q(hora_fin__gt=F('hora_inicio')),
                name='chk_horario_fusionado_horas',
            ),
        ]

    def __str__(self):
        return f"Fusionado {self.asignatura} {self.dia_semana}"