from django.db import models
from django.db.models import Q
from facultades.models import Facultad

# Create your models here.

class Programa(models.Model):
    id = models.AutoField(primary_key=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.CASCADE, related_name='programas')
    nombre = models.CharField(max_length=100)
    semestres = models.IntegerField(default=10)
    activo = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre


class StgOraclePrograma(models.Model):
    source_system = models.CharField(max_length=50, default='ORACLE_SIU', db_index=True)
    external_id = models.CharField(max_length=50, db_index=True)
    id_programa_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    id_sede_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    nombre_sede_oracle = models.CharField(max_length=255, null=True, blank=True)
    id_facultad_oracle = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    nombre_facultad_oracle = models.CharField(max_length=255, null=True, blank=True)
    nombre_programa = models.CharField(max_length=255)
    periodo_academico = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    raw_data = models.JSONField(default=dict, blank=True)
    row_hash = models.CharField(max_length=64, db_index=True)
    estado_registro = models.CharField(max_length=30, default='valido', db_index=True)
    fecha_carga = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                condition=Q(source_system__isnull=False) & Q(external_id__isnull=False) & ~Q(external_id=''),
                name='uq_stg_oracle_prog_source_external',
            )
        ]
        ordering = ['external_id']

    def __str__(self):
        return f'{self.source_system}:{self.external_id} {self.nombre_programa}'
