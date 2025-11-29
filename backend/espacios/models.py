from django.db import models
from sedes.models import Sede
from usuarios.models import Usuario

class TipoEspacio(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.nombre

class EspacioFisico(models.Model):
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)  # Nombre del espacio
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='espacios')
    tipo = models.ForeignKey(TipoEspacio, on_delete=models.PROTECT, related_name='espacios')
    capacidad = models.PositiveIntegerField()
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(
        max_length=20, 
        choices=[
            ('Disponible', 'Disponible'), 
            ('Mantenimiento', 'En Mantenimiento'), 
            ('No Disponible', 'No Disponible')
        ], 
        default='Disponible'
    )

    def __str__(self):
        return f"{self.nombre} - {self.tipo.nombre} ({self.ubicacion or 'sin ubicación'})"
    
class EspacioPermitido(models.Model):
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='espacios_permitidos')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='espacios_permitidos')   

    def __str__(self):
        return f"{self.usuario} para {self.espacio}"