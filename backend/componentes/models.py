from django.db import models
from usuarios.models import Rol, Usuario


class Componente(models.Model):
	id = models.AutoField(primary_key=True)
	nombre = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True, null=True)

	def __str__(self):
		return self.nombre or str(self.id)

class ComponenteRol(models.Model):
    class Permiso(models.TextChoices):
        VER = 'VER', 'Ver'
        EDITAR = 'EDITAR', 'Editar'

    componente = models.ForeignKey(Componente, on_delete=models.CASCADE)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    permiso = models.CharField(max_length=20, choices=Permiso.choices, default=Permiso.VER)

    def __str__(self):
        return f"{self.rol.nombre} - {self.componente.nombre} ({self.get_permiso_display()})"


class ComponenteUsuario(models.Model):
    componente = models.ForeignKey(Componente, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    permiso = models.CharField(max_length=20, choices=ComponenteRol.Permiso.choices, default=ComponenteRol.Permiso.VER)
    activo = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['componente', 'usuario'], name='uniq_componente_usuario'),
        ]

    def __str__(self):
        estado = 'Activo' if self.activo else 'Inactivo'
        return f"{self.usuario.nombre} - {self.componente.nombre} ({self.permiso}, {estado})"