"""
Seeder de grupos académicos.
"""

from programas.models import Programa
from periodos.models import PeriodoAcademico
from grupos.models import Grupo


def create_grupos(stdout, style):
    """Crear grupos académicos para el periodo 2026-1"""
    stdout.write('  → Creando grupos académicos...')
    
    # Mapeo de nombres de programas
    programas_map = {
        'ALIANZA CANADIENSE': 'Alianza Canadiense',
        'POSGRADO': 'Posgrado',
        'ING. INDUSTRIAL': 'Ingeniería Industrial',
        'ING. SISTEMAS': 'Ingeniería de Sistemas',
        'ADM. NEGOCIOS': 'Administración de Negocios Internacionales',
        'CONTADURIA': 'Contaduría Pública',
        'MEDICINA': 'Medicina',
        'DERECHO': 'Derecho',
        'BACTERIOLOGIA': 'Bacteriología',
        'CENTRO DE APOYO': 'Centro de Apoyo a la Superación Académica',
        'OTRO': 'Ninguna',

    }
    
    # Mapeo de números romanos a enteros
    romanos_map = {
        'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
        'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
        'XI': 11, 'XII': 12
    }
    
    # Formato: (nombre_programa_corto, periodo, nombre_grupo, semestre_romano)
    grupos_data = [
        
        # Alianza Canadiense
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 1', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 2', 'II'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 3', 'III'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 4', 'IV'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 5', 'V'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 6', 'VI'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 7', 'VII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 1', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 2', 'II'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 3', 'III'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 4', 'IV'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 5', 'V'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 6', 'VI'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 7', 'VII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 8', 'VIII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 9', 'IX'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 1', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 2', 'II'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 3', 'III'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 4', 'IV'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 5', 'V'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 6', 'VI'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SABATINO 7', 'VII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 1', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 2', 'II'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 3', 'III'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 4', 'IV'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 5', 'V'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 6', 'VI'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 7', 'VII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 1', 'I'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 2', 'II'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 3', 'III'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 4', 'IV'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 5', 'V'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 6', 'VI'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMI-INTENSIVO 7', 'VII'),
        
        # Ingeniería Industrial
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'I'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GB', 'I'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'II'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'III'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GB', 'III'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'IV'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GB', 'IV'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'V'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GB', 'V'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'VI'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'VII'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GB', 'VII'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'VIII'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'IX'),
        ('ING. INDUSTRIAL', '2026-1', 'ING. INDUSTRIAL GA', 'X'),
        
        # Ingeniería de Sistemas
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'I'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GB', 'I'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'II'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'IV'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GB', 'IV'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'V'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GB', 'V'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'VI'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'VII'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GB', 'VII'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'VIII'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GB', 'VIII'),
        ('ING. SISTEMAS', '2026-1', 'ING. SISTEMAS GA', 'X'),
        
                    
        # Derecho
        ('DERECHO', '2026-1', 'DERECHO A', 'I'),
        ('DERECHO', '2026-1', 'DERECHO B', 'I'),
        ('DERECHO', '2026-1', 'DERECHO C', 'I'),
        ('DERECHO', '2026-1', 'DERECHO D', 'I'),
        ('DERECHO', '2026-1', 'DERECHO E', 'I'),
        ('DERECHO', '2026-1', 'DERECHO F', 'I'),
        ('DERECHO', '2026-1', 'DERECHO AN', 'I'),
        ('DERECHO', '2026-1', 'DERECHO AN-E', 'I'),
        ('DERECHO', '2026-1', 'DERECHO AN-1E', 'I'),
        ('DERECHO', '2026-1', 'DERECHO A', 'II'),
        ('DERECHO', '2026-1', 'DERECHO B', 'II'),
        ('DERECHO', '2026-1', 'DERECHO C', 'II'),
        ('DERECHO', '2026-1', 'DERECHO D', 'II'),
        ('DERECHO', '2026-1', 'DERECHO A', 'III'),
        ('DERECHO', '2026-1', 'DERECHO B', 'III'),
        ('DERECHO', '2026-1', 'DERECHO C', 'III'),
        ('DERECHO', '2026-1', 'DERECHO D', 'III'),
        ('DERECHO', '2026-1', 'DERECHO AB', 'III'),
        ('DERECHO', '2026-1', 'DERECHO AD', 'III'),
        ('DERECHO', '2026-1', 'DERECHO A', 'IV'),
        ('DERECHO', '2026-1', 'DERECHO B', 'IV'),
        ('DERECHO', '2026-1', 'DERECHO C', 'IV'),
        ('DERECHO', '2026-1', 'DERECHO A', 'V'),
        ('DERECHO', '2026-1', 'DERECHO B', 'V'),
        ('DERECHO', '2026-1', 'DERECHO C', 'V'),
        ('DERECHO', '2026-1', 'DERECHO D', 'V'),
        ('DERECHO', '2026-1', 'DERECHO A', 'VI'),
        ('DERECHO', '2026-1', 'DERECHO B', 'VI'),
        ('DERECHO', '2026-1', 'DERECHO C', 'VI'),
        ('DERECHO', '2026-1', 'DERECHO A', 'VII'),
        ('DERECHO', '2026-1', 'DERECHO B', 'VII'),
        ('DERECHO', '2026-1', 'DERECHO C', 'VII'),
        ('DERECHO', '2026-1', 'DERECHO D', 'VII'),
        ('DERECHO', '2026-1', 'DERECHO A', 'VIII'),
        ('DERECHO', '2026-1', 'DERECHO B', 'VIII'),
        ('DERECHO', '2026-1', 'DERECHO C', 'VIII'),
        ('DERECHO', '2026-1', 'DERECHO A', 'IX'),
        ('DERECHO', '2026-1', 'DERECHO B', 'IX'),
        ('DERECHO', '2026-1', 'DERECHO C', 'IX'),
        ('DERECHO', '2026-1', 'DERECHO AN', 'IX'),
        ('DERECHO', '2026-1', 'DERECHO A', 'X'),
        ('DERECHO', '2026-1', 'DERECHO B', 'X'),
        ('DERECHO', '2026-1', 'DERECHO C', 'X'),
        
        # Administración de Negocios Internacionales
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS AN', 'I'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'I'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'II'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'III'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS AN', 'III'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'IV'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'V'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'VI'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS CD', 'VII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS AN', 'VII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS BN', 'VII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS EN', 'VII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS AN', 'VIII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS BN', 'VIII'),
        ('ADM. NEGOCIOS', '2026-1', 'ADM. NEGOCIOS EN', 'VIII'),
        
        # Contaduría Pública
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'I'),
        ('CONTADURIA', '2026-1', 'CONTADURIA GN', 'I'),
        ('CONTADURIA', '2026-1', 'CONTADURIA CD', 'I'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'II'),
        ('CONTADURIA', '2026-1', 'CONTADURIA CD', 'II'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'III'),
        ('CONTADURIA', '2026-1', 'CONTADURIA CD', 'III'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'IV'),
        ('CONTADURIA', '2026-1', 'CONTADURIA CD', 'IV'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'V'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'VI'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'VII'),
        ('CONTADURIA', '2026-1', 'CONTADURIA AN', 'VIII'),
        
        # Medicina
        ('MEDICINA', '2026-1', 'MEDICINA', 'I'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'I'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'II'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'II'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'IV'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'V'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'V'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'VI'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VI'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'VII'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VII'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'VIII'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VIII'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'IX'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'IX'),
        ('MEDICINA', '2026-1', 'MEDICINA', 'X'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'X'),

        #Bacteriología
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'V'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'VII'),

        
        ('POSGRADO', '2026-1', 'CLASES POSGRADOS', 'I'),

        ('CENTRO DE APOYO', '2026-1', 'CENTRO DE APOYO', 'I'),

    ]
    
    created_count = 0
    skipped_count = 0
    
    try:
        # Obtener el periodo 2026-1
        periodo = PeriodoAcademico.objects.get(nombre='2026-1')
    except PeriodoAcademico.DoesNotExist:
        stdout.write(style.ERROR('    ✗ No existe el periodo 2026-1. Ejecuta primero create_periodos_academicos()'))
        return
    
    for nombre_prog_corto, periodo_nombre, nombre_grupo, semestre_romano in grupos_data:
        try:
            # Obtener el programa
            nombre_programa_completo = programas_map.get(nombre_prog_corto)
            if not nombre_programa_completo:
                stdout.write(style.WARNING(f'    ⚠ Programa no mapeado: {nombre_prog_corto}'))
                skipped_count += 1
                continue
            
            programa = Programa.objects.get(nombre=nombre_programa_completo)
            
            # Convertir semestre romano a número
            semestre = romanos_map.get(semestre_romano.strip())
            if not semestre:
                stdout.write(style.WARNING(f'    ⚠ Semestre inválido: {semestre_romano}'))
                skipped_count += 1
                continue
            # Colocar Número Romano al Inicio del nombre del grupo
            if programa.nombre != 'Posgrado' and programa.nombre != 'Centro de Apoyo a la Superación Académica'  and nombre_grupo != 'ALIANZA SABATINO':
                nombre_grupo = f'{semestre_romano.strip()} {nombre_grupo}'
                
            
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
            stdout.write(style.WARNING(f'    ⚠ Programa no encontrado: {nombre_programa_completo}'))
            skipped_count += 1
        except Exception as e:
            stdout.write(style.WARNING(f'    ⚠ Error creando grupo {nombre_grupo}: {str(e)}'))
            skipped_count += 1
    
    total = len(grupos_data)
    stdout.write(style.SUCCESS(f'    ✓ {created_count} grupos creados, {skipped_count} omitidos ({total} totales)'))

