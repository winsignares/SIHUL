from django.db import models

class Agente(models.Model):
    nombre = models.CharField(max_length=100)
    subtitulo = models.CharField(max_length=200, blank=True, null=True)
    descripcion = models.TextField()
    icono = models.CharField(max_length=50, default='Bot')  # Nombre del icono Lucide
    color = models.CharField(max_length=20, default='blue')
    bg_gradient = models.CharField(max_length=100, default='from-blue-500 via-blue-600 to-indigo-600')
    activo = models.BooleanField(default=True)
    endpoint_url = models.URLField(max_length=500)
    mensaje_bienvenida = models.TextField()
    orden = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = 'Agente'
        verbose_name_plural = 'Agentes'
        ordering = ['orden', 'nombre']
    
    def __str__(self):
        return self.nombre

class PreguntaSugerida(models.Model):
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='preguntas')
    pregunta = models.TextField()
    orden = models.IntegerField(default=0)
    contador_uso = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Pregunta Sugerida'
        verbose_name_plural = 'Preguntas Sugeridas'
        ordering = ['agente', 'orden']
    
    def __str__(self):
        return f"{self.agente.nombre} - {self.pregunta[:50]}"
