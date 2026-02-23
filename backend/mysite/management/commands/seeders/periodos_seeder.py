"""
Seeder de periodos académicos.
"""

from datetime import date
from periodos.models import PeriodoAcademico


def create_periodos_academicos(stdout, style):
    """Crear periodos académicos"""
    stdout.write('  → Creando periodos académicos...')
    
    periodos_data = [
        {
            'nombre': '2026-1',
            'fecha_inicio': date(2026, 2, 2),
            'fecha_fin': date(2026, 6, 22),
            'activo': True
        },
        {
            'nombre': '2026-2',
            'fecha_inicio': date(2026, 7, 20),
            'fecha_fin': date(2026, 11, 30),
            'activo': False
        },
    ]
    
    created_count = 0
    for periodo_data in periodos_data:
        periodo, created = PeriodoAcademico.objects.get_or_create(
            nombre=periodo_data['nombre'],
            defaults={
                'fecha_inicio': periodo_data['fecha_inicio'],
                'fecha_fin': periodo_data['fecha_fin'],
                'activo': periodo_data['activo']
            }
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} periodos académicos creados ({len(periodos_data)} totales)'))

