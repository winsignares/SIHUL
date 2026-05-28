from django.db import models
from django.db.models import Q
from sedes.models import Sede

# Create your models here.

class Facultad(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    source_system = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    external_id = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, null=True, blank=True, related_name='facultades')
    activa = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['source_system', 'external_id'],
                condition=Q(source_system__isnull=False, external_id__isnull=False),
                name='uq_facultad_source_external',
            )
        ]

    def __str__(self):
        return self.nombre
