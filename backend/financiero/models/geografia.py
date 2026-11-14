from django.db import models
from django.db.models import Index



class Pais(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=120, unique=True)
    codigo_iso = models.CharField(max_length=3, unique=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['nombre'], name='idx_pais_nombre'),
            Index(fields=['activo'], name='idx_pais_activo'),
        ]
        verbose_name = 'País'
        verbose_name_plural = 'Países'
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class DepartamentoGeografico(models.Model):
    id = models.AutoField(primary_key=True)
    pais = models.ForeignKey(Pais, on_delete=models.CASCADE, related_name='departamentos_geograficos')
    nombre = models.CharField(max_length=120)
    codigo = models.CharField(max_length=10, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['nombre'], name='idx_geo_departamento_nombre'),
            Index(fields=['activo'], name='idx_geo_departamento_activo'),
        ]
        verbose_name = 'Departamento geográfico'
        verbose_name_plural = 'Departamentos geográficos'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(fields=['pais', 'nombre'], name='uq_geo_departamento_pais_nombre'),
        ]

    def __str__(self):
        return f'{self.nombre} - {self.pais.nombre}'


class Ciudad(models.Model):
    id = models.AutoField(primary_key=True)
    departamento = models.ForeignKey(DepartamentoGeografico, on_delete=models.CASCADE, related_name='ciudades')
    nombre = models.CharField(max_length=120)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            Index(fields=['nombre'], name='idx_ciudad_nombre'),
            Index(fields=['activo'], name='idx_ciudad_activo'),
        ]
        verbose_name = 'Ciudad'
        verbose_name_plural = 'Ciudades'
        ordering = ['nombre']
        constraints = [
            models.UniqueConstraint(fields=['departamento', 'nombre'], name='uq_ciudad_departamento_nombre'),
        ]

    def __str__(self):
        return f'{self.nombre} - {self.departamento.nombre}'
