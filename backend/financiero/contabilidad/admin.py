from django.contrib import admin
from .models import Banco, CentroCosto, CuentaContable, Departamento, TipoCuenta

@admin.register(Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'estado']
    list_filter = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']
@admin.register(CuentaContable)
class CuentaContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_cuenta', 'nivel', 'estado']
    list_filter = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']
@admin.register(CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'estado']
    list_filter = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']
@admin.register(Banco)
class BancoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo_bancario', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre', 'codigo_bancario']
@admin.register(TipoCuenta)
class TipoCuentaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre']
