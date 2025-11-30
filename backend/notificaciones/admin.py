from django.contrib import admin
from .models import Notificacion

@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('tipo_notificacion', 'id_usuario', 'prioridad', 'es_leida', 'fecha_creacion')
    list_filter = ('tipo_notificacion', 'prioridad', 'es_leida', 'fecha_creacion')
    search_fields = ('mensaje', 'id_usuario')
    readonly_fields = ('fecha_creacion',)
    
    fieldsets = (
        ('Información del Usuario', {
            'fields': ('id_usuario',)
        }),
        ('Contenido de la Notificación', {
            'fields': ('tipo_notificacion', 'mensaje', 'prioridad')
        }),
        ('Estado de Lectura', {
            'fields': ('es_leida',)
        }),
        ('Timestamps', {
            'fields': ('fecha_creacion',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['marcar_como_leida', 'marcar_como_no_leida']
    
    def marcar_como_leida(self, request, queryset):
        """Acción para marcar notificaciones como leídas"""
        count = 0
        for notificacion in queryset:
            notificacion.marcar_como_leida()
            count += 1
        self.message_user(request, f'{count} notificación(es) marcada(s) como leída(s).')
    marcar_como_leida.short_description = 'Marcar como leída'
    
    def marcar_como_no_leida(self, request, queryset):
        """Acción para marcar notificaciones como no leídas"""
        queryset.update(es_leida=False, fecha_lectura=None)
        self.message_user(request, f'{queryset.count()} notificación(es) marcada(s) como no leída(s).')
    marcar_como_no_leida.short_description = 'Marcar como no leída'
