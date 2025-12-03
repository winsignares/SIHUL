from prestamos.models import TipoActividad

print('Tipos de Actividad en la BD:')
print('=' * 50)
for t in TipoActividad.objects.all().order_by('nombre'):
    print(f'  - {t.nombre}')
print(f'\nTotal: {TipoActividad.objects.count()}')
