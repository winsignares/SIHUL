from django.core.management.base import BaseCommand
from componentes.models import Componente, ComponenteRol
from usuarios.models import Rol

class Command(BaseCommand):
    help = 'Seeds the database with initial components and assigns them to roles'

    def handle(self, *args, **options):
        # Definición de componentes por grupo/rol
        admin_components = [
            {'nombre': 'Dashboard', 'descripcion': 'Dashboard Principal'},
            {'nombre': 'Facultades', 'descripcion': 'Gestión de Facultades'},
            {'nombre': 'Programas', 'descripcion': 'Gestión de Programas'},
            {'nombre': 'Periodos', 'descripcion': 'Gestión de Periodos'},
            {'nombre': 'Grupos', 'descripcion': 'Gestión de Grupos'},
            {'nombre': 'Asignaturas', 'descripcion': 'Gestión de Asignaturas'},
            {'nombre': 'Espacios', 'descripcion': 'Gestión de Espacios'},
            {'nombre': 'Horarios', 'descripcion': 'Gestión de Horarios'},
            {'nombre': 'Préstamos', 'descripcion': 'Gestión de Préstamos'},
            {'nombre': 'Ocupación Semanal', 'descripcion': 'Reportes de Ocupación'},
            {'nombre': 'Reportes', 'descripcion': 'Reportes Generales'},
            {'nombre': 'Usuarios', 'descripcion': 'Gestión de Usuarios'},
            {'nombre': 'Notificaciones', 'descripcion': 'Notificaciones del Sistema'},
            {'nombre': 'Chat', 'descripcion': 'Chat Interno'},
            {'nombre': 'Ajustes', 'descripcion': 'Ajustes del Sistema'},
            {'nombre': 'Recursos', 'descripcion': 'Gestión de Recursos'},
            {'nombre': 'Mensajería', 'descripcion': 'Sistema de Mensajería'},
            {'nombre': 'Cronograma', 'descripcion': 'Cronograma de Actividades'},
            {'nombre': 'Apertura y Cierre', 'descripcion': 'Control de Apertura y Cierre'},
            {'nombre': 'Estado de Recursos', 'descripcion': 'Estado de los Recursos'},
            # Mapeos Adicionales
            {'nombre': 'Centro Institucional', 'descripcion': 'Centro Institucional'},
            {'nombre': 'Centro de Horarios', 'descripcion': 'Centro de Horarios'},
            {'nombre': 'Préstamos de Espacios', 'descripcion': 'Préstamos de Espacios'},
            {'nombre': 'Periodos Académicos', 'descripcion': 'Periodos Académicos'},
            {'nombre': 'Asistentes Virtuales', 'descripcion': 'Asistentes Virtuales'},
            {'nombre': 'Reportes Generales', 'descripcion': 'Reportes Generales'},
            {'nombre': 'Gestión de Usuarios', 'descripcion': 'Gestión de Usuarios Completa'},
            {'nombre': 'Asignación Automática', 'descripcion': 'Asignación Automática de Espacios'},
        ]

        supervisor_components = [
            {'nombre': 'Dashboard Supervisor', 'descripcion': 'Dashboard para Supervisor'},
            {'nombre': 'Disponibilidad de Espacios', 'descripcion': 'Consulta de Disponibilidad'},
            {'nombre': 'Apertura y Cierre de Salones', 'descripcion': 'Control de Salones'},
            {'nombre': 'Asistentes Virtuales Supervisor', 'descripcion': 'Asistente Virtual para Supervisor'},
            {'nombre': 'Estado de Recursos', 'descripcion': 'Estado de los Recursos'}, # Compartido
        ]

        docente_components = [
            {'nombre': 'Dashboard Docente', 'descripcion': 'Dashboard para Docente'},
            {'nombre': 'Mi Horario', 'descripcion': 'Horario del Docente'},
            {'nombre': 'Préstamos Docente', 'descripcion': 'Préstamos para Docente'},
            {'nombre': 'Asistentes Virtuales Docente', 'descripcion': 'Asistente Virtual para Docente'},
        ]

        estudiante_components = [
            {'nombre': 'Dashboard Estudiante', 'descripcion': 'Dashboard para Estudiante'},
            {'nombre': 'Mi Horario Estudiante', 'descripcion': 'Horario del Estudiante'},
            {'nombre': 'Asistentes Virtuales Estudiante', 'descripcion': 'Asistente Virtual para Estudiante'},
        ]

        # 1. Crear todos los componentes
        all_components_data = admin_components + supervisor_components + docente_components + estudiante_components
        # Eliminar duplicados por nombre (por si acaso)
        seen_names = set()
        unique_components = []
        for c in all_components_data:
            if c['nombre'] not in seen_names:
                unique_components.append(c)
                seen_names.add(c['nombre'])

        for comp_data in unique_components:
            componente, created = Componente.objects.get_or_create(
                nombre=comp_data['nombre'],
                defaults={'descripcion': comp_data['descripcion']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created component "{componente.nombre}"'))
            else:
                self.stdout.write(f'Component "{componente.nombre}" already exists')

        # 2. Asignar componentes a roles
        def assign_components_to_role(role_name, components_list):
            try:
                rol = Rol.objects.get(nombre=role_name)
            except Rol.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Role "{role_name}" not found. Run seed_roles first.'))
                return

            for comp_data in components_list:
                try:
                    componente = Componente.objects.get(nombre=comp_data['nombre'])
                    # Crear o actualizar la relación
                    cr, created = ComponenteRol.objects.get_or_create(
                        rol=rol,
                        componente=componente,
                        defaults={'permiso': 'VER'} # Default permiso
                    )
                    if created:
                        self.stdout.write(self.style.SUCCESS(f'Assigned "{componente.nombre}" to "{rol.nombre}"'))
                    else:
                        self.stdout.write(f'Relation "{componente.nombre}" - "{rol.nombre}" already exists')
                except Componente.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'Component "{comp_data["nombre"]}" not found'))

        # Planeación Facultad - Solo componentes específicos
        planeacion_facultad_components = [
            {'nombre': 'Dashboard', 'descripcion': 'Dashboard Principal'},
            {'nombre': 'Centro de Horarios', 'descripcion': 'Centro de Horarios'},
            {'nombre': 'Asistentes Virtuales', 'descripcion': 'Asistentes Virtuales'},
            {'nombre': 'Ocupación Semanal', 'descripcion': 'Reportes de Ocupación'},
            {'nombre': 'Reportes Generales', 'descripcion': 'Reportes Generales'},
        ]

        # Asignar
        assign_components_to_role('admin', admin_components)
        assign_components_to_role('planeacion_facultad', planeacion_facultad_components)
        assign_components_to_role('supervisor_general', supervisor_components)
        assign_components_to_role('docente', docente_components)
        assign_components_to_role('estudiante', estudiante_components)
