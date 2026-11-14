from django.contrib import admin
from identidad.componentes.models import Componente
from identidad.componentes.models import ComponenteRol

# Register your models here.
admin.site.register(Componente)
admin.site.register(ComponenteRol)