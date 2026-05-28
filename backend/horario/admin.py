from django.contrib import admin

from .models import Horario, HorarioFusionado, HorarioEstudiante, StgOracleHorario

@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'grupo',
        'asignatura',
        'docente',
        'espacio',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'estado',
    )
    list_filter = ('dia_semana', 'estado', 'espacio__sede')
    search_fields = (
        'id',
        'grupo__nombre',
        'asignatura__nombre',
        'docente__nombre',
        'docente__correo',
        'espacio__nombre',
    )
    list_select_related = ('grupo', 'asignatura', 'docente', 'espacio', 'espacio__sede')
    raw_id_fields = ('grupo', 'asignatura', 'docente', 'espacio')
    list_per_page = 50


@admin.register(HorarioFusionado)
class HorarioFusionadoAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'grupo1',
        'grupo2',
        'grupo3',
        'asignatura',
        'docente',
        'espacio',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
    )
    raw_id_fields = ('grupo1', 'grupo2', 'grupo3', 'asignatura', 'docente', 'espacio')
    list_select_related = ('grupo1', 'grupo2', 'grupo3', 'asignatura', 'docente', 'espacio')
    list_per_page = 50


@admin.register(HorarioEstudiante)
class HorarioEstudianteAdmin(admin.ModelAdmin):
    list_display = ('id', 'horario', 'estudiante')
    raw_id_fields = ('horario', 'estudiante')
    list_select_related = ('horario', 'estudiante')
    list_per_page = 50


@admin.register(StgOracleHorario)
class StgOracleHorarioAdmin(admin.ModelAdmin):
    list_display = (
        'external_id',
        'id_grupo_oracle',
        'id_asignatura_oracle',
        'id_sede_oracle',
        'nom_aula_oracle',
        'estado_registro',
        'fecha_carga',
    )
    search_fields = (
        'external_id',
        'id_grupo_oracle',
        'id_asignatura_oracle',
        'id_sede_oracle',
        'nom_aula_oracle',
    )
    list_filter = ('source_system', 'estado_registro', 'id_sede_oracle')
    readonly_fields = ('fecha_carga',)
    list_per_page = 50



