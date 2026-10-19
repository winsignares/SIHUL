from django.contrib import admin
from .models import ParametroSLA, ParametrosFinanciero

@admin.register(ParametroSLA)
class ParametroSLAAdmin(admin.ModelAdmin):
    list_display = ['etapa', 'rol_responsable', 'dias_maximos', 'activo']
    list_filter = ['activo', 'rol_responsable']
    search_fields = ['etapa']
@admin.register(ParametrosFinanciero)
class ParametrosFinancieroAdmin(admin.ModelAdmin):
    list_display = ['clave', 'valor', 'categoria', 'editable']
    list_filter = ['categoria', 'editable']
    search_fields = ['clave']
