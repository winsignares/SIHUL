from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'ETL Oracle dedicado para Facultades (requiere mapping de sedes)'

    def add_arguments(self, parser):
        parser.add_argument('--host', type=str, required=True)
        parser.add_argument('--port', type=int, default=1521)
        parser.add_argument('--user', type=str, required=True)
        parser.add_argument('--password', type=str, required=True)
        parser.add_argument('--service', type=str, required=True)
        parser.add_argument('--source-system', type=str, default='ORACLE_SIU')
        parser.add_argument(
            '--sedes-query',
            type=str,
            default='SELECT id_sede, cod_sede, nombre_sede FROM UHORARIOS.VW_SEDES',
            help='Consulta de sedes Oracle para mantener mapping actualizado',
        )
        parser.add_argument(
            '--facultades-query',
            type=str,
            default=(
                'SELECT '
                'ID_FACULTAD AS id_facultad, '
                'ID_SEDE AS id_sede, '
                'COD_SEDE AS cod_sede, '
                'NOMBRE_SEDE AS nombre_sede, '
                'NOMBRE_FACULTAD AS nombre_facultad '
                'FROM UHORARIOS.VW_FACULTAD'
            ),
            help='Consulta de facultades Oracle',
        )
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument('--no-input', action='store_true')
        parser.add_argument('--max-runtime-min', type=int, default=30)
        parser.add_argument(
            '--seccional',
            type=str,
            default='',
            help='Filtra por seccional (usa columnas SEDE/NOMBRE_SEDE cuando existan)',
        )

    def handle(self, *args, **options):
        call_command(
            'etl_oracle_staging',
            host=options['host'],
            port=options['port'],
            user=options['user'],
            password=options['password'],
            service=options['service'],
            source_system=options['source_system'],
            sedes_query=options['sedes_query'],
            facultades_query=options['facultades_query'],
            dry_run=options['dry_run'],
            limit=options['limit'],
            no_input=options['no_input'],
            max_runtime_min=options['max_runtime_min'],
            seccional=options['seccional'],
        )
