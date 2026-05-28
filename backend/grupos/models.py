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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Guardar el programa original para detectar cambios
        self._old_programa_id = self.programa_id if self.pk else None


class StgOracleGrupoAcademico(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=100, db_index=True)
    id_grupo_oracle = models.CharField(max_length=22, null=True, blank=True, db_index=True)
    id_sede_oracle = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    nombre_sede_oracle = models.CharField(max_length=50, null=True, blank=True)
    id_facultad_oracle = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    nombre_facultad_oracle = models.CharField(max_length=250, null=True, blank=True)
    id_programa_oracle = models.CharField(max_length=5, null=True, blank=True, db_index=True)
    nombre_programa_oracle = models.CharField(max_length=250, null=True, blank=True)
    nombre_grupo_oracle = models.CharField(max_length=20, null=True, blank=True)
    periodo_academico = models.CharField(max_length=5, null=True, blank=True, db_index=True)
    semestre_oracle = models.IntegerField(null=True, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    estado_registro = models.CharField(max_length=30, default='valido', db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                name='uq_stg_oracle_grupo_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        display_name = self.nombre_grupo_oracle or self.id_grupo_oracle or ''
        return f'{self.source_system}:{self.external_id} {display_name}'.strip()
