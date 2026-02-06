#!/usr/bin/env python
"""Script para verificar las relaciones AsignaturaPrograma por programa"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from programas.models import Programa
from asignaturas.models import AsignaturaPrograma

print("\n" + "="*60)
print("DISTRIBUCIÓN DE ASIGNATURAS POR PROGRAMA")
print("="*60 + "\n")

total_relaciones = 0
for programa in Programa.objects.all().order_by('nombre'):
    count = AsignaturaPrograma.objects.filter(programa=programa).count()
    total_relaciones += count
    print(f"{programa.nombre:45} {count:3} asignaturas")

print("\n" + "-"*60)
print(f"{'TOTAL':45} {total_relaciones:3} relaciones")
print("="*60 + "\n")
