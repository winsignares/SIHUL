from django.core.management.base import BaseCommand
from facultades.models import Facultad

class Command(BaseCommand):
    help = 'Seeds the database with initial faculties'

    def handle(self, *args, **options):
        facultades = [
            {'nombre': 'Ingeniería'},
            {'nombre': 'Derecho'},
            {'nombre': 'Ciencias de la Salud'},
            {'nombre': 'Ciencias Económicas'},
            {'nombre': 'Ciencias de la Educación'},
            {'nombre': 'Filosofía'},
        ]

        for fac_data in facultades:
            facultad, created = Facultad.objects.get_or_create(
                nombre=fac_data['nombre'],
                defaults={'activa': True}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created faculty "{facultad.nombre}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Faculty "{facultad.nombre}" already exists'))
