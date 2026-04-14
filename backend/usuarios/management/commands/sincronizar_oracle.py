from django.core.management.base import BaseCommand
from django.db import transaction
import oracledb
import os


class Command(BaseCommand):
    help = 'Sincroniza datos desde una vista/tabla Oracle a PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument(
            '--host',
            type=str,
            default=os.getenv('ORACLE_HOST', ''),
            help='Host de Oracle (o variable ORACLE_HOST)',
        )
        parser.add_argument(
            '--port',
            type=int,
            default=int(os.getenv('ORACLE_PORT', 1521)),
            help='Puerto de Oracle (default: 1521)',
        )
        parser.add_argument(
            '--user',
            type=str,
            default=os.getenv('ORACLE_USER', ''),
            help='Usuario de Oracle (o variable ORACLE_USER)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default=os.getenv('ORACLE_PASSWORD', ''),
            help='Contraseña de Oracle (o variable ORACLE_PASSWORD)',
        )
        parser.add_argument(
            '--service',
            type=str,
            default=os.getenv('ORACLE_SERVICE', ''),
            help='Nombre del servicio Oracle (o variable ORACLE_SERVICE)',
        )
        parser.add_argument(
            '--query',
            type=str,
            required=True,
            help='Query SQL a ejecutar en Oracle (e.g., "SELECT * FROM mi_vista")',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simula la sincronización sin guardar los datos',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limita el número de registros a procesar',
        )

    def handle(self, *args, **options):
        # Obtener y validar credenciales
        host = options.get('host')
        port = options.get('port')
        user = options.get('user')
        password = options.get('password')
        service = options.get('service')
        query = options.get('query')
        dry_run = options.get('dry_run')
        limit = options.get('limit')

        if not all([host, user, password, service]):
            self.stdout.write(
                self.style.ERROR(
                    '✗ Faltan credenciales. Proporciona --host, --user, --password, --service '
                    'o define las variables de entorno: ORACLE_HOST, ORACLE_USER, ORACLE_PASSWORD, ORACLE_SERVICE'
                )
            )
            return

        try:
            # Conectar a Oracle
            self.stdout.write(f'Conectando a Oracle://{user}@{host}:{port}/{service}...')
            connection = oracledb.connect(
                user=user,
                password=password,
                dsn=f"{host}:{port}/{service}"
            )
            self.stdout.write(self.style.SUCCESS('✓ Conectado a Oracle'))

            cursor = connection.cursor()

            # Ejecutar query
            self.stdout.write(f'Ejecutando: {query}')
            cursor.execute(query)

            # Obtener resultados
            filas = cursor.fetchall()
            columnas = [desc[0].lower() for desc in cursor.description]

            if limit:
                filas = filas[:limit]

            self.stdout.write(
                self.style.SUCCESS(f'✓ Se encontraron {len(filas)} registros')
            )
            self.stdout.write(f'Columnas: {", ".join(columnas)}\n')

            # Mostrar primeros registros como preview
            if filas:
                self.stdout.write('Primeros 3 registros:')
                for i, fila in enumerate(filas[:3]):
                    datos = dict(zip(columnas, fila))
                    self.stdout.write(f'  {i+1}. {datos}')
                if len(filas) > 3:
                    self.stdout.write(f'  ... y {len(filas) - 3} más\n')

            if not dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        '⚠ Modo REAL: Los datos se guardarán en la base de datos'
                    )
                )
                response = input('¿Deseas continuar? (s/n): ').strip().lower()
                if response != 's':
                    self.stdout.write(self.style.WARNING('Operación cancelada'))
                    return

                with transaction.atomic():
                    # Aquí es donde mapearías los datos a tu modelo Django
                    # Ejemplo:
                    # from mi_app.models import MiModelo
                    # for fila in filas:
                    #     datos = dict(zip(columnas, fila))
                    #     MiModelo.objects.get_or_create(**datos)
                    
                    self.stdout.write(
                        self.style.WARNING(
                            '\n⚠ IMPORTANTE: Este comando solo trae los datos.\n'
                            'Debes mapearlos a tu modelo Django modificando el comando.\n'
                            'Ver comentarios en el código para saber cómo hacerlo.'
                        )
                    )

                self.stdout.write(self.style.SUCCESS(f'✓ {len(filas)} registros listos para sincronizar'))

            else:
                self.stdout.write(
                    self.style.WARNING(
                        '\n[DRY-RUN] Se sincronizarían los datos anteriores\n'
                        'Usa sin --dry-run para ejecutar realmente'
                    )
                )

            cursor.close()
            connection.close()

        except oracledb.DatabaseError as e:
            self.stdout.write(self.style.ERROR(f'✗ Error de conexión Oracle: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error: {e}'))
