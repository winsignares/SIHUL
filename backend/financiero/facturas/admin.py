from django.contrib import admin
from .models import ComentarioFactura, DocumentoAdjunto, Factura, HistorialFactura, RechazoDevolucion

@admin.register(Factura)
class FacturaAdmin(admin.ModelAdmin):
    list_display = ['numero_factura', 'proveedor', 'valor_total', 'estado', 'fecha_recepcion']
    list_filter = ['estado', 'fecha_recepcion']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    readonly_fields = ['valor_neto_pagar', 'dias_transcurridos', 'fecha_creacion', 'fecha_modificacion']
@admin.register(DocumentoAdjunto)
class DocumentoAdjuntoAdmin(admin.ModelAdmin):
    list_display = ['nombre_archivo', 'factura', 'tipo_documento', 'fecha_carga']
    list_filter = ['tipo_documento', 'fecha_carga']
    search_fields = ['nombre_archivo']
@admin.register(HistorialFactura)
class HistorialFacturaAdmin(admin.ModelAdmin):
    list_display = ['factura', 'accion', 'usuario', 'fecha_accion']
    list_filter = ['accion', 'fecha_accion']
    search_fields = ['factura__numero_factura']
    readonly_fields = ['fecha_accion']
@admin.register(ComentarioFactura)
class ComentarioFacturaAdmin(admin.ModelAdmin):
    list_display = ['factura', 'usuario', 'tipo', 'fecha_creacion']
    list_filter = ['tipo', 'fecha_creacion']
    search_fields = ['factura__numero_factura']
@admin.register(RechazoDevolucion)
class RechazoDevolacionAdmin(admin.ModelAdmin):
    list_display = ['factura', 'etapa_rechazo', 'tipo', 'fecha_rechazo']
    list_filter = ['tipo', 'etapa_rechazo', 'fecha_rechazo']
    search_fields = ['factura__numero_factura']
