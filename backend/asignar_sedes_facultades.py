"""
Script para asignar sedes a facultades existentes
"""
from facultades.models import Facultad
from sedes.models import Sede

# Obtener sedes disponibles
sedes = list(Sede.objects.all())
print(f'Sedes disponibles: {len(sedes)}')
for sede in sedes:
    print(f'  - ID: {sede.id}, {sede.nombre} ({sede.ciudad})')

if not sedes:
    print('ERROR: No hay sedes en la base de datos')
    exit(1)

# Asignar sede principal (Barranquilla) a todas las facultades sin sede
sede_principal = sedes[0]
print(f'\nAsignando {sede_principal.nombre} a facultades sin sede...')

facultades_sin_sede = Facultad.objects.filter(sede__isnull=True)
count = facultades_sin_sede.count()

if count > 0:
    facultades_sin_sede.update(sede=sede_principal)
    print(f'✓ {count} facultades actualizadas con sede {sede_principal.nombre}')
else:
    print('✓ Todas las facultades ya tienen sede asignada')

# Verificar resultado
facultades = Facultad.objects.select_related('sede').all()
print(f'\n=== Facultades con sedes asignadas ===')
for fac in facultades:
    print(f'{fac.nombre}: {fac.sede.nombre if fac.sede else "Sin sede"}')

facultades_con_sede = Facultad.objects.filter(sede__isnull=False).count()
facultades_sin_sede = Facultad.objects.filter(sede__isnull=True).count()
total = Facultad.objects.count()

print(f'\n=== Resultado Final ===')
print(f'Total facultades: {total}')
print(f'Con sede: {facultades_con_sede}')
print(f'Sin sede: {facultades_sin_sede}')
