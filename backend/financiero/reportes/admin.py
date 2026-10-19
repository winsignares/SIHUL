from django.contrib import admin
from .models import ReporteGenerado

@admin.register(ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    list_display = ['nombre_reporte', 'tipo_reporte', 'formato', 'fecha_generacion']
    list_filter = ['tipo_reporte', 'formato', 'fecha_generacion']
    search_fields = ['nombre_reporte']
