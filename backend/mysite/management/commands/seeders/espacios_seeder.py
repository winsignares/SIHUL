"""
Seeder de espacios físicos de las sedes.
"""

from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico


def create_espacios_fisicos(stdout, style):
    """Crear espacios físicos de ambas sedes"""
    stdout.write('  → Creando espacios físicos...')
    stdout.write('     Este proceso puede tomar unos segundos...')
    
    sede_principal = Sede.objects.get(nombre='Sede Principal')
    sede_centro = Sede.objects.get(nombre='Sede Centro')
    
    tipo_torreon = TipoEspacio.objects.get(nombre='TORREON')
    tipo_salon = TipoEspacio.objects.get(nombre='SALON')
    tipo_sala_computo = TipoEspacio.objects.get(nombre='SALA COMPUTO')
    tipo_auditorio = TipoEspacio.objects.get(nombre='AUDITORIO')
    
    # Formato: (nombre, sede, tipo, capacidad, ubicacion)
    espacios_data = [
        # === SEDE PRINCIPAL ===
        ('TORREON 1', sede_principal, tipo_torreon, 130, 'N/A'),
        ('TORREON 2', sede_principal, tipo_torreon, 130, 'N/A'),
        ('SALON 302A', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 303A', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 101B', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 102B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 103B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 104B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 105B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 106B', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 107B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALA COMPUTO 201B', sede_principal, tipo_sala_computo, 30, 'N/A'),
        ('SALA COMPUTO 202B', sede_principal, tipo_sala_computo, 40, 'N/A'),
        ('SALA COMPUTO 203B', sede_principal, tipo_sala_computo, 30, 'N/A'),
        ('SALON 203A', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 204A', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 205B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 206B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 301B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 302B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 303B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 304B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 305B', sede_principal, tipo_salon, 50, 'N/A'),
        ('SALON 306B', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 307B', sede_principal, tipo_salon, 100, 'N/A'),
        ('SALON 308B', sede_principal, tipo_salon, 100, 'N/A'),
        
        # === SEDE CENTRO ===
        ('SALON 103B-CENTRO', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 401NB', sede_centro, tipo_salon, 30, 'N/A'),
        ('SALON 402NB', sede_centro, tipo_salon, 30, 'N/A'),
        ('SALON 715NB', sede_centro, tipo_salon, 30, 'N/A'),
        ('SALON 403NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 404NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 405NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 406NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 407NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 408NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 409NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 410NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 411NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 412NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 413NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 414NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 415NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 416NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 500NB', sede_centro, tipo_salon, 15, 'N/A'),
        ('SALON 501NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 502NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 503NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 504NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 505NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 506NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 507NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 508NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 509NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 510NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 511NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 512NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 513NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 514NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 515NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 516NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 517NB', sede_centro, tipo_salon, 15, 'N/A'),
        ('SALON 600NB', sede_centro, tipo_salon, 15, 'N/A'),
        ('SALON 601NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 602NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 603NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 604NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 605NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 606NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 607NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 608NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 609NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 610NB', sede_centro, tipo_salon, 30, 'N/A'),
        ('SALON 611NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 612NB', sede_centro, tipo_salon, 55, 'N/A'),
        ('SALON 613NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 614NB', sede_centro, tipo_salon, 40, 'N/A'),
        ('SALON 615NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 616NB', sede_centro, tipo_salon, 60, 'N/A'),
        ('SALON 617NB', sede_centro, tipo_salon, 15, 'N/A'),
        ('SALON 701NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 702NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 703NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 704NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 709NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 710NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 711NB', sede_centro, tipo_salon, 119, 'N/A'),
        ('SALON 713NB', sede_centro, tipo_salon, 28, 'N/A'),
        ('SALON 714NB', sede_centro, tipo_salon, 29, 'N/A'),
        ('SALON 717NB', sede_centro, tipo_salon, 21, 'N/A'),
        ('SALON 718NB', sede_centro, tipo_salon, 20, 'N/A'),
        ('AUDITORIO', sede_centro, tipo_auditorio, 300, 'N/A'),
    ]
    
    created_count = 0
    for nombre, sede, tipo, capacidad, ubicacion in espacios_data:
        _, created = EspacioFisico.objects.get_or_create(
            nombre=nombre,
            sede=sede,
            defaults={
                'tipo': tipo,
                'capacidad': capacidad,
                'ubicacion': ubicacion,
                'estado': 'Disponible'
            }
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} espacios físicos creados ({len(espacios_data)} totales)'))

