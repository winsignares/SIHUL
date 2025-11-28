from django.db import models
from sedes.models import Sede
from usuarios.models import Usuario

class EspacioFisico(models.Model):
    id = models.AutoField(primary_key=True)
    sede = models.ForeignKey(Sede, on_delete=models.CASCADE, related_name='espacios')
    tipo = models.CharField(max_length=50)
    capacidad = models.PositiveIntegerField()
    ubicacion = models.CharField(max_length=100, blank=True, null=True)
    recursos = models.TextField(blank=True, null=True)
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.tipo} ({self.ubicacion or 'sin ubicación'})"
    
class EspacioPermitido(models.Model):
    espacio = models.ForeignKey(EspacioFisico, on_delete=models.CASCADE, related_name='espacios_permitidos')
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='espacios_permitidos')   

    def __str__(self):
        return f"{self.usuario} para {self.espacio}"