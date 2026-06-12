from django.core.management.base import BaseCommand
from mysite.management.commands.seeders import financiero_seeder


class Command(BaseCommand):
    help = 'Carga los datos iniciales del módulo financiero'

    def handle(self, *args, **options):
        financiero_seeder.create_financiero_data(self.stdout, self.style)
