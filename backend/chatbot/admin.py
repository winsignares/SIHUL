from django.contrib import admin
from .models import (
    Agente,
    ChatbotAppMessage,
    ChatbotChunk,
    ChatbotDocument,
    Conversacion,
    PreguntaSugerida,
)


class ChatbotAppAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

@admin.register(Agente)
class AgenteAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'orden']
    list_filter = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering = ['orden']

@admin.register(PreguntaSugerida)
class PreguntaSugeridaAdmin(admin.ModelAdmin):
    list_display = ['pregunta_corta', 'agente', 'contador_uso', 'activo', 'orden']
    list_filter = ['agente', 'activo']
    search_fields = ['pregunta']
    ordering = ['agente', 'orden']
    
    def pregunta_corta(self, obj):
        return obj.pregunta[:75] + '...' if len(obj.pregunta) > 75 else obj.pregunta
    pregunta_corta.short_description = 'Pregunta'

@admin.register(Conversacion)
class ConversacionAdmin(admin.ModelAdmin):
    list_display = ['id', 'chat_id_corto', 'chatbot', 'id_usuario', 'usuario', 'mensaje_corto', 'respuesta_corta', 'fecha']
    list_filter = ['chatbot', 'fecha']
    search_fields = ['usuario', 'mensaje', 'respuesta', 'chat_id']
    readonly_fields = ['chat_id', 'fecha']
    ordering = ['-fecha']
    date_hierarchy = 'fecha'
    
    def chat_id_corto(self, obj):
        return str(obj.chat_id)[:8] + '...'
    chat_id_corto.short_description = 'Chat ID'
    
    def mensaje_corto(self, obj):
        return obj.mensaje[:60] + '...' if len(obj.mensaje) > 60 else obj.mensaje
    mensaje_corto.short_description = 'Mensaje'
    
    def respuesta_corta(self, obj):
        return obj.respuesta[:60] + '...' if len(obj.respuesta) > 60 else obj.respuesta
    respuesta_corta.short_description = 'Respuesta'


@admin.register(ChatbotDocument)
class ChatbotDocumentAdmin(ChatbotAppAdmin):
    list_display = ['id', 'filename', 'sede', 'created_at', 'content_corto']
    list_filter = ['sede', 'created_at']
    search_fields = ['filename', 'content', 'sede']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def content_corto(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_corto.short_description = 'Contenido'


@admin.register(ChatbotChunk)
class ChatbotChunkAdmin(ChatbotAppAdmin):
    list_display = ['id', 'document', 'sede', 'text_corto']
    list_filter = ['sede']
    search_fields = ['text', 'sede', 'document__filename']
    readonly_fields = ['id']

    def text_corto(self, obj):
        return obj.text[:80] + '...' if len(obj.text) > 80 else obj.text
    text_corto.short_description = 'Texto'


@admin.register(ChatbotAppMessage)
class ChatbotAppMessageAdmin(ChatbotAppAdmin):
    list_display = ['id', 'nombre', 'sede', 'relevance_score', 'question_corta', 'answer_corta', 'created_at']
    list_filter = ['sede', 'created_at']
    search_fields = ['nombre', 'sede', 'question', 'answer']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    def question_corta(self, obj):
        return obj.question[:60] + '...' if len(obj.question) > 60 else obj.question
    question_corta.short_description = 'Pregunta'

    def answer_corta(self, obj):
        return obj.answer[:60] + '...' if len(obj.answer) > 60 else obj.answer
    answer_corta.short_description = 'Respuesta'
