from django.core.management.base import BaseCommand

from mysite.management.commands.modifiers.deleteAdditionalSchedules import run as delete_additional_schedules


class Command(BaseCommand):
    help = 'Elimina los horarios adicionales creados por createAdditionalSchedules.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Aplica cambios reales (elimina horarios). Si no se indica, corre en modo simulación (dry-run).',
        )

    def handle(self, *args, **options):
        apply_changes = options.get('apply', False)

        mode = 'APPLY' if apply_changes else 'DRY-RUN'
        self.stdout.write(self.style.WARNING(f'Iniciando eliminación de horarios adicionales en modo {mode}...'))

        delete_additional_schedules(apply_changes=apply_changes)

        self.stdout.write(self.style.SUCCESS('Eliminación finalizada.'))
