"""
Comando de Django para cargar datos iniciales completos en la base de datos SIHUL.

Este archivo contiene todos los datos necesarios para inicializar el sistema:
- Roles del sistema
- Sedes
- Tipos de espacio
- Facultades
- Programas académicos
- Usuarios docentes
- Asignaturas de todos los programas
- Espacios físicos

Uso: python manage.py seed_initial_data

Para agregar más datos en el futuro, simplemente añade las tuplas a las listas
correspondientes en cada método y ejecuta nuevamente el comando.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma


class Command(BaseCommand):
    help = 'Carga datos iniciales completos en la base de datos SIHUL'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n═══════════════════════════════════════'))
        self.stdout.write(self.style.WARNING('   CARGANDO DATOS INICIALES SIHUL'))
        self.stdout.write(self.style.WARNING('═══════════════════════════════════════\n'))
        
        try:
            with transaction.atomic():
                # Paso 1: Tablas primarias (sin foreign keys)
                self.stdout.write(self.style.SUCCESS('\n[1/9] Tablas Primarias'))
                self.create_roles()
                self.create_sedes()
                self.create_tipos_espacio()
                
                # Paso 2: Tablas con una foreign key
                self.stdout.write(self.style.SUCCESS('\n[2/9] Estructura Académica'))
                self.create_facultades()
                self.create_programas()
                
                # Paso 3: Asignaturas (tabla independiente)
                self.stdout.write(self.style.SUCCESS('\n[3/9] Asignaturas'))
                self.create_asignaturas()
                
                # Paso 4: Relaciones Asignatura-Programa
                self.stdout.write(self.style.SUCCESS('\n[4/9] Asignaturas por Programa'))
                self.create_asignaturas_programa()
                
                # Paso 5: Usuarios del sistema
                self.stdout.write(self.style.SUCCESS('\n[5/9] Usuarios del Sistema'))
                self.create_usuarios_sistema()
                
                # Paso 6: Docentes
                self.stdout.write(self.style.SUCCESS('\n[6/9] Docentes'))
                self.create_usuarios_docentes()
                
                # Paso 7: Espacios físicos
                self.stdout.write(self.style.SUCCESS('\n[7/9] Espacios Físicos'))
                self.create_espacios_fisicos()
                
            self.stdout.write(self.style.SUCCESS('\n═══════════════════════════════════════'))
            self.stdout.write(self.style.SUCCESS('✓ DATOS CARGADOS EXITOSAMENTE'))
            self.stdout.write(self.style.SUCCESS('═══════════════════════════════════════\n'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Error al cargar datos: {str(e)}'))
            import traceback
            traceback.print_exc()
            raise

    def create_roles(self):
        """Crear roles del sistema"""
        self.stdout.write('  → Creando roles del sistema...')
        
        roles_data = [
            {'nombre': 'admin', 'descripcion': 'Administrador del Sistema'},
            {'nombre': 'planeacion_facultad', 'descripcion': 'Planeación de Facultad'},
            {'nombre': 'supervisor_general', 'descripcion': 'Supervisor General'},
            {'nombre': 'docente', 'descripcion': 'Docente'},
            {'nombre': 'estudiante', 'descripcion': 'Estudiante'},
        ]
        
        created_count = 0
        for rol_data in roles_data:
            _, created = Rol.objects.get_or_create(nombre=rol_data['nombre'], defaults=rol_data)
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} roles creados ({len(roles_data)} totales)'))

    def create_sedes(self):
        """Crear sedes de la universidad"""
        self.stdout.write('  → Creando sedes...')
        
        sedes_data = [
            {
                'nombre': 'Sede Centro',
                'direccion': 'Cra. 46 #48, Nte. Centro Historico, Barranquilla, Atlántico',
                'ciudad': 'Barranquilla',
                'activa': True
            },
            {
                'nombre': 'Sede Principal',
                'direccion': 'Cra. 51B #135 -100, Sabanilla Montecarmelo, Barranquilla, Atlántico',
                'ciudad': 'Barranquilla',
                'activa': True
            },
        ]
        
        created_count = 0
        for sede_data in sedes_data:
            _, created = Sede.objects.get_or_create(nombre=sede_data['nombre'], defaults=sede_data)
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} sedes creadas ({len(sedes_data)} totales)'))

    def create_tipos_espacio(self):
        """Crear tipos de espacio físico"""
        self.stdout.write('  → Creando tipos de espacio...')
        
        tipos_data = [
            {'nombre': 'TORREON', 'descripcion': 'N/A'},
            {'nombre': 'SALON', 'descripcion': 'Espacio de clase para asignaturas de los programas de la universidad libre'},
            {'nombre': 'SALA COMPUTO', 'descripcion': 'Espacio de clase para asignaturas de los programas de la universidad libre con computadores'},
            {'nombre': 'AUDITORIO', 'descripcion': 'Espacio de conferencia y eventos de la universidad libre'},
        ]
        
        created_count = 0
        for tipo_data in tipos_data:
            _, created = TipoEspacio.objects.get_or_create(nombre=tipo_data['nombre'], defaults=tipo_data)
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} tipos de espacio creados ({len(tipos_data)} totales)'))

    def create_facultades(self):
        """Crear facultades con sus sedes"""
        self.stdout.write('  → Creando facultades...')
        
        sede_centro = Sede.objects.get(nombre='Sede Centro')
        sede_principal = Sede.objects.get(nombre='Sede Principal')
        
        facultades_data = [
            {'nombre': 'Facultad de Ingeniería', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Ciencias Económicas, Administrativas y Contables', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Derecho, Ciencias Políticas y Sociales', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Ciencias de la Salud', 'sede': sede_principal, 'activa': True},
            {'nombre': 'Facultad de Ciencias de la Salud, Exactas y Naturales', 'sede': sede_centro, 'activa': True},
        ]
        
        created_count = 0
        for fac_data in facultades_data:
            _, created = Facultad.objects.get_or_create(
                nombre=fac_data['nombre'],
                defaults={'sede': fac_data['sede'], 'activa': fac_data['activa']}
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} facultades creadas ({len(facultades_data)} totales)'))

    def create_programas(self):
        """Crear programas académicos"""
        self.stdout.write('  → Creando programas académicos...')
        
        programas_data = [
            ('Facultad de Derecho, Ciencias Políticas y Sociales', 'Derecho', 10, True),
            ('Facultad de Ciencias Económicas, Administrativas y Contables', 'Administración de Negocios Internacionales', 8, True),
            ('Facultad de Ciencias Económicas, Administrativas y Contables', 'Contaduría Pública', 8, True),
            ('Facultad de Ciencias de la Salud', 'Medicina', 12, True),
            ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Bacteriología', 9, True),
            ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Microbiología', 10, True),
            ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Fisioterapia', 8, True),
            ('Facultad de Ciencias de la Salud, Exactas y Naturales', 'Instrumentación Quirúrgica', 8, True),
            ('Facultad de Ingeniería', 'Ingeniería de Sistemas', 10, True),
            ('Facultad de Ingeniería', 'Ingeniería Industrial', 10, True),
        ]
        
        created_count = 0
        for nombre_facultad, nombre_programa, semestres, activo in programas_data:
            try:
                facultad = Facultad.objects.get(nombre=nombre_facultad)
                _, created = Programa.objects.get_or_create(
                    nombre=nombre_programa,
                    facultad=facultad,
                    defaults={'semestres': semestres, 'activo': activo}
                )
                if created:
                    created_count += 1
            except Facultad.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'    ! Facultad no encontrada: {nombre_facultad}'))
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} programas creados ({len(programas_data)} totales)'))

    def create_usuarios_docentes(self):
        """Crear usuarios docentes del sistema"""
        self.stdout.write('  → Creando docentes...')
        
        try:
            rol_docente = Rol.objects.get(nombre='docente')
        except Rol.DoesNotExist:
            self.stdout.write(self.style.ERROR('    ✗ No se encontró el rol docente'))
            return
        
        docentes = [
            'Carlos Jimenez', 'Agustin Vidal', 'Alejandro Blanco', 'Alexander González', 'Alexander Parody',
            'Alejandra Zambrano', 'Andrea Coronado', 'Anderson Diaz', 'Aracelly García', 'Arnaldo Arce',
            'Aroldo Padilla', 'Astrid Barrios', 'Beatriz Tovar', 'Brenda Valero', 'Carlos Aníbal Espinel Benítez',
            'Carlos Barrera', 'Carlos Consuegra', 'Carlos Espinel', 'Carlos Jiménez', 'Carlos Newball',
            'Claudia Vizcaíno', 'Cristóbal Arteta', 'Cristóbal Arteta Ripoll', 'Danna Betancourt', 'Danna Betancourt Espinosa',
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
                    'contrasena_hash': 'pbkdf2_sha256$600000$temp$hashdefault123456',
                    'rol': rol_docente,
                    'activo': True
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} docentes creados ({len(docentes)} totales)'))

    def create_usuarios_sistema(self):
        """Crear usuarios predeterminados para cada rol del sistema"""
        self.stdout.write('  → Creando usuarios del sistema...')
        
        # Obtener roles
        try:
            rol_admin = Rol.objects.get(nombre='admin')
            rol_planeacion = Rol.objects.get(nombre='planeacion_facultad')
            rol_supervisor = Rol.objects.get(nombre='supervisor_general')
            rol_docente = Rol.objects.get(nombre='docente')
            rol_estudiante = Rol.objects.get(nombre='estudiante')
        except Rol.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'    ✗ Error: Rol no encontrado - {str(e)}'))
            return
        
        # Usuarios del sistema
        usuarios_data = [
            {
                'nombre': 'Administrador del Sistema',
                'correo': 'admin@unilibre.edu.co',
                'rol': rol_admin,
                'contrasena_hash': 'pbkdf2_sha256$600000$admin$hashdefault123456',
                'activo': True
            },
            {
                'nombre': 'Coordinador de Planeación',
                'correo': 'planeacion@unilibre.edu.co',
                'rol': rol_planeacion,
                'contrasena_hash': 'pbkdf2_sha256$600000$planeacion$hashdefault123456',
                'activo': True
            },
            {
                'nombre': 'Supervisor General',
                'correo': 'supervisor@unilibre.edu.co',
                'rol': rol_supervisor,
                'contrasena_hash': 'pbkdf2_sha256$600000$supervisor$hashdefault123456',
                'activo': True
            },
            {
                'nombre': 'Docente de Prueba',
                'correo': 'docente@unilibre.edu.co',
                'rol': rol_docente,
                'contrasena_hash': 'pbkdf2_sha256$600000$docente$hashdefault123456',
                'activo': True
            },
            {
                'nombre': 'Estudiante de Prueba',
                'correo': 'estudiante@unilibre.edu.co',
                'rol': rol_estudiante,
                'contrasena_hash': 'pbkdf2_sha256$600000$estudiante$hashdefault123456',
                'activo': True
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
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} usuarios del sistema creados ({len(usuarios_data)} totales)'))

    def create_asignaturas_programa(self):
        """Crear relaciones entre asignaturas y programas con semestre y componente formativo"""
        self.stdout.write('  → Creando relaciones asignatura-programa...')
        self.stdout.write('     Este proceso puede tomar varios segundos...')
        
        # Mapeo de componentes formativos
        componentes_map = {
            'Básico': 'Básico',
            'Profesional': 'Profesional',
            'Humanístico': 'Humanístico',
            'Investigativo': 'Investigativo',
            'Práctico': 'Práctico',
            'Electivo/Optativo': 'Electivo/Optativo'
        }
        
        # Formato: (nombre_programa, codigo_asignatura, semestre, componente_formativo)
        relaciones_data = [
            # === INGENIERÍA DE SISTEMAS ===
            ('Ingeniería de Sistemas', 'IS-CALD', 1, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-FM', 1, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-II', 1, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-LA', 1, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-LM', 1, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-CAC', 1, 'Humanístico'),
            ('Ingeniería de Sistemas', 'IS-CU', 1, 'Humanístico'),
            ('Ingeniería de Sistemas', 'IS-CALI', 2, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-EML', 2, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-AL', 2, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-PS', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FP', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDI', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC1', 2, 'Electivo/Optativo'),
            ('Ingeniería de Sistemas', 'IS-CMV', 3, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-PED', 3, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-DI', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDAT', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-AC', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ISW1', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDIF', 4, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-CS', 4, 'Humanístico'),
            ('Ingeniería de Sistemas', 'IS-CP', 4, 'Humanístico'),
            ('Ingeniería de Sistemas', 'IS-FBD', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PROG1', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ISW2', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC2', 4, 'Electivo/Optativo'),
            ('Ingeniería de Sistemas', 'IS-MD', 5, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-SO', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-SBD', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FE', 5, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-ISW3', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PROG2', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FEP', 6, 'Investigativo'),
            ('Ingeniería de Sistemas', 'IS-PWEB', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PL', 6, 'Básico'),
            ('Ingeniería de Sistemas', 'IS-AI', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-RC', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC3', 6, 'Electivo/Optativo'),
            ('Ingeniería de Sistemas', 'IS-OPT1', 6, 'Electivo/Optativo'),
            ('Ingeniería de Sistemas', 'IS-MI', 7, 'Investigativo'),
            ('Ingeniería de Sistemas', 'IS-ET', 7, 'Humanístico'),
            ('Ingeniería de Sistemas', 'IS-SI', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-IA', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PM', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-GPI', 7, 'Profesional'),
           ('Ingeniería de Sistemas', 'IS-OPT2', 7, 'Electivo/Optativo'),
            ('Ingeniería de Sistemas', 'IS-IAP', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-AE', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-SIG', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PE', 8, 'Práctico'),
            ('Ingeniería de Sistemas', 'IS-GE', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-OPT3', 8, 'Electivo/Optativo'),
            
            # === INGENIERÍA INDUSTRIAL ===
            ('Ingeniería Industrial', 'II-CALD', 1, 'Básico'),
            ('Ingeniería Industrial', 'II-QGL', 1, 'Básico'),
            ('Ingeniería Industrial', 'II-II', 1, 'Profesional'),
            ('Ingeniería Industrial', 'II-LA', 1, 'Básico'),
            ('Ingeniería Industrial', 'II-EGI', 1, 'Profesional'),
            ('Ingeniería Industrial', 'II-CAC', 1, 'Humanístico'),
            ('Ingeniería Industrial', 'II-CU', 1, 'Humanístico'),
            ('Ingeniería Industrial', 'II-CALI', 2, 'Básico'),
            ('Ingeniería Industrial', 'II-FML', 2, 'Básico'),
            ('Ingeniería Industrial', 'II-AL', 2, 'Básico'),
            ('Ingeniería Industrial', 'II-CMI', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-LP', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-CP', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-ELEC1', 2, 'Electivo/Optativo'),
            ('Ingeniería Industrial', 'II-CMV', 3, 'Básico'),
            ('Ingeniería Industrial', 'II-EML', 3, 'Básico'),
            ('Ingeniería Industrial', 'II-PED', 3, 'Básico'),
            ('Ingeniería Industrial', 'II-DI', 3, 'Profesional'),
            ('Ingeniería Industrial', 'II-GO', 3, 'Profesional'),
            ('Ingeniería Industrial', 'II-FE', 3, 'Básico'),
            ('Ingeniería Industrial', 'II-ELEC2', 3, 'Electivo/Optativo'),
            ('Ingeniería Industrial', 'II-ED', 4, 'Básico'),
            ('Ingeniería Industrial', 'II-TERM', 4, 'Básico'),
            ('Ingeniería Industrial', 'II-GE', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-CEC', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-PI', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-CO', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-IO1', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-SIG', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-DPS', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-IM', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-IE', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-CS', 5, 'Humanístico'),
            ('Ingeniería Industrial', 'II-ELEC3', 5, 'Electivo/Optativo'),
            ('Ingeniería Industrial', 'II-IO2', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-PCPO', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-MER', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-GT', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-FIN', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-OPT1', 6, 'Electivo/Optativo'),
            ('Ingeniería Industrial', 'II-MME', 7, 'Básico'),
            ('Ingeniería Industrial', 'II-SST', 7, 'Profesional'),
            ('Ingeniería Industrial', 'II-FEP', 7, 'Investigativo'),
            ('Ingeniería Industrial', 'II-MI', 7, 'Investigativo'),
            ('Ingeniería Industrial', 'II-CPOL', 7, 'Humanístico'),
            ('Ingeniería Industrial', 'II-ET', 7, 'Humanístico'),
            ('Ingeniería Industrial', 'II-OPT2', 7, 'Electivo/Optativo'),
            ('Ingeniería Industrial', 'II-DIIS', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-LCS', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-IA', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-SP', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-PE', 8, 'Práctico'),
            ('Ingeniería Industrial', 'II-OPT3', 8, 'Electivo/Optativo'),
            
            # === NEGOCIOS INTERNACIONALES ===
            ('Administración de Negocios Internacionales', 'NI-FM', 1, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-FNI', 1, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-FE', 1, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-CF', 1, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-EVE', 1, 'Humanístico'),
            ('Administración de Negocios Internacionales', 'NI-CU', 1, 'Humanístico'),
            ('Administración de Negocios Internacionales', 'NI-CAL', 2, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-EE', 2, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-SC', 2, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ED', 2, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-DC', 2, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ELEC1', 2, 'Electivo/Optativo'),
            ('Administración de Negocios Internacionales', 'NI-CEN', 3, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-EI2', 3, 'Básico'),
            ('Administración de Negocios Internacionales', 'NI-FMERC', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-LA', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-CNG', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ELEC2', 3, 'Electivo/Optativo'),
            ('Administración de Negocios Internacionales', 'NI-FI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-LDFI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-IM', 4, 'Investigativo'),
            ('Administración de Negocios Internacionales', 'NI-DCI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GPO', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-SNC', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-DL', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-PE', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-FGP', 5, 'Investigativo'),
            ('Administración de Negocios Internacionales', 'NI-ELEC3', 5, 'Electivo/Optativo'),
            ('Administración de Negocios Internacionales', 'NI-IMKT', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GTH', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GCE', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-MI', 6, 'Investigativo'),
            ('Administración de Negocios Internacionales', 'NI-OE1', 6, 'Electivo/Optativo'),
            ('Administración de Negocios Internacionales', 'NI-GI', 7, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-AF', 7, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-EPRS', 7, 'Humanístico'),
            ('Administración de Negocios Internacionales', 'NI-PI', 7, 'Investigativo'),
            ('Administración de Negocios Internacionales', 'NI-OE2', 7, 'Electivo/Optativo'),
            ('Administración de Negocios Internacionales', 'NI-GEX', 8, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-SG', 8, 'Investigativo'),
            ('Administración de Negocios Internacionales', 'NI-GLOB', 8, 'Humanístico'),
            ('Administración de Negocios Internacionales', 'NI-OE3', 8, 'Electivo/Optativo'),
            
            # === CONTADURÍA PÚBLICA ===
            ('Contaduría Pública', 'CP-FM', 1, 'Básico'),
            ('Contaduría Pública', 'CP-FA', 1, 'Profesional'),
            ('Contaduría Pública', 'CP-CF', 1, 'Profesional'),
            ('Contaduría Pública', 'CP-FE', 1, 'Básico'),
            ('Contaduría Pública', 'CP-EVE', 1, 'Humanístico'),
            ('Contaduría Pública', 'CP-CU', 1, 'Humanístico'),
            ('Contaduría Pública', 'CP-CAL1', 2, 'Básico'),
            ('Contaduría Pública', 'CP-CEAI', 2, 'Profesional'),
            ('Contaduría Pública', 'CP-EE', 2, 'Básico'),
            ('Contaduría Pública', 'CP-DC', 2, 'Profesional'),
            ('Contaduría Pública', 'CP-ED', 2, 'Básico'),
            ('Contaduría Pública', 'CP-ELEC1', 2, 'Electivo/Optativo'),
            ('Contaduría Pública', 'CP-EI2', 3, 'Básico'),
            ('Contaduría Pública', 'CP-SC', 3, 'Profesional'),
            ('Contaduría Pública', 'CP-CEN', 3, 'Básico'),
            ('Contaduría Pública', 'CP-DLSS', 3, 'Profesional'),
            ('Contaduría Pública', 'CP-ELEC2', 3, 'Electivo/Optativo'),
            ('Contaduría Pública', 'CP-CIF', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-CEF', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-PE', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-IO', 4, 'Investigativo'),
            ('Contaduría Pública', 'CP-ELEC3', 4, 'Electivo/Optativo'),
            ('Contaduría Pública', 'CP-CG', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-CA', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-AF', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-AA', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-MI', 5, 'Investigativo'),
            ('Contaduría Pública', 'CP-IRC', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-CFP', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-FNT', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-EP', 6, 'Humanístico'),
            ('Contaduría Pública', 'CP-OPT1', 6, 'Electivo/Optativo'),
            ('Contaduría Pública', 'CP-IVRF', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-RF', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-FC', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-FGP', 7, 'Investigativo'),
            ('Contaduría Pública', 'CP-OPT2', 7, 'Electivo/Optativo'),
            ('Contaduría Pública', 'CP-ITPT', 8, 'Profesional'),
            ('Contaduría Pública', 'CP-AS', 8, 'Profesional'),
            ('Contaduría Pública', 'CP-SG', 8, 'Investigativo'),
            ('Contaduría Pública', 'CP-CNG', 8, 'Humanístico'),
            ('Contaduría Pública', 'CP-OPT3', 8, 'Electivo/Optativo'),
            
            # === DERECHO ===
            ('Derecho', 'DER-ID', 1, 'Básico'),
            ('Derecho', 'DER-DR', 1, 'Básico'),
            ('Derecho', 'DER-HD', 1, 'Básico'),
            ('Derecho', 'DER-TE', 1, 'Básico'),
            ('Derecho', 'DER-CC', 1, 'Humanístico'),
            ('Derecho', 'DER-CU', 1, 'Humanístico'),
            ('Derecho', 'DER-DC1', 2, 'Básico'),
            ('Derecho', 'DER-TGD', 2, 'Básico'),
            ('Derecho', 'DER-DCP', 2, 'Profesional'),
            ('Derecho', 'DER-SJ', 2, 'Humanístico'),
            ('Derecho', 'DER-MI', 2, 'Investigativo'),
            ('Derecho', 'DER-DC2', 3, 'Básico'),
            ('Derecho', 'DER-DCB', 3, 'Profesional'),
            ('Derecho', 'DER-DPG', 3, 'Profesional'),
            ('Derecho', 'DER-FD', 3, 'Humanístico'),
            ('Derecho', 'DER-ELEC1', 3, 'Electivo/Optativo'),
            ('Derecho', 'DER-DCO', 4, 'Profesional'),
            ('Derecho', 'DER-DPE', 4, 'Profesional'),
            ('Derecho', 'DER-DA1', 4, 'Profesional'),
            ('Derecho', 'DER-HJ', 4, 'Humanístico'),
            ('Derecho', 'DER-ELEC2', 4, 'Electivo/Optativo'),
            ('Derecho', 'DER-DCC', 5, 'Profesional'),
            ('Derecho', 'DER-DPC1', 5, 'Profesional'),
            ('Derecho', 'DER-DA2', 5, 'Profesional'),
            ('Derecho', 'DER-DLI', 5, 'Profesional'),
            ('Derecho', 'DER-ELEC3', 5, 'Electivo/Optativo'),
            ('Derecho', 'DER-DPC2', 6, 'Profesional'),
            ('Derecho', 'DER-DLC', 6, 'Profesional'),
            ('Derecho', 'DER-DCOM1', 6, 'Profesional'),
            ('Derecho', 'DER-DPP', 6, 'Profesional'),
            ('Derecho', 'DER-EP', 6, 'Humanístico'),
            ('Derecho', 'DER-DCOM2', 7, 'Profesional'),
            ('Derecho', 'DER-DPR', 7, 'Profesional'),
            ('Derecho', 'DER-DIP', 7, 'Profesional'),
            ('Derecho', 'DER-DT', 7, 'Profesional'),
            ('Derecho', 'DER-OPT1', 7, 'Electivo/Optativo'),
            ('Derecho', 'DER-DIPR', 8, 'Profesional'),
            ('Derecho', 'DER-DF', 8, 'Profesional'),
            ('Derecho', 'DER-DPA', 8, 'Profesional'),
            ('Derecho', 'DER-CJ1', 8, 'Práctico'),
            ('Derecho', 'DER-OPT2', 8, 'Electivo/Optativo'),
            ('Derecho', 'DER-CJ2', 9, 'Práctico'),
            ('Derecho', 'DER-MASC', 9, 'Profesional'),
            ('Derecho', 'DER-SG', 9, 'Investigativo'),
            ('Derecho', 'DER-PJ', 10, 'Práctico'),
            ('Derecho', 'DER-OPT3', 10, 'Electivo/Optativo'),
            
            # === BACTERIOLOGÍA ===
            ('Bacteriología', 'BAC-BIO', 1, 'Básico'),
            ('Bacteriología', 'BAC-QUI', 1, 'Básico'),
            ('Bacteriología', 'BAC-MF1', 1, 'Básico'),
            ('Bacteriología', 'BAC-BF', 1, 'Básico'),
            ('Bacteriología', 'BAC-CC1', 1, 'Humanístico'),
            ('Bacteriología', 'BAC-CU', 1, 'Humanístico'),
            ('Bacteriología', 'BAC-BQ', 2, 'Básico'),
            ('Bacteriología', 'BAC-MF2', 2, 'Básico'),
            ('Bacteriología', 'BAC-MG', 2, 'Profesional'),
            ('Bacteriología', 'BAC-BEI', 2, 'Básico'),
            ('Bacteriología', 'BAC-EC1', 2, 'Electivo/Optativo'),
            ('Bacteriología', 'BAC-INM', 3, 'Profesional'),
            ('Bacteriología', 'BAC-PAR', 3, 'Profesional'),
            ('Bacteriología', 'BAC-MIC', 3, 'Profesional'),
            ('Bacteriología', 'BAC-ICE', 3, 'Básico'),
            ('Bacteriología', 'BAC-MI', 3, 'Investigativo'),
            ('Bacteriología', 'BAC-BC1', 4, 'Profesional'),
            ('Bacteriología', 'BAC-VIR', 4, 'Profesional'),
            ('Bacteriología', 'BAC-HEM', 4, 'Profesional'),
            ('Bacteriología', 'BAC-SP', 4, 'Profesional'),
            ('Bacteriología', 'BAC-EC2', 4, 'Electivo/Optativo'),
            ('Bacteriología', 'BAC-MA', 5, 'Profesional'),
            ('Bacteriología', 'BAC-MSA', 5, 'Profesional'),
            ('Bacteriología', 'BAC-IH', 5, 'Profesional'),
            ('Bacteriología', 'BAC-SAO', 5, 'Profesional'),
            ('Bacteriología', 'BAC-EC3', 5, 'Electivo/Optativo'),
            ('Bacteriología', 'BAC-ADM1', 6, 'Profesional'),
            ('Bacteriología', 'BAC-GC', 6, 'Profesional'),
            ('Bacteriología', 'BAC-INV1', 6, 'Investigativo'),
            ('Bacteriología', 'BAC-EGB', 6, 'Humanístico'),
            ('Bacteriología', 'BAC-PH1', 7, 'Práctico'),
            ('Bacteriología', 'BAC-EP1', 7, 'Electivo/Optativo'),
            ('Bacteriología', 'BAC-PH2', 8, 'Práctico'),
            ('Bacteriología', 'BAC-INV2', 8, 'Investigativo'),
            ('Bacteriología', 'BAC-PAAL', 9, 'Práctico'),
            ('Bacteriología', 'BAC-PH3', 9, 'Práctico'),
            ('Bacteriología', 'BAC-SPPC', 9, 'Práctico'),
            ('Bacteriología', 'BAC-INV3', 9, 'Investigativo'),
            ('Bacteriología', 'BAC-ADM2', 9, 'Profesional'),
            
            # === MICROBIOLOGÍA ===
            ('Microbiología', 'MIC-BIO', 1, 'Básico'),
            ('Microbiología', 'MIC-QUI', 1, 'Básico'),
            ('Microbiología', 'MIC-MF1', 1, 'Básico'),
            ('Microbiología', 'MIC-BF', 1, 'Básico'),
            ('Microbiología', 'MIC-CC1', 1, 'Humanístico'),
            ('Microbiología', 'MIC-CU', 1, 'Humanístico'),
            ('Microbiología', 'MIC-BQ', 2, 'Básico'),
            ('Microbiología', 'MIC-MF2', 2, 'Básico'),
            ('Microbiología', 'MIC-MG', 2, 'Profesional'),
            ('Microbiología', 'MIC-BEI', 2, 'Básico'),
            ('Microbiología', 'MIC-EC1', 2, 'Electivo/Optativo'),
            ('Microbiología', 'MIC-INM', 3, 'Profesional'),
            ('Microbiología', 'MIC-PAR', 3, 'Profesional'),
            ('Microbiología', 'MIC-VIR', 3, 'Profesional'),
            ('Microbiología', 'MIC-ICE', 3, 'Básico'),
            ('Microbiología', 'MIC-MI', 3, 'Investigativo'),
            ('Microbiología', 'MIC-GM', 4, 'Profesional'),
            ('Microbiología', 'MIC-BC3', 4, 'Profesional'),
            ('Microbiología', 'MIC-MA', 4, 'Profesional'),
            ('Microbiología', 'MIC-FM', 4, 'Profesional'),
            ('Microbiología', 'MIC-EC2', 4, 'Electivo/Optativo'),
            ('Microbiología', 'MIC-MIND', 5, 'Profesional'),
            ('Microbiología', 'MIC-MM', 5, 'Profesional'),
            ('Microbiología', 'MIC-CT', 5, 'Profesional'),
            ('Microbiología', 'MIC-GC', 5, 'Profesional'),
            ('Microbiología', 'MIC-EC3', 5, 'Electivo/Optativo'),
            ('Microbiología', 'MIC-ADM1', 6, 'Profesional'),
            ('Microbiología', 'MIC-INV1', 6, 'Investigativo'),
            ('Microbiología', 'MIC-EGB', 6, 'Humanístico'),
            ('Microbiología', 'MIC-PH1', 7, 'Práctico'),
            ('Microbiología', 'MIC-EP1', 7, 'Electivo/Optativo'),
            ('Microbiología', 'MIC-PH2', 8, 'Práctico'),
            ('Microbiología', 'MIC-INV2', 8, 'Investigativo'),
            ('Microbiología', 'MIC-PAAL', 9, 'Práctico'),
            ('Microbiología', 'MIC-PH3', 9, 'Práctico'),
            ('Microbiología', 'MIC-SPPC', 9, 'Práctico'),
            ('Microbiología', 'MIC-INV3', 9, 'Investigativo'),
            ('Microbiología', 'MIC-ADM2', 9, 'Profesional'),
            
            # === FISIOTERAPIA ===
            ('Fisioterapia', 'FIS-BIO', 1, 'Básico'),
            ('Fisioterapia', 'FIS-QUI', 1, 'Básico'),
            ('Fisioterapia', 'FIS-MF1', 1, 'Básico'),
            ('Fisioterapia', 'FIS-BF', 1, 'Básico'),
            ('Fisioterapia', 'FIS-FF', 1, 'Profesional'),
            ('Fisioterapia', 'FIS-CC1', 1, 'Humanístico'),
            ('Fisioterapia', 'FIS-CU', 1, 'Humanístico'),
            ('Fisioterapia', 'FIS-BQ', 2, 'Básico'),
            ('Fisioterapia', 'FIS-MF2', 2, 'Básico'),
            ('Fisioterapia', 'FIS-KIN', 2, 'Profesional'),
            ('Fisioterapia', 'FIS-BEI', 2, 'Básico'),
            ('Fisioterapia', 'FIS-EC1', 2, 'Electivo/Optativo'),
            ('Fisioterapia', 'FIS-MF3', 3, 'Básico'),
            ('Fisioterapia', 'FIS-CIN', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-MAS', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-MEC', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-ICE', 3, 'Básico'),
            ('Fisioterapia', 'FIS-MI', 3, 'Investigativo'),
            ('Fisioterapia', 'FIS-FPE', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-ELE', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-FCP', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-HID', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-CN', 4, 'Humanístico'),
            ('Fisioterapia', 'FIS-EC2', 4, 'Electivo/Optativo'),
            ('Fisioterapia', 'FIS-FNE', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-FOT', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-FGE', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-AT', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-SST', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-EC3', 5, 'Electivo/Optativo'),
            ('Fisioterapia', 'FIS-ADM1', 6, 'Profesional'),
            ('Fisioterapia', 'FIS-CSS', 6, 'Profesional'),
            ('Fisioterapia', 'FIS-INV1', 6, 'Investigativo'),
            ('Fisioterapia', 'FIS-EGDF', 6, 'Humanístico'),
            ('Fisioterapia', 'FIS-PH1', 7, 'Práctico'),
            ('Fisioterapia', 'FIS-EP1', 7, 'Electivo/Optativo'),
            ('Fisioterapia', 'FIS-PH2', 8, 'Práctico'),
            ('Fisioterapia', 'FIS-FMO', 8, 'Profesional'),
            ('Fisioterapia', 'FIS-INV2', 8, 'Investigativo'),
            ('Fisioterapia', 'FIS-ADM2', 8, 'Profesional'),
            ('Fisioterapia', 'FIS-PH3', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-PAADM', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-SPPC', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-INV3', 9, 'Investigativo'),
            
            # === INSTRUMENTACIÓN QUIRÚRGICA ===
            ('Instrumentación Quirúrgica', 'IQ-BIO', 1, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-QUI', 1, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-MF1', 1, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-BF', 1, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-IIQ', 1, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CC1', 1, 'Humanístico'),
            ('Instrumentación Quirúrgica', 'IQ-CU', 1, 'Humanístico'),
            ('Instrumentación Quirúrgica', 'IQ-BQ', 2, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-MF2', 2, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-MIC', 2, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-PA1', 2, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-BEI', 2, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-EC1', 2, 'Electivo/Optativo'),
            ('Instrumentación Quirúrgica', 'IQ-FA', 3, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-CIPS', 3, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQCGP', 3, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-ICE', 3, 'Básico'),
            ('Instrumentación Quirúrgica', 'IQ-MI', 3, 'Investigativo'),
            ('Instrumentación Quirúrgica', 'IQ-PQGO', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQU', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PA2', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CN', 4, 'Humanístico'),
            ('Instrumentación Quirúrgica', 'IQ-SST', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-EC2', 4, 'Electivo/Optativo'),
            ('Instrumentación Quirúrgica', 'IQ-PQO', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQN', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-IT', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-GC', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-EC3', 5, 'Electivo/Optativo'),
            ('Instrumentación Quirúrgica', 'IQ-ADM1', 6, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CSS', 6, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-INV1', 6, 'Investigativo'),
            ('Instrumentación Quirúrgica', 'IQ-EGDIQ', 6, 'Humanístico'),
            ('Instrumentación Quirúrgica', 'IQ-PH1', 7, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-EP1', 7, 'Electivo/Optativo'),
            ('Instrumentación Quirúrgica', 'IQ-PH2', 8, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-PQCM', 8, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-INV2', 8, 'Investigativo'),
            ('Instrumentación Quirúrgica', 'IQ-ADM2', 8, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PH3', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-PAADM', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-SPPC', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-INV3', 9, 'Investigativo'),
            
            # === MEDICINA ===
            ('Medicina', 'MED-BCM', 1, 'Básico'),
            ('Medicina', 'MED-QUI', 1, 'Básico'),
            ('Medicina', 'MED-MORF1', 1, 'Básico'),
            ('Medicina', 'MED-CC1', 1, 'Humanístico'),
            ('Medicina', 'MED-AMA', 1, 'Humanístico'),
            ('Medicina', 'MED-PS1', 1, 'Práctico'),
            ('Medicina', 'MED-CU', 1, 'Humanístico'),
            ('Medicina', 'MED-BQ', 2, 'Básico'),
            ('Medicina', 'MED-MORF2', 2, 'Básico'),
            ('Medicina', 'MED-FIS1', 2, 'Básico'),
            ('Medicina', 'MED-CC2', 2, 'Humanístico'),
            ('Medicina', 'MED-BEI', 2, 'Básico'),
            ('Medicina', 'MED-PS2', 2, 'Práctico'),
            ('Medicina', 'MED-FIS2', 3, 'Básico'),
            ('Medicina', 'MED-MP', 3, 'Básico'),
            ('Medicina', 'MED-GEN', 3, 'Básico'),
            ('Medicina', 'MED-FPS', 3, 'Humanístico'),
            ('Medicina', 'MED-EGB', 3, 'Humanístico'),
            ('Medicina', 'MED-PS3', 3, 'Práctico'),
            ('Medicina', 'MED-INM', 4, 'Básico'),
            ('Medicina', 'MED-SEM1', 4, 'Profesional'),
            ('Medicina', 'MED-PAT1', 4, 'Básico'),
            ('Medicina', 'MED-NUT', 4, 'Básico'),
            ('Medicina', 'MED-EPI1', 4, 'Básico'),
            ('Medicina', 'MED-SA', 4, 'Humanístico'),
            ('Medicina', 'MED-SEM2', 5, 'Profesional'),
            ('Medicina', 'MED-PAT2', 5, 'Básico'),
            ('Medicina', 'MED-FARM1', 5, 'Básico'),
            ('Medicina', 'MED-MP2', 5, 'Profesional'),
            ('Medicina', 'MED-EC1', 5, 'Electivo/Optativo'),
            ('Medicina', 'MED-MI1', 6, 'Profesional'),
            ('Medicina', 'MED-CIR1', 6, 'Profesional'),
            ('Medicina', 'MED-FARM2', 6, 'Básico'),
            ('Medicina', 'MED-MINV', 6, 'Investigativo'),
            ('Medicina', 'MED-CN', 6, 'Humanístico'),
            ('Medicina', 'MED-MI2', 7, 'Profesional'),
            ('Medicina', 'MED-CIR2', 7, 'Profesional'),
            ('Medicina', 'MED-PED1', 7, 'Profesional'),
            ('Medicina', 'MED-GO1', 7, 'Profesional'),
            ('Medicina', 'MED-EPI2', 7, 'Básico'),
            ('Medicina', 'MED-MI3', 8, 'Profesional'),
            ('Medicina', 'MED-CIR3', 8, 'Profesional'),
            ('Medicina', 'MED-PED2', 8, 'Profesional'),
            ('Medicina', 'MED-GO2', 8, 'Profesional'),
            ('Medicina', 'MED-INV1', 8, 'Investigativo'),
            ('Medicina', 'MED-PSI', 9, 'Profesional'),
            ('Medicina', 'MED-ORT', 9, 'Profesional'),
            ('Medicina', 'MED-URO', 9, 'Profesional'),
            ('Medicina', 'MED-OFT', 9, 'Profesional'),
            ('Medicina', 'MED-ORL', 9, 'Profesional'),
            ('Medicina', 'MED-INV2', 9, 'Investigativo'),
            ('Medicina', 'MED-ML', 10, 'Profesional'),
            ('Medicina', 'MED-DER', 10, 'Profesional'),
            ('Medicina', 'MED-ANE', 10, 'Profesional'),
            ('Medicina', 'MED-RAD', 10, 'Profesional'),
            ('Medicina', 'MED-EP1', 10, 'Electivo/Optativo'),
            ('Medicina', 'MED-INV3', 10, 'Investigativo'),
            ('Medicina', 'MED-IR', 11, 'Práctico'),
        ]
        
        created_count = 0
        skipped_count = 0
        
        for nombre_programa, codigo_asignatura, semestre, componente in relaciones_data:
            try:
                programa = Programa.objects.get(nombre=nombre_programa)
                asignatura = Asignatura.objects.get(codigo=codigo_asignatura)
                
                _, created = AsignaturaPrograma.objects.get_or_create(
                    programa=programa,
                    asignatura=asignatura,
                    defaults={
                        'semestre': semestre,
                        'componente_formativo': componentes_map.get(componente, 'Básico')
                    }
                )
                if created:
                    created_count += 1
            except Programa.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'    ! Programa no encontrado: {nombre_programa}'))
                skipped_count += 1
            except Asignatura.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'    ! Asignatura no encontrada: {codigo_asignatura}'))
                skipped_count += 1
        
        total = len(relaciones_data)
        self.stdout.write(self.style.SUCCESS(f'    ✓ Relaciones procesadas: {created_count} nuevas, {skipped_count} omitidas, {total} totales'))

    def create_asignaturas(self):
        """Crear todas las asignaturas de todos los programas"""
        self.stdout.write('  → Creando asignaturas...')
        self.stdout.write('     Este proceso puede tomar unos segundos...')
        
        asignaturas_data = self._get_all_asignaturas()
        
        created_count = 0
        updated_count = 0
        
        for nombre, codigo, creditos, tipo_str, horas in asignaturas_data:
            # Mapear tipo string a choice del modelo
            tipo_map = {
                'Teórica': 'teórica',
                'Práctica': 'práctica',
                'Teórica/Práctica': 'mixta',
                'Mixta': 'mixta'
            }
            tipo = tipo_map.get(tipo_str, 'teórica')
            
            asignatura, created = Asignatura.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'creditos': creditos,
                    'tipo': tipo,
                    'horas': horas
                }
            )
            
            if created:
                created_count += 1
            elif (asignatura.nombre != nombre or asignatura.creditos != creditos or 
                  asignatura.tipo != tipo or asignatura.horas != horas):
                # Actualizar si hay cambios
                asignatura.nombre = nombre
                asignatura.creditos = creditos
                asignatura.tipo = tipo
                asignatura.horas = horas
                asignatura.save()
                updated_count += 1
        
        total = len(asignaturas_data)
        self.stdout.write(self.style.SUCCESS(f'    ✓ Asignaturas procesadas: {created_count} nuevas, {updated_count} actualizadas, {total} totales'))

    def _get_all_asignaturas(self):
        """Retorna la lista completa de asignaturas de todos los programas"""
        # Formato: (nombre, código, créditos, tipo, horas)
        return [
            # === NEGOCIOS INTERNACIONALES (NI) ===
            ('Fundamentos de Matemáticas', 'NI-FM', 4, 'Teórica', 4),
            ('Principios de Derecho y Constitución', 'NI-PDC', 2, 'Teórica', 2),
            ('Expresión Verbal y Escrita', 'NI-EVE', 2, 'Teórica', 2),
            ('Emprendimiento e Innovación', 'NI-EI', 2, 'Teórica/Práctica', 2),
            ('Fundamentos de Economía', 'NI-FE', 2, 'Teórica', 2),
            ('Fundamentos de Administración', 'NI-FA', 3, 'Teórica', 3),
            ('Fundamentos de Negocios Internacionales', 'NI-FNI', 3, 'Teórica', 3),
            ('Cálculo', 'NI-CAL', 4, 'Teórica', 4),
            ('Epistemología y Metodología de la Investigación', 'NI-EMI', 2, 'Teórica', 2),
            ('Contabilidad Financiera', 'NI-CF', 3, 'Teórica/Práctica', 3),
            ('Economía de Empresa', 'NI-EE', 2, 'Teórica', 2),
            ('Derecho Comercial', 'NI-DC', 2, 'Teórica', 2),
            ('Gestión de la Planeación y Organización', 'NI-GPO', 3, 'Teórica/Práctica', 3),
            ('Estadística Descriptiva', 'NI-ED', 3, 'Teórica', 3),
            ('Matemáticas Financieras', 'NI-MF', 3, 'Teórica', 3),
            ('Derecho Laboral y de Seguridad Social', 'NI-DLSS', 2, 'Teórica', 2),
            ('Sistemas de Costeo', 'NI-SC', 3, 'Teórica/Práctica', 3),
            ('Coyuntura Económica Nacional', 'NI-CEN', 2, 'Teórica', 2),
            ('Presupuestos Empresariales', 'NI-PE', 3, 'Teórica/Práctica', 3),
            ('Dirección y Liderazgo', 'NI-DL', 2, 'Teórica/Práctica', 2),
            ('Estadística Inferencial', 'NI-EI2', 3, 'Teórica', 3),
            ('Administración Financiera', 'NI-AF', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Mercadeo', 'NI-FMERC', 3, 'Teórica/Práctica', 3),
            ('Geopolítica', 'NI-GEO', 2, 'Teórica', 2),
            ('Gestión del Talento Humano', 'NI-GTH', 3, 'Teórica/Práctica', 3),
            ('Legislación Aduanera', 'NI-LA', 2, 'Teórica', 2),
            ('Coyuntura Económica Internacional', 'NI-CEI', 2, 'Teórica', 2),
            ('Modelos de Investigación', 'NI-MI', 2, 'Teórica', 2),
            ('Investigación de Operaciones', 'NI-IO', 3, 'Teórica/Práctica', 3),
            ('Desarrollo e Innovación de las Organizaciones', 'NI-DIO', 3, 'Teórica/Práctica', 3),
            ('Comercio y Negocios Globales', 'NI-CNG', 2, 'Teórica', 2),
            ('Finanzas Corporativas', 'NI-FC', 3, 'Teórica/Práctica', 3),
            ('Derecho Comercial Internacional', 'NI-DCI', 2, 'Teórica', 2),
            ('Logística y Distribución Física Internacional', 'NI-LDFI', 2, 'Teórica/Práctica', 2),
            ('Formulación y Gestión de Proyectos', 'NI-FGP', 3, 'Teórica/Práctica', 3),
            ('Electiva I', 'NI-ELEC1', 2, 'Teórica', 2),
            ('Investigación de Mercados', 'NI-IM', 3, 'Teórica/Práctica', 3),
            ('Finanzas Internacionales', 'NI-FI', 3, 'Teórica/Práctica', 3),
            ('Gestión de Importaciones', 'NI-GI', 2, 'Teórica/Práctica', 2),
            ('Gestión del Transporte Internacional', 'NI-GTI', 2, 'Teórica/Práctica', 2),
            ('Optativa de Énfasis I', 'NI-OE1', 4, 'Teórica/Práctica', 4),
            ('Electiva II', 'NI-ELEC2', 2, 'Teórica', 2),
            ('Seminario de Negociación y Concertación', 'NI-SNC', 2, 'Teórica/Práctica', 2),
            ('International Marketing', 'NI-IMKT', 2, 'Teórica/Práctica', 2),
            ('Proyecto de Investigación', 'NI-PI', 2, 'Teórica', 2),
            ('International Agreement', 'NI-IA', 3, 'Teórica', 3),
            ('Gerencia de Comercio Exterior', 'NI-GCE', 3, 'Teórica/Práctica', 3),
            ('Gestión de Exportaciones', 'NI-GEX', 2, 'Teórica/Práctica', 2),
            ('Optativa de Énfasis II', 'NI-OE2', 3, 'Teórica/Práctica', 3),
            ('Electiva III', 'NI-ELEC3', 2, 'Teórica', 2),
            ('Simulación Gerencial', 'NI-SG', 2, 'Teórica/Práctica', 2),
            ('Régimen Cambiario y Aduanero', 'NI-RCA', 2, 'Teórica', 2),
            ('Mercado de Capitales', 'NI-MC', 2, 'Teórica', 2),
            ('Ética Profesional y Responsabilidad Social', 'NI-EPRS', 2, 'Teórica', 2),
            ('Globalización', 'NI-GLOB', 3, 'Teórica', 3),
            ('Optativa de Énfasis III', 'NI-OE3', 4, 'Teórica/Práctica', 4),
            
            # === CONTADURÍA PÚBLICA (CP) ===
            ('Fundamentos de Matemáticas', 'CP-FM', 4, 'Teórica', 4),
            ('Fundamentos de Economía', 'CP-FE', 4, 'Teórica', 4),
            ('Principios de Derecho y Constitución', 'CP-PDC', 2, 'Teórica', 2),
            ('Expresión Verbal y Escrita', 'CP-EVE', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'CP-CU', 2, 'Teórica', 2),
            ('Electiva I', 'CP-ELEC1', 1, 'Teórica', 1),
            ('Fundamentos de Administración', 'CP-FA', 2, 'Teórica', 2),
            ('Cálculo I', 'CP-CAL1', 4, 'Teórica', 4),
            ('Economía de Empresa', 'CP-EE', 4, 'Teórica', 4),
            ('Epistemología y Metodología de la Investigación', 'CP-EMI', 2, 'Teórica', 2),
            ('Derecho Comercial', 'CP-DC', 3, 'Teórica', 3),
            ('Contabilidad Financiera', 'CP-CF', 2, 'Teórica/Práctica', 2),
            ('Electiva II', 'CP-ELEC2', 2, 'Teórica', 2),
            ('Ciclo de Egresos y Administración de Inventarios', 'CP-CEAI', 4, 'Teórica/Práctica', 4),
            ('Teorías Contables', 'CP-TC', 2, 'Teórica', 2),
            ('Matemáticas Financieras', 'CP-MF', 3, 'Teórica', 3),
            ('Estadística Descriptiva', 'CP-ED', 3, 'Teórica', 3),
            ('Coyuntura Económica Nacional', 'CP-CEN', 2, 'Teórica', 2),
            ('Emprendimiento e Innovación', 'CP-EI', 2, 'Teórica/Práctica', 2),
            ('Derecho Laboral y de Seguridad Social', 'CP-DLSS', 2, 'Teórica', 2),
            ('Ciclo de Inversiones y Financiación', 'CP-CIF', 4, 'Teórica/Práctica', 4),
            ('Sistemas de Costeo', 'CP-SC', 4, 'Teórica/Práctica', 4),
            ('Contabilidad Ambiental', 'CP-CA', 2, 'Teórica', 2),
            ('Estadística Inferencial', 'CP-EI2', 3, 'Teórica', 3),
            ('Gerencia Estratégica Organizacional', 'CP-GEO', 2, 'Teórica', 2),
            ('Fundamentos de Mercadeo', 'CP-FMERC', 2, 'Teórica/Práctica', 2),
            ('Modelos de Investigación', 'CP-MI', 2, 'Teórica', 2),
            ('Ciclo de Estados Financieros', 'CP-CEF', 4, 'Teórica/Práctica', 4),
            ('Costos Gerenciales', 'CP-CG', 4, 'Teórica/Práctica', 4),
            ('Fundamentos y Normatividad Tributaria', 'CP-FNT', 2, 'Teórica', 2),
            ('Aseguramiento y Fundamentos de Control', 'CP-AFC', 3, 'Teórica', 3),
            ('Investigación de Operaciones', 'CP-IO', 2, 'Teórica/Práctica', 2),
            ('Electiva III', 'CP-ELEC3', 1, 'Teórica', 1),
            ('Electiva IV', 'CP-ELEC4', 2, 'Teórica', 2),
            ('Auditoría Aplicada', 'CP-AA', 4, 'Teórica/Práctica', 4),
            ('Impuesto sobre la Renta y Complementarios', 'CP-IRC', 4, 'Teórica', 4),
            ('Presupuestos Empresariales', 'CP-PE', 3, 'Teórica/Práctica', 3),
            ('Administración Financiera', 'CP-AF', 3, 'Teórica/Práctica', 3),
            ('Optativa I', 'CP-OPT1', 3, 'Teórica/Práctica', 3),
            ('Comercio y Negocios Globales', 'CP-CNG', 2, 'Teórica', 2),
            ('Revisoría Fiscal', 'CP-RF', 4, 'Teórica/Práctica', 4),
            ('Contabilidad y Finanzas Públicas', 'CP-CFP', 3, 'Teórica', 3),
            ('Finanzas Corporativas', 'CP-FC', 3, 'Teórica/Práctica', 3),
            ('Formulación y Gestión de Proyectos', 'CP-FGP', 3, 'Teórica/Práctica', 3),
            ('Impuesto a las Ventas y Retención en la Fuente', 'CP-IVRF', 3, 'Teórica', 3),
            ('Optativa II', 'CP-OPT2', 2, 'Teórica/Práctica', 2),
            ('Impuestos Territoriales y Procedimiento Tributario', 'CP-ITPT', 3, 'Teórica', 3),
            ('Auditoría de Sistemas', 'CP-AS', 3, 'Teórica/Práctica', 3),
            ('Ética Profesional', 'CP-EP', 3, 'Teórica', 3),
            ('Optativa III', 'CP-OPT3', 3, 'Teórica/Práctica', 3),
            ('Simulación Gerencial', 'CP-SG', 3, 'Teórica/Práctica', 3),
            ('Electiva V', 'CP-ELEC5', 4, 'Teórica', 4),
            ('Ciclo Básico Contable', 'CP-CBC', 3, 'Teórica', 3),
            
            # === INSTRUMENTACIÓN QUIRÚRGICA (IQ) ===
            ('Biología', 'IQ-BIO', 2, 'Teórica', 2),
            ('Morfofisiología I', 'IQ-MF1', 3, 'Teórica/Práctica', 3),
            ('Biofísica', 'IQ-BF', 2, 'Teórica', 2),
            ('Química', 'IQ-QUI', 2, 'Teórica', 2),
            ('Introducción a la Instrumentación', 'IQ-IIQ', 2, 'Teórica/Práctica', 2),
            ('Competencias Comunicativas I', 'IQ-CC1', 2, 'Teórica', 2),
            ('Sociedad, Sector Salud y Comunidad', 'IQ-SSSC', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'IQ-CU', 1, 'Teórica', 1),
            ('Bioquímica', 'IQ-BQ', 2, 'Teórica', 2),
            ('Morfofisiología II', 'IQ-MF2', 3, 'Teórica/Práctica', 3),
            ('Microbiología', 'IQ-MIC', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Psicología', 'IQ-FPS', 2, 'Teórica', 2),
            ('Competencias Comunicativas II', 'IQ-CC2', 2, 'Teórica', 2),
            ('Bioestadística e Informática', 'IQ-BEI', 2, 'Teórica/Práctica', 2),
            ('Ética General y Deontología de la Instrumentación Quirúrgica', 'IQ-EGDIQ', 3, 'Teórica', 3),
            ('Patología', 'IQ-PAT', 3, 'Teórica', 3),
            ('Control de Infecciones y Promoción de la Salud', 'IQ-CIPS', 2, 'Teórica/Práctica', 2),
            ('Procesos Asépticos I', 'IQ-PA1', 3, 'Práctica', 3),
            ('Cuidados Básicos en Salud', 'IQ-CBS', 3, 'Teórica/Práctica', 3),
            ('Investigación Clínica Epidemiológica', 'IQ-ICE', 2, 'Teórica', 2),
            ('Farmacología y Anestesia', 'IQ-FA', 3, 'Teórica/Práctica', 3),
            ('Socioantropología', 'IQ-SA', 2, 'Teórica', 2),
            ('Electiva Complementaria I', 'IQ-EC1', 1, 'Teórica', 1),
            ('Procesos Quirúrgicos en Cirugía General y Pediatría', 'IQ-PQCGP', 4, 'Práctica', 4),
            ('Procesos Quirúrgicos en Urología', 'IQ-PQU', 2, 'Práctica', 2),
            ('Constitución Nacional', 'IQ-CN', 2, 'Teórica', 2),
            ('Procesos Quirúrgicos en Gineco-Obstetricia', 'IQ-PQGO', 2, 'Práctica', 2),
            ('Procesos Asépticos II', 'IQ-PA2', 3, 'Práctica', 3),
            ('Metodología de la Investigación', 'IQ-MI', 2, 'Teórica', 2),
            ('Salud y Seguridad en el Trabajo', 'IQ-SST', 2, 'Teórica', 2),
            ('Práctica Hospitalaria I', 'IQ-PH1', 8, 'Práctica', 8),
            ('Procesos Quirúrgicos en Ortopedia', 'IQ-PQO', 3, 'Práctica', 3),
            ('Procesos Quirúrgicos en Neurocirugía', 'IQ-PQN', 3, 'Práctica', 3),
            ('Innovación y Tecnología', 'IQ-IT', 4, 'Teórica/Práctica', 4),
            ('Calidad en Servicios de Salud', 'IQ-CSS', 2, 'Teórica', 2),
            ('Práctica Hospitalaria II', 'IQ-PH2', 7, 'Práctica', 7),
            ('Procesos Quirúrgicos en Cirugía Maxilofacial', 'IQ-PQCM', 2, 'Práctica', 2),
            ('Procesos Quirúrgicos en Cirugía Plástica', 'IQ-PQCP', 2, 'Práctica', 2),
            ('Procesos Quirúrgicos en Oftalmología', 'IQ-PQOF', 2, 'Práctica', 2),
            ('Electiva de Profundización I', 'IQ-EP1', 2, 'Teórica/Práctica', 2),
            ('Investigación I', 'IQ-INV1', 3, 'Teórica', 3),
            ('Administración I', 'IQ-ADM1', 2, 'Teórica', 2),
            ('Salud Pública', 'IQ-SP', 2, 'Teórica', 2),
            ('Práctica Hospitalaria III', 'IQ-PH3', 8, 'Práctica', 8),
            ('Procesos Quirúrgicos en Otorrinolaringología', 'IQ-PQORL', 3, 'Práctica', 3),
            ('Procesos Quirúrgicos en Cardiovascular', 'IQ-PQCV', 3, 'Práctica', 3),
            ('Electiva de Profundización II', 'IQ-EP2', 5, 'Teórica/Práctica', 5),
            ('Investigación II', 'IQ-INV2', 2, 'Teórica', 2),
            ('Administración II', 'IQ-ADM2', 2, 'Teórica', 2),
            ('Práctica Hospitalaria IV', 'IQ-PH4', 8, 'Práctica', 8),
            ('Práctica de Administración', 'IQ-PAADM', 6, 'Práctica', 6),
            ('Salud Pública (Práctica Comunitaria)', 'IQ-SPPC', 4, 'Práctica', 4),
            ('Investigación III', 'IQ-INV3', 2, 'Teórica', 2),
            
            # === INGENIERÍA DE SISTEMAS (IS) ===
            ('Cálculo Diferencial', 'IS-CALD', 3, 'Teórica', 3),
            ('Física Mecánica', 'IS-FM', 3, 'Teórica', 3),
            ('Introducción a la Ingeniería', 'IS-II', 2, 'Teórica', 2),
            ('Lógica y Algoritmos', 'IS-LA', 3, 'Teórica/Práctica', 3),
            ('Lógica Matemática', 'IS-LM', 3, 'Teórica', 3),
            ('Competencias de Aprendizaje y Comunicación', 'IS-CAC', 3, 'Teórica', 3),
            ('Cátedra Unilibrista', 'IS-CU', 1, 'Teórica', 1),
            ('Cálculo Integral', 'IS-CALI', 3, 'Teórica', 3),
            ('Electricidad y Magnetismo y Laboratorio', 'IS-EML', 3, 'Teórica/Práctica', 3),
            ('Álgebra Lineal', 'IS-AL', 3, 'Teórica', 3),
            ('Pensamiento Sistémico', 'IS-PS', 2, 'Teórica', 2),
            ('Fundamentos de Programación', 'IS-FP', 3, 'Teórica/Práctica', 3),
            ('Electrónica Digital', 'IS-EDI', 2, 'Teórica/Práctica', 2),
            ('Electiva I', 'IS-ELEC1', 2, 'Teórica', 2),
            ('Cálculo Multivariado y Vectorial', 'IS-CMV', 3, 'Teórica', 3),
            ('Probabilidad y Estadística Descriptiva', 'IS-PED', 3, 'Teórica', 3),
            ('Diseño en Ingeniería', 'IS-DI', 3, 'Teórica/Práctica', 3),
            ('Estructuras de Datos', 'IS-EDAT', 3, 'Teórica/Práctica', 3),
            ('Arquitectura de Computadores', 'IS-AC', 3, 'Teórica/Práctica', 3),
            ('Ingeniería de Software I', 'IS-ISW1', 3, 'Teórica/Práctica', 3),
            ('Ecuaciones Diferenciales', 'IS-EDIF', 3, 'Teórica', 3),
            ('Cátedra de Sostenibilidad', 'IS-CS', 2, 'Teórica', 2),
            ('Constitución Política', 'IS-CP', 2, 'Teórica', 2),
            ('Fundamentos de Bases de Datos', 'IS-FBD', 3, 'Teórica/Práctica', 3),
            ('Programación I', 'IS-PROG1', 3, 'Teórica/Práctica', 3),
            ('Ingeniería de Software II', 'IS-ISW2', 3, 'Teórica/Práctica', 3),
            ('Electiva II', 'IS-ELEC2', 2, 'Teórica', 2),
            ('Matemáticas Discretas', 'IS-MD', 3, 'Teórica', 3),
            ('Sistemas Operativos', 'IS-SO', 3, 'Teórica/Práctica', 3),
            ('Sistemas de Bases de Datos', 'IS-SBD', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Economía', 'IS-FE', 3, 'Teórica', 3),
            ('Ingeniería de Software III', 'IS-ISW3', 3, 'Teórica/Práctica', 3),
            ('Programación II', 'IS-PROG2', 3, 'Teórica/Práctica', 3),
            ('Formulación y Evaluación de Proyectos', 'IS-FEP', 3, 'Teórica/Práctica', 3),
            ('Programación Web', 'IS-PWEB', 3, 'Teórica/Práctica', 3),
            ('Programación Lineal', 'IS-PL', 2, 'Teórica', 2),
            ('Arquitectura de Información', 'IS-AI', 2, 'Teórica/Práctica', 2),
            ('Redes de Computadores', 'IS-RC', 3, 'Teórica/Práctica', 3),
            ('Electiva III', 'IS-ELEC3', 2, 'Teórica', 2),
            ('Optativa I', 'IS-OPT1', 3, 'Teórica/Práctica', 3),
            ('Metodología de la Investigación', 'IS-MI', 3, 'Teórica', 3),
            ('Ética', 'IS-ET', 2, 'Teórica', 2),
            ('Seguridad de la Información', 'IS-SI', 2, 'Teórica/Práctica', 2),
            ('Inteligencia Artificial', 'IS-IA', 3, 'Teórica/Práctica', 3),
            ('Programación Móvil', 'IS-PM', 3, 'Teórica/Práctica', 3),
            ('Gestión de Proyectos de Ingeniería', 'IS-GPI', 2, 'Teórica', 2),
            ('Optativa II', 'IS-OPT2', 3, 'Teórica/Práctica', 3),
            ('Ingeniería Aplicada', 'IS-IAP', 3, 'Teórica/Práctica', 3),
            ('Arquitectura Empresarial', 'IS-AE', 3, 'Teórica', 3),
            ('Sistemas Integrados de Gestión', 'IS-SIG', 3, 'Teórica', 3),
            ('Práctica Empresarial', 'IS-PE', 3, 'Práctica', 3),
            ('Gerencia Estratégica', 'IS-GE', 3, 'Teórica', 3),
            ('Optativa III', 'IS-OPT3', 3, 'Teórica/Práctica', 3),
            
            # === INGENIERÍA INDUSTRIAL (II) ===
            ('Cálculo Diferencial', 'II-CALD', 3, 'Teórica', 3),
            ('Química General y Laboratorio', 'II-QGL', 3, 'Teórica/Práctica', 3),
            ('Introducción a la Ingeniería', 'II-II', 2, 'Teórica', 2),
            ('Lógica y Algoritmos', 'II-LA', 3, 'Teórica/Práctica', 3),
            ('Expresión Gráfica para Ingeniería', 'II-EGI', 3, 'Teórica/Práctica', 3),
            ('Competencias de Aprendizaje y Comunicación', 'II-CAC', 3, 'Teórica', 3),
            ('Cátedra Unilibrista', 'II-CU', 1, 'Teórica', 1),
            ('Cálculo Int egral', 'II-CALI', 3, 'Teórica', 3),
            ('Física Mecánica y Laboratorio', 'II-FML', 3, 'Teórica/Práctica', 3),
            ('Álgebra Lineal', 'II-AL', 3, 'Teórica', 3),
            ('Ciencia de los Materiales en la Industria', 'II-CMI', 2, 'Teórica/Práctica', 2),
            ('Lenguaje de Programación', 'II-LP', 3, 'Teórica/Práctica', 3),
            ('Contabilidad y Presupuesto', 'II-CP', 2, 'Teórica/Práctica', 2),
            ('Electiva I', 'II-ELEC1', 2, 'Teórica', 2),
            ('Cálculo Multivariado y Vectorial', 'II-CMV', 3, 'Teórica', 3),
            ('Electricidad y Magnetismo y Laboratorio', 'II-EML', 3, 'Teórica/Práctica', 3),
            ('Probabilidad y Estadística Descriptiva', 'II-PED', 3, 'Teórica', 3),
            ('Diseño en Ingeniería', 'II-DI', 2, 'Teórica/Práctica', 2),
            ('Gestión Organizacional', 'II-GO', 2, 'Teórica', 2),
            ('Fundamentos de Economía', 'II-FE', 3, 'Teórica', 3),
            ('Electiva II', 'II-ELEC2', 2, 'Teórica', 2),
            ('Ecuaciones Diferenciales', 'II-ED', 3, 'Teórica', 3),
            ('Termodinámica', 'II-TERM', 3, 'Teórica/Práctica', 3),
            ('Gerencia Estratégica', 'II-GE', 3, 'Teórica', 3),
            ('Control Estadístico de la Calidad', 'II-CEC', 3, 'Teórica/Práctica', 3),
            ('Procesos Industriales', 'II-PI', 3, 'Teórica/Práctica', 3),
            ('Costos de Operación', 'II-CO', 3, 'Teórica', 3),
            ('Investigación Operativa I', 'II-IO1', 3, 'Teórica/Práctica', 3),
            ('Sistemas Integrados de Gestión', 'II-SIG', 2, 'Teórica', 2),
            ('Diseño de Productos y Servicios', 'II-DPS', 3, 'Teórica/Práctica', 3),
            ('Ingeniería de Métodos', 'II-IM', 3, 'Teórica/Práctica', 3),
            ('Ingeniería Económica', 'II-IE', 3, 'Teórica', 3),
            ('Cátedra de Sostenibilidad', 'II-CS', 2, 'Teórica', 2),
            ('Electiva III', 'II-ELEC3', 2, 'Teórica', 2),
            ('Investigación Operativa II', 'II-IO2', 3, 'Teórica/Práctica', 3),
            ('Planeación y Control de la Producción y Operaciones', 'II-PCPO', 3, 'Teórica/Práctica', 3),
            ('Mercadeo', 'II-MER', 3, 'Teórica', 3),
            ('Gestión de la Tecnología', 'II-GT', 3, 'Teórica', 3),
            ('Finanzas', 'II-FIN', 3, 'Teórica', 3),
            ('Optativa I', 'II-OPT1', 3, 'Teórica/Práctica', 3),
            ('Modelos Matemáticos Estocásticos', 'II-MME', 3, 'Teórica', 3),
            ('Seguridad y Salud en el Trabajo', 'II-SST', 2, 'Teórica', 2),
            ('Formulación y Evaluación de Proyectos', 'II-FEP', 3, 'Teórica/Práctica', 3),
            ('Metodología de la Investigación', 'II-MI', 3, 'Teórica', 3),
            ('Constitución Política', 'II-CPOL', 2, 'Teórica', 2),
            ('Ética', 'II-ET', 2, 'Teórica', 2),
            ('Optativa II', 'II-OPT2', 3, 'Teórica/Práctica', 3),
            ('Diseño de Instalaciones Industriales y de Servicios', 'II-DIIS', 3, 'Teórica/Práctica', 3),
            ('Logística y Cadena de Suministros', 'II-LCS', 3, 'Teórica/Práctica', 3),
            ('Ingeniería Aplicada', 'II-IA', 3, 'Teórica/Práctica', 3),
            ('Simulación de Procesos', 'II-SP', 3, 'Teórica/Práctica', 3),
            ('Práctica Empresarial', 'II-PE', 3, 'Práctica', 3),
            ('Optativa III', 'II-OPT3', 3, 'Teórica/Práctica', 3),
            
            # === DERECHO (DER) ===
            ('Introducción al Derecho', 'DER-ID', 3, 'Teórica', 3),
            ('Derecho Romano', 'DER-DR', 3, 'Teórica', 3),
            ('Historia del Derecho', 'DER-HD', 2, 'Teórica', 2),
            ('Teoría del Estado', 'DER-TE', 3, 'Teórica', 3),
            ('Competencias Comunicativas', 'DER-CC', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'DER-CU', 1, 'Teórica', 1),
            ('Derecho Constitucional I', 'DER-DC1', 3, 'Teórica', 3),
            ('Teoría General del Derecho', 'DER-TGD', 3, 'Teórica', 3),
            ('Derecho Civil Personas', 'DER-DCP', 3, 'Teórica', 3),
            ('Sociología Jurídica', 'DER-SJ', 2, 'Teórica', 2),
            ('Metodología de la Investigación', 'DER-MI', 3, 'Teórica', 3),
            ('Derecho Constitucional II', 'DER-DC2', 3, 'Teórica', 3),
            ('Derecho Civil Bienes', 'DER-DCB', 3, 'Teórica', 3),
            ('Derecho Penal General', 'DER-DPG', 3, 'Teórica', 3),
            ('Filosofía del Derecho', 'DER-FD', 2, 'Teórica', 2),
            ('Electiva I', 'DER-ELEC1', 2, 'Teórica', 2),
            ('Derecho Civil Obligaciones', 'DER-DCO', 3, 'Teórica', 3),
            ('Derecho Penal Especial', 'DER-DPE', 3, 'Teórica', 3),
            ('Derecho Administrativo I', 'DER-DA1', 3, 'Teórica', 3),
            ('Hermenéutica Jurídica', 'DER-HJ', 2, 'Teórica', 2),
            ('Electiva II', 'DER-ELEC2', 2, 'Teórica', 2),
            ('Derecho Civil Contratos', 'DER-DCC', 3, 'Teórica', 3),
            ('Derecho Procesal Civil I', 'DER-DPC1', 3, 'Teórica', 3),
            ('Derecho Administrativo II', 'DER-DA2', 3, 'Teórica', 3),
            ('Derecho Laboral Individual', 'DER-DLI', 3, 'Teórica', 3),
            ('Electiva III', 'DER-ELEC3', 2, 'Teórica', 2),
            ('Derecho Procesal Civil II', 'DER-DPC2', 3, 'Teórica', 3),
            ('Derecho Laboral Colectivo', 'DER-DLC', 3, 'Teórica', 3),
            ('Derecho Comercial I', 'DER-DCOM1', 3, 'Teórica', 3),
            ('Derecho Procesal Penal', 'DER-DPP', 3, 'Teórica', 3),
            ('Ética Profesional', 'DER-EP', 2, 'Teórica', 2),
            ('Derecho Comercial II', 'DER-DCOM2', 3, 'Teórica', 3),
            ('Derecho Probatorio', 'DER-DPR', 3, 'Teórica', 3),
            ('Derecho Internacional Público', 'DER-DIP', 3, 'Teórica', 3),
            ('Derecho Tributario', 'DER-DT', 3, 'Teórica', 3),
            ('Optativa I', 'DER-OPT1', 2, 'Teórica', 2),
            ('Derecho Internacional Privado', 'DER-DIPR', 3, 'Teórica', 3),
            ('Derecho Financiero', 'DER-DF', 3, 'Teórica', 3),
            ('Derecho Procesal Administrativo', 'DER-DPA', 3, 'Teórica', 3),
            ('Consultorio Jurídico I', 'DER-CJ1', 3, 'Práctica', 3),
            ('Optativa II', 'DER-OPT2', 2, 'Teórica', 2),
            ('Consultorio Jurídico II', 'DER-CJ2', 3, 'Práctica', 3),
            ('Mecanismos Alternativos de Solución de Conflictos', 'DER-MASC', 2, 'Teórica/Práctica', 2),
            ('Seminario de Grado', 'DER-SG', 2, 'Teórica', 2),
            ('Práctica Jurídica', 'DER-PJ', 4, 'Práctica', 4),
            ('Optativa III', 'DER-OPT3', 2, 'Teórica', 2),
            
            # === BACTERIOLOGÍA (BAC) ===
            ('Biología', 'BAC-BIO', 2, 'Teórica', 2),
            ('Morfofisiología I', 'BAC-MF1', 3, 'Teórica/Práctica', 3),
            ('Biofísica', 'BAC-BF', 2, 'Teórica', 2),
            ('Química', 'BAC-QUI', 2, 'Teórica', 2),
            ('Competencias Comunicativas I', 'BAC-CC1', 2, 'Teórica', 2),
            ('Sociedad, Sector Salud y Comunidad', 'BAC-SSSC', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'BAC-CU', 1, 'Teórica', 1),
            ('Bioquímica', 'BAC-BQ', 2, 'Teórica', 2),
            ('Morfofisiología II', 'BAC-MF2', 3, 'Teórica/Práctica', 3),
            ('Microbiología General', 'BAC-MG', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Psicología', 'BAC-FPS', 2, 'Teórica', 2),
            ('Competencias Comunicativas II', 'BAC-CC2', 2, 'Teórica', 2),
            ('Bioestadística e Informática', 'BAC-BEI', 2, 'Teórica/Práctica', 2),
            ('Ética General y Bioética', 'BAC-EGB', 3, 'Teórica', 3),
            ('Inmunología', 'BAC-INM', 3, 'Teórica/Práctica', 3),
            ('Hematología', 'BAC-HEM', 3, 'Teórica/Práctica', 3),
            ('Parasitología', 'BAC-PAR', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica I', 'BAC-BC1', 3, 'Teórica/Práctica', 3),
            ('Investigación Clínica Epidemiológica', 'BAC-ICE', 2, 'Teórica', 2),
            ('Socioantropología', 'BAC-SA', 2, 'Teórica', 2),
            ('Inmunohematología', 'BAC-IH', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica II', 'BAC-BC2', 3, 'Teórica/Práctica', 3),
            ('Virología', 'BAC-VIR', 3, 'Teórica/Práctica', 3),
            ('Micología', 'BAC-MIC', 2, 'Teórica/Práctica', 2),
            ('Alimentación y Salud', 'BAC-AS', 2, 'Teórica', 2),
            ('Constitución Nacional', 'BAC-CN', 2, 'Teórica', 2),
            ('Citología', 'BAC-CIT', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica III', 'BAC-BC3', 3, 'Teórica/Práctica', 3),
            ('Microbiología de Alimentos', 'BAC-MA', 3, 'Teórica/Práctica', 3),
            ('Metodología de la Investigación', 'BAC-MI', 2, 'Teórica', 2),
            ('Toxicología', 'BAC-TOX', 2, 'Teórica', 2),
            ('Electiva Complementaria I', 'BAC-EC1', 1, 'Teórica', 1),
            ('Salud Ambiental y Ocupacional', 'BAC-SAO', 2, 'Teórica', 2),
            ('Práctica Hospitalaria I', 'BAC-PH1', 8, 'Práctica', 8),
            ('Biotecnología', 'BAC-BT', 3, 'Teórica/Práctica', 3),
            ('Electiva de Profundización I', 'BAC-EP1', 2, 'Teórica/Práctica', 2),
            ('Investigación I', 'BAC-INV1', 3, 'Teórica', 3),
            ('Gestión de la Calidad', 'BAC-GC', 2, 'Teórica', 2),
            ('Práctica Hospitalaria II', 'BAC-PH2', 8, 'Práctica', 8),
            ('Microbiología del Suelo y Agua', 'BAC-MSA', 3, 'Teórica/Práctica', 3),
            ('Electiva de Profundización II', 'BAC-EP2', 5, 'Teórica/Práctica', 5),
            ('Investigación II', 'BAC-INV2', 2, 'Teórica', 2),
            ('Administración I', 'BAC-ADM1', 2, 'Teórica', 2),
            ('Seminarios de Investigación en Bacteriología', 'BAC-SIB', 2, 'Teórica', 2),
            ('Práctica en Administración y Administración de Laboratorios', 'BAC-PAAL', 6, 'Práctica', 6),
            ('Práctica Hospitalaria III', 'BAC-PH3', 8, 'Práctica', 8),
            ('Salud Pública (Práctica Comunitaria)', 'BAC-SPPC', 4, 'Práctica', 4),
            ('Investigación III', 'BAC-INV3', 2, 'Teórica', 2),
            ('Administración II', 'BAC-ADM2', 2, 'Teórica', 2),
            
            # === MICROBIOLOGÍA (MIC) ===
            ('Biología', 'MIC-BIO', 2, 'Teórica', 2),
            ('Morfofisiología I', 'MIC-MF1', 3, 'Teórica/Práctica', 3),
            ('Biofísica', 'MIC-BF', 2, 'Teórica', 2),
            ('Química', 'MIC-QUI', 2, 'Teórica', 2),
            ('Competencias Comunicativas I', 'MIC-CC1', 2, 'Teórica', 2),
            ('Sociedad, Sector Salud y Comunidad', 'MIC-SSSC', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'MIC-CU', 1, 'Teórica', 1),
            ('Bioquímica', 'MIC-BQ', 2, 'Teórica', 2),
            ('Morfofisiología II', 'MIC-MF2', 3, 'Teórica/Práctica', 3),
            ('Microbiología General', 'MIC-MG', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Psicología', 'MIC-FPS', 2, 'Teórica', 2),
            ('Competencias Comunicativas II', 'MIC-CC2', 2, 'Teórica', 2),
            ('Bioestadística e Informática', 'MIC-BEI', 2, 'Teórica/Práctica', 2),
            ('Ética General y Bioética', 'MIC-EGB', 3, 'Teórica', 3),
            ('Inmunología', 'MIC-INM', 3, 'Teórica/Práctica', 3),
            ('Hematología', 'MIC-HEM', 3, 'Teórica/Práctica', 3),
            ('Parasitología', 'MIC-PAR', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica I', 'MIC-BC1', 3, 'Teórica/Práctica', 3),
            ('Investigación Clínica Epidemiológica', 'MIC-ICE', 2, 'Teórica', 2),
            ('Socioantropología', 'MIC-SA', 2, 'Teórica', 2),
            ('Inmunohematología', 'MIC-IH', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica II', 'MIC-BC2', 3, 'Teórica/Práctica', 3),
            ('Virología', 'MIC-VIR', 3, 'Teórica/Práctica', 3),
            ('Micología', 'MIC-MIC', 2, 'Teórica/Práctica', 2),
            ('Alimentación y Salud', 'MIC-AS', 2, 'Teórica', 2),
            ('Constitución Nacional', 'MIC-CN', 2, 'Teórica', 2),
            ('Genética Microbiana', 'MIC-GM', 3, 'Teórica/Práctica', 3),
            ('Bacteriología Clínica III', 'MIC-BC3', 3, 'Teórica/Práctica', 3),
            ('Microbiología Ambiental', 'MIC-MA', 3, 'Teórica/Práctica', 3),
            ('Metodología de la Investigación', 'MIC-MI', 2, 'Teórica', 2),
            ('Fisiología Microbiana', 'MIC-FM', 2, 'Teórica/Práctica', 2),
            ('Electiva Complementaria I', 'MIC-EC1', 1, 'Teórica', 1),
            ('Microbiología Industrial', 'MIC-MIND', 3, 'Teórica/Práctica', 3),
            ('Práctica Hospitalaria I', 'MIC-PH1', 8, 'Práctica', 8),
            ('Microbiología Molecular', 'MIC-MM', 3, 'Teórica/Práctica', 3),
            ('Electiva de Profundización I', 'MIC-EP1', 2, 'Teórica/Práctica', 2),
            ('Investigación I', 'MIC-INV1', 3, 'Teórica', 3),
            ('Gestión de la Calidad', 'MIC-GC', 2, 'Teórica', 2),
            ('Práctica Hospitalaria II', 'MIC-PH2', 8, 'Práctica', 8),
            ('Cultivo de Tejidos', 'MIC-CT', 3, 'Teórica/Práctica', 3),
            ('Microbiología de Alimentos', 'MIC-MALIM', 3, 'Teórica/Práctica', 3),
            ('Electiva de Profundización II', 'MIC-EP2', 5, 'Teórica/Práctica', 5),
            ('Investigación II', 'MIC-INV2', 2, 'Teórica', 2),
            ('Administración I', 'MIC-ADM1', 2, 'Teórica', 2),
            ('Seminarios de Investigación en Microbiología', 'MIC-SIM', 2, 'Teórica', 2),
            ('Práctica en Administración y Administración de Laboratorios', 'MIC-PAAL', 6, 'Práctica', 6),
            ('Práctica Hospitalaria III', 'MIC-PH3', 8, 'Práctica', 8),
            ('Salud Pública (Práctica Comunitaria)', 'MIC-SPPC', 4, 'Práctica', 4),
            ('Investigación III', 'MIC-INV3', 2, 'Teórica', 2),
            ('Administración II', 'MIC-ADM2', 2, 'Teórica', 2),
            
            # === FISIOTERAPIA (FIS) ===
            ('Biología', 'FIS-BIO', 2, 'Teórica', 2),
            ('Morfofisiología I', 'FIS-MF1', 3, 'Teórica/Práctica', 3),
            ('Biofísica', 'FIS-BF', 2, 'Teórica', 2),
            ('Química', 'FIS-QUI', 2, 'Teórica', 2),
            ('Competencias Comunicativas I', 'FIS-CC1', 2, 'Teórica', 2),
            ('Antropología y Medio Ambiente', 'FIS-AMA', 2, 'Teórica', 2),
            ('Cátedra Unilibrista', 'FIS-CU', 1, 'Teórica', 1),
            ('Fundamentos de Fisioterapia', 'FIS-FF', 2, 'Teórica', 2),
            ('Bioquímica', 'FIS-BQ', 2, 'Teórica', 2),
            ('Morfofisiología II', 'FIS-MF2', 3, 'Teórica/Práctica', 3),
            ('Kinesiología', 'FIS-KIN', 3, 'Teórica/Práctica', 3),
            ('Fundamentos de Psicología', 'FIS-FPS', 2, 'Teórica', 2),
            ('Competencias Comunicativas II', 'FIS-CC2', 2, 'Teórica', 2),
            ('Bioestadística e Informática', 'FIS-BEI', 2, 'Teórica/Práctica', 2),
            ('Ética General y Deontología de la Fisioterapia', 'FIS-EGDF', 3, 'Teórica', 3),
            ('Semiología Médico Quirúrgica', 'FIS-SMQ', 2, 'Teórica/Práctica', 2),
            ('Morfofisiología III', 'FIS-MF3', 3, 'Teórica/Práctica', 3),
            ('Cinesiterapia', 'FIS-CIN', 3, 'Teórica/Práctica', 3),
            ('Masoterapia', 'FIS-MAS', 3, 'Teórica/Práctica', 3),
            ('Mecanoterapia', 'FIS-MEC', 3, 'Teórica/Práctica', 3),
            ('Investigación Clínica Epidemiológica', 'FIS-ICE', 2, 'Teórica', 2),
            ('Socioantropología', 'FIS-SA', 2, 'Teórica', 2),
            ('Fisioterapia en Pediatría', 'FIS-FPE', 3, 'Teórica/Práctica', 3),
            ('Electroterapia', 'FIS-ELE', 3, 'Teórica/Práctica', 3),
            ('Fisioterapia Cardiopulmonar', 'FIS-FCP', 3, 'Teórica/Práctica', 3),
            ('Hidrocinesiterapia', 'FIS-HID', 2, 'Teórica/Práctica', 2),
            ('Constitución Nacional', 'FIS-CN', 2, 'Teórica', 2),
            ('Electiva Complementaria I', 'FIS-EC1', 1, 'Teórica', 1),
            ('Fisioterapia Neurológica', 'FIS-FNE', 3, 'Teórica/Práctica', 3),
            ('Fisioterapia en Ortopedia y Traumatología', 'FIS-FOT', 3, 'Teórica/Práctica', 3),
            ('Fisioterapia en Geriatría', 'FIS-FGE', 3, 'Teórica/Práctica', 3),
            ('Agentes Térmicos', 'FIS-AT', 2, 'Teórica/Práctica', 2),
            ('Metodología de la Investigación', 'FIS-MI', 2, 'Teórica', 2),
            ('Salud y Seguridad en el Trabajo', 'FIS-SST', 2, 'Teórica', 2),
            ('Práctica Hospitalaria I', 'FIS-PH1', 8, 'Práctica', 8),
            ('Fisioterapia Dermatofuncional', 'FIS-FDF', 2, 'Teórica/Práctica', 2),
            ('Fisioterapia en el Deporte', 'FIS-FDE', 2, 'Teórica/Práctica', 2),
            ('Electiva de Profundización I', 'FIS-EP1', 2, 'Teórica/Práctica', 2),
            ('Investigación I', 'FIS-INV1', 3, 'Teórica', 3),
            ('Administración I', 'FIS-ADM1', 2, 'Teórica', 2),
            ('Calidad en Servicios de Salud', 'FIS-CSS', 2, 'Teórica', 2),
            ('Práctica Hospitalaria II', 'FIS-PH2', 8, 'Práctica', 8),
            ('Fisioterapia Manual Ortopédica', 'FIS-FMO', 3, 'Teórica/Práctica', 3),
            ('Electiva de Profundización II', 'FIS-EP2', 5, 'Teórica/Práctica', 5),
            ('Investigación II', 'FIS-INV2', 2, 'Teórica', 2),
            ('Administración II', 'FIS-ADM2', 2, 'Teórica', 2),
            ('Práctica Hospitalaria III', 'FIS-PH3', 8, 'Práctica', 8),
            ('Práctica de Administración', 'FIS-PAADM', 6, 'Práctica', 6),
            ('Salud Pública (Práctica Comunitaria)', 'FIS-SPPC', 4, 'Práctica', 4),
            ('Investigación III', 'FIS-INV3', 2, 'Teórica', 2),
            
            # === MEDICINA (MED) ===
            ('Biología Celular y Molecular', 'MED-BCM', 3, 'Teórica', 3),
            ('Química', 'MED-QUI', 3, 'Teórica', 3),
            ('Morfología I', 'MED-MORF1', 4, 'Teórica/Práctica', 4),
            ('Competencias Comunicativas I', 'MED-CC1', 2, 'Teórica', 2),
            ('Antropología y Medio Ambiente', 'MED-AMA', 2, 'Teórica', 2),
            ('Práctica Social I', 'MED-PS1', 2, 'Práctica', 2),
            ('Cátedra Unilibrista', 'MED-CU', 1, 'Teórica', 1),
            ('Bioquímica', 'MED-BQ', 3, 'Teórica', 3),
            ('Morfología II', 'MED-MORF2', 4, 'Teórica/Práctica', 4),
            ('Fisiología I', 'MED-FIS1', 3, 'Teórica/Práctica', 3),
            ('Competencias Comunicativas II', 'MED-CC2', 2, 'Teórica', 2),
            ('Bioestadística e Informática', 'MED-BEI', 2, 'Teórica/Práctica', 2),
            ('Práctica Social II', 'MED-PS2', 2, 'Práctica', 2),
            ('Fisiología II', 'MED-FIS2', 3, 'Teórica/Práctica', 3),
            ('Microbiología y Parasitología', 'MED-MP', 4, 'Teórica/Práctica', 4),
            ('Genética', 'MED-GEN', 2, 'Teórica', 2),
            ('Fundamentos de Psicología', 'MED-FPS', 2, 'Teórica', 2),
            ('Ética General y Bioética', 'MED-EGB', 2, 'Teórica', 2),
            ('Práctica Social III', 'MED-PS3', 2, 'Práctica', 2),
            ('Inmunología', 'MED-INM', 2, 'Teórica/Práctica', 2),
            ('Semiología I', 'MED-SEM1', 4, 'Teórica/Práctica', 4),
            ('Patología I', 'MED-PAT1', 3, 'Teórica/Práctica', 3),
            ('Nutrición', 'MED-NUT', 2, 'Teórica', 2),
            ('Epidemiología I', 'MED-EPI1', 2, 'Teórica', 2),
            ('Socioantropología', 'MED-SA', 2, 'Teórica', 2),
            ('Semiología II', 'MED-SEM2', 4, 'Teórica/Práctica', 4),
            ('Patología II', 'MED-PAT2', 3, 'Teórica/Práctica', 3),
            ('Farmacología I', 'MED-FARM1', 3, 'Teórica', 3),
            ('Medicina Preventiva', 'MED-MP2', 2, 'Teórica', 2),
            ('Electiva Complementaria I', 'MED-EC1', 1, 'Teórica', 1),
            ('Medicina Interna I', 'MED-MI1', 4, 'Teórica/Práctica', 4),
            ('Cirugía I', 'MED-CIR1', 4, 'Teórica/Práctica', 4),
            ('Farmacología II', 'MED-FARM2', 3, 'Teórica', 3),
            ('Metodología de la Investigación', 'MED-MINV', 2, 'Teórica', 2),
            ('Constitución Nacional', 'MED-CN', 2, 'Teórica', 2),
            ('Medicina Interna II', 'MED-MI2', 4, 'Teórica/Práctica', 4),
            ('Cirugía II', 'MED-CIR2', 4, 'Teórica/Práctica', 4),
            ('Pediatría I', 'MED-PED1', 4, 'Teórica/Práctica', 4),
            ('Ginecología y Obstetricia I', 'MED-GO1', 4, 'Teórica/Práctica', 4),
            ('Epidemiología II', 'MED-EPI2', 2, 'Teórica', 2),
            ('Medicina Interna III', 'MED-MI3', 4, 'Teórica/Práctica', 4),
            ('Cirugía III', 'MED-CIR3', 4, 'Teórica/Práctica', 4),
            ('Pediatría II', 'MED-PED2', 4, 'Teórica/Práctica', 4),
            ('Ginecología y Obstetricia II', 'MED-GO2', 4, 'Teórica/Práctica', 4),
            ('Investigación I', 'MED-INV1', 3, 'Teórica', 3),
            ('Psiquiatría', 'MED-PSI', 4, 'Teórica/Práctica', 4),
            ('Ortopedia', 'MED-ORT', 3, 'Teórica/Práctica', 3),
            ('Urología', 'MED-URO', 2, 'Teórica/Práctica', 2),
            ('Oftalmología', 'MED-OFT', 2, 'Teórica/Práctica', 2),
            ('Otorrinolaringología', 'MED-ORL', 2, 'Teórica/Práctica', 2),
            ('Investigación II', 'MED-INV2', 2, 'Teórica', 2),
            ('Medicina Legal', 'MED-ML', 2, 'Teórica/Práctica', 2),
            ('Dermatología', 'MED-DER', 2, 'Teórica/Práctica', 2),
            ('Anestesiología', 'MED-ANE', 2, 'Teórica/Práctica', 2),
            ('Radiología', 'MED-RAD', 2, 'Teórica/Práctica', 2),
            ('Electiva de Profundización I', 'MED-EP1', 2, 'Teórica/Práctica', 2),
            ('Investigación III', 'MED-INV3', 2, 'Teórica', 2),
            ('Internado Rural', 'MED-IR', 12, 'Práctica', 12),
        ]

    def create_espacios_fisicos(self):
        """Crear espacios físicos de ambas sedes"""
        self.stdout.write('  → Creando espacios físicos...')
        self.stdout.write('     Este proceso puede tomar unos segundos...')
        
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
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} espacios físicos creados ({len(espacios_data)} totales)'))
