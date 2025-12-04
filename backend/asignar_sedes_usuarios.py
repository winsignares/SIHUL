"""
Script para asignar sedes a usuarios existentes
"""
from usuarios.models import Usuario
from sedes.models import Sede

# Obtener sedes disponibles
sedes = list(Sede.objects.all())
print(f'Sedes disponibles: {len(sedes)}')
for sede in sedes:
    print(f'  - {sede.nombre} ({sede.ciudad})')

if not sedes:
    print('ERROR: No hay sedes en la base de datos')
    exit(1)

# Asignar sede principal a todos los usuarios sin sede
sede_principal = sedes[0]
print(f'\nAsignando {sede_principal.nombre} a usuarios sin sede...')

usuarios_sin_sede = Usuario.objects.filter(sede__isnull=True)
count = usuarios_sin_sede.count()

if count > 0:
    usuarios_sin_sede.update(sede=sede_principal)
    print(f'✓ {count} usuarios actualizados con sede {sede_principal.nombre}')
else:
    print('✓ Todos los usuarios ya tienen sede asignada')

# Verificar resultado
usuarios_con_sede = Usuario.objects.filter(sede__isnull=False).count()
usuarios_sin_sede = Usuario.objects.filter(sede__isnull=True).count()
total = Usuario.objects.count()

print(f'\n=== Resultado Final ===')
print(f'Total usuarios: {total}')
print(f'Con sede: {usuarios_con_sede}')
print(f'Sin sede: {usuarios_sin_sede}')
