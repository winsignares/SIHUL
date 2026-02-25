#!/usr/bin/env python
"""Script para consultar horarios del grupo ALIANZA SABATINO"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mysite.settings')
django.setup()

from grupos.models import Grupo
from horario.models import Horario

# Buscar el grupo
grupo = Grupo.objects.filter(nombre='ALIANZA SABATINO').first()

if not grupo:
    print("❌ No se encontró el grupo 'ALIANZA SABATINO'")
    print("\nGrupos disponibles:")
    for g in Grupo.objects.all()[:10]:
        print(f"  - {g.nombre}")
else:
    print(f"✅ Grupo encontrado: {grupo.nombre}")
    print(f"   Programa: {grupo.programa.nombre}")
    print(f"   Periodo: {grupo.periodo}")
    print(f"   Semestre: {grupo.semestre}")
    print(f"   Activo: {grupo.activo}")
    
    # Consultar horarios
    horarios = Horario.objects.filter(grupo=grupo).select_related(
        'asignatura', 'docente', 'espacio'
    ).order_by('dia_semana', 'hora_inicio')
    
    print(f"\n{'='*100}")
    print(f"HORARIOS DEL GRUPO: {grupo.nombre}")
    print(f"{'='*100}")
    print(f"Total de horarios: {horarios.count()}\n")
    
    if horarios.count() > 0:
        for h in horarios:
            docente_nombre = h.docente.get_full_name() if h.docente else "Sin docente"
            print(f"ID: {h.id:4d} | {h.dia_semana:15s} | {h.hora_inicio} - {h.hora_fin} | "
                  f"Asignatura: {h.asignatura.nombre:40s} | "
                  f"Docente: {docente_nombre:30s} | "
                  f"Espacio: {h.espacio.nombre:20s} | "
                  f"Estado: {h.estado}")
    else:
        print("⚠️  No hay horarios asociados a este grupo")
    
    print(f"\n{'='*100}")
