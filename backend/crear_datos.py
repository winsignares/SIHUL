"""
Crear datos de prueba en diferentes ciudades para demostrar el filtrado
"""
from usuarios.models import Usuario
from facultades.models import Facultad
from sedes.models import Sede

print('=== Creando datos de prueba en diferentes ciudades ===\n')

# Obtener sedes
sede_bogota = Sede.objects.filter(ciudad='Bogotá').first()
sede_barranquilla = Sede.objects.filter(ciudad='Barranquilla').first()

print(f'Sede Bogotá: {sede_bogota.nombre if sede_bogota else "No existe"}')
print(f'Sede Barranquilla: {sede_barranquilla.nombre if sede_barranquilla else "No existe"}')

if not sede_bogota or not sede_barranquilla:
    print('ERROR: No se encontraron las sedes necesarias')
    exit(1)

# Crear algunos usuarios en Bogotá si no existen
usuarios_bogota = Usuario.objects.filter(sede__ciudad='Bogotá').count()
if usuarios_bogota == 0:
    print('\nCreando usuarios de prueba en Bogotá...')
    
    # Mover algunos usuarios a Bogotá
    usuarios_a_mover = Usuario.objects.filter(sede__ciudad='Barranquilla')[1:4]
    count = 0
    for usuario in usuarios_a_mover:
        usuario.sede = sede_bogota
        usuario.save()
        count += 1
        print(f'  - {usuario.nombre} -> {sede_bogota.nombre}')
    
    print(f'✓ {count} usuarios movidos a Bogotá')

# Crear algunas facultades en Bogotá si no existen
facultades_bogota = Facultad.objects.filter(sede__ciudad='Bogotá').count()
if facultades_bogota == 0:
    print('\nCreando facultades de prueba en Bogotá...')
    
    # Mover algunas facultades a Bogotá
    facultades_a_mover = Facultad.objects.filter(sede__ciudad='Barranquilla')[1:3]
    count = 0
    for facultad in facultades_a_mover:
        facultad.sede = sede_bogota
        facultad.save()
        count += 1
        print(f'  - {facultad.nombre} -> {sede_bogota.nombre}')
    
    print(f'✓ {count} facultades movidas a Bogotá')

# Mostrar distribución final
print(f'\n=== Distribución final de datos ===')
ciudades = Sede.objects.values_list('ciudad', flat=True).distinct()
for ciudad in ciudades:
    usuarios_count = Usuario.objects.filter(sede__ciudad=ciudad).count()
    facultades_count = Facultad.objects.filter(sede__ciudad=ciudad).count()
    print(f'\n{ciudad}:')
    print(f'  - Usuarios: {usuarios_count}')
    print(f'  - Facultades: {facultades_count}')

print('\n✓ Datos de prueba creados exitosamente')
