from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

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


class Conversacion(models.Model):
    """
    Modelo para almacenar conversaciones completas (pregunta + respuesta) con agentes de IA
    Cada registro representa una interacción completa: pregunta del usuario y respuesta del agente
    """
    # Identificador único del hilo de conversación
    chat_id = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    
    # Relaciones
    chatbot = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='conversaciones')
    id_usuario = models.IntegerField(db_index=True, help_text='ID del usuario que envió el mensaje')
    usuario = models.CharField(max_length=255, help_text='Nombre completo del usuario')
    
    # Contenido de la conversación (pregunta + respuesta en un solo registro)
    mensaje = models.TextField(help_text='Pregunta enviada por el usuario')
    respuesta = models.TextField(help_text='Respuesta generada por el agente IA')
    
    # Timestamp
    fecha = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        verbose_name = 'Conversación'
        verbose_name_plural = 'Conversaciones'
        ordering = ['-fecha']  # Más recientes primero
        indexes = [
            models.Index(fields=['chat_id', 'fecha']),
            models.Index(fields=['chatbot', 'id_usuario', 'fecha']),
            models.Index(fields=['id_usuario', 'fecha']),
        ]
    
    def __str__(self):
        return f"{self.usuario} -> {self.chatbot.nombre}: {self.mensaje[:50]} ({self.fecha.strftime('%Y-%m-%d %H:%M')})"
