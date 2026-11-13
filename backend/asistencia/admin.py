from django.contrib import admin

from .models import AsignacionPractica, ConsentimientoUbicacion, LugarPractica, RegistroAsistencia

admin.site.register(LugarPractica)
admin.site.register(AsignacionPractica)
admin.site.register(ConsentimientoUbicacion)
admin.site.register(RegistroAsistencia)
