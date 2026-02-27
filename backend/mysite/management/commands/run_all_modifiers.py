from django.core.management.base import BaseCommand

from mysite.management.commands.modifiers.runAllModifiers import run_all_modifiers


class Command(BaseCommand):
    help = 'Ejecuta todos los scripts de modificación en el orden definido.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Aplica cambios reales. Si no se indica, corre en modo simulación (dry-run).',
        )

    def handle(self, *args, **options):
        apply_changes = options.get('apply', False)

        mode = 'APPLY' if apply_changes else 'DRY-RUN'
        self.stdout.write(self.style.WARNING(f'Iniciando run_all_modifiers en modo {mode}...'))

        run_all_modifiers(apply_changes=apply_changes)

        self.stdout.write(self.style.SUCCESS('run_all_modifiers finalizado.'))
