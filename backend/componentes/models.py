from django.db import models


class Componente(models.Model):
	id = models.AutoField(primary_key=True)
	nombre = models.CharField(max_length=255)
	descripcion = models.TextField(blank=True, null=True)

	def __str__(self):
		return self.nombre or str(self.id)
