from django.contrib import admin
from .models import PrestamoEspacio, PrestamoEspacioPublico, TipoActividad, PrestamoRecurso

# Register your models here.
admin.site.register(PrestamoEspacio)
admin.site.register(PrestamoEspacioPublico)
admin.site.register(TipoActividad)
admin.site.register(PrestamoRecurso)