"""
Seeder de usuarios del sistema y docentes.
"""

from sedes.models import Sede
from usuarios.models import Rol, Usuario


def create_usuarios_sistema(stdout, style):
    """Crear usuarios predeterminados para cada rol del sistema"""
    stdout.write('  → Creando usuarios del sistema...')
    
    # Obtener roles
    try:
        rol_admin = Rol.objects.get(nombre='admin')
        rol_planeacion = Rol.objects.get(nombre='planeacion_facultad')
        rol_supervisor = Rol.objects.get(nombre='supervisor_general')
        rol_docente = Rol.objects.get(nombre='docente')
        rol_estudiante = Rol.objects.get(nombre='estudiante')
    except Rol.DoesNotExist as e:
        stdout.write(style.ERROR(f'    ✗ Error: Rol no encontrado - {str(e)}'))
        return
    
    # Usuarios del sistema
    usuarios_data = [
        {
            'nombre': 'Administrador del Sistema',
            'correo': 'admin@unilibre.edu.co',
            'rol': rol_admin,
            'contrasena_hash': 'scrypt:32768:8:1$kiG9tp2Zn62F5Y17$fe8d82d4b9fe0c16bec841eceff1639a964b1c4b5b1959c16ea2e06209cc61e865c605e19f7fb02729e95733238478246fd53f8d86aa501e5b14e0f0706fb702',
            'activo': True,
            'sede': Sede.objects.get(nombre='Sede Centro')
        },
        {
            'nombre': 'Coordinador de Planeación',
            'correo': 'planeacion@unilibre.edu.co',
            'rol': rol_planeacion,
            'contrasena_hash': 'scrypt:32768:8:1$f7zwr2SiPijCgp45$62e2689fe954de05d5b03d9f736acfb1e8892962ccbb0989eb58174d6327d87b2d25455e0b17f6d165025a268cad789520ca2da815248d7a5bdcef524a0e28e8',
            'activo': True,
            'sede': Sede.objects.get(nombre='Sede Centro')
        },
        {
            'nombre': 'Supervisor General',
            'correo': 'supervisor@unilibre.edu.co',
            'rol': rol_supervisor,
            'contrasena_hash': 'scrypt:32768:8:1$2AWn6L8RGMq1IiQQ$8b5b2ec45d8f847d4dbe150b91bdd386088357865909b17b54a62ba6f97c6aca84d169028ede4242a09edc526af530d3a7676e8d73531a7997c037f2aafe6c33',
            'activo': True,
            'sede': Sede.objects.get(nombre='Sede Centro')
        },
        {
            'nombre': 'Docente de Prueba',
            'correo': 'docente@unilibre.edu.co',
            'rol': rol_docente,
            'contrasena_hash': 'scrypt:32768:8:1$F4jAKI6EZtJNZKNu$ff979b1bd37c5b53c4d9801ed1b049b2d4bbcb771650be11c84e945c48553e5689de2edd2d5f13ceb19447d78583a6c4503f155cdfefa4474328f3485a763629',
            'activo': True,
            'sede': Sede.objects.get(nombre='Sede Centro')
        },
        {
            'nombre': 'Estudiante de Prueba',
            'correo': 'estudiante@unilibre.edu.co',
            'rol': rol_estudiante,
            'contrasena_hash': 'scrypt:32768:8:1$5m5hX0NN5IbauR4t$3001e275f7dac8863ae85331638f631020511422e40a3b8e8d050e21c9f4d0fe4438fa03753db4e3e8623345e68ef21360a09e09d038be25097be3948e5f8435',
            'activo': True,
            'sede': Sede.objects.get(nombre='Sede Centro')
        },
    ]
    
    created_count = 0
    for usuario_data in usuarios_data:
        _, created = Usuario.objects.get_or_create(
            correo=usuario_data['correo'],
            defaults=usuario_data
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} usuarios del sistema creados ({len(usuarios_data)} totales)'))


def create_usuarios_docentes(stdout, style):
    """Crear usuarios docentes del sistema"""
    stdout.write('  → Creando docentes...')
    
    try:
        rol_docente = Rol.objects.get(nombre='docente')
    except Rol.DoesNotExist:
        stdout.write(style.ERROR('    ✗ No se encontró el rol docente'))
        return
    
    docentes = [
        'Carlos Jimenez', 'Agustin Vidal', 'Alejandro Blanco', 'Alexander González', 'Alexander Parody',
        'Alejandra Zambrano', 'Andrea Coronado', 'Anderson Diaz', 'Aracelly García', 'Arnaldo Arce',
        'Aroldo Padilla', 'Astrid Barrios', 'Beatriz Tovar', 'Brenda Valero', 'Carlos Aníbal Espinel Benítez',
        'Carlos Barrera', 'Carlos Consuegra', 'Carlos Espinel', 'Carlos Jiménez', 'Carlos Newball',
        'Claudia Vizcaíno', 'Cristóbal Arteta', 'Cristóbal Arteta Ripoll', 'Danna Betancourt',
        'David Guette', 'Deiber Puello', 'Diana Suárez', 'Diego Suero', 'Edgar Devia',
        'Edgardo Buelvas', 'Eduardo Cerra', 'Eduardo Espinosa', 'Eduardo Lascano', 'Elba Valle',
        'Elvis Ruiz', 'Elvira Crespo', 'Emeldo Caballero', 'Erick Jassir', 'Fabio Amorocho',
        'Felipe Heras', 'Fernando Fiorillo', 'Francisco Bustamante', 'Francisco Polo', 'Franklin Barrios',
        'Franklin Torres', 'Gilberto Barrios', 'Gloria Quijano', 'Gonzalo Aguilar', 'Gretty Pavlovich',
        'Guillermo Arévalo', 'Guillermo De La Hoz', 'Gustavo De La Hoz', 'Hernando Peña', 'Ingrid Pérez',
        'Ingrid Steffanell', 'Ismael Lizarazu', 'Ivan Quintero', 'Jaime Bermejo', 'Janeth Rozo',
        'Javier Crespo', 'Jesús Rodríguez Polo', 'Jesús Iglesias', 'Jhonny Mendoza', 'John Buitrago',
        'John Faber Buitrago', 'Jorge Rivera', 'José Penagos', 'José Jinete', 'Juan Carlos Carrasco',
        'Juan Carlos Gutiérrez', 'Leslie Montealegre', 'Lilia Cedeño', 'Linda Nader', 'Luis Carlos Acosta',
        'Luis Castillo', 'Luis Cerra', 'Luis Cerra Jiménez', 'Luz M. Silvera', 'Magda Djanon',
        'Mariluz Barrios', 'Marlys Herazo', 'Marina Hernández', 'Martha Arteta', 'Marvin Molina',
        'Matías Puello', 'Medardo González', 'Milena Rubio', 'Nubia Marrugo', 'Oona Hernández',
        'Patricia Morris', 'Patty Pedroza', 'Paul Sanmartín', 'Pedro Arias', 'Rafael Fierro',
        'Rafael Rodríguez', 'Ricardo De La Hoz', 'Ricardo Jiménez', 'Ricardo Méndez', 'Richard Andrés Palacio Matta',
        'Roberto Osio', 'Rocío Mercedes Duarte Angarita', 'Sandra Villa', 'Saúl Olivos', 'Tatiana Polo',
        'Tulio Díaz', 'Virginia Sirtori', 'Yadira García', 'Yesenia Valarezo', 'Yessy Coronel',
        'Yolanda Fandiño',
    ]
    
    created_count = 0
    for nombre_docente in docentes:
        # Generar correo a partir del nombre (normalizar caracteres)
        correo_base = nombre_docente.lower().replace(' ', '.')
        # Remover acentos y caracteres especiales
        correo_base = (correo_base.replace('á', 'a').replace('é', 'e').replace('í', 'i')
                      .replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n'))
        correo = f"{correo_base}@unilibre.edu.co"
        
        _, created = Usuario.objects.get_or_create(
            correo=correo,
            defaults={
                'nombre': nombre_docente,
                'contrasena_hash': 'scrypt:32768:8:1$F4jAKI6EZtJNZKNu$ff979b1bd37c5b53c4d9801ed1b049b2d4bbcb771650be11c84e945c48553e5689de2edd2d5f13ceb19447d78583a6c4503f155cdfefa4474328f3485a763629',
                'rol': rol_docente,
                'activo': True,
                'sede': Sede.objects.get(nombre='Sede Centro')
            }
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} docentes creados ({len(docentes)} totales)'))

