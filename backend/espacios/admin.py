from django.contrib import admin

from espacios.models import EspacioFisico
from espacios.models import EspacioPermitido

# Register your models here.
admin.site.register(EspacioFisico)
admin.site.register(EspacioPermitido)
