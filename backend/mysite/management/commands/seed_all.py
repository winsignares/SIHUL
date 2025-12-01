from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Ejecuta todos los comandos de seed en el orden correcto'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Iniciando carga de datos iniciales ===\n'))

        # 1. Seed de roles (debe ir primero porque usuarios dependen de roles)
        self.stdout.write(self.style.WARNING('1/4 - Cargando roles...'))
        try:
            call_command('seed_roles')
            self.stdout.write(self.style.SUCCESS('✓ Roles cargados exitosamente\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error cargando roles: {str(e)}\n'))
            return

        # 2. Seed de componentes (debe ir antes de usuarios para asignar componentes a roles)
        self.stdout.write(self.style.WARNING('2/4 - Cargando componentes...'))
        try:
            call_command('seed_components')
            self.stdout.write(self.style.SUCCESS('✓ Componentes cargados exitosamente\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error cargando componentes: {str(e)}\n'))
            return

        # 3. Seed de facultades
        self.stdout.write(self.style.WARNING('3/4 - Cargando facultades...'))
        try:
            call_command('seed_facultades')
            self.stdout.write(self.style.SUCCESS('✓ Facultades cargadas exitosamente\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error cargando facultades: {str(e)}\n'))
            return

        # 4. Seed de usuarios (debe ir al final porque depende de roles y facultades)
        self.stdout.write(self.style.WARNING('4/4 - Cargando usuarios...'))
        try:
            call_command('seed_users')
            self.stdout.write(self.style.SUCCESS('✓ Usuarios cargados exitosamente\n'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error cargando usuarios: {str(e)}\n'))
            return

        self.stdout.write(self.style.SUCCESS('\n=== ✓ Todos los datos iniciales han sido cargados exitosamente ==='))
