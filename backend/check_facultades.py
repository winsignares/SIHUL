#!/usr/bin/env python
"""Script para verificar las facultades y sus programas con sedes"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from facultades.models import Facultad
from programas.models import Programa

print("\n" + "="*80)
print("FACULTADES Y SUS PROGRAMAS")
print("="*80 + "\n")

for facultad in Facultad.objects.all().order_by('nombre'):
    programas = Programa.objects.filter(facultad=facultad).order_by('nombre')
    print(f"📚 {facultad.nombre}")
    print(f"   Sede: {facultad.sede.nombre}")
    print(f"   Programas: {programas.count()}")
    for programa in programas:
        print(f"      • {programa.nombre} ({programa.semestres} semestres)")
    print()

print("="*80)
print(f"Total Facultades: {Facultad.objects.count()}")
print(f"Total Programas: {Programa.objects.count()}")
print("="*80 + "\n")
