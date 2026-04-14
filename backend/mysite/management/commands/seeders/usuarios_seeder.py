"""
Seeder de usuarios del sistema y docentes.
"""

from django.contrib.auth.hashers import make_password
from sedes.models import Sede
from usuarios.models import Rol, Usuario


def create_usuarios_sistema(stdout, style):
    """Crear usuarios predeterminados para cada rol del sistema"""
    stdout.write('  → Creando usuarios del sistema...')
    
    # Obtener roles
    try:
        rol_admin = Rol.objects.get(nombre='admin')
        rol_admin_planeacion = Rol.objects.get(nombre='admin_planeacion')
        rol_planeacion = Rol.objects.get(nombre='planeacion_facultad')
        rol_supervisor = Rol.objects.get(nombre='supervisor_general')
        rol_docente = Rol.objects.get(nombre='docente')
        rol_estudiante = Rol.objects.get(nombre='estudiante')
    except Rol.DoesNotExist as e:
        stdout.write(style.ERROR(f'    ✗ Error: Rol no encontrado - {str(e)}'))
        return
    
    sede_centro = Sede.objects.get(nombre='Sede Centro')
    hash_admin = make_password('admin123')
    hash_plan = make_password('plan123')
    hash_supervisor = make_password('sup123')
    hash_docente = make_password('doc123')
    hash_estudiante = make_password('est123')

    # Usuarios del sistema
    usuarios_data = [
        {
            'nombre': 'Administrador de Planeación',
            'correo': 'admin_planeacion@unilibre.edu.co',
            'rol': rol_admin_planeacion,
            'contrasena_hash': hash_admin,
            'activo': True,
            'sede': sede_centro
        },
        {
            'nombre': 'Administrador del Sistema',
            'correo': 'admin@unilibre.edu.co',
            'rol': rol_admin,
            'contrasena_hash': hash_admin,
            'activo': True,
            'sede': sede_centro
        },
        {
            'nombre': 'Coordinador de Planeación',
            'correo': 'planeacion@unilibre.edu.co',
            'rol': rol_planeacion,
            'contrasena_hash': hash_plan,
            'activo': True,
            'sede': sede_centro
        },
        {
            'nombre': 'Supervisor General',
            'correo': 'supervisor@unilibre.edu.co',
            'rol': rol_supervisor,
            'contrasena_hash': hash_supervisor,
            'activo': True,
            'sede': sede_centro
        },
        {
            'nombre': 'Docente de Prueba',
            'correo': 'docente@unilibre.edu.co',
            'rol': rol_docente,
            'contrasena_hash': hash_docente,
            'activo': True,
            'sede': sede_centro
        },
        {
            'nombre': 'Estudiante de Prueba',
            'correo': 'estudiante@unilibre.edu.co',
            'rol': rol_estudiante,
            'contrasena_hash': hash_estudiante,
            'activo': True,
            'sede': sede_centro
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
        'Yolanda Fandiño', 'Mario Mutis', 'Juan David Rodriguez', 'Enrique Fonseca', 'Gladys Helena Rios', 'J. Villareal',
        'Elen Manrrique', 'Adalgisa Alcocer', 'Ismael Piñeres', 'Gloria Muñoz', 'Eulalia Amador', 'Marianella Suarez',
        'Yosed Anaya', 'Eduardo Navarro', 'Mily Ardila', 'Laura Ardila', 'Tammy Pulido', 'Nobis De La Cruz', 
        'Lucy Bula', 'Marina Hernandez', 'Sindy Ariza', 'Gladys Helena Gutiérrez', 'Raúl Polo', 'Juan Carlos De Los Ríos',
        'Sergio Nieves Vanegas', 'Mario Peña', 'Roberto Rebolledo', 'Angélica Corcho', 'Ronald Maestre',
        'Pierine España', 'Martha Mendihueta', 'Evelyn Mendoza', 'L Banderas', 'Jaime Lorduy', 'Gisell diFilippo',
        'Alberto Moreno', 'Yoli Yepes', 'Mónica Gómez', 'Beatriz Barraza',
        'Juan David Sanchez', 'Lorena Herrera', 'Anderson Díaz', 'Wendy Rosales', 'Yennifer Barrios',
        'Cecilia Arcieniegas', 'Cristian Cadena', 'Jainer Molina', 'María Rosa Baldovino', 'Javier Duran',
        'Norka Márquez', 'Luisa Galeano', 'Leidy Gómez', 'Leidy Goenaga', 'Richard Zambrano', 'María Amador',
        'Claudia Tapia', 'Ingrid Perez', 'Adalgiza Alcocer', 'A. Guerrero', 'J. Navarro', 'Zuleima Yañez', 'Ana Medina',
        'Virginia Siacon', 'Leonel Alfonso', 'Nora Álvarez', 'Liliana Carranza', 'Karol Cervantes',
        'Stephanye Carrillo', 'Arleth Lopez', 'Luis Carlos Rodriguez', 'Boris Silva',
        'Emilee Vásquez', 'Bryan Domínguez', 'Matias Puello', 'Julia Andrade', 'Lina Chavez', 'Christian Cadenas', 'Luis Carlos Rueda',
        'Jennifer Barrios', 'Cristina Arteta', 'Tatiana Gómez', 'Cristobal Arteta', 'Yadira Barrios', 'Miriam Linero',
        'Simón Bolívar', 'Víctor Meza', 'Luz Marina Silvera', 'Jorge Bolaño', 'María Inés López', 'G. Sarmiento', 'Bertiller',
        # Profesores genéricos para Alianza Canadiense
        'Profesor 1', 'Profesor 2', 'Profesor 3', 'Profesor 4', 'Profesor 5', 'Profesor 6',
    ]
    
    sede_centro = Sede.objects.get(nombre='Sede Centro')
    hash_docente = make_password('doc123')

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
                'contrasena_hash': hash_docente,
                'rol': rol_docente,
                'activo': True,
                'sede': sede_centro
            }
        )
        if created:
            created_count += 1
    
    stdout.write(style.SUCCESS(f'    ✓ {created_count} docentes creados ({len(docentes)} totales)'))

