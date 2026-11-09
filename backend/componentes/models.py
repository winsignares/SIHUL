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
        # Solo en ajustes de una seccional: quita un componente que la plantilla general sí da al rol.
        NINGUNO = 'NINGUNO', 'Sin acceso'

    componente = models.ForeignKey(Componente, on_delete=models.CASCADE)
    rol = models.ForeignKey(Rol, on_delete=models.CASCADE)
    permiso = models.CharField(max_length=20, choices=Permiso.choices, default=Permiso.VER)
    # Vacío = plantilla general del rol (vale para todas las seccionales). Con seccional = ajuste que
    # solo aplica a las personas de esa seccional y que reemplaza a la plantilla en ese componente.
    seccional = models.ForeignKey(
        'sedes.Seccional', on_delete=models.CASCADE, null=True, blank=True, related_name='componentes_rol',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['componente', 'rol', 'seccional'], condition=models.Q(seccional__isnull=False),
                name='uniq_componente_rol_seccional',
            ),
        ]

    def __str__(self):
        ambito = f' [{self.seccional.ciudad}]' if self.seccional_id else ''
        return f"{self.rol.nombre} - {self.componente.nombre} ({self.get_permiso_display()}){ambito}"


class ComponenteUsuario(models.Model):
    componente = models.ForeignKey(Componente, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    permiso = models.CharField(
        max_length=20,
        choices=[c for c in ComponenteRol.Permiso.choices if c[0] != ComponenteRol.Permiso.NINGUNO],
        default=ComponenteRol.Permiso.VER,
    )
    activo = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['componente', 'usuario'], name='uniq_componente_usuario'),
        ]

    def __str__(self):
        estado = 'Activo' if self.activo else 'Inactivo'
        return f"{self.usuario.nombre} - {self.componente.nombre} ({self.permiso}, {estado})"