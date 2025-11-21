from django.db import models


class Componente(models.Model):
	id = models.AutoField(primary_key=True)
	nombre = models.CharField(max_length=255)
	codigo = models.CharField(max_length=100, unique=True, blank=True, null=True)
	descripcion = models.TextField(blank=True, null=True)
	activo = models.BooleanField(default=True)
	creado = models.DateTimeField(auto_now_add=True)
	modificado = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.nombre or str(self.id)

	class Meta:
		verbose_name = "Componente"
		verbose_name_plural = "Componentes"
		ordering = ["nombre"]
