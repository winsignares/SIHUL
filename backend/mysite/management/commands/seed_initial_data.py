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
from datetime import date, time
from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma
from componentes.models import Componente, ComponenteRol
from periodos.models import PeriodoAcademico
from grupos.models import Grupo
from horario.models import Horario


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
                self.create_periodos_academicos()
                
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
                
                # Paso 8: Componentes del sistema
                self.stdout.write(self.style.SUCCESS('\n[8/10] Componentes del Sistema'))
                self.create_componentes()
                
                # Paso 9: Asignar componentes a roles
                self.stdout.write(self.style.SUCCESS('\n[9/10] Asignación de Componentes a Roles'))
                self.create_componentes_rol()
                
                # Paso 10: Grupos académicos
                self.stdout.write(self.style.SUCCESS('\n[10/11] Grupos Académicos'))
                self.create_grupos()
                
                # Paso 11: Horarios Sede Centro
                self.stdout.write(self.style.SUCCESS('\n[11/12] Horarios Sede Centro'))
                self.create_horarios_sede_centro()
                
                self.stdout.write(self.style.SUCCESS('\n[12/12] Horarios Sede Principal'))
                self.create_horarios_sede_principal()
                
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
        
        sede_principal = Sede.objects.get(nombre='Sede Principal')
        sede_centro = Sede.objects.get(nombre='Sede Centro')
        
        facultades_data = [
            {'nombre': 'Facultad de Ingeniería', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Ciencias Económicas, Administrativas y Contables', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Derecho, Ciencias Políticas y Sociales', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Facultad de Ciencias de la Salud', 'sede': sede_principal, 'activa': True},
            {'nombre': 'Facultad de Ciencias de la Salud, Exactas y Naturales', 'sede': sede_centro, 'activa': True},
            {'nombre': 'Ninguna', 'sede': sede_centro, 'activa': True},
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
            ('Ninguna','Alianza Canadiense', 10, True),
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
                self.stdout.write(self.style.WARNING(f'    ! Facultad no encontrada: {nombre_facultad}, registrando sin facultad'))
                _, created = Programa.objects.get_or_create(
                    nombre=nombre_programa,
                    facultad=None,
                    defaults={'semestres': semestres, 'activo': activo}
                )
                if created:
                    created_count += 1
        
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
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} usuarios del sistema creados ({len(usuarios_data)} totales)'))

    def create_asignaturas_programa(self):
        """Crear relaciones entre asignaturas y programas con semestre y componente formativo"""
        self.stdout.write('  → Creando relaciones asignatura-programa...')
        self.stdout.write('     Este proceso puede tomar varios segundos...')
        
        # Mapeo de componentes formativos
        componentes_map = {
            'Básica': 'Básica',
            'Profesional': 'Profesional',
            'Humanística': 'Humanística',
            'Práctico': 'Práctico',
            'Optativa': 'Optativa',
            'Electiva': 'Electiva'
        }
        
        # Formato: (nombre_programa, codigo_asignatura, semestre, componente_formativo)
        relaciones_data = [
            # === INGENIERÍA DE SISTEMAS ===
            ('Ingeniería de Sistemas', 'IS-CALD', 1, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-FM', 1, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-II', 1, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-LA', 1, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-LM', 1, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-CAC', 1, 'Humanística'),
            ('Ingeniería de Sistemas', 'IS-CU', 1, 'Humanística'),
            ('Ingeniería de Sistemas', 'IS-CALI', 2, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-EML', 2, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-AL', 2, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-PS', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FP', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDI', 2, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC1', 2, 'Electiva'),
            ('Ingeniería de Sistemas', 'IS-CMV', 3, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-PED', 3, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-DI', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDAT', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-AC', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ISW1', 3, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-EDIF', 4, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-CS', 4, 'Humanística'),
            ('Ingeniería de Sistemas', 'IS-CP', 4, 'Humanística'),
            ('Ingeniería de Sistemas', 'IS-FBD', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PROG1', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ISW2', 4, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC2', 4, 'Electiva'),
            ('Ingeniería de Sistemas', 'IS-MD', 5, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-SO', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-SBD', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FE', 5, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-ISW3', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PROG2', 5, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-FEP', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PWEB', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PL', 6, 'Básica'),
            ('Ingeniería de Sistemas', 'IS-AI', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-RC', 6, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ELEC3', 6, 'Electiva'),
            ('Ingeniería de Sistemas', 'IS-OPT1', 6, 'Optativa'),
            ('Ingeniería de Sistemas', 'IS-MI', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-ET', 7, 'Humanística'),
            ('Ingeniería de Sistemas', 'IS-SI', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-IA', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PM', 7, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-GPI', 7, 'Profesional'),
           ('Ingeniería de Sistemas', 'IS-OPT2', 7, 'Optativa'),
            ('Ingeniería de Sistemas', 'IS-IAP', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-AE', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-SIG', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-PE', 8, 'Práctico'),
            ('Ingeniería de Sistemas', 'IS-GE', 8, 'Profesional'),
            ('Ingeniería de Sistemas', 'IS-OPT3', 8, 'Optativa'),
            
            # === INGENIERÍA INDUSTRIAL ===
            ('Ingeniería Industrial', 'II-CALD', 1, 'Básica'),
            ('Ingeniería Industrial', 'II-QGL', 1, 'Básica'),
            ('Ingeniería Industrial', 'II-II', 1, 'Profesional'),
            ('Ingeniería Industrial', 'II-LA', 1, 'Básica'),
            ('Ingeniería Industrial', 'II-EGI', 1, 'Profesional'),
            ('Ingeniería Industrial', 'II-CAC', 1, 'Humanística'),
            ('Ingeniería Industrial', 'II-CU', 1, 'Humanística'),
            ('Ingeniería Industrial', 'II-CALI', 2, 'Básica'),
            ('Ingeniería Industrial', 'II-FML', 2, 'Básica'),
            ('Ingeniería Industrial', 'II-AL', 2, 'Básica'),
            ('Ingeniería Industrial', 'II-CMI', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-LP', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-CP', 2, 'Profesional'),
            ('Ingeniería Industrial', 'II-ELEC1', 2, 'Electiva'),
            ('Ingeniería Industrial', 'II-CMV', 3, 'Básica'),
            ('Ingeniería Industrial', 'II-EML', 3, 'Básica'),
            ('Ingeniería Industrial', 'II-PED', 3, 'Básica'),
            ('Ingeniería Industrial', 'II-DI', 3, 'Profesional'),
            ('Ingeniería Industrial', 'II-GO', 3, 'Profesional'),
            ('Ingeniería Industrial', 'II-FE', 3, 'Básica'),
            ('Ingeniería Industrial', 'II-ELEC2', 3, 'Electiva'),
            ('Ingeniería Industrial', 'II-ED', 4, 'Básica'),
            ('Ingeniería Industrial', 'II-TERM', 4, 'Básica'),
            ('Ingeniería Industrial', 'II-GE', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-CEC', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-PI', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-CO', 4, 'Profesional'),
            ('Ingeniería Industrial', 'II-IO1', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-SIG', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-DPS', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-IM', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-IE', 5, 'Profesional'),
            ('Ingeniería Industrial', 'II-CS', 5, 'Humanística'),
            ('Ingeniería Industrial', 'II-ELEC3', 5, 'Electiva'),
            ('Ingeniería Industrial', 'II-IO2', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-PCPO', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-MER', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-GT', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-FIN', 6, 'Profesional'),
            ('Ingeniería Industrial', 'II-OPT1', 6, 'Optativa'),
            ('Ingeniería Industrial', 'II-MME', 7, 'Básica'),
            ('Ingeniería Industrial', 'II-SST', 7, 'Profesional'),
            ('Ingeniería Industrial', 'II-FEP', 7, 'Profesional'),
            ('Ingeniería Industrial', 'II-MI', 7, 'Profesional'),
            ('Ingeniería Industrial', 'II-CPOL', 7, 'Humanística'),
            ('Ingeniería Industrial', 'II-ET', 7, 'Humanística'),
            ('Ingeniería Industrial', 'II-OPT2', 7, 'Optativa'),
            ('Ingeniería Industrial', 'II-DIIS', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-LCS', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-IA', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-SP', 8, 'Profesional'),
            ('Ingeniería Industrial', 'II-PE', 8, 'Práctico'),
            ('Ingeniería Industrial', 'II-OPT3', 8, 'Optativa'),
            
            # === NEGOCIOS INTERNACIONALES ===
            ('Administración de Negocios Internacionales', 'NI-FM', 1, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-FNI', 1, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-FE', 1, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-CF', 1, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-EVE', 1, 'Humanística'),
            ('Administración de Negocios Internacionales', 'NI-CU', 1, 'Humanística'),
            ('Administración de Negocios Internacionales', 'NI-CAL', 2, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-EE', 2, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-SC', 2, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ED', 2, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-DC', 2, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ELEC1', 2, 'Electiva'),
            ('Administración de Negocios Internacionales', 'NI-CEN', 3, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-EI2', 3, 'Básica'),
            ('Administración de Negocios Internacionales', 'NI-FMERC', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-LA', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-CNG', 3, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ELEC2', 3, 'Electiva'),
            ('Administración de Negocios Internacionales', 'NI-FI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-LDFI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-IM', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-DCI', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GPO', 4, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-SNC', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-DL', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-PE', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-FGP', 5, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-ELEC3', 5, 'Electiva'),
            ('Administración de Negocios Internacionales', 'NI-IMKT', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GTH', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GCE', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-MI', 6, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-OE1', 6, 'Optativa'),
            ('Administración de Negocios Internacionales', 'NI-GI', 7, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-AF', 7, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-EPRS', 7, 'Humanística'),
            ('Administración de Negocios Internacionales', 'NI-PI', 7, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-OE2', 7, 'Optativa'),
            ('Administración de Negocios Internacionales', 'NI-GEX', 8, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-SG', 8, 'Profesional'),
            ('Administración de Negocios Internacionales', 'NI-GLOB', 8, 'Humanística'),
            ('Administración de Negocios Internacionales', 'NI-OE3', 8, 'Optativa'),
            
            # === CONTADURÍA PÚBLICA ===
            ('Contaduría Pública', 'CP-FM', 1, 'Básica'),
            ('Contaduría Pública', 'CP-FA', 1, 'Profesional'),
            ('Contaduría Pública', 'CP-CF', 1, 'Profesional'),
            ('Contaduría Pública', 'CP-FE', 1, 'Básica'),
            ('Contaduría Pública', 'CP-EVE', 1, 'Humanística'),
            ('Contaduría Pública', 'CP-CU', 1, 'Humanística'),
            ('Contaduría Pública', 'CP-CAL1', 2, 'Básica'),
            ('Contaduría Pública', 'CP-CEAI', 2, 'Profesional'),
            ('Contaduría Pública', 'CP-EE', 2, 'Básica'),
            ('Contaduría Pública', 'CP-DC', 2, 'Profesional'),
            ('Contaduría Pública', 'CP-ED', 2, 'Básica'),
            ('Contaduría Pública', 'CP-ELEC1', 2, 'Electiva'),
            ('Contaduría Pública', 'CP-EI2', 3, 'Básica'),
            ('Contaduría Pública', 'CP-SC', 3, 'Profesional'),
            ('Contaduría Pública', 'CP-CEN', 3, 'Básica'),
            ('Contaduría Pública', 'CP-DLSS', 3, 'Profesional'),
            ('Contaduría Pública', 'CP-ELEC2', 3, 'Electiva'),
            ('Contaduría Pública', 'CP-CIF', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-CEF', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-PE', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-IO', 4, 'Profesional'),
            ('Contaduría Pública', 'CP-ELEC3', 4, 'Optativa'),
            ('Contaduría Pública', 'CP-CG', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-CA', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-AF', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-AA', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-MI', 5, 'Profesional'),
            ('Contaduría Pública', 'CP-IRC', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-CFP', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-FNT', 6, 'Profesional'),
            ('Contaduría Pública', 'CP-EP', 6, 'Humanística'),
            ('Contaduría Pública', 'CP-OPT1', 6, 'Optativa'),
            ('Contaduría Pública', 'CP-IVRF', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-RF', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-FC', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-FGP', 7, 'Profesional'),
            ('Contaduría Pública', 'CP-OPT2', 7, 'Optativa'),
            ('Contaduría Pública', 'CP-ITPT', 8, 'Profesional'),
            ('Contaduría Pública', 'CP-AS', 8, 'Profesional'),
            ('Contaduría Pública', 'CP-SG', 8, 'Profesional'),
            ('Contaduría Pública', 'CP-CNG', 8, 'Humanística'),
            ('Contaduría Pública', 'CP-OPT3', 8, 'Optativa'),
            
            # === DERECHO ===
            ('Derecho', 'DER-ID', 1, 'Básica'),
            ('Derecho', 'DER-DR', 1, 'Básica'),
            ('Derecho', 'DER-HD', 1, 'Básica'),
            ('Derecho', 'DER-TE', 1, 'Básica'),
            ('Derecho', 'DER-CC', 1, 'Humanística'),
            ('Derecho', 'DER-CU', 1, 'Humanística'),
            ('Derecho', 'DER-DC1', 2, 'Básica'),
            ('Derecho', 'DER-TGD', 2, 'Básica'),
            ('Derecho', 'DER-DCP', 2, 'Profesional'),
            ('Derecho', 'DER-SJ', 2, 'Humanística'),
            ('Derecho', 'DER-MI', 2, 'Profesional'),
            ('Derecho', 'DER-DC2', 3, 'Básica'),
            ('Derecho', 'DER-DCB', 3, 'Profesional'),
            ('Derecho', 'DER-DPG', 3, 'Profesional'),
            ('Derecho', 'DER-FD', 3, 'Humanística'),
            ('Derecho', 'DER-ELEC1', 3, 'Electiva'),
            ('Derecho', 'DER-DCO', 4, 'Profesional'),
            ('Derecho', 'DER-DPE', 4, 'Profesional'),
            ('Derecho', 'DER-DA1', 4, 'Profesional'),
            ('Derecho', 'DER-HJ', 4, 'Humanística'),
            ('Derecho', 'DER-ELEC2', 4, 'Electiva'),
            ('Derecho', 'DER-DCC', 5, 'Profesional'),
            ('Derecho', 'DER-DPC1', 5, 'Profesional'),
            ('Derecho', 'DER-DA2', 5, 'Profesional'),
            ('Derecho', 'DER-DLI', 5, 'Profesional'),
            ('Derecho', 'DER-ELEC3', 5, 'Electiva'),
            ('Derecho', 'DER-DPC2', 6, 'Profesional'),
            ('Derecho', 'DER-DLC', 6, 'Profesional'),
            ('Derecho', 'DER-DCOM1', 6, 'Profesional'),
            ('Derecho', 'DER-DPP', 6, 'Profesional'),
            ('Derecho', 'DER-EP', 6, 'Humanística'),
            ('Derecho', 'DER-DCOM2', 7, 'Profesional'),
            ('Derecho', 'DER-DPR', 7, 'Profesional'),
            ('Derecho', 'DER-DIP', 7, 'Profesional'),
            ('Derecho', 'DER-DT', 7, 'Profesional'),
            ('Derecho', 'DER-OPT1', 7, 'Optativa'),
            ('Derecho', 'DER-DIPR', 8, 'Profesional'),
            ('Derecho', 'DER-DF', 8, 'Profesional'),
            ('Derecho', 'DER-DPA', 8, 'Profesional'),
            ('Derecho', 'DER-CJ1', 8, 'Práctico'),
            ('Derecho', 'DER-OPT2', 8, 'Optativa'),
            ('Derecho', 'DER-CJ2', 9, 'Práctico'),
            ('Derecho', 'DER-MASC', 9, 'Profesional'),
            ('Derecho', 'DER-SG', 9, 'Profesional'),
            ('Derecho', 'DER-PJ', 10, 'Práctico'),
            ('Derecho', 'DER-OPT3', 10, 'Optativa'),
            
            # === BACTERIOLOGÍA ===
            ('Bacteriología', 'BAC-BIO', 1, 'Básica'),
            ('Bacteriología', 'BAC-QUI', 1, 'Básica'),
            ('Bacteriología', 'BAC-MF1', 1, 'Básica'),
            ('Bacteriología', 'BAC-BF', 1, 'Básica'),
            ('Bacteriología', 'BAC-CC1', 1, 'Humanística'),
            ('Bacteriología', 'BAC-CU', 1, 'Humanística'),
            ('Bacteriología', 'BAC-BQ', 2, 'Básica'),
            ('Bacteriología', 'BAC-MF2', 2, 'Básica'),
            ('Bacteriología', 'BAC-MG', 2, 'Profesional'),
            ('Bacteriología', 'BAC-BEI', 2, 'Básica'),
            ('Bacteriología', 'BAC-EC1', 2, 'Electiva'),
            ('Bacteriología', 'BAC-INM', 3, 'Profesional'),
            ('Bacteriología', 'BAC-PAR', 3, 'Profesional'),
            ('Bacteriología', 'BAC-MIC', 3, 'Profesional'),
            ('Bacteriología', 'BAC-ICE', 3, 'Básica'),
            ('Bacteriología', 'BAC-MI', 3, 'Profesional'),
            ('Bacteriología', 'BAC-BC1', 4, 'Profesional'),
            ('Bacteriología', 'BAC-VIR', 4, 'Profesional'),
            ('Bacteriología', 'BAC-HEM', 4, 'Profesional'),
            ('Bacteriología', 'BAC-SP', 4, 'Profesional'),
            ('Bacteriología', 'BAC-EC2', 4, 'Electiva'),
            ('Bacteriología', 'BAC-MA', 5, 'Profesional'),
            ('Bacteriología', 'BAC-MSA', 5, 'Profesional'),
            ('Bacteriología', 'BAC-IH', 5, 'Profesional'),
            ('Bacteriología', 'BAC-SAO', 5, 'Profesional'),
            ('Bacteriología', 'BAC-EC3', 5, 'Electiva'),
            ('Bacteriología', 'BAC-ADM1', 6, 'Profesional'),
            ('Bacteriología', 'BAC-GC', 6, 'Profesional'),
            ('Bacteriología', 'BAC-INV1', 6, 'Profesional'),
            ('Bacteriología', 'BAC-EGB', 6, 'Humanística'),
            ('Bacteriología', 'BAC-PH1', 7, 'Práctico'),
            ('Bacteriología', 'BAC-EP1', 7, 'Electiva'),
            ('Bacteriología', 'BAC-PH2', 8, 'Práctico'),
            ('Bacteriología', 'BAC-INV2', 8, 'Profesional'),
            ('Bacteriología', 'BAC-PAAL', 9, 'Práctico'),
            ('Bacteriología', 'BAC-PH3', 9, 'Práctico'),
            ('Bacteriología', 'BAC-SPPC', 9, 'Práctico'),
            ('Bacteriología', 'BAC-INV3', 9, 'Profesional'),
            ('Bacteriología', 'BAC-ADM2', 9, 'Profesional'),
            
            # === MICROBIOLOGÍA ===
            ('Microbiología', 'MIC-BIO', 1, 'Básica'),
            ('Microbiología', 'MIC-QUI', 1, 'Básica'),
            ('Microbiología', 'MIC-MF1', 1, 'Básica'),
            ('Microbiología', 'MIC-BF', 1, 'Básica'),
            ('Microbiología', 'MIC-CC1', 1, 'Humanística'),
            ('Microbiología', 'MIC-CU', 1, 'Humanística'),
            ('Microbiología', 'MIC-BQ', 2, 'Básica'),
            ('Microbiología', 'MIC-MF2', 2, 'Básica'),
            ('Microbiología', 'MIC-MG', 2, 'Profesional'),
            ('Microbiología', 'MIC-BEI', 2, 'Básica'),
            ('Microbiología', 'MIC-EC1', 2, 'Electiva'),
            ('Microbiología', 'MIC-INM', 3, 'Profesional'),
            ('Microbiología', 'MIC-PAR', 3, 'Profesional'),
            ('Microbiología', 'MIC-VIR', 3, 'Profesional'),
            ('Microbiología', 'MIC-ICE', 3, 'Básica'),
            ('Microbiología', 'MIC-MI', 3, 'Profesional'),
            ('Microbiología', 'MIC-GM', 4, 'Profesional'),
            ('Microbiología', 'MIC-BC3', 4, 'Profesional'),
            ('Microbiología', 'MIC-MA', 4, 'Profesional'),
            ('Microbiología', 'MIC-FM', 4, 'Profesional'),
            ('Microbiología', 'MIC-EC2', 4, 'Electiva'),
            ('Microbiología', 'MIC-MIND', 5, 'Profesional'),
            ('Microbiología', 'MIC-MM', 5, 'Profesional'),
            ('Microbiología', 'MIC-CT', 5, 'Profesional'),
            ('Microbiología', 'MIC-GC', 5, 'Profesional'),
            ('Microbiología', 'MIC-EC3', 5, 'Electiva'),
            ('Microbiología', 'MIC-ADM1', 6, 'Profesional'),
            ('Microbiología', 'MIC-INV1', 6, 'Profesional'),
            ('Microbiología', 'MIC-EGB', 6, 'Humanística'),
            ('Microbiología', 'MIC-PH1', 7, 'Práctico'),
            ('Microbiología', 'MIC-EP1', 7, 'Electiva'),
            ('Microbiología', 'MIC-PH2', 8, 'Práctico'),
            ('Microbiología', 'MIC-INV2', 8, 'Profesional'),
            ('Microbiología', 'MIC-PAAL', 9, 'Práctico'),
            ('Microbiología', 'MIC-PH3', 9, 'Práctico'),
            ('Microbiología', 'MIC-SPPC', 9, 'Práctico'),
            ('Microbiología', 'MIC-INV3', 9, 'Profesional'),
            ('Microbiología', 'MIC-ADM2', 9, 'Profesional'),
            
            # === FISIOTERAPIA ===
            ('Fisioterapia', 'FIS-BIO', 1, 'Básica'),
            ('Fisioterapia', 'FIS-QUI', 1, 'Básica'),
            ('Fisioterapia', 'FIS-MF1', 1, 'Básica'),
            ('Fisioterapia', 'FIS-BF', 1, 'Básica'),
            ('Fisioterapia', 'FIS-FF', 1, 'Profesional'),
            ('Fisioterapia', 'FIS-CC1', 1, 'Humanística'),
            ('Fisioterapia', 'FIS-CU', 1, 'Humanística'),
            ('Fisioterapia', 'FIS-BQ', 2, 'Básica'),
            ('Fisioterapia', 'FIS-MF2', 2, 'Básica'),
            ('Fisioterapia', 'FIS-KIN', 2, 'Profesional'),
            ('Fisioterapia', 'FIS-BEI', 2, 'Básica'),
            ('Fisioterapia', 'FIS-EC1', 2, 'Electiva'),
            ('Fisioterapia', 'FIS-MF3', 3, 'Básica'),
            ('Fisioterapia', 'FIS-CIN', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-MAS', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-MEC', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-ICE', 3, 'Básica'),
            ('Fisioterapia', 'FIS-MI', 3, 'Profesional'),
            ('Fisioterapia', 'FIS-FPE', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-ELE', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-FCP', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-HID', 4, 'Profesional'),
            ('Fisioterapia', 'FIS-CN', 4, 'Humanística'),
            ('Fisioterapia', 'FIS-EC2', 4, 'Electiva'),
            ('Fisioterapia', 'FIS-FNE', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-FOT', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-FGE', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-AT', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-SST', 5, 'Profesional'),
            ('Fisioterapia', 'FIS-EC3', 5, 'Electiva'),
            ('Fisioterapia', 'FIS-ADM1', 6, 'Profesional'),
            ('Fisioterapia', 'FIS-CSS', 6, 'Profesional'),
            ('Fisioterapia', 'FIS-INV1', 6, 'Profesional'),
            ('Fisioterapia', 'FIS-EGDF', 6, 'Humanística'),
            ('Fisioterapia', 'FIS-PH1', 7, 'Práctico'),
            ('Fisioterapia', 'FIS-EP1', 7, 'Electiva'),
            ('Fisioterapia', 'FIS-PH2', 8, 'Práctico'),
            ('Fisioterapia', 'FIS-FMO', 8, 'Profesional'),
            ('Fisioterapia', 'FIS-INV2', 8, 'Profesional'),
            ('Fisioterapia', 'FIS-ADM2', 8, 'Profesional'),
            ('Fisioterapia', 'FIS-PH3', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-PAADM', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-SPPC', 9, 'Práctico'),
            ('Fisioterapia', 'FIS-INV3', 9, 'Profesional'),
            
            # === INSTRUMENTACIÓN QUIRÚRGICA ===
            ('Instrumentación Quirúrgica', 'IQ-BIO', 1, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-QUI', 1, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-MF1', 1, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-BF', 1, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-IIQ', 1, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CC1', 1, 'Humanística'),
            ('Instrumentación Quirúrgica', 'IQ-CU', 1, 'Humanística'),
            ('Instrumentación Quirúrgica', 'IQ-BQ', 2, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-MF2', 2, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-MIC', 2, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-PA1', 2, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-BEI', 2, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-EC1', 2, 'Electiva'),
            ('Instrumentación Quirúrgica', 'IQ-FA', 3, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-CIPS', 3, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQCGP', 3, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-ICE', 3, 'Básica'),
            ('Instrumentación Quirúrgica', 'IQ-MI', 3, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQGO', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQU', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PA2', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CN', 4, 'Humanística'),
            ('Instrumentación Quirúrgica', 'IQ-SST', 4, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-EC2', 4, 'Electiva'),
            ('Instrumentación Quirúrgica', 'IQ-PQO', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PQN', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-IT', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-GC', 5, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-EC3', 5, 'Electiva'),
            ('Instrumentación Quirúrgica', 'IQ-ADM1', 6, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-CSS', 6, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-INV1', 6, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-EGDIQ', 6, 'Humanística'),
            ('Instrumentación Quirúrgica', 'IQ-PH1', 7, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-EP1', 7, 'Electiva'),
            ('Instrumentación Quirúrgica', 'IQ-PH2', 8, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-PQCM', 8, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-INV2', 8, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-ADM2', 8, 'Profesional'),
            ('Instrumentación Quirúrgica', 'IQ-PH3', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-PAADM', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-SPPC', 9, 'Práctico'),
            ('Instrumentación Quirúrgica', 'IQ-INV3', 9, 'Profesional'),
            
            # === MEDICINA ===
            ('Medicina', 'MED-BCM', 1, 'Básica'),
            ('Medicina', 'MED-QUI', 1, 'Básica'),
            ('Medicina', 'MED-MORF1', 1, 'Básica'),
            ('Medicina', 'MED-CC1', 1, 'Humanística'),
            ('Medicina', 'MED-AMA', 1, 'Humanística'),
            ('Medicina', 'MED-PS1', 1, 'Práctico'),
            ('Medicina', 'MED-CU', 1, 'Humanística'),
            ('Medicina', 'MED-BQ', 2, 'Básica'),
            ('Medicina', 'MED-MORF2', 2, 'Básica'),
            ('Medicina', 'MED-FIS1', 2, 'Básica'),
            ('Medicina', 'MED-CC2', 2, 'Humanística'),
            ('Medicina', 'MED-BEI', 2, 'Básica'),
            ('Medicina', 'MED-PS2', 2, 'Práctico'),
            ('Medicina', 'MED-FIS2', 3, 'Básica'),
            ('Medicina', 'MED-MP', 3, 'Básica'),
            ('Medicina', 'MED-GEN', 3, 'Básica'),
            ('Medicina', 'MED-FPS', 3, 'Humanística'),
            ('Medicina', 'MED-EGB', 3, 'Humanística'),
            ('Medicina', 'MED-PS3', 3, 'Práctico'),
            ('Medicina', 'MED-INM', 4, 'Básica'),
            ('Medicina', 'MED-SEM1', 4, 'Profesional'),
            ('Medicina', 'MED-PAT1', 4, 'Básica'),
            ('Medicina', 'MED-NUT', 4, 'Básica'),
            ('Medicina', 'MED-EPI1', 4, 'Básica'),
            ('Medicina', 'MED-SA', 4, 'Humanística'),
            ('Medicina', 'MED-SEM2', 5, 'Profesional'),
            ('Medicina', 'MED-PAT2', 5, 'Básica'),
            ('Medicina', 'MED-FARM1', 5, 'Básica'),
            ('Medicina', 'MED-MP2', 5, 'Profesional'),
            ('Medicina', 'MED-EC1', 5, 'Electiva'),
            ('Medicina', 'MED-MI1', 6, 'Profesional'),
            ('Medicina', 'MED-CIR1', 6, 'Profesional'),
            ('Medicina', 'MED-FARM2', 6, 'Básica'),
            ('Medicina', 'MED-MINV', 6, 'Profesional'),
            ('Medicina', 'MED-CN', 6, 'Humanística'),
            ('Medicina', 'MED-MI2', 7, 'Profesional'),
            ('Medicina', 'MED-CIR2', 7, 'Profesional'),
            ('Medicina', 'MED-PED1', 7, 'Profesional'),
            ('Medicina', 'MED-GO1', 7, 'Profesional'),
            ('Medicina', 'MED-EPI2', 7, 'Básica'),
            ('Medicina', 'MED-MI3', 8, 'Profesional'),
            ('Medicina', 'MED-CIR3', 8, 'Profesional'),
            ('Medicina', 'MED-PED2', 8, 'Profesional'),
            ('Medicina', 'MED-GO2', 8, 'Profesional'),
            ('Medicina', 'MED-INV1', 8, 'Profesional'),
            ('Medicina', 'MED-PSI', 9, 'Profesional'),
            ('Medicina', 'MED-ORT', 9, 'Profesional'),
            ('Medicina', 'MED-URO', 9, 'Profesional'),
            ('Medicina', 'MED-OFT', 9, 'Profesional'),
            ('Medicina', 'MED-ORL', 9, 'Profesional'),
            ('Medicina', 'MED-INV2', 9, 'Profesional'),
            ('Medicina', 'MED-ML', 10, 'Profesional'),
            ('Medicina', 'MED-DER', 10, 'Profesional'),
            ('Medicina', 'MED-ANE', 10, 'Profesional'),
            ('Medicina', 'MED-RAD', 10, 'Profesional'),
            ('Medicina', 'MED-EP1', 10, 'Electiva'),
            ('Medicina', 'MED-INV3', 10, 'Profesional'),
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
                        'componente_formativo': componentes_map.get(componente, 'Básica')
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
            ('Ciclo Básica Contable', 'CP-CBC', 3, 'Teórica', 3),
            
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
            ('Cuidados Básicas en Salud', 'IQ-CBS', 3, 'Teórica/Práctica', 3),
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

    def create_componentes(self):
        """Crear componentes del sistema de permisos"""
        self.stdout.write('  → Creando componentes del sistema...')
        
        componentes_data = [
            # Componentes para Admin
            {'nombre': 'Dashboard', 'descripcion': 'Panel principal de administración'},
            {'nombre': 'Centro Institucional', 'descripcion': 'Gestión de facultades y programas'},
            {'nombre': 'Centro de Horarios', 'descripcion': 'Gestión central de horarios'},
            {'nombre': 'Asignación Automática', 'descripcion': 'Asignación automática de espacios'},
            {'nombre': 'Préstamos de Espacios', 'descripcion': 'Gestión de préstamos de espacios'},
            {'nombre': 'Periodos Académicos', 'descripcion': 'Gestión de periodos académicos'},
            {'nombre': 'Asistentes Virtuales', 'descripcion': 'Chatbots y asistentes virtuales'},
            {'nombre': 'Ocupación Semanal', 'descripcion': 'Reporte de ocupación semanal'},
            {'nombre': 'Reportes Generales', 'descripcion': 'Reportes y estadísticas generales'},
            {'nombre': 'Gestión de Usuarios', 'descripcion': 'Administración de usuarios del sistema'},
            {'nombre': 'Estado de Recursos', 'descripcion': 'Monitoreo de recursos físicos'},
            
            # Componentes para Supervisor General
            {'nombre': 'Dashboard Supervisor', 'descripcion': 'Panel de supervisor general'},
            {'nombre': 'Disponibilidad de Espacios', 'descripcion': 'Consulta de disponibilidad de espacios'},
            {'nombre': 'Apertura y Cierre de Salones', 'descripcion': 'Control de apertura y cierre de salones'},
            {'nombre': 'Asistentes Virtuales Supervisor', 'descripcion': 'Asistentes virtuales para supervisores'},
            
            # Componentes para Docente
            {'nombre': 'Dashboard Docente', 'descripcion': 'Panel principal del docente'},
            {'nombre': 'Mi Horario', 'descripcion': 'Visualización de horario personal'},
            {'nombre': 'Préstamos Docente', 'descripcion': 'Solicitud de préstamos de espacios'},
            {'nombre': 'Asistentes Virtuales Docente', 'descripcion': 'Asistentes virtuales para docentes'},
            
            # Componentes para Estudiante
            {'nombre': 'Dashboard Estudiante', 'descripcion': 'Panel principal del estudiante'},
            {'nombre': 'Mi Horario Estudiante', 'descripcion': 'Visualización de horario de clases'},
            {'nombre': 'Asistentes Virtuales Estudiante', 'descripcion': 'Asistentes virtuales para estudiantes'},
        ]
        
        created_count = 0
        for componente_data in componentes_data:
            _, created = Componente.objects.get_or_create(
                nombre=componente_data['nombre'],
                defaults=componente_data
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} componentes creados ({len(componentes_data)} totales)'))

    def create_periodos_academicos(self):
        """Crear periodos académicos"""
        self.stdout.write('  → Creando periodos académicos...')
        
        periodos_data = [
            {
                'nombre': '2026-1',
                'fecha_inicio': date(2026, 2, 2),
                'fecha_fin': date(2026, 6, 22),
                'activo': True
            },
            {
                'nombre': '2026-2',
                'fecha_inicio': date(2026, 7, 20),
                'fecha_fin': date(2026, 11, 30),
                'activo': False
            },
        ]
        
        created_count = 0
        for periodo_data in periodos_data:
            periodo, created = PeriodoAcademico.objects.get_or_create(
                nombre=periodo_data['nombre'],
                defaults={
                    'fecha_inicio': periodo_data['fecha_inicio'],
                    'fecha_fin': periodo_data['fecha_fin'],
                    'activo': periodo_data['activo']
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} periodos académicos creados ({len(periodos_data)} totales)'))

    def create_componentes_rol(self):
        """Asignar componentes a roles con sus permisos"""
        self.stdout.write('  → Asignando componentes a roles...')
        
        # Definir asignaciones: (nombre_rol, nombre_componente, permiso)
        asignaciones_data = [
            # Admin - tiene acceso a todos los componentes de administración
            ('admin', 'Dashboard', 'EDITAR'),
            ('admin', 'Centro Institucional', 'EDITAR'),
            ('admin', 'Centro de Horarios', 'EDITAR'),
            ('admin', 'Asignación Automática', 'EDITAR'),
            ('admin', 'Préstamos de Espacios', 'EDITAR'),
            ('admin', 'Periodos Académicos', 'EDITAR'),
            ('admin', 'Asistentes Virtuales', 'EDITAR'),
            ('admin', 'Ocupación Semanal', 'VER'),
            ('admin', 'Reportes Generales', 'VER'),
            ('admin', 'Gestión de Usuarios', 'EDITAR'),
            ('admin', 'Estado de Recursos', 'EDITAR'),
            
            # Planeación de Facultad - similar a admin pero enfocado en su facultad
            ('planeacion_facultad', 'Dashboard', 'EDITAR'),
            ('planeacion_facultad', 'Centro Institucional', 'VER'),
            ('planeacion_facultad', 'Centro de Horarios', 'EDITAR'),
            ('planeacion_facultad', 'Asignación Automática', 'EDITAR'),
            ('planeacion_facultad', 'Préstamos de Espacios', 'EDITAR'),
            ('planeacion_facultad', 'Periodos Académicos', 'VER'),
            ('planeacion_facultad', 'Asistentes Virtuales', 'VER'),
            ('planeacion_facultad', 'Ocupación Semanal', 'VER'),
            ('planeacion_facultad', 'Reportes Generales', 'VER'),
            ('planeacion_facultad', 'Estado de Recursos', 'VER'),
            
            # Supervisor General
            ('supervisor_general', 'Dashboard Supervisor', 'EDITAR'),
            ('supervisor_general', 'Disponibilidad de Espacios', 'VER'),
            ('supervisor_general', 'Apertura y Cierre de Salones', 'EDITAR'),
            ('supervisor_general', 'Estado de Recursos', 'EDITAR'),
            ('supervisor_general', 'Asistentes Virtuales Supervisor', 'VER'),
            
            # Docente
            ('docente', 'Dashboard Docente', 'VER'),
            ('docente', 'Mi Horario', 'VER'),
            ('docente', 'Préstamos Docente', 'EDITAR'),
            ('docente', 'Asistentes Virtuales Docente', 'VER'),
            
            # Estudiante
            ('estudiante', 'Dashboard Estudiante', 'VER'),
            ('estudiante', 'Mi Horario Estudiante', 'VER'),
            ('estudiante', 'Asistentes Virtuales Estudiante', 'VER'),
        ]
        
        created_count = 0
        for nombre_rol, nombre_componente, permiso in asignaciones_data:
            try:
                rol = Rol.objects.get(nombre=nombre_rol)
                componente = Componente.objects.get(nombre=nombre_componente)
                
                _, created = ComponenteRol.objects.get_or_create(
                    rol=rol,
                    componente=componente,
                    defaults={'permiso': permiso}
                )
                
                if created:
                    created_count += 1
            except (Rol.DoesNotExist, Componente.DoesNotExist) as e:
                self.stdout.write(self.style.WARNING(f'    ⚠ Omitiendo: {nombre_rol} - {nombre_componente} ({str(e)})'))
        
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} asignaciones creadas ({len(asignaciones_data)} totales)'))

    def create_grupos(self):
        """Crear grupos académicos para el periodo 2026-1"""
        self.stdout.write('  → Creando grupos académicos...')
        
        # Mapeo de nombres de programas
        programas_map = {
            'ING. INDUSTRIAL': 'Ingeniería Industrial',
            'ING. SISTEMAS': 'Ingeniería de Sistemas',
            'ADM. NEGOCIOS': 'Administración de Negocios Internacionales',
            'CONTADURIA': 'Contaduría Pública',
            'MEDICINA': 'Medicina',
            'DERECHO': 'Derecho'
        }
        
        # Mapeo de números romanos a enteros
        romanos_map = {
            'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
            'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
            'XI': 11, 'XII': 12
        }
        
        # Formato: (nombre_programa_corto, periodo, nombre_grupo, semestre_romano)
        grupos_data = [
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
            ('DERECHO', '2026-1', 'DERECHO A', 'II'),
            ('DERECHO', '2026-1', 'DERECHO B', 'II'),
            ('DERECHO', '2026-1', 'DERECHO C', 'II'),
            ('DERECHO', '2026-1', 'DERECHO D', 'II'),
            ('DERECHO', '2026-1', 'DERECHO A', 'III'),
            ('DERECHO', '2026-1', 'DERECHO B', 'III'),
            ('DERECHO', '2026-1', 'DERECHO C', 'III'),
            ('DERECHO', '2026-1', 'DERECHO A', 'IV'),
            ('DERECHO', '2026-1', 'DERECHO B', 'IV'),
            ('DERECHO', '2026-1', 'DERECHO C', 'IV'),
            ('DERECHO', '2026-1', 'DERECHO A', 'V'),
            ('DERECHO', '2026-1', 'DERECHO B', 'V'),
            ('DERECHO', '2026-1', 'DERECHO C', 'V'),
            ('DERECHO', '2026-1', 'DERECHO A', 'VI'),
            ('DERECHO', '2026-1', 'DERECHO B', 'VI'),
            ('DERECHO', '2026-1', 'DERECHO C', 'VI'),
            ('DERECHO', '2026-1', 'DERECHO A', 'VII'),
            ('DERECHO', '2026-1', 'DERECHO B', 'VII'),
            ('DERECHO', '2026-1', 'DERECHO C', 'VII'),
            ('DERECHO', '2026-1', 'DERECHO A', 'VIII'),
            ('DERECHO', '2026-1', 'DERECHO B', 'VIII'),
            ('DERECHO', '2026-1', 'DERECHO C', 'VIII'),
            ('DERECHO', '2026-1', 'DERECHO A', 'IX'),
            ('DERECHO', '2026-1', 'DERECHO B', 'IX'),
            ('DERECHO', '2026-1', 'DERECHO C', 'IX'),
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
            ('MEDICINA', '2026-1', 'MEDICINA GB', 'IV'),
            ('MEDICINA', '2026-1', 'MEDICINA GA', 'V'),
        ]
        
        created_count = 0
        skipped_count = 0
        
        try:
            # Obtener el periodo 2026-1
            periodo = PeriodoAcademico.objects.get(nombre='2026-1')
        except PeriodoAcademico.DoesNotExist:
            self.stdout.write(self.style.ERROR('    ✗ No existe el periodo 2026-1. Ejecuta primero create_periodos_academicos()'))
            return
        
        for nombre_prog_corto, periodo_nombre, nombre_grupo, semestre_romano in grupos_data:
            try:
                # Obtener el programa
                nombre_programa_completo = programas_map.get(nombre_prog_corto)
                if not nombre_programa_completo:
                    self.stdout.write(self.style.WARNING(f'    ⚠ Programa no mapeado: {nombre_prog_corto}'))
                    skipped_count += 1
                    continue
                
                programa = Programa.objects.get(nombre=nombre_programa_completo)
                
                # Convertir semestre romano a número
                semestre = romanos_map.get(semestre_romano.strip())
                if not semestre:
                    self.stdout.write(self.style.WARNING(f'    ⚠ Semestre inválido: {semestre_romano}'))
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
                self.stdout.write(self.style.WARNING(f'    ⚠ Programa no encontrado: {nombre_programa_completo}'))
                skipped_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'    ⚠ Error creando grupo {nombre_grupo}: {str(e)}'))
                skipped_count += 1
        
        total = len(grupos_data)
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} grupos creados, {skipped_count} omitidos ({total} totales)'))
    
    def create_horarios_sede_centro(self):
        """Crear horarios para la sede centro"""
        self.stdout.write('  → Creando horarios sede centro...')
        
        # Desconectar temporalmente la validación de horarios durante el seed
        from django.db.models.signals import pre_save
        from horario.signals import validar_horario
        pre_save.disconnect(validar_horario, sender=Horario)
        
        # Mapeo de días en español a formato consistente
        dias_map = {
            'LUNES': 'Lunes',
            'MARTES': 'Martes',
            'MIÉRCOLES': 'Miércoles',
            'MIERCOLES': 'Miércoles',
            'JUEVES': 'Jueves',
            'VIERNES': 'Viernes',
            'SÁBADO': 'Sábado',
            'SABADO': 'Sábado',
            'DOMINGO': 'Domingo'
        }
        
        # Formato: (grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio)
        horarios_data = [
            # ── ALIANZA CANADIENSE ──
            # Modalidad: Intensivo
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 501NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 502NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 506NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 501NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 502NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 506NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 501NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 502NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 506NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 501NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 502NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Intensiva', '7', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 506NB'),
            # Modalidad: SEMESTRAL
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '4', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '4', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '4', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '4', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 414NB'),
            # Modalidad: Sabatino
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 409NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 410NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 411NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 412NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Sabatino', '2', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 414NB'),
            # Modalidad: Semestral
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 506NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 513NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 505NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 506NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semestral', '2', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 513NB'),
            # Modalidad: Semi-Intensiva
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '5', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '5', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '5', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 509NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '5', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 509NB'),
            # Modalidad: Semi-Intensiva
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 414NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '7', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 414NB'),
            # Modalidad: Semi-intensiva
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-intensiva', '6', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-intensiva', '6', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-intensiva', '6', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 510NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-intensiva', '6', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 510NB'),
            # Modalidad: Semi-Intensiva
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 410NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 410NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 410NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 413NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 406NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 410NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: Semi-Intensiva', '4', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 413NB'),
            # Modalidad:Sabatino
            ('ALIANZA CANADIENSE', 'Modalidad:Sabatino', '7', 'SÁBADO', '08:00:00', '09:00:00', 'SALÓN 502NB'),
            # Modalidad: SEMESTRAL
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '1', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 405NB'),
            ('ALIANZA CANADIENSE', 'Modalidad: SEMESTRAL', '1', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 405NB'),

            # ELECTIVA LAW AT THE EDGE
            ('', 'ELECTIVA  LAW AT THE EDGE', 'ALEXANDER GONZÁLEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 501NB'),
            
            # Electiva: BASIC BUSSINESS ENGLISH
            ('', 'Electiva: BASIC BUSSINESS ENGLISH', 'RICHARD ANDRES PALACIO MATTA', 'LUNES', '18:00:00', '19:00:00', 'I CONTADURIA AN'),
            
            # Electiva: INTERMEDIATE ACCOUNTING ENGLISH
            ('', 'Electiva: INTERMEDIATE ACCOUNTING ENGLISH', 'RICHARD ANDRES PALACIO MATTA', 'LUNES', '20:00:00', '21:00:00', 'I CONTADURIA AN'),
            
            # /II CONTADURIA AN/II ADM. NEGOCIOS AN - Calculo
            ('II CONTADURIA AN', 'Cálculo', 'Rocío Mercedes Duarte Angarita', 'MARTES', '20:00:00', '21:00:00', 'SALÓN 506NB'),
            
            ('II ADM. NEGOCIOS AN', 'Cálculo', 'Rocío Mercedes Duarte Angarita', 'MARTES', '20:00:00', '21:00:00', 'SALÓN 506NB'),
            
            # /II CONTADURIA AN/II ADM. NEGOCIOS AN - Epistemología y Metodología de la Investigación
            ('II CONTADURIA AN', 'Epistemología y Metodología de la Investigación', 'Milagros Del Carmen Villasmil Molero', 'MARTES', '18:00:00', '19:00:00', 'SALÓN 506NB'),
            
            ('II ADM. NEGOCIOS AN', 'Epistemología y Metodología de la Investigación', 'Milagros Del Carmen Villasmil Molero', 'MARTES', '18:00:00', '19:00:00', 'SALÓN 506NB'),
            
            
            # 1 Semestre grupo C - HISTORIA DE LA FILOSOFÍA
            ('1 Semestre grupo C', 'HISTORIA DE LA FILOSOFÍA', 'CRISTÓBL ARTETA', 'LUNES', '10:00:00', '11:00:00', 'SALON 504NB'),
            
            # 1 Semestre grupo C - TEORÍA DEL ESTADO
            ('1 Semestre grupo C', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'LUNES', '08:00:00', '09:00:00', 'SALON 504NB'),
            
            # 1 Semestre grupo D - TEORÍA ECONÓMICA
            ('1 Semestre grupo D', 'TEORÍA ECONÓMICA', 'GUILLERMO DE LA HOZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 504NB'),
            
            # 1 semestre E - HABILIDADES COMUNICATIVAS
            ('1 semestre E', 'HABILIDADES COMUNICATIVAS', 'TATIANA POLO', 'MARTES', '08:00:00', '09:00:00', 'SALON 604NB'),
            
            # 1 semestre E - INTRODUCCIÓN AL DERECHO
            ('1 semestre E', 'INTRODUCCIÓN AL DERECHO', 'GONZALO AGUILAR', 'LUNES', '11:00:00', '12:00:00', 'SALON 607NB'),
            
            # 1 semestre grupo AN - ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA
            ('1 semestre grupo AN', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'LUNES', '08:00:00', '09:00:00', 'SALON 411NB'),
            
            # 1 semestre grupo AN - HABILIDADES COMUNICATIVAS
            ('1 semestre grupo AN', 'HABILIDADES COMUNICATIVAS', 'ALEJANDRO BLANCO', 'MARTES', '18:00:00', '19:00:00', 'SALON 601NB'),
            
            # 1 semestre grupo AN - INTRODUCCIÓN AL DERECHO
            ('1 semestre grupo AN', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '10:00:00', '11:00:00', 'SALON 411NB'),
            ('1 semestre grupo AN', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '18:00:00', '19:00:00', 'SALON 601NB'),
            
            # 1 semestre grupo AN - TEORÍA ECONÓMICA
            ('1 semestre grupo AN', 'TEORÍA ECONÓMICA', 'FRANCISCO POLO', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 601NB'),
            
            # 1 semestre grupo AN-1E - DERECHO ROMANO
            ('1 semestre grupo AN-1E', 'DERECHO ROMANO', 'TATIANA POLO', 'LUNES', '07:00:00', '08:00:00', 'SALON 607NB'),
            
            # 1 semestre grupo AN-E - DERECHO ROMANO
            ('1 semestre grupo AN-E', 'DERECHO ROMANO', 'TATIANA POLO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 6121NB'),
            
            # 1 semestre grupo AN-E - TEORÍA DEL ESTADO
            ('1 semestre grupo AN-E', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 612NB'),
            ('1 semestre grupo AN-E', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'VIERNES', '06:00:00', '07:00:00', 'SALON 612NB'),
            
            # 1 semestre grupo B - DERECHO ROMANO
            ('1 semestre grupo B', 'DERECHO ROMANO', 'TATIANA POLO', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 608NB'),
            
            # 1 semestre grupo B - TEORÍA DEL ESTADO
            ('1 semestre grupo B', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 608NB'),
            
            # 1 semestre grupo B - TEORÍA ECONÓMICA
            ('1 semestre grupo B', 'TEORÍA ECONÓMICA', 'FRANCISCO POLO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 411NB'),
            
            # 1 semestre grupo C - DERECHO ROMANO
            ('1 semestre grupo C', 'DERECHO ROMANO', 'TATIANA POLO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 503NB'),
            
            # 1 semestre grupo C - ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA
            ('1 semestre grupo C', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 503NB'),
            
            # 1 semestre grupo C - TEORÍA DEL ESTADO
            ('1 semestre grupo C', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 503NB'),
            
            # 1 semestre grupo D - DERECHO ROMANO
            ('1 semestre grupo D', 'DERECHO ROMANO', 'TATIANA POLO', 'LUNES', '10:00:00', '11:00:00', 'SALON 503NB'),
            
            # 1 semestre grupo D - INTRODUCCIÓN AL DERECHO
            ('1 semestre grupo D', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 503NB'),
            
            # 1 semestre grupo E - ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA
            ('1 semestre grupo E', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'GRETTY PÁVLOVICH', 'MARTES', '06:00:00', '07:00:00', 'SALÓN 612NB'),
            
            # 1 semestre grupo E - HISTORIA DE LA FILOSOFÍA
            ('1 semestre grupo E', 'HISTORIA DE LA FILOSOFÍA', 'ALEXANDER GONZÁLEZ', 'VIERNES', '08:00:00', '09:00:00', 'SALON 6121NB'),
            
            # 1 semestre grupo E - INTRODUCCIÓN AL DERECHO
            ('1 semestre grupo E', 'INTRODUCCIÓN AL DERECHO', 'GONZALO AGUILAR', 'JUEVES', '08:00:00', '09:00:00', 'SALON 6121NB'),
            
            # 10 Semestre Grupo A Diurno - DERECHO AMBIENTAL
            ('10 Semestre Grupo A Diurno', 'DERECHO AMBIENTAL', 'JAIME BERMEJO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 508NB'),
            
            # 10 Semestre Grupo A Diurno - ÉTICA II
            ('10 Semestre Grupo A Diurno', 'ÉTICA II', 'OONA HERNÁNDEZ', 'VIERNES', '08:00:00', '09:00:00', 'SALÓN 416NB'),
            
            # 10 Semestre Grupo B Diurno - ÉTICA II
            ('10 Semestre Grupo B Diurno', 'ÉTICA II', 'OONA HERNÁNDEZ', 'LUNES', '13:00:00', '14:00:00', 'SALON 611NB'),
            
            # 10 Semestre grupo B - RESPONSABILIDAD CIVIL
            ('10 Semestre grupo B', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'VIERNES', '06:00:00', '07:00:00', 'SALON 404NB'),
            
            # 10 semestre Grupo A Diurno - FINANZAS PÚBLICAS
            ('10 semestre Grupo A Diurno', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'LUNES', '10:00:00', '11:00:00', 'SALON 516NB'),
            ('10 semestre Grupo A Diurno', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'MARTES', '10:00:00', '11:00:00', 'SALON 516NB'),
            
            # 10 semestre Grupo A Diurno - RESPONSABILIDAD CIVIL
            ('10 semestre Grupo A Diurno', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'LUNES', '06:00:00', '07:00:00', 'SALON 516NB'),
            ('10 semestre Grupo A Diurno', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'MARTES', '06:00:00', '07:00:00', 'SALON 516NB'),
            
            # 10 semestre grupo B - DERECHO AMBIENTAL
            ('10 semestre grupo B', 'DERECHO AMBIENTAL', 'JAIME BERMEJO', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 612NB'),
            
            # 10 semestre grupo B - FINANZAS PÚBLICAS
            ('10 semestre grupo B', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 612NB'),
            
            # 10 semestre grupo B - RESPONSABILIDAD CIVIL
            ('10 semestre grupo B', 'RESPONSABILIDAD CIVIL', 'EDUARDO CERRA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 516NB'),
            
            # 10 semestre grupo B Diurno - FINANZAS PÚBLICAS
            ('10 semestre grupo B Diurno', 'FINANZAS PÚBLICAS', 'FELIPE HERAS', 'LUNES', '08:00:00', '09:00:00', 'SALON 615NB'),
            
            # 2 Semestre grupo A - CIENCIA POLITICA
            ('2 Semestre grupo A', 'CIENCIA POLITICA', 'ALEJANDRO BLANCO', 'LUNES', '15:00:00', '16:00:00', 'SALON 507NB'),
            
            # 2 Semestre grupo A - DERECHOS HUMANOS Y D.I.H.
            ('2 Semestre grupo A', 'DERECHOS HUMANOS Y D.I.H.', 'MAGDA DJANON', 'LUNES', '10:00:00', '11:00:00', 'SALON 507NB'),
            
            # 2 Semestre grupo A - SOCIOLOGÍA GENERAL Y JURÍDICA
            ('2 Semestre grupo A', 'SOCIOLOGÍA GENERAL Y JURÍDICA', 'YOLANDA FANDIÑO', 'VIERNES', '09:00:00', '10:00:00', 'SALON 504NB'),
            
            # 3 Semestre grupo B - CONSTITUCIONAL COLOMBIANO
            ('3 Semestre grupo B', 'CONSTITUCIONAL COLOMBIANO', '', 'LUNES', '14:00:00', '15:00:00', 'SALON 508NB'),
            
            # 3 Semestre grupo B - LÓGICA JURÍDICA
            ('3 Semestre grupo B', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'LUNES', '10:00:00', '11:00:00', 'SALON 508NB'),
            
            # 3 Semestre grupo C - CIVIL BIENES
            ('3 Semestre grupo C', 'CIVIL BIENES', 'BRENDA VALERO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 504NB'),
            
            # 3 Semestre grupo C - INVESTIGACIÓN I
            ('3 Semestre grupo C', 'INVESTIGACIÓN I', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 504NB'),
            
            # 3 Semestre grupo C - LÓGICA JURÍDICA
            ('3 Semestre grupo C', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 504NB'),
            
            # 3 Semestre grupo D - CIVIL BIENES
            ('3 Semestre grupo D', 'CIVIL BIENES', 'BRENDA VALERO', 'LUNES', '13:00:00', '14:00:00', 'SALON 504NB'),
            
            # 3 semestre grupo A - CONSTITUCIONAL COLOMBIANO
            ('3 semestre grupo A', 'CONSTITUCIONAL COLOMBIANO', 'JHONNY MENDOZA', 'MARTES', '18:00:00', '19:00:00', 'SALON 613NB'),
            ('3 semestre grupo A', 'CONSTITUCIONAL COLOMBIANO', 'JHONNY MENDOZA', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 613NB'),
            
            # 3 semestre grupo A - LÓGICA JURÍDICA
            ('3 semestre grupo A', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'LUNES', '18:00:00', '19:00:00', 'SALON 613NB'),
            
            # 3 semestre grupo A - TEORÍA DEL DELITO
            ('3 semestre grupo A', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'JUEVES', '18:00:00', '19:00:00', 'SALON 613NB'),
            ('3 semestre grupo A', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'VIERNES', '18:00:00', '19:00:00', 'SALON 514NB'),
            
            # 3 semestre grupo AB - CIVIL BIENES  3AB
            ('3 semestre grupo AB', 'CIVIL BIENES  3AB', 'CARLOS ESPINEL', 'LUNES', '06:00:00', '07:00:00', 'SALON 503NB'),
            ('3 semestre grupo AB', 'CIVIL BIENES  3AB', 'CARLOS ESPINEL', 'MARTES', '06:00:00', '07:00:00', 'SALON 503NB'),
            
            # 3 semestre grupo AD - INVESTIGACIÓN I 3AD
            ('3 semestre grupo AD', 'INVESTIGACIÓN I 3AD', 'ALEJANDRO BLANCO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 503NB'),
            
            # 3 semestre grupo B - INVESTIGACIÓN I
            ('3 semestre grupo B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'MARTES', '08:00:00', '09:00:00', 'SALON 503NB'),
            
            # 3 semestre grupo C - CIVIL BIENES
            ('3 semestre grupo C', 'CIVIL BIENES', 'BRENDA VALERO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 507NB'),
            
            # 3 semestre grupo C - INVESTIGACIÓN I
            ('3 semestre grupo C', 'INVESTIGACIÓN I', 'ALEJANDRO BLANCO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 507NB'),
            
            # 3 semestre grupo D - CIVIL BIENES
            ('3 semestre grupo D', 'CIVIL BIENES', 'BRENDA VALERO', 'VIERNES', '08:00:00', '09:00:00', 'SALON 415NB'),
            
            # 4 semestre grupo A - DERECHO INTERNACIONAL PÚBLICO
            ('4 semestre grupo A', 'DERECHO INTERNACIONAL PÚBLICO', 'GRETTY PAVLOVICH', 'MARTES', '08:00:00', '09:00:00', 'SALON 511NB'),
            
            # 4 semestre grupo A - INVESTIGACIÓN II
            ('4 semestre grupo A', 'INVESTIGACIÓN II', 'ALEJANDRO BLANCO', 'LUNES', '10:00:00', '11:00:00', 'SALON 511NB'),
            ('4 semestre grupo A', 'INVESTIGACIÓN II', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 511NB'),
            
            # 4 semestre grupo A - LABORAL INDIVIDUAL Y PRESTACIONAL
            ('4 semestre grupo A', 'LABORAL INDIVIDUAL Y PRESTACIONAL', 'LILIA CEDEÑO', 'MARTES', '13:00:00', '14:00:00', 'SALON 511NB'),
            ('4 semestre grupo A', 'LABORAL INDIVIDUAL Y PRESTACIONAL', 'LILIA CEDEÑO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 511NB'),
            
            # 4 semestre grupo A - SOLUCIÓN ALTERNATIVA DE CONFLICTOS
            ('4 semestre grupo A', 'SOLUCIÓN ALTERNATIVA DE CONFLICTOS', 'TATIANA POLO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 511NB'),
            ('4 semestre grupo A', 'SOLUCIÓN ALTERNATIVA DE CONFLICTOS', 'TATIANA POLO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 511NB'),
            
            # 4 semestre grupo A - TEORÍA GENERAL DEL PROCESO
            ('4 semestre grupo A', 'TEORÍA GENERAL DEL PROCESO', 'INGRID PEREZ', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON 511NB'),
            ('4 semestre grupo A', 'TEORÍA GENERAL DEL PROCESO', 'INGRID PEREZ', 'VIERNES', '08:00:00', '09:00:00', 'SALON 511NB'),
            
            # 4 semestre grupo A - TUTELA PENAL DE LOS BIENES JURIDÍCOS I
            ('4 semestre grupo A', 'TUTELA PENAL DE LOS BIENES JURIDÍCOS I', 'EDGAR DEVIA', 'JUEVES', '06:00:00', '07:00:00', 'SALON 511NB'),
            
            # 405NB - Electiva de profundización (B): Diagnóstico Forense
            ('405NB', 'Electiva de profundización (B):', 'Miriam Linero', 'JUEVES', '16:00:00', '17:00:00', 'SALON 405NB'),
            
            # 5 Semestre Grupo B - ADMINISTRATIVO GENERAL
            ('5 Semestre Grupo B', 'ADMINISTRATIVO GENERAL', 'EDUARDO CERRA', 'JUEVES', '14:00:00', '15:00:00', 'SALON 611NB'),
            
            # 5 Semestre Grupo B - INVESTIGACIÓN III
            ('5 Semestre Grupo B', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MARTES', '11:00:00', '12:00:00', 'SALON 611NB'),
            ('5 Semestre Grupo B', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 611NB'),
            
            # 5 Semestre Grupo B - OBLIGACIONES
            ('5 Semestre Grupo B', 'OBLIGACIONES', 'JAVIER CRESPO', 'MARTES', '06:00:00', '07:00:00', 'SALON 611NB'),
            
            # 5 Semestre Grupo B - PROCESAL PENAL I
            ('5 Semestre Grupo B', 'PROCESAL PENAL I', 'EDGAR DEVIA', 'JUEVES', '09:00:00', '10:00:00', 'SALON 611NB'),
            
            # 5 Semestre Grupo D - ELECTIVA V CONFLICTOS CONTEMPORÁNEOS
            ('5 Semestre Grupo D', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'MARTES', '10:00:00', '11:00:00', 'SALON 508NB'),
            
            # 5 Semestre grupo A - HERMENÉUTICA JURÍDICA (Diurno)
            ('5 Semestre grupo A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'MARTES', '10:00:00', '11:00:00', 'SALON 504NB'),
            
            # 5 Semestre grupo C - ADMINISTRATIVO GENERAL
            ('5 Semestre grupo C', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'LUNES', '14:00:00', '15:00:00', 'SALON 604NB'),
            
            # 5 Semestre grupo C - OBLIGACIONES
            ('5 Semestre grupo C', 'OBLIGACIONES', 'CARLOS ESPINEL', 'VIERNES', '10:00:00', '11:00:00', 'SALON 604NB'),
            
            # 5 Semestre grupo C - PROCESAL PENAL I
            ('5 Semestre grupo C', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'VIERNES', '06:00:00', '07:00:00', 'SALON 604NB'),
            
            # 5 Semestre grupo D - INVESTIGACIÓN III
            ('5 Semestre grupo D', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 604NB'),
            
            # 5 Semestre grupo D - OBLIGACIONES
            ('5 Semestre grupo D', 'OBLIGACIONES', 'CARLOS ESPINEL', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 604NB'),
            
            # 5 Semestre grupo D - PROCESAL PENAL I
            ('5 Semestre grupo D', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 604NB'),
            
            # 5 semestre GRUPO D - TUTELA PENAL DE LOS BIENES JURÍDICOS II
            ('5 semestre GRUPO D', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'LUIS CASTILLO', 'LUNES', '14:00:00', '15:00:00', 'SALON 615NB'),
            
            # 5 semestre Grupo D - INVESTIGACIÓN III
            ('5 semestre Grupo D', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'MARTES', '14:00:00', '15:00:00', 'SALON 516NB'),
            
            # 5 semestre grupo A - ADMINISTRATIVO GENERAL
            ('5 semestre grupo A', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'JUEVES', '18:00:00', '19:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo A - DERECHO INTERNACIONAL PRIVADO
            ('5 semestre grupo A', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'VIERNES', '18:00:00', '19:00:00', 'SALON 504NB'),
            
            # 5 semestre grupo A - HERMENÉUTICA JURÍDICA
            ('5 semestre grupo A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'MARTES', '06:00:00', '07:00:00', 'SALON 603NB'),
            ('5 semestre grupo A', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'VIERNES', '07:00:00', '08:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo A - INVESTIGACIÓN III
            ('5 semestre grupo A', 'INVESTIGACIÓN III', 'YOLANDA FANDIÑO', 'LUNES', '18:00:00', '19:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo A - OBLIGACIONES
            ('5 semestre grupo A', 'OBLIGACIONES', 'CARLOS ESPINEL', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 603NB'),
            ('5 semestre grupo A', 'OBLIGACIONES', 'CARLOS ESPINEL', 'JUEVES', '06:00:00', '07:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo A - PROCESAL PENAL I
            ('5 semestre grupo A', 'PROCESAL PENAL I', 'DAVID GÜETTE', 'MARTES', '18:00:00', '19:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo A - TUTELA PENAL DE LOS BIENES JURÍDICOS II
            ('5 semestre grupo A', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'JUAN CARLOS GUTIÉRREZ', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 103B'),
            
            # 5 semestre grupo B - ADMINISTRATIVO GENERAL
            ('5 semestre grupo B', 'ADMINISTRATIVO GENERAL', 'EDUARDO CERRA', 'LUNES', '14:00:00', '15:00:00', 'SALON 608NB'),
            
            # 5 semestre grupo B - HERMENÉUTICA JURÍDICA
            ('5 semestre grupo B', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'LUNES', '10:00:00', '11:00:00', 'SALON 608NB'),
            
            # 5 semestre grupo B - TUTELA PENAL DE LOS BIENES JURÍDICOS II
            ('5 semestre grupo B', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'JUAN CARLOS GUTIÉRREZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 103B'),
            
            # 5 semestre grupo C - ELECTIVA V CONFLICTOS CONTEMPORÁNEOS
            ('5 semestre grupo C', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'LUNES', '08:00:00', '09:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo C - OBLIGACIONES
            ('5 semestre grupo C', 'OBLIGACIONES', 'CARLOS ESPINEL', 'LUNES', '10:00:00', '11:00:00', 'SALON 603NB'),
            
            # 5 semestre grupo C - TUTELA PENAL DE LOS BIENES JURÍDICOS II
            ('5 semestre grupo C', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'JUAN CARLOS GUTIÉRREZ', 'MARTES', '06:00:00', '07:00:00', 'SALON 103B'),
            
            # 5 semestre grupo D - DERECHO INTERNACIONAL PRIVADO
            ('5 semestre grupo D', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'MARTES', '06:00:00', '07:00:00', 'SALON 508NB'),
            
            # 5. Semestre grupo D - ADMINISTRATIVO GENERAL
            ('5. Semestre grupo D', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 603NB'),
            
            # 5. Semestre grupo D - OBLIGACIONES
            ('5. Semestre grupo D', 'OBLIGACIONES', 'CARLOS ESPINEL', 'VIERNES', '08:00:00', '09:00:00', 'SALON 603NB'),
            
            # 6 ADMIN NEGOCIOS CD - Finanzas internacionales
            ('6 ADMIN NEGOCIOS CD', 'Finanzas internacionales', 'Winston Fontalvo Cerpa', 'LUNES', '18:00:00', '19:00:00', 'SALÓN 410 NB'),
            ('6 ADMIN NEGOCIOS CD', 'Finanzas internacionales', 'Winston Fontalvo Cerpa', 'MARTES', '18:00:00', '19:00:00', 'SALÓN 514NB'),
            
            # 6 ADMIN NEGOCIOS CD - Formulación y gestión de proyectos
            ('6 ADMIN NEGOCIOS CD', 'Formulación y gestión de proyectos', 'Danilo Enrique Torres Pimiento', 'VIERNES', '19:00:00', '20:00:00', 'SALÓN 103B'),
            
            # 6 ADMIN NEGOCIOS CD - Gestión de importaciones
            ('6 ADMIN NEGOCIOS CD', 'Gestión de importaciones', 'Maribel Cerro Camera', 'MARTES', '20:00:00', '21:00:00', 'SALÓN 514NB'),
            
            # 6 ADMIN NEGOCIOS CD - Gestión del transporte internacional
            ('6 ADMIN NEGOCIOS CD', 'Gestión del transporte internacional', 'Roberto Meisel Lanner', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALÓN 514NB'),
            
            # 6 ADMIN NEGOCIOS CD - Investigación de mercados
            ('6 ADMIN NEGOCIOS CD', 'Investigación de mercados', 'José Rafael Simancas Trujillo', 'LUNES', '19:00:00', '20:00:00', 'SALÓN 410NB'),
            ('6 ADMIN NEGOCIOS CD', 'Investigación de mercados', 'José Rafael Simancas Trujillo', 'MIÉRCOLES', '20:00:00', '21:00:00', 'SALÓN 514NB'),
            
            # 6 Semestre grupo A - PROCESAL CIVIL GENERAL (Diurno)
            ('6 Semestre grupo A', 'PROCESAL CIVIL GENERAL', 'NUBIA MARRUGO', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 616NB'),
            
            # 6 semestre grupo A - ADMINISTRATIVO COLOMBIANO
            ('6 semestre grupo A', 'ADMINISTRATIVO COLOMBIANO', 'JHONNY MENDOZA', 'LUNES', '14:00:00', '15:00:00', 'SALON 616NB'),
            ('6 semestre grupo A', 'ADMINISTRATIVO COLOMBIANO', 'JHONNY MENDOZA', 'MARTES', '11:00:00', '12:00:00', 'SALON 616NB'),
            
            # 6 semestre grupo A - ARGUMENTACIÓN JURÍDICA
            ('6 semestre grupo A', 'ARGUMENTACIÓN JURÍDICA', 'PATRICIA MORRIS', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 616NB'),
            
            # 6 semestre grupo A - INVESTIGACIÓN IV
            ('6 semestre grupo A', 'INVESTIGACIÓN IV', 'YOLANDA FANDIÑO', 'MARTES', '09:00:00', '10:00:00', 'SALON 616NB'),
            
            # 6 semestre grupo A - LABORAL COLECTIVO
            ('6 semestre grupo A', 'LABORAL COLECTIVO', 'FRANCISCO BUSTAMANTE', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 616NB'),
            
            # 6 semestre grupo A - PROCESAL CIVIL GENERAL
            ('6 semestre grupo A', 'PROCESAL CIVIL GENERAL', 'NUBIA MARRUGO', 'MARTES', '14:00:00', '15:00:00', 'SALON 616NB'),
            
            # 6 semestre grupo A - PROCESAL PENAL II
            ('6 semestre grupo A', 'PROCESAL PENAL II', 'RICARDO MÉNDEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALON 616NB'),
            
            # 6. Semestre grupo A - INVESTIGACIÓN IV
            ('6. Semestre grupo A', 'INVESTIGACIÓN IV', 'YOLANDA FANDIÑO', 'LUNES', '10:00:00', '11:00:00', 'SALON 616NB'),
            
            # 7 ADMIN NEG FN - OPTATIVA II . INNOVACIÓN Y TRANSFORMACIÓN DIGITAL EN EMPRESAS GLOBALES
            ('7 ADMIN NEG FN', 'OPTATIVA II . INNOVACIÓN Y TRANSFORMACIÓN DIGITAL EN EMPRESAS GLOBALES', 'Danilo Enrique Torres Pimiento', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 408NB'),
            
            # 7 Semestre Grupo C - CONTRATOS
            ('7 Semestre Grupo C', 'CONTRATOS', 'RAFAEL FIERRO', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 611NB'),
            
            # 7 Semestre Grupo C - FAMILIA, INFANCIA Y ADOLESCENCIA
            ('7 Semestre Grupo C', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALON 611NB'),
            
            # 7 Semestre grupo A - CRIMINOLOGÍA Y POLÍTICA CRIMINAL
            ('7 Semestre grupo A', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'RICARDO MÉNDEZ', 'VIERNES', '18:00:00', '19:00:00', 'SALÓN 411NB'),
            
            # 7 Semestre grupo A - FAMILIA, INFANCIA Y ADOLESCENCIA
            ('7 Semestre grupo A', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'RICARDO JIMÉNEZ', 'MARTES', '06:00:00', '07:00:00', 'SALON 607NB'),
            
            # 7 Semestre grupo A - FILOSOFÍA DEL DERECHO
            ('7 Semestre grupo A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 607NB'),
            ('7 Semestre grupo A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN 407NB'),
            ('7 Semestre grupo A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALÓN 407NB'),
            
            # 7 Semestre grupo B - CONTRATOS
            ('7 Semestre grupo B', 'CONTRATOS', 'RAFAEL FIERRO', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 411NB'),
            ('7 Semestre grupo B', 'CONTRATOS', 'RAFAEL FIERRO', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 411NB'),
            
            # 7 Semestre grupo B - FAMILIA, INFANCIA Y ADOLESCENCIA
            ('7 Semestre grupo B', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'JUAN CARLOS DE LOS RÍOS', 'LUNES', '10:00:00', '11:00:00', 'SALÓN 412NB'),
            ('7 Semestre grupo B', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'JUAN CARLOS DE LOS RÍOS', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN 411NB'),
            
            # 7 Semestre grupo B - FILOSOFÍA DEL DERECHO
            ('7 Semestre grupo B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 412NB'),
            
            # 7 Semestre grupo B - PROBATORIO
            ('7 Semestre grupo B', 'PROBATORIO', 'EDUARDO LASCANO', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 412NB'),
            ('7 Semestre grupo B', 'PROBATORIO', 'EDUARDO LASCANO', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 411NB'),
            
            # 7 Semestre grupo B - TÍTULOS VALORES
            ('7 Semestre grupo B', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 4111NB'),
            ('7 Semestre grupo B', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 411NB'),
            
            # 7 Semestre grupo C - FILOSOFÍA DEL DERECHO
            ('7 Semestre grupo C', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'LUNES', '06:00:00', '07:00:00', 'SALON 604NB'),
            
            # 7 Semestre grupo C - PROBATORIO
            ('7 Semestre grupo C', 'PROBATORIO', 'EDUARDO LASCANO', 'LUNES', '09:00:00', '10:00:00', 'SALON 604NB'),
            
            # 7 semestre grupo A - CONTRATOS
            ('7 semestre grupo A', 'CONTRATOS', 'CARLOS ESPINEL', 'JUEVES', '18:00:00', '19:00:00', 'SALON 516 NB'),
            
            # 7 semestre grupo A - FILOSOFÍA DEL DERECHO
            ('7 semestre grupo A', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON  409 BN'),
            
            # 7 semestre grupo A - PROBATORIO
            ('7 semestre grupo A', 'PROBATORIO', 'RAFAEL FIERRO', 'LUNES', '18:00:00', '19:00:00', 'SALON 516 NB'),
            ('7 semestre grupo A', 'PROBATORIO', 'RAFAEL FIERRO', 'MARTES', '18:00:00', '19:00:00', 'SALON 516 NB'),
            
            # 7 semestre grupo C - CRIMINOLOGÍA Y POLÍTICA CRIMINAL
            ('7 semestre grupo C', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'MARTES', '11:00:00', '12:00:00', 'SALON 608NB'),
            
            # 7 semestre grupo C - FAMILIA, INFANCIA Y ADOLESCENCIA
            ('7 semestre grupo C', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'JUEVES', '14:00:00', '15:00:00', 'SALON 512 NB'),
            
            # 7 semestre grupo C - FILOSOFÍA DEL DERECHO
            ('7 semestre grupo C', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MARTES', '08:00:00', '09:00:00', 'SALON 608NB'),
            
            # 7 semestre grupo C - PROBATORIO
            ('7 semestre grupo C', 'PROBATORIO', 'EDUARDO LASCANO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 516 NB'),
            
            # 7 semestre grupo C - TÍTULOS VALORES
            ('7 semestre grupo C', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '06:00:00', '07:00:00', 'SALON 608NB'),
            ('7 semestre grupo C', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '10:00:00', '11:00:00', 'SALON 512NB'),
            
            # 7 semestre grupo D - CONTRATOS
            ('7 semestre grupo D', 'CONTRATOS', 'RAFAEL FIERRO', 'LUNES', '08:00:00', '09:00:00', 'SALON 515NB'),
            ('7 semestre grupo D', 'CONTRATOS', 'RAFAEL FIERRO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 515NB'),
            
            # 7 semestre grupo D - CRIMINOLOGÍA Y POLÍTICA CRIMINAL
            ('7 semestre grupo D', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'LUNES', '13:00:00', '14:00:00', 'SALON 515NB'),
            
            # 7 semestre grupo D - FAMILIA, INFANCIA Y ADOLESCENCIA
            ('7 semestre grupo D', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 515NB'),
            ('7 semestre grupo D', 'FAMILIA, INFANCIA Y ADOLESCENCIA', 'PEDRO ARIAS', 'JUEVES', '06:00:00', '07:00:00', 'SALON 516 NB'),
            
            # 7 semestre grupo D - FILOSOFÍA DEL DERECHO
            ('7 semestre grupo D', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'LUNES', '10:00:00', '11:00:00', 'SALON 515NB'),
            ('7 semestre grupo D', 'FILOSOFÍA DEL DERECHO', 'ALEXANDER GONZÁLEZ', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 515NB'),
            
            # 7 semestre grupo D - PROBATORIO
            ('7 semestre grupo D', 'PROBATORIO', 'EDUARDO LASCANO', 'MARTES', '10:00:00', '11:00:00', 'SALON 515NB'),
            ('7 semestre grupo D', 'PROBATORIO', 'EDUARDO LASCANO', 'JUEVES', '09:00:00', '10:00:00', 'SALON 516 NB'),
            
            # 7 semestre grupo D - TÍTULOS VALORES
            ('7 semestre grupo D', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'MARTES', '08:00:00', '09:00:00', 'SALON 515NB'),
            ('7 semestre grupo D', 'TÍTULOS VALORES', 'MARLYS HERAZO', 'JUEVES', '14:00:00', '15:00:00', 'SALON 516 NB'),
            
            # 8 Semestre grupo A - CRIMINALÍSTICA Y CIENCIA FORENSE
            ('8 Semestre grupo A', 'CRIMINALÍSTICA Y CIENCIA FORENSE', 'CARLOS NEWBALL', 'JUEVES', '06:00:00', '07:00:00', 'SALON 504NB'),
            
            # 8 Semestre grupo A - LABORAL ADMINISTRATIVO
            ('8 Semestre grupo A', 'LABORAL ADMINISTRATIVO', 'FRANCISCO BUSTAMANTE', 'MARTES', '06:00:00', '07:00:00', 'SALÓN 412NB'),
            
            # 8 Semestre grupo A - PROCESAL CIVIL ESPECIAL Y DE FAMILIA
            ('8 Semestre grupo A', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'LUNES', '10:00:00', '11:00:00', 'SALÓN 404NB'),
            ('8 Semestre grupo A', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'JUEVES', '12:00:00', '13:00:00', 'SALON 504NB'),
            
            # 8 Semestre grupo A - PROCESAL LABORAL
            ('8 Semestre grupo A', 'PROCESAL LABORAL', 'LILIA CEDEÑO', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 412NB'),
            ('8 Semestre grupo A', 'PROCESAL LABORAL', 'LILIA CEDEÑO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 415NB'),
            
            # 8 Semestre grupo A - SEGURIDAD SOCIAL
            ('8 Semestre grupo A', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'LUNES', '13:00:00', '14:00:00', 'SALÓN 404NB'),
            ('8 Semestre grupo A', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALÓN 415NB'),
            
            # 8 Semestre grupo B - LABORAL ADMINISTRATIVO
            ('8 Semestre grupo B', 'LABORAL ADMINISTRATIVO', 'FRANCISCO BUSTAMANTE', 'VIERNES', '06:00:00', '07:00:00', 'SALÓN 403NB'),
            
            # 8 semestre grupo A - PROCESAL ADMINISTRATIVO I
            ('8 semestre grupo A', 'PROCESAL ADMINISTRATIVO I', 'LUIS CERRA', 'VIERNES', '06:00:00', '07:00:00', 'SALON 508NB'),
            
            # 8 semestre grupo B - CRIMINALÍSTICA Y CIENCIA FORENSE
            ('8 semestre grupo B', 'CRIMINALÍSTICA Y CIENCIA FORENSE', 'CARLOS NEWBALL', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALON 512NB'),
            
            # 8 semestre grupo B - PROCESAL ADMINISTRATIVO I
            ('8 semestre grupo B', 'PROCESAL ADMINISTRATIVO I', 'LUIS CERRA', 'JUEVES', '06:00:00', '07:00:00', 'SALON 515NB'),
            
            # 8 semestre grupo B - PROCESAL CIVIL ESPECIAL Y DE FAMILIA
            ('8 semestre grupo B', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'LUNES', '12:00:00', '13:00:00', 'SALON 512NB'),
            ('8 semestre grupo B', 'PROCESAL CIVIL ESPECIAL Y DE FAMILIA', 'NUBIA MARRUGO', 'MARTES', '12:00:00', '13:00:00', 'SALON 512NB'),
            
            # 8 semestre grupo B - PROCESAL LABORAL
            ('8 semestre grupo B', 'PROCESAL LABORAL', 'DAVID GUETTE', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALON 512NB'),
            
            # 8 semestre grupo B - SEGURIDAD SOCIAL
            ('8 semestre grupo B', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'MARTES', '07:00:00', '08:00:00', 'SALON 512NB'),
            ('8 semestre grupo B', 'SEGURIDAD SOCIAL', 'RAFAEL RODRÍGUEZ', 'JUEVES', '11:00:00', '12:00:00', 'SALON 515NB'),
            
            # 9 Semestre Diurno - OPTATIVA II GESTIÓN DEL CONFLICO EN LO PÚBLICO
            ('9 Semestre Diurno', 'OPTATIVA II GESTIÓN DEL CONFLICO EN LO PÚBLICO', 'LINDA NADER', 'VIERNES', '10:00:00', '11:00:00', 'SALON 611NB'),
            
            # 9 Semestre Grupo A Nocturno - JURISPRUDENCIA CONSTITUCIONAL
            ('9 Semestre Grupo A Nocturno', 'JURISPRUDENCIA CONSTITUCIONAL', 'GRETTY PÁVLOVICH', 'LUNES', '06:00:00', '07:00:00', 'SALON 511NB'),
            ('9 Semestre Grupo A Nocturno', 'JURISPRUDENCIA CONSTITUCIONAL', 'GRETTY PÁVLOVICH', 'MARTES', '06:00:00', '07:00:00', 'SALON 511NB'),
            
            # 9 Semestre Grupo C - JURISPRUDENCIA CONSTITUCIONAL
            ('9 Semestre Grupo C', 'JURISPRUDENCIA CONSTITUCIONAL', 'MAGDA DJANON', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALON 611NB'),
            
            # 9 Semestre Grupo C - PROCESAL ADMINISTRATIVO II
            ('9 Semestre Grupo C', 'PROCESAL ADMINISTRATIVO II', 'GUILLERMO ARÉVALO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 611NB'),
            
            # 9 Semestre Grupo C - SUCESIONES
            ('9 Semestre Grupo C', 'SUCESIONES', 'FABIO AMOROCHO', 'VIERNES', '06:00:00', '07:00:00', 'SALON 611NB'),
            
            # 9 Semestre grupo B - PROCESAL ADMINISTRATIVO II
            ('9 Semestre grupo B', 'PROCESAL ADMINISTRATIVO II', 'GUILLERMO ARÉVALO', 'MARTES', '06:00:00', '07:00:00', 'SALON 507NB'),
            
            # 9 Semestre grupo B - SUCESIONES
            ('9 Semestre grupo B', 'SUCESIONES', 'RICARDO JIMÉNEZ', 'MIÉRCOLES', '06:00:00', '07:00:00', 'ALON 507NB'),
            ('9 Semestre grupo B', 'SUCESIONES', 'RICARDO JIMÉNEZ', 'JUEVES', '06:00:00', '07:00:00', 'ALON 507NB'),
            
            # 9 semestre Diurno - OPTATIVA II PAZ Y MODELOS DE JUSTICIA
            ('9 semestre Diurno', 'OPTATIVA II PAZ Y MODELOS DE JUSTICIA', 'JOHN FABER BUITRAGO', 'VIERNES', '10:00:00', '11:00:00', 'SALON 608NB'),
            
            # 9 semestre Diurno - OPTATIVA III GESTIÓN DEL TALENTO HUMANO
            ('9 semestre Diurno', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'LILIA CEDEÑO', 'LUNES', '10:00:00', '11:00:00', 'SALON 615NB'),
            ('9 semestre Diurno', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'LILIA CEDEÑO', 'JUEVES', '13:00:00', '14:00:00', 'SALON 615NB'),
            
            # 9 semestre Diurno - OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES
            ('9 semestre Diurno', 'OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES', 'EDGAR DEVIA', 'MARTES', '10:00:00', '11:00:00', 'SALON 615NB'),
            
            # 9 semestre grupo A Nocturno - OPTATIVA II DIPLOMACIA Y RELACIONES INTERNACIONALES
            ('9 semestre grupo A Nocturno', 'OPTATIVA II DIPLOMACIA Y RELACIONES INTERNACIONALES', 'ALEJANDRO BLANCO', 'MIÉRCOLES', '18:00:00', '19:00:00', 'SALON 512 NB'),
            
            # Horarios detallados adicionales de la data completa
            # DERECHO COMERCIAL I - UN CONTRATO (grupos varios)
            ('', 'DERECHO COMERCIAL I - UN CONTRATO', 'MARLYS HERAZO', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 410NB'),
            ('', 'DERECHO COMERCIAL I - UN CONTRATO', 'MARLYS HERAZO', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 410NB'),
            ('', 'DERECHO COMERCIAL I - UN CONTRATO', 'MARLYS HERAZO', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 410NB'),
            
            # DERECHO COMERCIAL II - SOCIEDADES (varios grupos)
            ('', 'DERECHO COMERCIAL II - SOCIEDADES', 'MARLYS HERAZO', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 410 NB'),
            ('', 'DERECHO COMERCIAL II - SOCIEDADES', 'MARLYS HERAZO', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 410 NB'),
            
            # DERECHO PROCESAL CONSTITUCIONAL
            ('', 'DERECHO PROCESAL CONSTITUCIONAL', 'PABLO RAFAEL BULA GONZALEZ', 'JUEVES', '16:00:00', '17:00:00', 'SALON 603NB'),
            
            # DERECHO TRIBUTARIO
            ('', 'DERECHO TRIBUTARIO', 'JORGE MARIO MOLINA HERNÁNDEZ', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 612NB'),
            
            # ELECTIVA I
            ('', 'ELECTIVA I', 'YADIRA PATRICIA GARCÍA NAVARRO', 'VIERNES', '14:00:00', '15:00:00', 'SALON 608NB'),
            
            # ELECTIVA V: CONFLICTOS CONTEMPORÁNEOS
            ('', 'ELECTIVA V: CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'VIERNES', '14:00:00', '15:00:00', 'SALON 607NB'),
            
            # ELECTIVA V: TRIBUTARIO I
            ('', 'ELECTIVA V: TRIBUTARIO I', 'JORGE MARIO MOLINA HERNÁNDEZ', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 612NB'),
            
            # Electiva 2 Derecho a la prueba
            ('', 'Electiva 2 Derecho a la prueba', 'Eduardo Lascano', 'JUEVES', '16:00:00', '17:00:00', 'SALΌN 611 NB'),
            
            # Electiva 2 Sistemas de Información Geográfica
            ('', 'Electiva 2 Sistemas de Información Geográfica', 'Camilo Madariaga', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 515NB'),
            
            # Electiva de profundización A: COMERCIO EXTERIOR (varios semestres)
            ('', 'Electiva de profundización A: COMERCIO EXTERIOR', 'ROBERTO CARLOS MEISEL LANER', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 510NB'),
            
            # Electiva de profundización B: DERECHO ADUANERO
            ('', 'Electiva de profundización B: DERECHO ADUANERO', 'ROBERTO CARLOS MEISEL LANER', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 507NB'),
            
            # Electiva de profundización C: DERECHO DE LOS TRATADOS Internacionales
            ('', 'Electiva de profundización C: DERECHO DE LOS TRATADOS Internacionales', 'GRETTY PAVLOVICH', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 516 NB'),
            
            # Electiva de profundización D: DERECHO SOCIETARIO
            ('', 'Electiva de profundización D: DERECHO SOCIETARIO', 'MARLYS HERAZO', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 516 NB'),
            
            # Electiva de profundización E: LITIGIO ESTRATÉGICO
            ('', 'Electiva de profundización E: LITIGIO ESTRATÉGICO', 'PABLO RAFAEL BULA GONZALEZ', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 511 NB'),
            
            # Electiva de profundización F: Derecho y sociedad
            ('', 'Electiva de profundización F: Derecho y sociedad', 'YOLANDA FANDIÑO', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 513NB'),
            
            # Electiva de profundización G: Economía y medio ambiente
            ('', 'Electiva de profundización G: Economía y medio ambiente', 'Esperanza Castro', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 514 NB'),
            
            # Electiva II
            ('', 'Electiva II', 'GRETTY PAVLOVICH', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 612 NB'),
            
            # Lenguas Extranjeras: Inglés I
            ('', 'Lenguas Extranjeras: Inglés I', 'LUIS FERNANDO GÓMEZ', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 607NB'),
            ('', 'Lenguas Extranjeras: Inglés I', 'LUIS FERNANDO GÓMEZ', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 607NB'),
            
            # Lenguas Extranjeras: Inglés II
            ('', 'Lenguas Extranjeras: Inglés II', 'LUIS FERNANDO GÓMEZ', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 604 NB'),
            
            # OPTATIVA I: CONTRATOS COMERCIALES INTERNACIONALES
            ('', 'OPTATIVA I: CONTRATOS COMERCIALES INTERNACIONALES', 'MARLYS HERAZO', 'LUNES', '14:00:00', '15:00:00', 'SALON 608NB'),
            
            # OPTATIVA II DERECHO MIGRATORIO
            ('', 'OPTATIVA II DERECHO MIGRATORIO', 'JUAN CARLOS DE LOS RIOS', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 612 NB'),
            
            # OPTATIVA II GESTIÓN DEL CONFLICTO EN LO PÚBLICO
            ('', 'OPTATIVA II GESTIÓN DEL CONFLICTO EN LO PÚBLICO', 'LINDA NADER', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 516 NB'),
            
            # OPTATIVA II PAZ Y MODELOS DE JUSTICIA
            ('', 'OPTATIVA II PAZ Y MODELOS DE JUSTICIA', 'JOHN FABER BUITRAGO', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 611 NB'),
            
            # OPTATIVA III DERECHO CONTENCIOSO ADMINISTRATIVO
            ('', 'OPTATIVA III DERECHO CONTENCIOSO ADMINISTRATIVO', 'EDUARDO CERRA', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 612 NB'),
            
            # OPTATIVA III GESTIÓN DEL TALENTO HUMANO
            ('', 'OPTATIVA III GESTIÓN DEL TALENTO HUMANO', 'FRANCISCO BUSTAMANTE', 'LUNES', '14:00:00', '15:00:00', 'SALON 612NB'),
            
            # OPTATIVA III LITIGIO ORAL
            ('', 'OPTATIVA III LITIGIO ORAL', 'INGRID PÉREZ', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 612 NB'),
            
            # OPTATIVA III PRÁCTICA JUDICIAL
            ('', 'OPTATIVA III PRÁCTICA JUDICIAL', 'LUIS CERRA', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 516 NB'),
            
            # OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES
            ('', 'OPTATIVA III SISTEMA DE RESPONSABILIDAD PENAL PARA ADOLESCENTES', 'RICARDO MÉNDEZ', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 515 NB'),
            
            # RAZONAMIENTO CUANTITATIVO
            ('', 'RAZONAMIENTO CUANTITATIVO', 'FRANCISCO DE LA HOZ', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 611NB'),
            
            # Teoría del estado (grupos varios)
            ('', 'Teoría del estado', 'LINDA NADER', 'JUEVES', '10:00:00', '11:00:00', 'SALON 504NB'),
            
        ]
        
        created_count = 0
        skipped_count = 0
        errors = []
        
        try:
            periodo = PeriodoAcademico.objects.get(nombre='2026-1')
            sede_centro = Sede.objects.get(nombre='Sede Centro')
            programa_derecho = Programa.objects.get(nombre='Derecho')
            programa_admin = Programa.objects.get(nombre='Administración de Negocios Internacionales')
            programa_contaduria = Programa.objects.get(nombre='Contaduría Pública')
            
            tipo_aula = TipoEspacio.objects.get(nombre='Aula')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'    ✗ Error obteniendo entidades base: {str(e)}'))
            return
        
        # Helper function para extraer número de semestre de un nombre de grupo
        def extraer_semestre(grupo_nombre):
            import re
            # Buscar patrones como "1 Semestre", "10 semestre", "I ", "X ", etc.
            romanos_map = {
                'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
                'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10
            }
            
            # Intentar encontrar número romano al inicio
            for romano, numero in romanos_map.items():
                if grupo_nombre.strip().startswith(romano + ' '):
                    return numero
            
            # Intentar encontrar "X Semestre" o "X semestre"
            match = re.search(r'(\d+)\s*[Ss]emestre', grupo_nombre)
            if match:
                return int(match.group(1))
            
            # Intentar encontrar en el texto "II CONTADURIA", "III ADM", etc
            for romano, numero in romanos_map.items():
                if f'/{romano} ' in grupo_nombre or grupo_nombre.startswith(romano + ' '):
                    return numero
            
            return None
        
        # Determinar programa basado en el nombre del grupo
        def determinar_programa(grupo_nombre):
            grupo_upper = grupo_nombre.upper()
            if 'CONTADURIA' in grupo_upper or 'CONTADURÍA' in grupo_upper:
                return programa_contaduria
            elif 'ADM' in grupo_upper or 'NEGOCIOS' in grupo_upper:
                return programa_admin
            else:
                return programa_derecho
        
        # Mapeo de nombres informales de grupo → nombre formal del Grupo en BD
        # Los nombres formales coinciden con el campo `nombre` del modelo Grupo.
        # Los números romanos indican el semestre (I=1, II=2, …, X=10).
        grupos_derecho_map = {
            # Semestre I
            '1 semestre grupo A':          'DERECHO A',
            '1 Semestre grupo A':          'DERECHO A',
            '1 semestre grupo B':          'DERECHO B',
            '1 Semestre grupo B':          'DERECHO B',
            '1 semestre grupo C':          'DERECHO C',
            '1 Semestre grupo C':          'DERECHO C',
            '1 semestre grupo D':          'DERECHO D',
            '1 Semestre grupo D':          'DERECHO D',
            '1 semestre grupo E':          'DERECHO E',
            '1 Semestre grupo E':          'DERECHO E',
            # Semestre II
            '2 semestre grupo A':          'DERECHO A',
            '2 Semestre grupo A':          'DERECHO A',
            '2 semestre grupo B':          'DERECHO B',
            '2 Semestre grupo B':          'DERECHO B',
            '2. Semestre grupo B':         'DERECHO B',
            '2 semestre grupo C':          'DERECHO C',
            '2 Semestre grupo C':          'DERECHO C',
            '2 semestre grupo D':          'DERECHO D',
            '2 Semestre grupo D':          'DERECHO D',
            # Semestre III
            '3 semestre grupo A':          'DERECHO A',
            '3 Semestre grupo A':          'DERECHO A',
            '3 semestre grupo B':          'DERECHO B',
            '3 Semestre grupo B':          'DERECHO B',
            '3 semestre grupo C':          'DERECHO C',
            '3 Semestre grupo C':          'DERECHO C',
            # Semestre IV
            '4 semestre grupo A':          'DERECHO A',
            '4 Semestre grupo A':          'DERECHO A',
            '4 semestre grupo B':          'DERECHO B',
            '4 Semestre grupo B':          'DERECHO B',
            '4 semestre grupo C':          'DERECHO C',
            '4 Semestre grupo C':          'DERECHO C',
            # Semestre V
            '5 semestre grupo A':          'DERECHO A',
            '5 Semestre grupo A':          'DERECHO A',
            '5 Semestre Grupo A':          'DERECHO A',
            '5 semestre grupo B':          'DERECHO B',
            '5 Semestre grupo B':          'DERECHO B',
            '5 Semestre Grupo B':          'DERECHO B',
            '5 semestre grupo C':          'DERECHO C',
            '5 Semestre grupo C':          'DERECHO C',
            '5 Semestre Grupo C':          'DERECHO C',
            '5. Semestre grupo C':         'DERECHO C',
            # Semestre VI
            '6 semestre grupo A':          'DERECHO A',
            '6 Semestre grupo A':          'DERECHO A',
            '6. Semestre grupo A':         'DERECHO A',
            '6 semestre grupo B':          'DERECHO B',
            '6 Semestre grupo B':          'DERECHO B',
            '6 semestre grupo C':          'DERECHO C',
            '6 Semestre grupo C':          'DERECHO C',
            # Semestre VII
            '7 semestre grupo A':          'DERECHO A',
            '7 Semestre grupo A':          'DERECHO A',
            '7 Semestre Grupo A':          'DERECHO A',
            '7 semestre grupo B':          'DERECHO B',
            '7 Semestre grupo B':          'DERECHO B',
            '7 Semestre Grupo B':          'DERECHO B',
            '7 semestre grupo C':          'DERECHO C',
            '7 Semestre grupo C':          'DERECHO C',
            '7 Semestre Grupo C':          'DERECHO C',
            # Semestre VIII
            '8 semestre grupo A':          'DERECHO A',
            '8 Semestre grupo A':          'DERECHO A',
            '8 semestre grupo B':          'DERECHO B',
            '8 Semestre grupo B':          'DERECHO B',
            '8 semestre grupo C':          'DERECHO C',
            '8 Semestre grupo C':          'DERECHO C',
            # Semestre IX
            '9 semestre grupo A':          'DERECHO A',
            '9 Semestre grupo A':          'DERECHO A',
            '9 Semestre Grupo A Nocturno': 'DERECHO A',
            '9 semestre grupo A Nocturno': 'DERECHO A',
            '9 semestre grupo B':          'DERECHO B',
            '9 Semestre grupo B':          'DERECHO B',
            '9 semestre grupo C':          'DERECHO C',
            '9 Semestre Grupo C':          'DERECHO C',
            '9 semestre grupo D':          'DERECHO D',
            '9. Semestre grupo C':         'DERECHO C',
            # Semestre X
            '10 semestre grupo A':         'DERECHO A',
            '10 Semestre Grupo A Diurno':  'DERECHO A',
            '10 semestre Grupo A Diurno':  'DERECHO A',
            '10 semestre grupo B':         'DERECHO B',
            '10 Semestre grupo B':         'DERECHO B',
            '10 Semestre Grupo B Diurno':  'DERECHO B',
            '10 semestre Grupo B Diurno':  'DERECHO B',
            '10 semestre grupo C':         'DERECHO C',
            '10 Semestre grupo C':         'DERECHO C',
        }

        # Semestres asociados a cada nombre formal de grupo DERECHO
        semestres_derecho = {
            'I':   1, 'II':  2, 'III': 3, 'IV':  4, 'V':   5,
            'VI':  6, 'VII': 7, 'VIII':8, 'IX':  9, 'X':  10,
        }
        # Nombres formales registrados con su semestre
        grupos_formales_derecho = {
            'DERECHO A': None, 'DERECHO B': None,
            'DERECHO C': None, 'DERECHO D': None,
            'DERECHO E': None,
        }

        for grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio_str, hora_fin_str, espacio_nombre in horarios_data:
            try:
                # Aplicar mapeo de nombre informal → nombre formal de grupo DERECHO
                grupo_nombre_resuelto = grupos_derecho_map.get(grupo_nombre, grupo_nombre)

                # Buscar la asignatura - si no existe, crearla
                asignatura = Asignatura.objects.filter(nombre__iexact=materia_nombre.strip()).first()
                if not asignatura:
                    # Crear la asignatura automáticamente con código único
                    import hashlib
                    codigo_base = materia_nombre.strip()[:15].upper().replace(' ', '-').replace(':', '')
                    codigo_hash = hashlib.md5(materia_nombre.encode()).hexdigest()[:6].upper()
                    codigo_unico = f'{codigo_hash}'
                    
                    # Asegurar que el código sea único
                    contador = 1
                    codigo_final = codigo_unico
                    while Asignatura.objects.filter(codigo=codigo_final).exists():
                        codigo_final = f'{codigo_unico}{contador}'
                        contador += 1
                    
                    asignatura = Asignatura.objects.create(
                        nombre=materia_nombre.strip(),
                        codigo=codigo_final,
                        creditos=3,
                        horas=3,
                        tipo='mixta'
                    )
                
                # Buscar o crear el grupo
                grupo = None
                programa_detectado = determinar_programa(grupo_nombre_resuelto) if grupo_nombre_resuelto.strip() else programa_derecho

                if grupo_nombre_resuelto.strip():
                    # ─── Grupos formales DERECHO (ej. "DERECHO A", "DERECHO B") ───
                    if grupo_nombre_resuelto.strip().upper().startswith('DERECHO ') and \
                       grupo_nombre_resuelto.strip().upper() in [k.upper() for k in grupos_formales_derecho]:
                        grupo = Grupo.objects.filter(
                            periodo=periodo,
                            programa=programa_derecho,
                            nombre__iexact=grupo_nombre_resuelto.strip(),
                        ).first()
                        if not grupo:
                            errors.append(f'Grupo formal no encontrado en BD: {grupo_nombre_resuelto} (original: {grupo_nombre})')
                            skipped_count += 1
                            continue
                    else:
                        # ─── Grupos informales: extraer semestre del texto ───
                        semestre = extraer_semestre(grupo_nombre_resuelto)

                        if not semestre:
                            semestre = 1  # Default a primer semestre

                        # Buscar grupo existente
                        grupo = Grupo.objects.filter(
                            periodo=periodo,
                            programa=programa_detectado,
                            semestre=semestre
                        ).first()

                        if not grupo:
                            # Crear grupo
                            romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
                            nombre_grupo = f'{romanos[semestre-1]} {programa_detectado.nombre[:20]} Centro'
                            grupo, created = Grupo.objects.get_or_create(
                                programa=programa_detectado,
                                periodo=periodo,
                                semestre=semestre,
                                nombre=nombre_grupo,
                                defaults={'activo': True}
                            )
                else:
                    # Para horarios sin grupo específico, crear/usar un grupo general
                    grupo, created = Grupo.objects.get_or_create(
                        programa=programa_derecho,
                        periodo=periodo,
                        semestre=1,
                        nombre='I DERECHO GENERAL',
                        defaults={'activo': True}
                    )
                
                if not grupo:
                    errors.append(f'Grupo no creado: {grupo_nombre}')
                    skipped_count += 1
                    continue
                
                # Buscar el docente (puede ser null)
                docente = None
                if profesor_nombre.strip():
                    # Normalizar nombre para búsqueda
                    nombre_busqueda = profesor_nombre.strip().upper()
                    # Intentar búsqueda flexible
                    docente = Usuario.objects.filter(
                        nombre__icontains=nombre_busqueda
                    ).first()
                    
                    if not docente:
                        # Intentar con partes del nombre
                        partes = nombre_busqueda.split()
                        if len(partes) >= 2:
                            docente = Usuario.objects.filter(
                                nombre__icontains=partes[0]
                            ).filter(
                                nombre__icontains=partes[-1]
                            ).first()
                
                # Buscar o crear el espacio físico
                espacio_normalizado = espacio_nombre.strip()
                espacio = EspacioFisico.objects.filter(
                    nombre__iexact=espacio_normalizado,
                    sede=sede_centro
                ).first()
                
                if not espacio:
                    # Intentar búsqueda parcial
                    espacio = EspacioFisico.objects.filter(
                        nombre__icontains=espacio_normalizado.split()[0],
                        sede=sede_centro
                    ).first()
                    
                if not espacio:
                    # Crear el espacio si no existe
                    try:
                        espacio = EspacioFisico.objects.create(
                            nombre=espacio_normalizado,
                            sede=sede_centro,
                            tipo=tipo_aula,
                            capacidad=30,  # Capacidad por defecto
                            estado='Disponible'
                        )
                    except Exception as e:
                        errors.append(f'No se pudo crear espacio {espacio_nombre}: {str(e)}')
                        skipped_count += 1
                        continue
                
                # Normalizar día
                dia_normalizado = dias_map.get(dia.upper().strip(), dia.strip())
                
                # Convertir horas
                hora_inicio = time.fromisoformat(hora_inicio_str)
                hora_fin = time.fromisoformat(hora_fin_str)
                
                # Crear el horario (sin validación de conflictos durante seed)
                horario, created = Horario.objects.get_or_create(
                    grupo=grupo,
                    asignatura=asignatura,
                    dia_semana=dia_normalizado,
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin,
                    espacio=espacio,
                    defaults={
                        'docente': docente,
                        'estado': 'aprobado'
                    }
                )
                
                # Si ya existía pero está pendiente, actualizarlo a aprobado
                if not created and horario.estado == 'pendiente':
                    horario.estado = 'aprobado'
                    horario.save()
                
                if created:
                    created_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                errors.append(f'Error en {materia_nombre}: {str(e)}')
                skipped_count += 1
        
        total = len(horarios_data)
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} horarios creados, {skipped_count} omitidos ({total} totales)'))
        
        if errors:
            self.stdout.write(self.style.WARNING(f'\n    Errores encontrados ({len(errors)}):'))
            for error in errors[:20]:  # Mostrar los primeros 20 errores
                self.stdout.write(self.style.WARNING(f'      • {error}'))
            if len(errors) > 20:
                self.stdout.write(self.style.WARNING(f'      ... y {len(errors) - 20} errores más'))
        
        # Reconectar la validación de horarios
        pre_save.connect(validar_horario, sender=Horario)
    
    def create_horarios_sede_principal(self):
        """Crear horarios para la sede principal"""
        self.stdout.write('  → Creando horarios sede principal...')
        
        # Desconectar temporalmente la validación de horarios durante el seed
        from django.db.models.signals import pre_save
        from horario.signals import validar_horario
        pre_save.disconnect(validar_horario, sender=Horario)
        
        # Mapeo de días en español a formato consistente
        dias_map = {
            'LUNES': 'Lunes',
            'MARTES': 'Martes',
            'MIÉRCOLES': 'Miércoles',
            'MIERCOLES': 'Miércoles',
            'JUEVES': 'Jueves',
            'VIERNES': 'Viernes',
            'SÁBADO': 'Sábado',
            'SABADO': 'Sábado',
            'DOMINGO': 'Domingo'
        }
        
        # Formato: (grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio)
        horarios_data = [
            ('1 semestre grupo B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'JUEVES', '10:00:00', '11:00:00', 'SALON TORREON 2'),
            ('1 semestre grupo B', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 101B (100'),
            ('1 semestre grupo B', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 101B (100'),
            ('1 semestre grupo B', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'JUEVES', '08:00:00', '09:00:00', 'SALON TORREON 2'),
            ('1 semestre grupo C', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 101B (100'),
            ('1 semestre grupo C', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 106B (100'),
            ('1 semestre grupo C', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 101B (100'),
            ('1 semestre grupo C', 'TEORÍA ECONÓMICA', 'GUILLERMO DE LA HOZ', 'MARTES', '06:00:00', '07:00:00', 'SALÓN 106B (100'),
            ('1 semestre grupo D', 'ELECTIVA I COMPETENCIA Y CULTURA CIUDADANA', 'YADIRA GARCÍA', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 205B (50'),
            ('1 semestre grupo D', 'HABILIDADES COMUNICATIVAS', 'CLAUDIA VIZCAÍNO', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALÓN 103B (50'),
            ('1 semestre grupo D', 'HISTORIA DE LA FILOSOFÍA', 'CRISTÓBAL ARTETA', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 302B (50'),
            ('1 semestre grupo D', 'INTRODUCCIÓN AL DERECHO', 'OONA HERNÁNDEZ', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALÓN 104B (50'),
            ('1 semestre grupo D', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 302B (50'),
            ('1 semestre grupo D', 'TEORÍA DEL ESTADO', 'LINDA NADER', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 205B (50'),
            ('2 semestre grupo A', 'ECONOMÍA COLOMBIANA', 'GUILLERMO DE LA HOZ', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 203B (50'),
            ('2 semestre grupo A', 'ELECTIVA II ESTRUCTURA COMUNICATIVA DEL TEXO ESCRITO', 'SANDRA VILLA', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 308B (100'),
            ('2 semestre grupo A', 'TEORÍA DE LA CONSTITUCIÓN', 'GRETTY PAVLOVICH', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALÓN 308B (100'),
            ('2 semestre grupo A', 'TEORÍA DE LA CONSTITUCIÓN', 'GRETTY PAVLOVICH', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 306B (100'),
            ('2 semestre grupo A', 'ÉTICA I', 'CRISTÓBAL ARTETA RIPOLL', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 101B (100'),
            ('2. Semestre grupo B', 'CIVIL GENERAL Y PERSONAS', 'BEATRIZ TOVAR', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN TORREON 1'),
            ('2. Semestre grupo B', 'CIVIL GENERAL Y PERSONAS', 'BEATRIZ TOVAR', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo B', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 101B (100'),
            ('3 Semestre grupo B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN TORREON 2'),
            ('3 Semestre grupo B', 'TEORÍA DEL DELITO', 'JOHN BUITRAGO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo B', 'TEORÍA DEL DELITO', 'JOHN BUITRAGO', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo C', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'LUNES', '06:00:00', '07:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo C', 'CONSTITUCIONAL COLOMBIANO', 'Sin profesor especificado', 'MARTES', '06:00:00', '07:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo C', 'ELECTIVA III COMPRENSIÓN LECTORA', 'CLAUDIA VIZCAÍNO', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN 106B (100'),
            ('3 Semestre grupo C', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'MARTES', '10:00:00', '11:00:00', 'SALÓN TORREON 1'),
            ('3 Semestre grupo C', 'TEORÍA DEL DELITO', 'CARLOS JIMÉNEZ', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 106B (100'),
            ('3 semestre grupo AB', 'ELECTIVA III  3AB', 'COMPRENSIÓN LECTORA', 'MIÉRCOLES', '06:00:00', '07:00:00', 'SALÓN 308B (100'),
            ('3 semestre grupo AD', 'INVESTIGACIÓN I 3AD', 'ALEJANDRO BLANCO', 'JUEVES', '06:00:00', '07:00:00', 'SALON 205NB'),
            ('3 semestre grupo B', 'INVESTIGACIÓN I', 'PATRICIA MORRIS', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN 101B (100'),
            ('3 semestre grupo D', 'CONSTITUCIONAL COLOMBIANO', 'GRETTY PÁVLOVICH', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 101B (100'),
            ('3 semestre grupo D', 'CONSTITUCIONAL COLOMBIANO', 'GRETTY PÁVLOVICH', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 103B (50'),
            ('3 semestre grupo D', 'ELECTIVA III COMPRENSIÓN LECTORA', 'CLAUDIA VIZCAÍNO', 'MARTES', '06:00:00', '07:00:00', 'SALON 101B'),
            ('3 semestre grupo D', 'LÓGICA JURÍDICA', 'YADIRA GARCÍA', 'MARTES', '09:00:00', '10:00:00', 'SALON 302A'),
            ('3 semestre grupo D', 'TEORÍA DEL DELITO', 'LUIS CASTILLO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALON TORREON 2'),
            ('3 semestre grupo D', 'TEORÍA DEL DELITO', 'LUIS CASTILLO', 'JUEVES', '13:00:00', '14:00:00', 'SALON TORREON 2'),
            ('302A / V MEDICINA - GB', 'Parasitología  Teoría', 'TULIO DÍAZ', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALÓN 302A (100'),
            ('303A / V MEDICINA - GA', 'Parasitología  Teoría', 'TULIO DÍAZ', 'MARTES', '17:00:00', '18:00:00', 'SALÓN 303A (100'),
            ('5 Semestre Grupo C', 'INVESTIGACIÓN III', 'CLAUDIA VIZCAÍNO', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 307B (100'),
            ('5 Semestre grupo B', 'ELECTIVA V CONFLICTOS CONTEMPORÁNEOS', 'RAFAEL RODRÍGUEZ', 'VIERNES', '06:00:00', '07:00:00', 'SALÓN 106B (100'),
            ('5 Semestre grupo C', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 102B'),
            ('5 Semestre grupo C', 'INVESTIGACIÓN III', 'CLAUDIA VIZCAÍNO', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 102B'),
            ('5 semestre grupo B', 'DERECHO INTERNACIONAL PRIVADO', 'JUAN CARLOS DE LOS RÍOS', 'VIERNES', '09:00:00', '10:00:00', 'SALON 516 NB'),
            ('5 semestre grupo C', 'ADMINISTRATIVO GENERAL', 'JAIME BERMEJO', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 102B (50'),
            ('7 semestre grupo A', 'TITULOS VALORES', 'SANDRA VILLA', 'MARTES', '06:00:00', '07:00:00', 'SALÓN 308B (100'),
            ('7 semestre grupo A', 'TITULOS VALORES', 'SANDRA VILLA', 'JUEVES', '06:00:00', '07:00:00', 'SALÓN 304B (50'),
            ('7 semestre grupo B', 'CRIMINOLOGÍA Y POLÍTICA CRIMINAL', 'GONZALO AGUILAR', 'MIÉRCOLES', '10:00:00', '11:00:00', 'SALON 107B'),
            ('7 semestre grupo B', 'FILOSOFÍA DEL DERECHO', 'CRISTÓBAL ARTETA', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALON 107B'),
            ('I MEDICINA  - GA', 'Biologia Teoria', 'Yosed Anaya', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 308B (100'),
            ('I MEDICINA - B', 'Biologia Teoria', 'Yosed Anaya', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 303B (50'),
            ('I MEDICINA - GA', 'Bioestadística y Demografía', 'Sergio Nieves Vanegas', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 103B (50'),
            ('I MEDICINA - GA', 'Biología Teoría', 'Juan David Rodriguez/Yosed Anaya', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 304B (50'),
            ('I MEDICINA - GA', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 101B (100'),
            ('I MEDICINA - GA', 'Integracion basico', 'clinica. Quimica-Bioquimica', 'VIERNES', '07:00:00', '08:00:00', 'SALON 205B'),
            ('I MEDICINA - GA', 'Química Teoría', 'ALEJANDRA ZAMBRANO', 'VIERNES', '10:00:00', '11:00:00', 'SALÓN 308B (100'),
            ('I MEDICINA - GA', 'Socio-Antropología', 'VIRGINIA SIRTORI', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 308B (100'),
            ('I MEDICINA - GB', 'Bioestadística y Demografía', 'Adalgisa Alcocer', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 302A (100'),
            ('I MEDICINA - GB', 'Biologia Teoria', 'Juan David Rodriguez/Alberto Moreno', 'MARTES', '15:00:00', '16:00:00', 'SALON TORREON 2'),
            ('I MEDICINA - GB', 'Biología Teoría', 'Juan David Rodriguez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'TORREON 2'),
            ('I MEDICINA - GB', 'Electiva de formación integral:', 'Expresión Oral y Escrita', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 102B (50'),
            ('I MEDICINA - GB', 'Historia de la Medicina', 'Enrique Fonseca', 'MIÉRCOLES', '09:00:00', '10:00:00', 'TORREON 2'),
            ('I MEDICINA - GB', 'Integracion basico-clinica. Quimica-Bioquimica', 'ALEJANDRA ZAMBRANO', 'MIÉRCOLES', '12:00:00', '13:00:00', 'SALÓN 308B (100'),
            ('I MEDICINA - GB', 'Química Teoría', 'ALEJANDRA ZAMBRANO', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 307B (100'),
            ('I MEDICINA - GB', 'Socio-Antropología', 'VIRGINIA SIRTORI', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 102B (50'),
            ('I MEDICINA GA', 'BIOFISICA TEORIA', 'Ismael Piñeres', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 101B (100'),
            ('I MEDICINA GB', 'BIOFISICA TEORIA', 'Ismael Piñeres', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 303A (100'),
            ('I MEDICINA-GA', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '10:00:00', '11:00:00', 'SALON 308B'),
            ('II MEDICINA', 'ELECTIVA INSTITUCIONAL COMPLEMENTARIA', 'Comunicación escrita 307B', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 307B (100'),
            ('II MEDICINA', 'Electiva  complementaria 1 : Inteligencia emocional', '104B', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 104B (50'),
            ('II MEDICINA - GA', 'BIOQUIMICA', 'Alejandra Zambrano', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 106B (100'),
            ('II MEDICINA - GA', 'Bioquimica', 'ISMAEL LIZARAZU', 'LUNES', '17:00:00', '18:00:00', 'SALÓN 302A (100'),
            ('II MEDICINA - GA', 'Bioquimica ISMAEL LIZARAZU, ALEJANDRA ZAMBRANO', 'Sin profesor especificado', 'JUEVES', '16:00:00', '17:00:00', 'TORREON 1'),
            ('II MEDICINA - GA', 'Bioquimica _x000D_', 'ISMAEL LIZARAZU_x000D_', 'MARTES', '16:00:00', '17:00:00', 'TORREON 2'),
            ('II MEDICINA - GA', 'Metodología de la Investigación', 'G. DE LA HOZ', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 306B (100'),
            ('II MEDICINA - GA', 'Morfología I: Anatomia', 'Dr. Aroldo Padillo', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 302A (100'),
            ('II MEDICINA - GA', 'Morfología I: Histología Teoría', 'Waldy  Ahumada', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 303A (100'),
            ('II MEDICINA - GA y GB', 'Morfología I: Embriología', 'Jaime Navarro', 'LUNES', '12:00:00', '13:00:00', 'SALÓN 303A (100'),
            ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'LUNES', '18:00:00', '19:00:00', 'SALÓN 302A (100'),
            ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'MIÉRCOLES', '16:00:00', '17:00:00', 'TORREON 1'),
            ('II MEDICINA - GB', 'Bioquimica', 'ISMAEL LIZARAZU', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 308B (100'),
            ('II MEDICINA - GB', 'Metodología de la Investigación', 'ELVIRA CRESPO', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 302A (100'),
            ('II MEDICINA - GB', 'Metodología de la Investigación ELVIRA CRESPO', '302A', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 306B (100'),
            ('II MEDICINA - GB', 'Metodología de la Investigación ELVIRA CRESPO', '302A', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 302A (100'),
            ('II MEDICINA - GB', 'Morfología I: Anatomia', 'GILBERTO BARRIOS', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 308B (100'),
            ('II MEDICINA - GB', 'Morfología I: Histología Teoría', 'Waldy  Ahumada', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 303A (100'),
            ('II MEDICINA GA', 'Metodología de la Investigación', 'Ronald Maestre', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 303A (100'),
            ('II MEDICINA/I Y II MICROBIOLOGIA//II BACTERIOLOGIA', 'Electiva de formación integral:', 'Redacción de Textos Científicos', 'MIÉRCOLES', '11:00:00', '12:00:00', 'TORREON 2'),
            ('II MEDICINA/II FISIOTERAPIA/II MICROBIOLOGIA/III INSTRUMENTACION', 'Electiva de formación integral:', 'Comunicación No verbal', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 306B (100'),
            ('II Medicina', 'Electiva Cuidados Basicos', 'Salón  104B', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 104B (50'),
            ('III MEDICINA', 'Electiva  complementaria 2: Inteligencia emocional', 'Gustavo De La Hoz', 'VIERNES', '13:00:00', '14:00:00', 'SALÓN 203B (50'),
            ('III MEDICINA', 'Electiva:  Ingles I', 'Yesenia Valarezo', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 102B (50'),
            ('III MEDICINA - GA', 'Biología Molecular  Teoría', 'Christian Cadena', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 308B (100'),
            ('III MEDICINA - GA', 'Biología molecular', 'Christian Cadena', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 306B (100'),
            ('III MEDICINA - GA', 'Morfología II: Anatomia AROLDO PADILLA', '307B', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 307B (100'),
            ('III MEDICINA - GA', 'Morfología II: Histología Teoría', 'Waldy Ahumada', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALÓN 307B (100'),
            ('III MEDICINA - GA', 'Morfología II: Histología Teoría', 'Waldy Ahumada', 'VIERNES', '15:00:00', '16:00:00', 'SALÓN 302A (100'),
            ('III MEDICINA - GA', 'Psicología del Desarrollo', 'Mily Ardila', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 307B (100'),
            ('III MEDICINA - GA', 'Psicología del Desarrollo', 'Mily Ardila', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 303A (100'),
            ('III MEDICINA - GA', 'Salud Familiar  Teoría', 'Sin profesor especificado', 'JUEVES', '07:00:00', '08:00:00', 'SALON 303A'),
            ('III MEDICINA - GA', 'Salud Familiar áTeoría', '307B', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 307B (100'),
            ('III MEDICINA - GA y GB', 'Modulo basico- clinica Embiologia .', 'Jaime Navarro JLM', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 303A (100'),
            ('III MEDICINA - GB', 'Biología molecular', 'Christian Cadena', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 304B (50'),
            ('III MEDICINA - GB', 'Biología molecular', 'Christian Cadena', 'VIERNES', '10:00:00', '11:00:00', 'SALÓN 303B (50'),
            ('III MEDICINA - GB', 'Morfología II: Teoría', 'AROLDO PADILLA', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 308B (100'),
            ('III MEDICINA - GB', 'Psicología del Desarrollo                                                                                      Virginia Sirtori', '107B', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 107B (50'),
            ('III MEDICINA - GB', 'Salud Familiar  Teoría', '308B', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 308B (100'),
            ('III MEDICINA - GB', 'Salud Familiar áTeoría', '306B', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 306B (100'),
            ('III MEDICINA/I Y III MICROBIOLOGIA /BACTERIOLOGIA III/instrumentacion III/VIII FISIOTERAPIA', 'Emprendimiento e Innovacion', 'Luis Carlos Rodriguez', 'MARTES', '17:00:00', '18:00:00', 'SALA COMPUTO 202B (40'),
            ('III MEDICINA/III BACTERIOLOGIA', 'Electiva de formación integral:    Lectura Critica', 'Marina Hernandez', 'VIERNES', '08:00:00', '09:00:00', 'SALÓN 308B (100'),
            ('III MEDICINA/III INSTRUMENTACION/III BACTERIOLOGIA/III MICROBIOLOGIA', 'Electiva de formación integral: Texto y Cultura', 'LUZ M. SILVERA', 'VIERNES', '13:00:00', '14:00:00', 'SALÓN 302A (100'),
            ('III MEDICINA/III MICROBIOLOGIA', 'Electiva de formación integral: Lectura Critica', 'Luz Marina Silvera', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 303A (100'),
            ('III MEDICINA/III Y IV MICROBIOLOGIA/III BACTERIOLOGIA/III INSTRUMENTACIÓN', 'Electiva:  Ingles II', '102B', 'VIERNES', '13:00:00', '14:00:00', 'SALÓN 102B (50'),
            ('III MEDICINA/IV FISIOTERAPIA/III INSTRUMENTACION/III MICROBIOLOGIA/III Y IV BACTERIOLOGIA', 'Electiva de formación integral:', 'Innovacion Social', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 106B (100'),
            ('III Semestre BacterioplogÍa y MICROBIOLOGÍA', 'Genética', 'Teoría/Genética Básica y', 'LUNES', '10:00:00', '11:00:00', 'SALÓN 106B (100'),
            ('IV MEDICINA', 'Electiva : áComunicación, Liderazgo y Trabajo en Equipo', 'Cecilia Arciniegas', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 302B (50'),
            ('IV MEDICINA', 'Electiva de Formación Integral: Responsabilidad Social y Empresarial', '306B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA', 'Electiva:  Ingles III', 'YESENIA VALAREZO', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 304B (50'),
            ('IV MEDICINA - GA', 'Epidemiología Básica', 'Eduardo Navarro', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GA', 'Epidemiología Básica.', 'Eduardo Navarro', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 106B (100'),
            ('IV MEDICINA - GA', 'Fisiología Taller', '307B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 307B (100'),
            ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GA', 'Fisiología Teoría', 'Simon Bolivar', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 308B (100'),
            ('IV MEDICINA - GA', 'Inmunología Teoría', 'FRANKLIN TORRES', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GA', 'Salud Familiar II', '302A', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 302A (100'),
            ('IV MEDICINA - GA', 'Salud Familiar II Teoría', '308B', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 308B (100'),
            ('IV MEDICINA - GB', 'Epidemiología Básica', 'Eduardo Navarro', 'VIERNES', '16:00:00', '17:00:00', 'SALÓN 106B (100'),
            ('IV MEDICINA - GB', 'Epidemiología Básica.', 'Eduardo Navarro', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GB', 'Fisiología Taller', '303A', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 303A (100'),
            ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 302A (100'),
            ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GB', 'Fisiología Teoría', '302A', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 308B (100'),
            ('IV MEDICINA - GB', 'Inmunología Teoría', 'FRANKLIN TORRES', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 306B (100'),
            ('IV MEDICINA - GB', 'SALUD FAMILIAR II', '302A', 'LUNES', '10:00:00', '11:00:00', 'SALÓN 302A (100'),
            ('IV MEDICINA - GB', 'SALUD FAMILIAR II  TEORIA', '303A', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 303A (100'),
            ('IV MEDICINA GB', 'Electiva: Razonamiento cuantitativo', 'JOSE JINETE', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 308B (100'),
            ('IV MEDICINA/III INSTRUMENTACION/VIII FISIOTERAPIA/IV BACTERIOLOGÍA', 'Electiva:Competencias informacionales y digitales', 'Luis Carlos Rodriguez', 'MARTES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B (40'),
            ('IV MEDICINA/IV FISIOTERAPIA/', 'Electiva:Razonamiento Cuantitativo', 'Jose Jinete', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 206B (50'),
            ('IV MEDICINA/VI FISIOTERAPIA/', 'Electiva: Competencia Ciudadana', 'Luz Marina Silvera', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 308B (100'),
            ('IX MEDICINA', 'Proyecto de Grado  teoría', 'GUSTAVO DE LA HOZ - Primer Corte', 'MIÉRCOLES', '14:00:00', '15:00:00', 'TORREON 1 (130'),
            ('MEDICINA I - GA', 'Bioestadística y Demografía Taller', 'Sergio Nieves Vanegas', 'JUEVES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA I - GA', 'Bioestadística y Demografía Taller', 'Sergio Nieves Vanegas', 'JUEVES', '11:00:00', '12:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA I - GB', 'Bioestadística y Demografía', '202B', 'LUNES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA I - GB', 'Bioestadística y Demografía', '202B', 'VIERNES', '10:00:00', '11:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA II', 'Electiva de formación integral: Inteligencia Artificial', 'Luis Carlos Rodriguez', 'VIERNES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA II - GA', 'Metodología de la Investigación', 'Ronald Maestre', 'MARTES', '10:00:00', '11:00:00', 'SALÓN 103B (50'),
            ('MEDICINA II - GA', 'Taller Bioqca  A1', 'L. Banderas', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 204B (50'),
            ('MEDICINA II - GA', 'Taller Bioqca  A1', 'L. Banderas', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 306B (100'),
            ('MEDICINA II - GB', 'TALLER BIOQUIMICA A1', 'L. Banderas', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 103B (50'),
            ('MEDICINA II - GB', 'TALLER BIOQUIMICA B2', 'L. Banderas', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B (40'),
            ('MEDICINA II - GB', 'Taller Bioqca  B3 Doc de bioqca', 'L. Banderas', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', '"Modalidad: SEMESTRAL', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', '"Salud y Ambiente/Electiva de profundización B', 'D: Liliana Carranza', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', '*CONTROL DE INFECCIÓN Y PROMOCIÓN DE LA SALUD:', 'Bryan Domínguez', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Administración', '102B', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Administración', '102B', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Administración 1', 'Lorena Herera', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Administración II Teoría', 'Norka Márquez', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Administración en servicios de salud G1', 'Lucy Bula', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Administración en servicios de salud G1', 'Lucy Bula', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Administración y SSS', 'D: Leidy Goenaga', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Análisis Físico-Químico', 'Mario Peña', 'LUNES', '10:00:00', '11:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Análisis Matemático y Estadístico', 'Javier Duran', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Bacteriología Clínica Teoría', 'Gisell diFilippo', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Bioestadística', '105B', 'LUNES', '12:00:00', '13:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Bioestadística', '105B', 'LUNES', '09:00:00', '10:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Bioestadística', '105B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Bioestadística', '105B', 'JUEVES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Biofisica', 'MATIAS PUELLO', 'JUEVES', '15:00:00', '16:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Biofísica', 'Matías Puello', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Biofísica Teoría G1', 'Matías Puello', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Bioinformática', '202B', 'VIERNES', '07:00:00', '08:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Biologia molecular', 'Arleth Lopez', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Biologia molecular', 'Arleth Lopez', 'JUEVES', '10:00:00', '11:00:00', 'SALON 204B'),
            ('Sin grupo especificado', 'Biología', 'G1. Alberto Moreno', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Biología Molecular Teoría', 'D: Arleth López', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Biología Teoría', 'Yosed Anaya', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Biología de los Microorganismos', 'María Rosa Baldovino', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Biología teoría', 'Evelyn Mendoza', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Biomecánica', 'GB', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Biomecánica', 'GB', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Biomecánica', 'GB', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Biomecánica GB', 'Gladys Helena Gutierrez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Biomecánica teoría', 'GA', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Bioquímica', 'Mario Mutis', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Bioquímica Microbiana Teoría', 'Juan David Sanchez', 'LUNES', '06:00:00', '07:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Bioquímica Teoría', 'Pierine España', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Biotecnología Teoría', 'Mario Peña', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Biotecnología Teoría', 'Mario Peña', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'CALIDAD EN SERVICIOS DE SALUD', 'María Inés López', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'CONTROL DE INFECCIÓN: Angelica Corcho-', 'Sin profesor especificado', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALON 306B'),
            ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'MARTES', '08:00:00', '09:00:00', 'TORREON 2'),
            ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'MIÉRCOLES', '08:00:00', '09:00:00', 'SALÓN 106B (100'),
            ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'JUEVES', '08:00:00', '09:00:00', 'SALÓN 306B (100'),
            ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'VIERNES', '08:00:00', '09:00:00', 'SALÓN 101B (100'),
            ('Sin grupo especificado', 'CURSO PREMEDICO', 'QUIMICA TEORIA', 'VIERNES', '13:00:00', '14:00:00', 'SALÓN 101B (100'),
            ('Sin grupo especificado', 'Calidad Microbiológica y Sanitaria en productos de Consumo - Teoría', '105B', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Cinesiopatología G1', 'Yadira Barrios', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Competencia Comunicativas II', 'Marina Hernández', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Competencias Comunicativas I', 'Cecilia Arciniegas', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Comunicación, Liderazgo y Trabajo en Equipo', 'Cecilia Arciniegas', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Constitución Nacional', 'Elvis Ruiz', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Constitución Política', 'D: Bibiana Sierra', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Constitución política G1', '303B', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Control de la Infección y Promoción de la Salud', 'Arleth Cataño', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Control y aprendizaje motor G1', 'Yoly Yepes', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Cuidados Básicos en Salud Teoría', 'María Amador', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Cálculo', 'Javier Duran', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Cálculo', 'Javier Duran', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Discapacidad G1', 'Yoly Yepes', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'ELECTIVA DE PROFUNDIZACIÓN I', 'CALIDAD EN SERVICIO DE SALUD', 'MARTES', '14:00:00', '15:00:00', 'SALON 105B'),
            ('Sin grupo especificado', 'ELECTIVA INSTITUCIONAL û COMPLEMENTARIA', 'Texto y cultura', 'VIERNES', '13:00:00', '14:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Ecología Microbiana', 'Beatriz Barraza', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Electiva de Profundización II: Estilos de vida saludable y MCH', 'LESLIE MONTEALEGRE', 'LUNES', '09:00:00', '10:00:00', 'SALON 201B'),
            ('Sin grupo especificado', 'Electiva de profundización (A):', 'Enfermedades Transmitidas por Vectores', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable', 'Luisa Galeano (TC)', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable', 'Luisa Galeano (TC)', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALON 202B'),
            ('Sin grupo especificado', 'Electiva de profundización I: Estilos de vida saludable y MCH', 'Leslie Montealegre', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: FT. Cardiopulmonar', 'Tammy Pulido (CAT)', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: FT. Cardiopulmonar', 'Tammy Pulido (CAT)', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: Fisioterapia en enfermedades crónicas', 'Laura Ardila', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: Fisioterapia en enfermedades crónicas - Laura Ardila', 'salón 305B', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: SST', 'Karol Cervantes', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Electiva de profundización I: SST', 'Karol Cervantes', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: Motricidad', 'Eulalia Amador', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: Motricidad', 'Eulalia Amador', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: conexión mental', 'Mónica Gómez', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: conexión mental', 'Mónica Gómez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: enfermedades crónicas y MCH', 'Sindy Ariza', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Electiva de profundización II: estilos de vida saludable y MCH', 'Roberto Rebolledo', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 106B (100'),
            ('Sin grupo especificado', 'Electiva de profundización II: estilos de vida saludable y MCH', 'Roberto Rebolledo', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Electiva:  Inglés Avanzado', '103B', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Electiva:  Inglés Basic', '102B', 'VIERNES', '15:00:00', '16:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Electiva:  Inglés II', '103B', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Electiva: Comunicación, Liderazgo y Trabajo en Equipo', '204B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Electiva: Ingles Avanzado III', 'Salón  103B', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Electivas de formación integral III', 'Cuidado Básico en Salud Noris Álvarez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Empresarismo y Emprendimiento', 'Luis Carlos Rodriguez', 'JUEVES', '15:00:00', '16:00:00', 'SALON 202B'),
            ('Sin grupo especificado', 'Epidemiología', 'Adalgiza', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Epidemiología G1', 'Laura Ardila', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Epistemología de las ciencias G1', 'Karol Cervantes', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Evaluación y Diagnóstico                 GA', 'Roberto Rebolledo', 'LUNES', '12:00:00', '13:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Evaluación y Diagnóstico (práctica) GA Roberto Rebolledo', '104B', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Evaluación y Diagnóstico GB', 'Julia Andrade', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Expresión Oral y Escrita', 'Marina Hernandez', 'LUNES', '08:00:00', '09:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'FARMACOLOGIA Y TOXICOLOGIA VII. LILIANA CARRANZA', 'Salón 107B', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Farmacología en Ft', 'Luisa Galeano', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Farmacología en Ft. G1', 'Luisa Galeano', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALÓN 105B', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Farmacología y Anestesia', 'SALÓN 105B', 'JUEVES', '10:00:00', '11:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Fisiología Animal y Vegetal Arleth Lopez', 'Salón 206B', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Fisiología del Ejercicio (practica) GB', '303B', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Fisiología del Ejercicio GA', 'Raúl Polo', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Fisiología del Ejercicio grupo B', 'Sindy Ariza', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Fisiología del Ejercicio grupo GA', 'Raul Polo', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Fisiopatología Humana / Morfosi ología Humana', 'Gladys Gutierrez', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Fundamentos de Psicología', 'Mily Ardila', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Fundamentos en el Análisis y Redacción de Textos G1', 'Luz Marina Silvera', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Hematología Clínica', 'Lady Goenaga', 'JUEVES', '12:00:00', '13:00:00', 'SALON 204B'),
            ('Sin grupo especificado', 'Hematología Teoria', 'Christian Cadenas', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Historia de la Ciencia y la Microbiología.', 'Juan David Sánchez', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Inmunohematología Teoría', 'Goenaga', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Inmunologia Teoria', 'Yosed Anaya', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Inmunología Clinica Teoria', 'Franklin Torres', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Innovación y tecnología TEORIA', 'Lorena Herrera- Coordinadora asignatura', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l', 'GA', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALON 203B'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l GA', 'Lucy Bula', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l GA', 'Lucy Bula', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Intervención en Fisioterapia l GB', 'Nobis de la Cruz', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Intervención en Ft II', 'Yadira Barrios', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Intervención en Ft II', 'Yadira Barrios', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Intervención en Ft II GA', 'GA 205B', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Intervención en fisioterapia III', 'GA', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Intervención en fisioterapia III', 'GA', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Intervención en fisioterapia III GA', 'Salón 304B', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Intervención en fisioterapia III GA Jennifer Barrios', '302B', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Intervención en fisioterapia III GB', 'Jennifer Barrios', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Introducción a la Fisioterapia', 'Yadira Barrios', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Introducción a la Fisioterapia G1', 'Yadira Barrios', 'JUEVES', '11:00:00', '12:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Introducción a la instrumentación', 'María Amador', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Introducción a las ciencias ómicas                                 D: Cristian Cadena', 'Salón: 104B', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Investigación Clínica Epidemiológica', 'Bryan Domínguez', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Lógica Matemática', 'Sergio Nieves', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Lógica Matemática G1', 'José Jinete', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Metodología', 'de la Investigación', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 106B (100'),
            ('Sin grupo especificado', 'Metodología de la investigación', 'Cecilia Arciniegas', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Metodología de la investigación   G1', 'Laura Ardila', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Micología teoría', 'Gloria Muñoz', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Microbiología', 'Jaime Lordouy', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Microbiología Ambiental Teoría', 'Mario Peña', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Microbiología General Teoría', 'José Luis Villarreal', 'VIERNES', '10:00:00', '11:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Microbiología Industrial', 'Marianella  Suárez', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Microbiología Teoría', 'Wendy Rosales', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Microbiología Teoría', 'Wendy Rosales', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Microbiología de Alimentos', 'Marianela Suárez', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Microbiología de suelos', 'Beatriz Barraza', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Microbiología predictiva', 'Juan David Sanchez', 'JUEVES', '15:00:00', '16:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Modalidad: Semestral', 'Step 2', 'VIERNES', '14:00:00', '15:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Modalidades Físicas', 'GA', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Modalidades Físicas', 'GA', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Modalidades Físicas GA', 'Lina Chavez', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Morfo fisiología I Práctica- Anfiteatro', 'Gladys Helena Ríos', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Morfo fisiología I Teoría', 'Gladys Helena Ríos', 'LUNES', '15:00:00', '16:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Morfo fisiología II- Teoría', 'Tatiana Gómez', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Morfo fisiología l (Práctica)', 'GB', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Morfo fisiología ll (teoría) G1', '303B', 'LUNES', '13:00:00', '14:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Morfofisiología Humana II', 'D: Aroldo Padilla.', 'LUNES', '15:00:00', '16:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Morfofisiología l G1 (teoría)', 'Nobis De la Cruz', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Neurociencias del Movimiento G1', 'Eulalia Amador', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Ocupación y movimiento corporal G1', 'Martha Mendihueta', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Optativa A: Introducción a la ciencia de datos', '202B', 'MARTES', '13:00:00', '14:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Optativa A: Micología Avanzada', 'Gloria Muñoz', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Optativa B: Bioprospectuón', 'Caludia Tapia', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Optativa C: Fitopatologia y control Biologico', 'Mario Peña', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Optativa I Parasitología Veterinaria', '105B', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Optativa II: Diagnóstico Forense                         D: Miriam Linero', 'Salón: 303B', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Optativa II: Gestión de residuos hospitalarios', 'D: Liliana Carranza', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'PRACTICA HOSPITALARIA III', 'SEMINARIO TEORICO PRACTICO', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'PRACTICA SALUD PUBLICA PROYECCIÓN COMUNITARIA û Teoría', 'Bryan Domínguez', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'PRÁCTICA HOSPITALARIA IV', 'SEMINARIO TEORICO PRACTICO', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Parasitología Clínica', 'Christian Cadena', 'VIERNES', '08:00:00', '09:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Patología Básica', 'Richard Zambrano', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Patología Teoría', 'Richard Zambrano', 'JUEVES', '07:00:00', '08:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Prescripción del Ejercicio GA', 'Roberto Rebolledo', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Prescripción del Ejercicio GB', 'Raúl Polo', 'LUNES', '12:00:00', '13:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Prestamo Consejo Estudiantil de Medicina - CEM', '308B', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALÓN 308B (100'),
            ('Sin grupo especificado', 'Procesos Asépticos II', 'Teoría', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Procesos Industriales Teoría', 'Javier Duran', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Procesos Industriales Teoría / Javier Duran', 'Salón 104B', 'VIERNES', '15:00:00', '16:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Procesos Qcos Otorrino- Teoría', 'Tatiana Gómez', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Procesos Qcos en Cirugía Plástica', 'Leidy Gómez', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Procesos Qcos en Neurocirugía', 'Leidy Gómez', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Procesos Qcos en Ortopedia', 'Jainer Molina', 'MIÉRCOLES', '16:00:00', '17:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Procesos Qcos. Cirugía Plástica', 'Leidy Gómez', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Procesos Qcos. Cx. General y Pediatría GA', 'Arleth Cataño', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Procesos Qcos. Cx. General y Pediatría GA', 'Arleth Cataño', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Procesos Quirúrgico Urología(T)', 'Tatiana Gómez', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Procesos Quirúrgicos', 'en Oftalmología', 'LUNES', '15:00:00', '16:00:00', 'SALÓN 103B (50'),
            ('Sin grupo especificado', 'Procesos Quirúrgicos en Cardiovascular( C )', 'MARIA MARRIAGA - LORENA HERRERA', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Procesos asepticos I teoria', 'Maria Amador', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Propuesta de Investigación', 'Emilse Vásquez', 'MARTES', '07:00:00', '08:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Proyección a la comunidad TEORÍA D: Bryan Dominguéz Salón: 305B', 'VI BACTERIOLOGÍA', 'MIÉRCOLES', '07:00:00', '08:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Proyecto de Investigación I G1', '102B', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Proyecto de Investigación II', 'Laura Ardila (TC)', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 304B (50'),
            ('Sin grupo especificado', 'Proyecto de Investigación III', 'Lina Chavez', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MARTES', '17:00:00', '18:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Proyecto de investigación', 'Liliana Carranza', 'MIÉRCOLES', '11:00:00', '12:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Práctica Administrativa Teoría', 'Lorena Herrera', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Psicología Evolutiva G1', 'Salón 102B', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Quimica Clinica Teoria', 'Lady Goenaga', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Química Especial Teoría', 'Leidy Goenaga', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Química Teoría', 'Mario Mutis', 'LUNES', '12:00:00', '13:00:00', 'SALON TORREON 2'),
            ('Sin grupo especificado', 'Química Teoría', 'Mario Mutis', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 107B (50'),
            ('Sin grupo especificado', 'Salud Ocupacional - Teoría-Jainer Molina', '302B', 'VIERNES', '11:00:00', '12:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Salud PUBLICA', 'ANDERSON DIAZ', 'MARTES', '11:00:00', '12:00:00', 'SALON 307B'),
            ('Sin grupo especificado', 'Salud Publica II', 'Elvira Crespo', 'VIERNES', '08:00:00', '09:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Salud Pública G1', 'Lina chavez', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 302B (50'),
            ('Sin grupo especificado', 'Salud Pública G1', 'Lina chavez', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 303B (50'),
            ('Sin grupo especificado', 'Salud Pública I', 'Eduardo Navarro', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 102B (50'),
            ('Sin grupo especificado', 'Salud y Comunidad G1', 'Lina Chávez', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Seminario de integración Prácticas Formativas G1', '206B', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 206B (50'),
            ('Sin grupo especificado', 'Seminario de integración prácticas optativas', 'Yennifer Barrios', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Sistemas de Calidad', 'Maria Rosa Baldovino', 'JUEVES', '15:00:00', '16:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'Sociedad y sector salud teoría', 'Maria Amador', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Sociedad y sector salud y comunidad - teoría', 'Brayan Domínguez', 'MARTES', '08:00:00', '09:00:00', 'SALÓN 301B (50'),
            ('Sin grupo especificado', 'Socio antropología', 'Virginia Sirtori', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 105B (50'),
            ('Sin grupo especificado', 'SocioAnatropologia', 'Salón 305B', 'MARTES', '11:00:00', '12:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'TOXICOLOGIA', 'Claudia Tapia', 'LUNES', '12:00:00', '13:00:00', 'SALON 203B'),
            ('Sin grupo especificado', 'TOXICOLOGIA', 'Claudia Tapia', 'MARTES', '15:00:00', '16:00:00', 'SALON 301B'),
            ('Sin grupo especificado', 'Tecnicas Especiales Teoria', 'Claudia Tapia', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Trabajo de grado', 'Alfonso Rodriguez', 'VIERNES', '07:00:00', '08:00:00', 'SALÓN 305B (50'),
            ('Sin grupo especificado', 'Tutorias practicas', 'Sindy Ariza', 'MARTES', '14:00:00', '15:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Técnicas Especiales Teoría', 'Claudia Tapias', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 204B (50'),
            ('Sin grupo especificado', 'Virología Clínica', 'D: María Rosa Baldovino', 'VIERNES', '10:00:00', '11:00:00', 'SALÓN 205B (50'),
            ('Sin grupo especificado', 'Ética', 'Jose Luis Villareal', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 203B (50'),
            ('Sin grupo especificado', 'Ética Y Bioética', 'Anderson Diaz', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 104B (50'),
            ('Sin grupo especificado', 'Ética y Deontología', 'Stephanye Carrillo', 'MARTES', '08:00:00', '09:00:00', 'SALA COMPUTO 202B (40'),
            ('Sin grupo especificado', 'Ética y bioética G1', 'Gustavo de la Hoz', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 303B (50'),
            ('V MEDICINA - GA', 'ETICA', 'Esteffany Carrillo', 'JUEVES', '15:00:00', '16:00:00', 'SALÓN 303A (100'),
            ('V MEDICINA - GA', 'Farmacología Teoria', 'Elen Manrrique', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 303A (100'),
            ('V MEDICINA - GA', 'Micologia', 'Gloria Muñoz', 'LUNES', '13:00:00', '14:00:00', 'SALÓN 101B (100'),
            ('V MEDICINA - GA', 'Microbiología  teoría', 'Virologia. J. Villarreal', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 308B (100'),
            ('V MEDICINA - GA', 'Microbiología Teoría', 'Aracelys García', 'JUEVES', '13:00:00', '14:00:00', 'TORREON 1'),
            ('V MEDICINA - GA', 'Módulo farmacología', '303A', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 303A (100'),
            ('V MEDICINA - GA', 'Patologia Practica', '307B', 'MARTES', '09:00:00', '10:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GA', 'Patologia Practica', '307B', 'VIERNES', '09:00:00', '10:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GA', 'Patología ATENEO', 'Dra Bertiller', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 101B (100'),
            ('V MEDICINA - GB', 'ETICA', 'Esteffany Carrillo', 'JUEVES', '12:00:00', '13:00:00', 'SALÓN 303A (100'),
            ('V MEDICINA - GB', 'Farmacología Teoria', 'Elin Manrrique', 'LUNES', '15:00:00', '16:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GB', 'Micologia', 'Gloria Muñoz', 'LUNES', '11:00:00', '12:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GB', 'Microbiología Teoría', 'ARACELLY GARCÍA', 'MIÉRCOLES', '14:00:00', '15:00:00', 'SALÓN 302A (100'),
            ('V MEDICINA - GB', 'Microbiología VIROLOGIA Teoría J.Villarreal', '302A', 'MARTES', '15:00:00', '16:00:00', 'SALÓN 302A (100'),
            ('V MEDICINA - GB', 'Módulo farmacología', '302A', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 302A (100'),
            ('V MEDICINA - GB', 'Patologia Teoria', 'Sin profesor especificado', 'JUEVES', '09:00:00', '10:00:00', 'SALÓN 302A (100'),
            ('V MEDICINA - GB', 'Patologia Teoria', 'Sin profesor especificado', 'VIERNES', '09:00:00', '10:00:00', 'TORREON 1'),
            ('V MEDICINA - GB', 'Patología ATENEO', 'Dra Bertiller', 'LUNES', '13:00:00', '14:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GB', 'Patología Macro Práctica      GRUPOS A4-B4', '307B', 'LUNES', '09:00:00', '10:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA - GB', 'Patología Teoria', '307B', 'LUNES', '07:00:00', '08:00:00', 'SALÓN 307B (100'),
            ('V MEDICINA GA', 'Patología  Teoría', '306B', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 306B (100'),
            ('V Semestre Grupo D', 'TUTELA PENAL DE LOS BIENES JURÍDICOS II', 'LUIS CASTILLO', 'LUNES', '13:00:00', '14:00:00', 'SALÓN 104B (50'),
            ('V Semestre grupo D', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 206B (50'),
            ('V Semestre grupo D', 'HERMENÉUTICA JURÍDICA', 'PATRICIA MORRIS', 'JUEVES', '15:00:00', '16:00:00', 'SALÓN 302B (50'),
            ('VI MEDICINA - GA', 'Bioética', 'Anderson Diaz', 'JUEVES', '14:00:00', '15:00:00', 'SALÓN 307B (100'),
            ('VI MEDICINA - GA', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'LUNES', '14:00:00', '15:00:00', 'SALÓN 106B (100'),
            ('VI MEDICINA - GA', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 303A (100'),
            ('VI MEDICINA - GA', 'Farmacología y Toxicología Teoría', 'G. Sarmiento/J. Navarro', 'MARTES', '13:00:00', '14:00:00', 'SALÓN 306B (100'),
            ('VI MEDICINA - GA', 'Farmacología y Toxicología Teoría', 'G. Sarmiento/J. Navarro', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 303A (100'),
            ('VI MEDICINA - GA', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 306B (100'),
            ('VI MEDICINA - GA', 'Genética Clínica Teoría-Practica', 'Zuleima Yañez', 'MIÉRCOLES', '17:00:00', '18:00:00', 'SALÓN 303A (100'),
            ('VI MEDICINA - GB', 'Bioética', 'Anderson Diaz', 'JUEVES', '16:00:00', '17:00:00', 'SALÓN 307B (100'),
            ('VI MEDICINA - GB', 'Farmacología Práctica', 'A. GUERRERO/J. Navarro', 'MARTES', '16:00:00', '17:00:00', 'SALÓN 106B (100'),
            ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría', 'Dr. Guerrero', 'LUNES', '16:00:00', '17:00:00', 'SALÓN 106B (100'),
            ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría', 'Dr. Guerrero', 'MIÉRCOLES', '13:00:00', '14:00:00', 'SALÓN 307B (100'),
            ('VI MEDICINA - GB', 'Farmacología y Toxicología Teoría Guillermo Sarmiento/', 'Elen Manrrique', 'JUEVES', '13:00:00', '14:00:00', 'SALÓN 302A (100'),
            ('VI MEDICINA - GB', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MARTES', '12:00:00', '13:00:00', 'SALÓN 106B (100'),
            ('VI MEDICINA - GB', 'Genética Clínica Teoría', 'Zuleima Yañez', 'MIÉRCOLES', '15:00:00', '16:00:00', 'SALÓN 307B (100'),
            ('VI MEDICINA', 'Semiología', 'ELBA VALLE', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 307B (100'),
            ('VI MEDICINA', 'Semiología Teoría', 'FERNANDO FIORILLO', 'MIÉRCOLES', '09:00:00', '10:00:00', 'SALÓN 302A (100'),
        ]
        
        # Obtener sede principal
        try:
            sede, _ = Sede.objects.get_or_create(nombre='Sede Principal', defaults={
                'direccion': 'Dirección sede principal',
                'activo': True
            })
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creando sede: {str(e)}'))
            return
        
        # Obtener periodo
        try:
            periodo = PeriodoAcademico.objects.get(nombre='2026-1')
        except PeriodoAcademico.DoesNotExist:
            self.stdout.write(self.style.ERROR('Periodo 2026-1 no existe'))
            return
        
        # Contadores
        created_count = 0
        skipped_count = 0
        errors = []
        
        # Crear horarios
        for data in horarios_data:
            try:
                grupo_nombre, materia_nombre, profesor_nombre, dia, hora_inicio, hora_fin, espacio_nombre = data
                
                # Limpiar y limitar nombres
                materia_nombre = materia_nombre.strip()
                if len(materia_nombre) > 100:
                    materia_nombre = materia_nombre[:97] + '...'
                
                # Normalizar día
                dia_normalizado = dias_map.get(dia.upper(), dia)
                
                # Obtener o crear asignatura
                # Generar un código único basado en el nombre completo (max 20 chars)
                import hashlib
                nombre_hash = hashlib.md5(materia_nombre.encode()).hexdigest()[:6].upper()
                codigo_base = materia_nombre[:12].replace(" ", "").upper()
                codigo = f'{codigo_base[:12]}-{nombre_hash}'  # Max 12+1+6 = 19 chars
                
                # Primero intentar encontrar por nombre
                try:
                    asignatura = Asignatura.objects.filter(nombre=materia_nombre).first()
                    if not asignatura:
                        # Si no existe, crear una nueva
                        asignatura, _ = Asignatura.objects.get_or_create(
                            codigo=codigo,
                            defaults={
                                'nombre': materia_nombre,
                                'creditos': 3,
                                'horas': 3
                            }
                        )
                except Exception as e:
                    # Si hay error, intentar crear con codigo único
                    counter = 1
                    while True:
                        try:
                            codigo_alt = f'{codigo_base[:10]}-{counter:03d}'  # Max 10+1+3 = 14 chars
                            asignatura, _ = Asignatura.objects.get_or_create(
                                codigo=codigo_alt,
                                defaults={
                                    'nombre': materia_nombre,
                                    'creditos': 3,
                                    'horas': 3
                                }
                            )
                            break
                        except:
                            counter += 1
                            if counter > 999:
                                raise Exception(f'No se pudo crear asignatura: {materia_nombre}')
                
                # Obtener o crear grupo
                # Si el grupo está vacío, usamos un nombre genérico
                if not grupo_nombre or grupo_nombre.strip() == '':
                    grupo_nombre_final = f'{materia_nombre} - General'
                else:
                    grupo_nombre_final = grupo_nombre
                
                # Limitar el nombre del grupo a 50 caracteres
                if len(grupo_nombre_final) > 50:
                    grupo_nombre_final = grupo_nombre_final[:47] + '...'
                
                # Intentar encontrar un programa relacionado
                programa = None
                if 'MEDICINA' in grupo_nombre_final.upper():
                    try:
                        programa = Programa.objects.get(nombre__icontains='Medicina')
                    except:
                        pass
                elif 'DERECHO' in grupo_nombre_final.upper() or 'semestre' in grupo_nombre_final.lower():
                    try:
                        programa = Programa.objects.get(nombre__icontains='Derecho')
                    except:
                        pass
                elif 'BACTERIO' in grupo_nombre_final.upper() or 'MICROBIOLOGIA' in grupo_nombre_final.upper():
                    try:
                        programa = Programa.objects.get(nombre__icontains='Bacteriología')
                    except:
                        pass
                elif 'FISIOTERAPIA' in grupo_nombre_final.upper():
                    try:
                        programa = Programa.objects.get(nombre__icontains='Fisioterapia')
                    except:
                        pass
                elif 'INSTRUMENTACION' in grupo_nombre_final.upper():
                    try:
                        programa = Programa.objects.get(nombre__icontains='Instrumentación')
                    except:
                        pass
                
                # Si no encontramos programa, usar uno por defecto
                if not programa:
                    try:
                        programa = Programa.objects.first()
                    except:
                        pass
                
                grupo, _ = Grupo.objects.get_or_create(
                    nombre=grupo_nombre_final,
                    periodo=periodo,
                    defaults={
                        'programa': programa,
                        'semestre': 1,
                        'activo': True
                    }
                )
                
                # Obtener o crear usuario (profesor)
                profesor = None
                if profesor_nombre and profesor_nombre != 'Sin profesor especificado':
                    # Generar correo único
                    base_email = profesor_nombre.lower().replace(' ', '.').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')[:30]
                    email = f'{base_email}@sihul.edu.co'
                    counter = 1
                    while Usuario.objects.filter(correo=email).exists():
                        email = f'{base_email[:20]}_{counter}@sihul.edu.co'
                        counter += 1
                    
                    # Intentar obtener el rol Docente
                    rol_docente = None
                    try:
                        rol_docente = Rol.objects.get(nombre='Docente')
                    except Rol.DoesNotExist:
                        pass
                    
                    profesor, _ = Usuario.objects.get_or_create(
                        correo=email,
                        defaults={
                            'nombre': profesor_nombre,
                            'contrasena_hash': 'hash_placeholder',
                            'rol': rol_docente,
                            'activo': True
                        }
                    )
                
                # Obtener o crear espacio físico
                # Primero obtener o crear el tipo de espacio
                tipo_espacio, _ = TipoEspacio.objects.get_or_create(
                    nombre='aula',
                    defaults={'descripcion': 'Aula de clases'}
                )
                
                espacio, _ = EspacioFisico.objects.get_or_create(
                    nombre=espacio_nombre,
                    sede=sede,
                    defaults={
                        'capacidad': 50,
                        'tipo': tipo_espacio,
                        'estado': 'Disponible'
                    }
                )
                
                # Crear horario
                horario, created = Horario.objects.get_or_create(
                    asignatura=asignatura,
                    grupo=grupo,
                    dia_semana=dia_normalizado,
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin,
                    espacio=espacio,
                    defaults={
                        'docente': profesor,
                        'estado': 'aprobado'  # Estado aprobado por defecto
                    }
                )
                
                if created:
                    created_count += 1
                else:
                    skipped_count += 1
                    
            except Exception as e:
                errors.append(f'Error en {materia_nombre}: {str(e)}')
                skipped_count += 1
        
        total = len(horarios_data)
        self.stdout.write(self.style.SUCCESS(f'    ✓ {created_count} horarios creados, {skipped_count} omitidos ({total} totales)'))
        
        if errors:
            self.stdout.write(self.style.WARNING(f'\n    Errores encontrados ({len(errors)}):'))
            for error in errors[:20]:  # Mostrar los primeros 20 errores
                self.stdout.write(self.style.WARNING(f'      • {error}'))
            if len(errors) > 20:
                self.stdout.write(self.style.WARNING(f'      ... y {len(errors) - 20} errores más'))
        
        # Reconectar la validación de horarios
        pre_save.connect(validar_horario, sender=Horario)
