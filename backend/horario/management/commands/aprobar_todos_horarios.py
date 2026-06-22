from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from horario.models import Horario


class Command(BaseCommand):
    help = 'Aprueba masivamente horarios existentes. Por defecto solo muestra una simulacion.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirmar',
            action='store_true',
            help='Ejecuta la actualizacion. Sin esta bandera solo muestra cuantos horarios cambiaria.',
        )
        parser.add_argument(
            '--incluir-rechazados',
            action='store_true',
            help='Tambien aprueba horarios rechazados. Por defecto solo cambia horarios pendientes.',
        )

    def handle(self, *args, **options):
        estado_origen = ['pendiente', 'rechazado'] if options['incluir_rechazados'] else ['pendiente']
        queryset = Horario.objects.filter(estado__in=estado_origen)
        total = queryset.count()

        if not options['confirmar']:
            self.stdout.write(
                self.style.WARNING(
                    f'Simulacion: se aprobarian {total} horarios con estado {", ".join(estado_origen)}.'
                )
            )
            self.stdout.write('Ejecuta con --confirmar para aplicar los cambios.')
            return

        with transaction.atomic():
            actualizados = queryset.update(estado='aprobado')

        self.stdout.write(
            self.style.SUCCESS(
                f'{actualizados} horarios aprobados correctamente el {timezone.now().isoformat()}.'
            )
        )
