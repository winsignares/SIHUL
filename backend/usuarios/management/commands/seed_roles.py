from django.core.management.base import BaseCommand
from usuarios.models import Rol

class Command(BaseCommand):
    help = 'Seeds the database with initial roles'

    def handle(self, *args, **options):
        roles = [
            {'nombre': 'admin', 'descripcion': 'Administrador del Sistema'},
            {'nombre': 'planeacion_facultad', 'descripcion': 'Planeación de Facultad'},
            {'nombre': 'supervisor_general', 'descripcion': 'Supervisor General', 'supervisa_espacios': True},
            {'nombre': 'docente', 'descripcion': 'Docente'},
            {'nombre': 'estudiante', 'descripcion': 'Estudiante'},
        ]

        for role_data in roles:
            defaults = {'descripcion': role_data['descripcion']}
            if 'supervisa_espacios' in role_data:
                defaults['supervisa_espacios'] = role_data['supervisa_espacios']

            rol, created = Rol.objects.get_or_create(
                nombre=role_data['nombre'],
                defaults=defaults
            )
            if not created and 'supervisa_espacios' in role_data and rol.supervisa_espacios != role_data['supervisa_espacios']:
                rol.supervisa_espacios = role_data['supervisa_espacios']
                rol.save(update_fields=['supervisa_espacios'])
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created role "{rol.nombre}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Role "{rol.nombre}" already exists'))
