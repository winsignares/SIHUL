from django.core.management.base import BaseCommand
from mysite.management.commands.seeders import financiero_seeder


class Command(BaseCommand):
    help = 'Carga los datos iniciales del módulo financiero'

    def add_arguments(self, parser):
        parser.add_argument(
            '--seccional',
            default='Barranquilla',
            help='Ciudad de la seccional financiera a sembrar. Default: Barranquilla.',
        )

    def handle(self, *args, **options):
        financiero_seeder.create_financiero_data(
            self.stdout,
            self.style,
            seccional_ciudad=options['seccional'],
        )
