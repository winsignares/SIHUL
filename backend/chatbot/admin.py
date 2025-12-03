from django.contrib import admin
from .models import Agente, PreguntaSugerida, Conversacion

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
