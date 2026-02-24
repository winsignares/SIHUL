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
        'ING. INDUSTRIAL': 'Ingeniería Industrial',
        'ING. SISTEMAS': 'Ingeniería de Sistemas',
        'ADM. NEGOCIOS': 'Administración de Negocios Internacionales',
        'CONTADURIA': 'Contaduría Pública',
        'MEDICINA': 'Medicina',
        'DERECHO': 'Derecho',
        'FISIOTERAPIA': 'Fisioterapia',
        'BACTERIOLOGIA': 'Bacteriología',
        'INSTRUMENTACION': 'Instrumentación Quirúrgica',
        'MICROBIOLOGIA': 'Microbiología',
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
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA INTENSIVO 7', 'VII'),
        ('ALIANZA CANADIENSE', '2026-1', 'ALIANZA SEMESTRAL 4', 'IV'),
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
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'I'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'I'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'II'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'II'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'IV'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'V'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'V'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'VI'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VI'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'VII'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VII'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'VIII'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'VIII'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'IX'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'IX'),
        ('MEDICINA', '2026-1', 'MEDICINA GA', 'X'),
        ('MEDICINA', '2026-1', 'MEDICINA GB', 'X'),

        #Bacteriología
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'I'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'I'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'II'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'II'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'III'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'III'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'IV'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'IV'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'V'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'V'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'VI'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'VI'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'VII'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'VII'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'VIII'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'VIII'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'IX'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GB', 'IX'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGIA GA', 'X'),
        ('BACTERIOLOGIA', '2026-1', 'BACTERIOLOGÍA GB', 'X'),

        #MICROBIOLOGIA
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'I'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'I'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'II'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'II'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'III'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'III'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'IV'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'IV'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'V'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'V'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'VI'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'VI'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'VII'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'VII'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'VIII'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'VIII'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'IX'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'IX'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GA', 'X'),
        ('MICROBIOLOGIA', '2026-1', 'MICROBIOLOGIA GB', 'X'),

        # Intrumentación

            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'I'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'I'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'II'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'II'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'III'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'III'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'IV'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'IV'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'V'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'V'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'VI'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'VI'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'VII'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'VII'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'VIII'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'VIII'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'IX'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'IX'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GA', 'X'),
            ('INSTRUMENTACION', '2026-1', 'INSTRUMENTACION GB', 'X'),

        # Fisioterapia
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'I'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'I'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'II'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'II'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'III'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'III'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'IV'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'IV'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'V'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'V'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'VI'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'VI'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'VII'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'VII'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'VIII'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'VIII'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'IX'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GB', 'IX'),
        ('FISIOTERAPIA', '2026-1', 'FISIOTERAPIA GA', 'X'),

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

