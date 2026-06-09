from django.contrib import admin
from . import models

# Registrar modelos en el admin de Django
@admin.register(models.Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nit', 'razon_social', 'tipo_proveedor', 'estado']
    list_filter = ['estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social']

@admin.register(models.Departamento)
class DepartamentoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'estado']
    list_filter = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(models.CuentaContable)
class CuentaContableAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_cuenta', 'nivel', 'estado']
    list_filter = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(models.CentroCosto)
class CentroCostoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'estado']
    list_filter = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(models.Banco)
class BancoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo_bancario', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre', 'codigo_bancario']

@admin.register(models.TipoCuenta)
class TipoCuentaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo']
    search_fields = ['nombre']

@admin.register(models.Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ['numero_factura', 'proveedor', 'valor_total', 'estado', 'fecha_recepcion']
    list_filter = ['estado', 'fecha_recepcion']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    readonly_fields = ['valor_neto_pagar', 'dias_transcurridos', 'fecha_creacion', 'fecha_modificacion']

@admin.register(models.DocumentoAdjunto)
class DocumentoAdjuntoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'factura', 'tipo_documento', 'fecha_carga']
    list_filter = ['tipo_documento', 'fecha_carga']
    search_fields = ['nombre_archivo']

@admin.register(models.HistorialFactura)
class HistorialFacturaAdmin(admin.ModelAdmin):
    list_display = ['factura', 'accion', 'usuario', 'fecha_accion']
    list_filter = ['accion', 'fecha_accion']
    search_fields = ['factura__numero_factura']
    readonly_fields = ['fecha_accion']

@admin.register(models.ParametroSLA)
class ParametroSLAAdmin(admin.ModelAdmin):
    list_display = ['etapa', 'rol_responsable', 'dias_maximos', 'activo']
    list_filter = ['activo', 'rol_responsable']
    search_fields = ['etapa']

@admin.register(models.ParametrosFinanciero)
class ParametrosFinancieroAdmin(admin.ModelAdmin):
    list_display = ['clave', 'valor', 'categoria', 'editable']
    list_filter = ['categoria', 'editable']
    search_fields = ['clave']

@admin.register(models.ReporteGenerado)
class ReporteGeneradoAdmin(admin.ModelAdmin):
    list_display = ['nombre_reporte', 'tipo_reporte', 'formato', 'fecha_generacion']
    list_filter = ['tipo_reporte', 'formato', 'fecha_generacion']
    search_fields = ['nombre_reporte']

@admin.register(models.ComentarioFactura)
class ComentarioFacturaAdmin(admin.ModelAdmin):
    list_display = ['factura', 'usuario', 'tipo', 'fecha_creacion']
    list_filter = ['tipo', 'fecha_creacion']
    search_fields = ['factura__numero_factura']

@admin.register(models.RechazoDevolucion)
class RechazoDevolacionAdmin(admin.ModelAdmin):
    list_display = ['factura', 'etapa_rechazo', 'tipo', 'fecha_rechazo']
    list_filter = ['tipo', 'etapa_rechazo', 'fecha_rechazo']
    search_fields = ['factura__numero_factura']
