from django.contrib import admin
from .models import Proveedor

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nit', 'razon_social', 'tipo_proveedor', 'estado']
    list_filter = ['estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social']
