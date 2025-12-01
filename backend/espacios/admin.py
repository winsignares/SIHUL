from django.contrib import admin
from .models import EspacioFisico, EspacioPermitido, TipoEspacio

# Register your models here.
admin.site.register(EspacioFisico)
admin.site.register(EspacioPermitido)
admin.site.register(TipoEspacio)
