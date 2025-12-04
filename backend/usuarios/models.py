from django.db import models
from django.db.models import Index
from facultades.models import Facultad
from sedes.models import Sede  # Agregar este import

# Create your models here.

class Rol(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Usuario(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    correo = models.EmailField(max_length=100, unique=True)
    contrasena_hash = models.CharField(max_length=255)
    rol = models.ForeignKey(Rol, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    activo = models.BooleanField(default=True)
    facultad = models.ForeignKey(Facultad, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    # Agregar relación con Sede
    sede = models.ForeignKey(Sede, on_delete=models.SET_NULL, null=True, blank=True, related_name='usuarios')
    
    class Meta:
        indexes = [
            Index(fields=['rol'], name='idx_usuario_rol'),
            Index(fields=['facultad'], name='idx_usuario_facultad'),
            Index(fields=['sede'], name='idx_usuario_sede'),  # Agregar índice
        ]

    def __str__(self):
        return self.nombre
