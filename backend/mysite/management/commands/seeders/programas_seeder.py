"""
Seeder de programas académicos.
"""

from facultades.models import Facultad
from programas.models import Programa


def create_programas(stdout, style):
    """Crear programas académicos"""
    stdout.write('  → Creando programas académicos...')
    
    programas_data = [
        ('Facultad de Derecho, Ciencias Políticas y Sociales', 'Derecho', 10, True),
        ('Facultad de Ciencias Económicas, Administrativas y Contables', 'Administración de Negocios Internacionales', 8, True),
        ('Facultad de Ciencias Económicas, Administrativas y Contables', 'Contaduría Pública', 8, True),
        ('Facultad de Ciencias de la Salud', 'Medicina', 12, True),
        ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Bacteriología', 9, True),
        ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Microbiología', 10, True),
        ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Fisioterapia', 8, True),
        ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Instrumentación Quirúrgica', 8, True),
        ('Facultad de Ingeniería', 'Ingeniería de Sistemas', 10, True),
        ('Facultad de Ingeniería', 'Ingeniería Industrial', 10, True),
        ('Ninguna','Alianza Canadiense', 10, True),
    ]
    
    created_count = 0
    for nombre_facultad, nombre_programa, semestres, activo in programas_data:
        try:
            facultad = Facultad.objects.get(nombre=nombre_facultad)
            _, created = Programa.objects.get_or_create(
                nombre=nombre_programa,
                facultad=facultad,
                defaults={'semestres': semestres, 'activo': activo}
            )
            if created:
                created_count += 1
        except Facultad.DoesNotExist:
            stdout.write(style.WARNING(f'    ! Facultad no encontrada: {nombre_facultad}, registrando sin facultad'))
            _, created = Programa.objects.get_or_create(
                nombre=nombre_programa,
                facultad=None,
                defaults={'semestres': semestres, 'activo': activo}
            )
            if created:
                created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} programas creados ({len(programas_data)} totales)'))

