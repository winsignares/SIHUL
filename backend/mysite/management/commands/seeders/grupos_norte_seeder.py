"""
Seeder de grupos para Sede Norte.
Este archivo se llenará gradualmente con los datos específicos de la sede norte.
"""

from programas.models import Programa
from periodos.models import PeriodoAcademico
from grupos.models import Grupo


def create_grupos(stdout, style):
    """Crear grupos académicos de la sede norte"""
    stdout.write('  → Creando grupos sede norte...')
    
    # Mapeo de números romanos a enteros
    romanos_map = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
        'XI': 11, 'XII': 12
    }
    
    # Formato: (programa, periodo, nombre_grupo, semestre_romano)
    grupos_data = [
        # GRUPOS DE DERECHO
        ('Derecho', '2026-1', 'I DERECHO GB', 'I'),
        ('Derecho', '2026-1', 'I DERECHO GC', 'I'),
        ('Derecho', '2026-1', 'II DERECHO GA', 'II'),
        ('Derecho', '2026-1', 'II DERECHO GB', 'II'),
        ('Derecho', '2026-1', 'III DERECHO GB', 'III'),
        ('Derecho', '2026-1', 'III DERECHO GC', 'III'),
        ('Derecho', '2026-1', 'III DERECHO GD', 'III'),
        ('Derecho', '2026-1', 'V DERECHO GC', 'V'),
        
        # GRUPOS DE MEDICINA
        ('Medicina', '2026-1', 'I MEDICINA GA', 'I'),
        ('Medicina', '2026-1', 'I MEDICINA GB', 'I'),
        ('Medicina', '2026-1', 'II MEDICINA GA', 'II'),
        ('Medicina', '2026-1', 'II MEDICINA GB', 'II'),
        ('Medicina', '2026-1', 'III MEDICINA GA', 'III'),
        ('Medicina', '2026-1', 'III MEDICINA GB', 'III'),
        ('Medicina', '2026-1', 'IV MEDICINA GA', 'IV'),
        ('Medicina', '2026-1', 'IV MEDICINA GB', 'IV'),
        ('Medicina', '2026-1', 'V MEDICINA GA', 'V'),
        ('Medicina', '2026-1', 'V MEDICINA GB', 'V'),
        ('Medicina', '2026-1', 'VI MEDICINA GA', 'VI'),
        ('Medicina', '2026-1', 'VI MEDICINA GB', 'VI'),
        ('Medicina', '2026-1', 'IX MEDICINA GA', 'IX'),
        
        # GRUPOS DE BACTERIOLOGÍA
        ('Bacteriología', '2026-1', 'I BACTERIOLOGÍA GA', 'I'),
        ('Bacteriología', '2026-1', 'II BACTERIOLOGÍA GA', 'II'),
        ('Bacteriología', '2026-1', 'III BACTERIOLOGÍA GA', 'III'),
        ('Bacteriología', '2026-1', 'IV BACTERIOLOGÍA GA', 'IV'),
        
        # GRUPOS DE MICROBIOLOGÍA
        ('Microbiología', '2026-1', 'I MICROBIOLOGÍA GA', 'I'),
        ('Microbiología', '2026-1', 'II MICROBIOLOGÍA GA', 'II'),
        ('Microbiología', '2026-1', 'III MICROBIOLOGÍA GA', 'III'),
        ('Microbiología', '2026-1', 'IV MICROBIOLOGÍA GA', 'IV'),
        ('Microbiología', '2026-1', 'VI MICROBIOLOGÍA GA', 'VI'),
        
        # GRUPOS DE INSTRUMENTACIÓN QUIRÚRGICA
        ('Instrumentación Quirúrgica', '2026-1', 'I INSTRUMENTACIÓN GA', 'I'),
        ('Instrumentación Quirúrgica', '2026-1', 'II INSTRUMENTACIÓN GA', 'II'),
        ('Instrumentación Quirúrgica', '2026-1', 'III INSTRUMENTACIÓN GA', 'III'),
        ('Instrumentación Quirúrgica', '2026-1', 'III INSTRUMENTACIÓN GB', 'III'),
        
        # GRUPOS DE FISIOTERAPIA
        ('Fisioterapia', '2026-1', 'II FISIOTERAPIA GA', 'II'),
        ('Fisioterapia', '2026-1', 'II FISIOTERAPIA GB', 'II'),
        ('Fisioterapia', '2026-1', 'III FISIOTERAPIA GA', 'III'),
        ('Fisioterapia', '2026-1', 'III FISIOTERAPIA GB', 'III'),
        ('Fisioterapia', '2026-1', 'VI FISIOTERAPIA GA', 'VI'),
        ('Fisioterapia', '2026-1', 'VII FISIOTERAPIA GA', 'VII'),
        ('Fisioterapia', '2026-1', 'VIII FISIOTERAPIA GA', 'VIII'),
    ]
    
    created_count = 0
    skipped_count = 0
    
    try:
        # Obtener el periodo 2026-1
        periodo = PeriodoAcademico.objects.get(nombre='2026-1')
    except PeriodoAcademico.DoesNotExist:
        stdout.write(style.ERROR('    ✗ No existe el periodo 2026-1. Ejecuta primero create_periodos_academicos()'))
        return
    
    for nombre_programa, periodo_nombre, nombre_grupo, semestre_romano in grupos_data:
        try:
            # Obtener el programa
            programa = Programa.objects.get(nombre=nombre_programa)
            
            # Convertir semestre romano a número
            semestre = romanos_map.get(semestre_romano.strip())
            if not semestre:
                stdout.write(style.WARNING(f'    ⚠ Semestre inválido: {semestre_romano}'))
                skipped_count += 1
                continue
            
            # Crear o obtener el grupo
            grupo, created = Grupo.objects.get_or_create(
                programa=programa,
                periodo=periodo,
                nombre=nombre_grupo,
                semestre=semestre,
                defaults={'activo': True}
            )
            
            if created:
                created_count += 1
            else:
                skipped_count += 1
                
        except Programa.DoesNotExist:
            stdout.write(style.WARNING(f'    ⚠ Programa no encontrado: {nombre_programa}'))
            skipped_count += 1
        except Exception as e:
            stdout.write(style.WARNING(f'    ⚠ Error creando grupo {nombre_grupo}: {str(e)}'))
            skipped_count += 1
    
    total = len(grupos_data)
    stdout.write(style.SUCCESS(f'    ✓ {created_count} grupos creados, {skipped_count} omitidos ({total} totales)'))
