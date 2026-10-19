from django.contrib import admin
from .models import Recurso
from .models import EspacioRecurso

# Register your models here.
admin.site.register(Recurso)
admin.site.register(EspacioRecurso)