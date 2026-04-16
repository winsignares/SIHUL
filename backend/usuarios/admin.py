from django.contrib import admin
from django.contrib import messages
from .models import Rol, StgOracleDocente, StgOracleEstudiante, Usuario

admin.site.register(Rol)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
	list_display = ('id', 'correo', 'nombre', 'activo', 'is_superuser', 'es_superusuario')
	search_fields = ('correo', 'nombre')
	list_filter = ('activo', 'is_superuser', 'es_superusuario', 'rol')

	def delete_model(self, request, obj):
		if obj.is_superuser or obj.es_superusuario:
			obj.activo = False
			obj.is_active = False
			obj.save(update_fields=['activo', 'is_active'])
			self.message_user(
				request,
				f'Superusuario {obj.correo} desactivado en lugar de eliminado para conservar trazabilidad.',
				level=messages.WARNING,
			)
			return
		super().delete_model(request, obj)

	def delete_queryset(self, request, queryset):
		superusers_qs = queryset.filter(is_superuser=True) | queryset.filter(es_superusuario=True)
		superusers_qs = superusers_qs.distinct()
		normal_qs = queryset.exclude(pk__in=superusers_qs.values_list('pk', flat=True))

		if superusers_qs.exists():
			updated = superusers_qs.update(activo=False, is_active=False)
			self.message_user(
				request,
				f'{updated} superusuario(s) desactivado(s) en lugar de eliminado(s) para conservar trazabilidad.',
				level=messages.WARNING,
			)

		if normal_qs.exists():
			super().delete_queryset(request, normal_qs)


@admin.register(StgOracleDocente)
class StgOracleDocenteAdmin(admin.ModelAdmin):
	list_display = ('external_id', 'id_docente_oracle', 'nombre_completo', 'correo_institucional', 'estado_docente', 'fecha_carga')
	search_fields = ('external_id', 'id_docente_oracle', 'numero_documento', 'nombre_completo', 'correo_institucional')
	list_filter = ('source_system', 'estado_docente', 'estado_registro')
	readonly_fields = ('fecha_carga',)


@admin.register(StgOracleEstudiante)
class StgOracleEstudianteAdmin(admin.ModelAdmin):
	list_display = ('external_id', 'id_estudiante_oracle', 'codigo_estudiante_oracle', 'nombre_completo', 'periodo_academico', 'fecha_carga')
	search_fields = ('external_id', 'id_estudiante_oracle', 'codigo_estudiante_oracle', 'nombre_completo')
	list_filter = ('source_system', 'periodo_academico', 'estado_registro')
	readonly_fields = ('fecha_carga',)