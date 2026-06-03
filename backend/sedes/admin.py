from django.contrib import admin

from sedes.models import (
	MapOracleSedeSeccional,
	OracleSyncIssue,
	OracleSyncRun,
	Seccional,
	Sede,
	StgOracleFacultad,
	StgOracleSede,
)

# Register your models here.


@admin.register(Seccional)
class SeccionalAdmin(admin.ModelAdmin):
	list_display = ('id', 'ciudad', 'activa')
	search_fields = ('ciudad',)
	list_filter = ('activa',)


@admin.register(Sede)
class SedeAdmin(admin.ModelAdmin):
	list_display = ('id', 'nombre', 'seccional', 'source_system', 'external_id', 'activa')
	search_fields = ('nombre', 'external_id')
	list_filter = ('activa', 'source_system', 'seccional')


@admin.register(StgOracleSede)
class StgOracleSedeAdmin(admin.ModelAdmin):
	list_display = ('id', 'source_system', 'external_id', 'nombre_sede', 'fecha_carga')
	search_fields = ('external_id', 'nombre_sede')
	list_filter = ('source_system',)
	readonly_fields = ('fecha_carga', 'row_hash', 'raw_data')


@admin.register(StgOracleFacultad)
class StgOracleFacultadAdmin(admin.ModelAdmin):
	list_display = (
		'id',
		'source_system',
		'external_id',
		'id_sede_oracle',
		'nombre_facultad',
		'fecha_carga',
	)
	search_fields = ('external_id', 'id_sede_oracle', 'nombre_facultad', 'nombre_sede_oracle')
	list_filter = ('source_system',)
	readonly_fields = ('fecha_carga', 'row_hash', 'raw_data')


@admin.register(MapOracleSedeSeccional)
class MapOracleSedeSeccionalAdmin(admin.ModelAdmin):
	list_display = (
		'id',
		'source_system',
		'external_id_oracle',
		'nombre_oracle',
		'seccional',
		'sede',
		'metodo_asignacion',
		'estado',
		'confianza',
		'updated_at',
	)
	search_fields = ('external_id_oracle', 'nombre_oracle', 'observaciones')
	list_filter = ('source_system', 'metodo_asignacion', 'estado')
	readonly_fields = ('created_at', 'updated_at', 'ultimo_hash_oracle')


@admin.register(OracleSyncRun)
class OracleSyncRunAdmin(admin.ModelAdmin):
	list_display = ('id', 'source_system', 'run_type', 'dry_run', 'status', 'started_at', 'finished_at')
	list_filter = ('source_system', 'run_type', 'dry_run', 'status')
	readonly_fields = ('started_at', 'finished_at', 'report')


@admin.register(OracleSyncIssue)
class OracleSyncIssueAdmin(admin.ModelAdmin):
	list_display = ('id', 'run', 'issue_type', 'severity', 'external_id', 'resolved', 'created_at')
	list_filter = ('severity', 'resolved', 'source_system', 'issue_type')
	search_fields = ('external_id', 'issue_type', 'message')
	readonly_fields = ('created_at', 'payload')

