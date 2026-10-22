from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models.functions import Lower
from django.contrib.auth import get_user_model
from django.utils import timezone
import os
import uuid

User = get_user_model()

class Agente(models.Model):
    # Perfil de comportamiento del asistente (prompt, tono, reglas de respuesta). Los
    # perfiles se definen en el servicio RAG (chatbot/app/core/profiles.py).
    TIPO_NORMATIVO = 'normativo'
    TIPO_INVESTIGATIVO = 'investigativo'
    TIPO_CHOICES = [
        (TIPO_NORMATIVO, 'Normativo (reglamentos, manuales, procedimientos)'),
        (TIPO_INVESTIGATIVO, 'Investigativo (monografías, tesis, artículos)'),
    ]

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
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default=TIPO_NORMATIVO)
    # Tope de documentos del agente por sede (1 a 10). Vacío = el del tipo (ver
    # limite_documentos); debe coincidir con los perfiles del servicio RAG.
    max_documentos = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
    )
    # Seccionales donde está disponible. Vacío = todas (así quedan los chatbots que ya existían).
    seccionales = models.ManyToManyField(
        'sedes.Seccional', blank=True, related_name='chatbots',
        help_text='Seccionales donde está disponible este chatbot. Vacío = todas las seccionales.',
    )
    instrucciones_adicionales = models.TextField(
        max_length=2000,
        blank=True,
        default='',
        help_text='Ajustes finos de comportamiento que se añaden al perfil del tipo '
                  '(p. ej. "responde siempre en inglés"). No pueden anular la regla de '
                  'responder solo con los documentos cargados.',
    )
    
    def valores_sede(self):
        """Seccionales donde está disponible, con el nombre que usa el RAG (vacío = todas)."""
        from .sedes import normalizar_sede

        return {normalizar_sede(s.ciudad) for s in self.seccionales.all()} - {None}

    def disponible_en(self, sede_value):
        valores = self.valores_sede()
        return not valores or sede_value in valores

    class Meta:
        verbose_name = 'Agente'
        verbose_name_plural = 'Agentes'
        ordering = [Lower('nombre')]
    
    @property
    def limite_documentos(self):
        if self.max_documentos:
            return self.max_documentos
        return 5 if self.tipo == self.TIPO_INVESTIGATIVO else 10

    def __str__(self):
        return self.nombre


class AgenteResponsable(models.Model):
    """Persona encargada de cargar la documentación de un chatbot.

    Quien no administra chatbots solo puede gestionar los documentos y las preguntas-respuestas
    de los chatbots que tiene asignados aquí. La seccional con la que sube sale de su propio
    usuario, no de lo que envíe el navegador.
    """
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='responsables')
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='chatbots_asignados')
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Responsable de chatbot'
        verbose_name_plural = 'Responsables de chatbots'
        constraints = [
            models.UniqueConstraint(fields=['agente', 'usuario'], name='uniq_agente_responsable'),
        ]

    def __str__(self):
        return f'{self.usuario_id} -> {self.agente_id}'


class PreguntaSugerida(models.Model):
    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='preguntas')
    pregunta = models.TextField()
    # Seccional a la que aplica la pregunta; vacío = todas las seccionales.
    seccional = models.ForeignKey(
        'sedes.Seccional', null=True, blank=True, on_delete=models.CASCADE, related_name='preguntas_sugeridas',
    )
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

    # Documentos de soporte que acompañaron la respuesta, para volver a ofrecerlos al
    # reabrir el historial. Si un anexo se elimina, simplemente deja de aparecer.
    anexos = models.ManyToManyField(
        'AnexoRespuesta',
        blank=True,
        related_name='conversaciones',
        help_text='Anexos (documentos de soporte) entregados con la respuesta',
    )
    
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


class PreguntaRespuesta(models.Model):
    """
    Pareja pregunta | respuesta oficial de un agente en una sede, con sus anexos
    (documentos de soporte que la persona debe presentar o diligenciar).

    El servicio RAG (chatbot/app/services/qa_service.py) lee esta tabla directamente:
    compara la pregunta del usuario con `pregunta`, usa la respuesta como contexto
    prioritario y, si la pareja corresponde a lo preguntado, entrega sus anexos junto
    con la respuesta del chatbot.
    """

    agente = models.ForeignKey(Agente, on_delete=models.CASCADE, related_name='preguntas_respuestas')
    # Mismo valor de sede que usa el servicio RAG ('barranquilla', 'bogota', ...).
    sede = models.CharField(max_length=50, db_index=True)
    pregunta = models.TextField()
    respuesta = models.TextField()
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Pregunta y respuesta'
        verbose_name_plural = 'Preguntas y respuestas'
        ordering = ['agente_id', '-actualizado']
        indexes = [models.Index(fields=['agente', 'sede', 'activo'])]

    def __str__(self):
        return f'{self.agente.nombre} ({self.sede}) - {self.pregunta[:50]}'


def anexo_respuesta_upload_to(instance, filename):
    # Nombre aleatorio en disco: la ruta no debe poder adivinarse. El nombre original se
    # conserva en AnexoRespuesta.nombre y es el que recibe quien lo descarga.
    extension = os.path.splitext(filename)[1].lower()
    return f'chatbot/anexos/{timezone.now():%Y/%m}/{uuid.uuid4().hex}{extension}'


class AnexoRespuesta(models.Model):
    """Documento de soporte (Word, PDF o Excel) adjunto a una pregunta-respuesta."""

    pregunta_respuesta = models.ForeignKey(PreguntaRespuesta, on_delete=models.CASCADE, related_name='anexos')
    archivo = models.FileField(upload_to=anexo_respuesta_upload_to, max_length=255)
    nombre = models.CharField(max_length=255, help_text='Nombre original del archivo')
    tipo_mime = models.CharField(max_length=150)
    tamano = models.PositiveIntegerField(help_text='Tamaño en bytes')
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Anexo de respuesta'
        verbose_name_plural = 'Anexos de respuestas'
        ordering = ['id']

    @property
    def extension(self):
        return os.path.splitext(self.nombre)[1].lower().lstrip('.')

    def __str__(self):
        return self.nombre


class ChatbotDocument(models.Model):
    # Tabla creada y mantenida por el servicio RAG (FastAPI): managed=False, estos campos
    # solo reflejan sus columnas para poder consultarlas desde el admin.
    filename = models.CharField(max_length=255)
    content = models.TextField()
    content_hash = models.CharField(max_length=64, null=True, blank=True)
    embedding_model = models.CharField(max_length=100, null=True, blank=True)
    perfil = models.CharField(max_length=20, null=True, blank=True)
    prioridad = models.IntegerField(null=True, blank=True)  # 1 = la más alta en su chatbot y sede
    chatbot = models.ForeignKey(
        Agente,
        on_delete=models.DO_NOTHING,
        db_column='chatbot_id',
        db_constraint=False,
        null=True,
        blank=True,
        related_name='documentos',
    )
    sede = models.CharField(max_length=50, db_index=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'documents'
        verbose_name = 'Documento del Chatbot'
        verbose_name_plural = 'Documentos del Chatbot'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.filename} ({self.sede})'


class ChatbotChunk(models.Model):
    document = models.ForeignKey(
        ChatbotDocument,
        on_delete=models.DO_NOTHING,
        db_column='document_id',
        related_name='chunks',
    )
    text = models.TextField()
    page = models.IntegerField(null=True, blank=True)
    chatbot = models.ForeignKey(
        Agente,
        on_delete=models.DO_NOTHING,
        db_column='chatbot_id',
        db_constraint=False,
        null=True,
        blank=True,
        related_name='chunks',
    )
    sede = models.CharField(max_length=50, db_index=True)

    class Meta:
        managed = False
        db_table = 'chunks'
        verbose_name = 'Fragmento del Chatbot'
        verbose_name_plural = 'Fragmentos del Chatbot'

    def __str__(self):
        return f'{self.document.filename} - {self.text[:50]}'


class ChatbotAppMessage(models.Model):
    nombre = models.CharField(max_length=150)
    # Hilo (mismo chat_id que Conversacion) y usuario que preguntó, para cruzar ambos registros
    chat_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    id_usuario = models.BigIntegerField(null=True, blank=True, db_index=True)
    chatbot = models.ForeignKey(
        Agente,
        on_delete=models.DO_NOTHING,
        db_column='chatbot_id',
        db_constraint=False,
        null=True,
        blank=True,
        related_name='mensajes_app',
    )
    sede = models.CharField(max_length=50, db_index=True)
    question = models.TextField()
    answer = models.TextField()
    relevance_score = models.FloatField(default=0.0)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'chat_messages'
        verbose_name = 'Mensaje del Chatbot App'
        verbose_name_plural = 'Mensajes del Chatbot App'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.sede}): {self.question[:50]}'
