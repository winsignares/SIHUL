from django.contrib import admin
from .models import Agente, PreguntaSugerida

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
