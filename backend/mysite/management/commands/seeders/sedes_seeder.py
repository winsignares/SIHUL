"""
Seeder de sedes de la universidad.
"""

from sedes.models import Sede


def create_sedes(stdout, style):
    """Crear sedes de la universidad"""
    stdout.write('  → Creando sedes...')
    
    sedes_data = [
        {
            'nombre': 'Sede Candelaria',
            'direccion': 'Calle 8 n.º 5-80, La Candelaria, Bogotá, Cundinamarca',
            'ciudad': 'Bogotá',
            'activa': True
        },
        {
            'nombre': 'Sede El Bosque',
            'direccion': 'Carrera 70 n.º 53-40, El Bosque Popular, Bogotá, Cundinamarca',
            'ciudad': 'Bogotá',
            'activa': True
        },
        {
            'nombre': 'Sede Centro',
            'direccion': 'Cra. 46 #48, Nte. Centro Historico, Barranquilla, Atlántico',
            'ciudad': 'Barranquilla',
            'activa': True
        },
        {
            'nombre': 'Sede Principal',
            'direccion': 'Cra. 51B #135 -100, Puerto Colombia, Barranquilla, Atlántico',
            'ciudad': 'Barranquilla',
            'activa': True
        },
        {
            'nombre': 'Sede Santa Isabel',
            'direccion': 'Cra. 46 #48, Nte. Santa Isabel, Cali, Valle del Cauca',
            'ciudad': 'Cali',
            'activa': True
        },
        {
            'nombre': 'Sede Valle del Lili',
            'direccion': 'Carrera 109 n.º 22 - 00, Valle de Lili, Cali, Valle del Cauca',
            'ciudad': 'Cali',
            'activa': True
        },
        {
            'nombre': 'Sede Pereira Centro',
            'direccion': 'Calle 40 # 7 - 30, Campus Centro, Pereira, Risaralda',
            'ciudad': 'Pereira',
            'activa': True
        },
        {
            'nombre': 'Sede Cúcuta',
            'direccion': 'Avenida 4ta n.º 12n-81 - Urbanización El Bosque, Cúcuta, Norte de Santander',
            'ciudad': 'Cúcuta',
            'activa': True
        },
        {
            'nombre': 'Sede Cartagena',
            'direccion': 'Calle Real n.º 20-177, Campus Pie de la Popa, Cartagena, Bolívar',
            'ciudad': 'Cartagena',
            'activa': True
        },
        {
            'nombre': 'Sede El Socorro',
            'direccion': 'Carrera 15 n.º 16-58, Edificio Albornoz Rueda, El Socorro, Santander',
            'ciudad': 'El Socorro',
            'activa': True
        },
        {
            'nombre': 'Sede Albornoz Rueda',
            'direccion': 'Carrera 15 n.º 16-58, Edificio Albornoz Rueda, El Socorro, Santander',
            'ciudad': 'El Socorro',
            'activa': True
        },
        {
            'nombre': 'Sede Majavita',
            'direccion': 'Campus Universitario Hacienda Majavita, El Socorro, Santander',
            'ciudad': 'El Socorro',
            'activa': True
        },
        {
            'nombre': 'Sede Belmonte',
            'direccion': 'Avenida Las Américas Carrera 28 n.º 96-102, Campus Belmonte, Pereira, Risaralda',
            'ciudad': 'Pereira',
            'activa': True
        },
    ]
    
    created_count = 0
    for sede_data in sedes_data:
        _, created = Sede.objects.get_or_create(nombre=sede_data['nombre'], defaults=sede_data)
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} sedes creadas ({len(sedes_data)} totales)'))

