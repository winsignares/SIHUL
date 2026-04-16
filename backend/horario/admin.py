from django.contrib import admin

from .models import Horario, HorarioFusionado, HorarioEstudiante, StgOracleHorario

# Register your models here.
admin.site.register(Horario)
admin.site.register(HorarioFusionado)
admin.site.register(HorarioEstudiante)
admin.site.register(StgOracleHorario)



