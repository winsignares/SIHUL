from django.contrib import admin
from . import models
from mysite.auth_helpers import get_user_seccional_id, is_admin_global


class FinancieroTenantAdminMixin:
    seccional_lookup = 'seccional_id'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        user = getattr(request, 'user', None)
        if user and is_admin_global(user):
            return queryset

        seccional_id = get_user_seccional_id(user)
        if not seccional_id:
            return queryset.none()

        return queryset.filter(**{self.seccional_lookup: seccional_id})

    def save_model(self, request, obj, form, change):
        user = getattr(request, 'user', None)
        seccional_id = get_user_seccional_id(user)
        if seccional_id and hasattr(obj, 'seccional_id') and not is_admin_global(user):
            obj.seccional_id = seccional_id
        super().save_model(request, obj, form, change)

# Registrar modelos en el admin de Django
@admin.register(models.Proveedor)
class ProveedorAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['nit', 'razon_social', 'tipo_proveedor', 'seccional', 'estado']
    list_filter = ['seccional', 'estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social']

@admin.register(models.Departamento)
class DepartamentoAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'seccional', 'estado']
    list_filter = ['seccional', 'tipo', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(models.CuentaContable)
class CuentaContableAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo_cuenta', 'nivel', 'seccional', 'estado']
    list_filter = ['seccional', 'tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']

@admin.register(models.CentroCosto)
class CentroCostoAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'tipo', 'seccional', 'estado']
    list_filter = ['seccional', 'tipo', 'estado']
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
class FacturaAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['numero_factura', 'proveedor', 'seccional', 'valor_total', 'estado', 'fecha_recepcion']
    list_filter = ['seccional', 'estado', 'fecha_recepcion']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    readonly_fields = ['valor_neto_pagar', 'dias_transcurridos', 'fecha_creacion', 'fecha_modificacion']

@admin.register(models.DocumentoAdjunto)
class DocumentoAdjuntoAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    seccional_lookup = 'factura__seccional_id'
    list_display = ['nombre_archivo', 'factura', 'tipo_documento', 'fecha_carga']
    list_filter = ['tipo_documento', 'fecha_carga']
    search_fields = ['nombre_archivo']

@admin.register(models.HistorialFactura)
class HistorialFacturaAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    seccional_lookup = 'factura__seccional_id'
    list_display = ['factura', 'accion', 'usuario', 'fecha_accion']
    list_filter = ['accion', 'fecha_accion']
    search_fields = ['factura__numero_factura']
    readonly_fields = ['fecha_accion']

@admin.register(models.ParametroSLA)
class ParametroSLAAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['etapa', 'rol_responsable', 'dias_maximos', 'seccional', 'activo']
    list_filter = ['seccional', 'activo', 'rol_responsable']
    search_fields = ['etapa']

@admin.register(models.ParametrosFinanciero)
class ParametrosFinancieroAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['clave', 'valor', 'categoria', 'seccional', 'editable']
    list_filter = ['seccional', 'categoria', 'editable']
    search_fields = ['clave']

@admin.register(models.ReporteGenerado)
class ReporteGeneradoAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    list_display = ['nombre_reporte', 'tipo_reporte', 'formato', 'seccional', 'fecha_generacion']
    list_filter = ['seccional', 'tipo_reporte', 'formato', 'fecha_generacion']
    search_fields = ['nombre_reporte']

@admin.register(models.ComentarioFactura)
class ComentarioFacturaAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    seccional_lookup = 'factura__seccional_id'
    list_display = ['factura', 'usuario', 'tipo', 'fecha_creacion']
    list_filter = ['tipo', 'fecha_creacion']
    search_fields = ['factura__numero_factura']

@admin.register(models.RechazoDevolucion)
class RechazoDevolacionAdmin(FinancieroTenantAdminMixin, admin.ModelAdmin):
    seccional_lookup = 'factura__seccional_id'
    list_display = ['factura', 'etapa_rechazo', 'tipo', 'fecha_rechazo']
    list_filter = ['tipo', 'etapa_rechazo', 'fecha_rechazo']
    search_fields = ['factura__numero_factura']
