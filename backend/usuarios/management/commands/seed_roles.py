from django.core.management.base import BaseCommand
from usuarios.models import Rol

class Command(BaseCommand):
    help = 'Seeds the database with initial roles'

    def handle(self, *args, **options):
        roles = [
            {'nombre': 'admin', 'descripcion': 'Administrador del Sistema'},
            {'nombre': 'planeacion_facultad', 'descripcion': 'Planeación de Facultad'},
            {'nombre': 'supervisor_general', 'descripcion': 'Supervisor General'},
            {'nombre': 'docente', 'descripcion': 'Docente'},
            {'nombre': 'estudiante', 'descripcion': 'Estudiante'},
        ]

        for role_data in roles:
            rol, created = Rol.objects.get_or_create(
                nombre=role_data['nombre'],
                defaults={'descripcion': role_data['descripcion']}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created role "{rol.nombre}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Role "{rol.nombre}" already exists'))
