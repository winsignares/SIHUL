import os
import re
import unicodedata

import oracledb
from django.core.management.base import BaseCommand
from django.db import transaction

from sedes.models import Seccional


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
            help='Contrasena de Oracle (o variable ORACLE_PASSWORD)',
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
            help='Simula la sincronizacion sin guardar los datos',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limita el numero de registros a procesar',
        )
        parser.add_argument(
            '--target',
            type=str,
            default='preview',
            choices=['preview', 'seccionales'],
            help='Destino: preview (solo lectura) o seccionales (crear/actualizar)',
        )
        parser.add_argument(
            '--city-column',
            type=str,
            default='',
            help='Columna Oracle con ciudad/seccional directa (opcional)',
        )
        parser.add_argument(
            '--name-column',
            type=str,
            default='',
            help='Columna Oracle con nombre de sede para extraer ciudad (ej. nombre_sede)',
        )

    @staticmethod
    def _detectar_columna(columnas, valor_manual, candidatas):
        if valor_manual:
            objetivo = valor_manual.lower().strip()
            if objetivo in columnas:
                return objetivo
            return None
        for c in candidatas:
            if c in columnas:
                return c
        return None

    @staticmethod
    def _normalizar_ciudad(valor):
        texto = str(valor or '').strip()
        if not texto:
            return ''

        sin_tildes = ''.join(
            ch for ch in unicodedata.normalize('NFD', texto.upper())
            if unicodedata.category(ch) != 'Mn'
        )
        sin_tildes = re.sub(r'\s+', ' ', sin_tildes).strip()

        alias = {
            'BOGOTA': 'Bogota',
            'BARRANQUILLA': 'Barranquilla',
            'CALI': 'Cali',
            'PEREIRA': 'Pereira',
            'CARTAGENA': 'Cartagena',
            'CUCUTA': 'Cucuta',
            'SOCORRO': 'El Socorro',
            'EL SOCORRO': 'El Socorro',
        }
        if sin_tildes in alias:
            return alias[sin_tildes]

        return ' '.join(p.capitalize() for p in sin_tildes.split())

    @staticmethod
    def _normalizar_texto(valor):
        texto = str(valor or '').strip()
        if not texto:
            return ''
        sin_tildes = ''.join(
            ch for ch in unicodedata.normalize('NFD', texto.upper())
            if unicodedata.category(ch) != 'Mn'
        )
        return re.sub(r'\s+', ' ', sin_tildes).strip()

    def _buscar_ciudad_en_texto(self, texto):
        normalizado = self._normalizar_texto(texto)
        if not normalizado:
            return ''

        # Prioridad por coincidencia mas larga para evitar falsos positivos.
        candidatas = {
            'EL SOCORRO': 'El Socorro',
            'BARRANQUILLA': 'Barranquilla',
            'CARTAGENA': 'Cartagena',
            'PEREIRA': 'Pereira',
            'CUCUTA': 'Cucuta',
            'BOGOTA': 'Bogota',
            'CALI': 'Cali',
            'SOCORRO': 'El Socorro',
        }

        # Tambien considera seccionales ya existentes en BD para casos no previstos.
        for ciudad in Seccional.objects.values_list('ciudad', flat=True):
            clave = self._normalizar_texto(ciudad)
            if clave:
                candidatas.setdefault(clave, ciudad)

        for clave, canonical in sorted(candidatas.items(), key=lambda x: len(x[0]), reverse=True):
            if re.search(rf'(^|\s){re.escape(clave)}(\s|$)', normalizado):
                return canonical

        return ''

    def _extraer_ciudad_desde_nombre_sede(self, nombre_sede):
        texto = str(nombre_sede or '').strip()
        if not texto:
            return ''

        match = re.search(r'\bSECCIONAL\s+(.+)$', texto, flags=re.IGNORECASE)
        if match:
            ciudad = self._normalizar_ciudad(match.group(1))
            if ciudad:
                return ciudad

        encontrada = self._buscar_ciudad_en_texto(texto)
        if encontrada:
            return encontrada

        return self._normalizar_ciudad(texto)

    def _obtener_ciudades(self, filas, columnas, city_column, name_column):
        col_ciudad = self._detectar_columna(
            columnas,
            city_column,
            ['ciudad', 'seccional', 'nombre_seccional', 'nombre_ciudad'],
        )
        col_nombre = self._detectar_columna(
            columnas,
            name_column,
            ['nombre_sede', 'sede', 'descripcion_sede'],
        )

        if not col_ciudad and not col_nombre:
            return None, None, None

        ciudades = []
        for fila in filas:
            datos = dict(zip(columnas, fila))
            if col_ciudad:
                valor_ciudad = datos.get(col_ciudad)
                ciudad = self._buscar_ciudad_en_texto(valor_ciudad) or self._normalizar_ciudad(valor_ciudad)
            else:
                ciudad = self._extraer_ciudad_desde_nombre_sede(datos.get(col_nombre))
            if ciudad:
                ciudades.append(ciudad)

        ciudades_unicas = list(dict.fromkeys(ciudades))
        return ciudades_unicas, col_ciudad, col_nombre

    def handle(self, *args, **options):
        host = options.get('host')
        port = options.get('port')
        user = options.get('user')
        password = options.get('password')
        service = options.get('service')
        query = options.get('query')
        dry_run = options.get('dry_run')
        limit = options.get('limit')
        target = options.get('target')
        city_column = options.get('city_column')
        name_column = options.get('name_column')

        if not all([host, user, password, service]):
            self.stdout.write(
                self.style.ERROR(
                    'Faltan credenciales. Usa --host --user --password --service '
                    'o variables ORACLE_HOST ORACLE_USER ORACLE_PASSWORD ORACLE_SERVICE'
                )
            )
            return

        connection = None
        cursor = None
        try:
            self.stdout.write(f'Conectando a Oracle://{user}@{host}:{port}/{service} ...')
            connection = oracledb.connect(
                user=user,
                password=password,
                dsn=f'{host}:{port}/{service}',
            )
            self.stdout.write(self.style.SUCCESS('Conectado a Oracle'))

            cursor = connection.cursor()
            self.stdout.write(f'Ejecutando query: {query}')
            cursor.execute(query)

            filas = cursor.fetchall()
            columnas = [desc[0].lower() for desc in cursor.description]
            if limit:
                filas = filas[:limit]

            self.stdout.write(self.style.SUCCESS(f'Registros obtenidos: {len(filas)}'))
            self.stdout.write(f'Columnas: {", ".join(columnas)}')

            if filas:
                self.stdout.write('Primeros 3 registros:')
                for i, fila in enumerate(filas[:3], 1):
                    self.stdout.write(f'  {i}. {dict(zip(columnas, fila))}')
                if len(filas) > 3:
                    self.stdout.write(f'  ... y {len(filas) - 3} mas')

            if target == 'preview':
                self.stdout.write(self.style.WARNING('Modo preview: no se realizaron cambios'))
                return

            ciudades_unicas, col_ciudad, col_nombre = self._obtener_ciudades(
                filas, columnas, city_column, name_column
            )
            if ciudades_unicas is None:
                self.stdout.write(
                    self.style.ERROR(
                        'No se pudo identificar columna de ciudad. '
                        'Usa --city-column o --name-column. '
                        f'Columnas disponibles: {", ".join(columnas)}'
                    )
                )
                return

            self.stdout.write(
                f'Extraccion de ciudad usando: {col_ciudad or col_nombre}. '
                f'Seccionales unicas detectadas: {len(ciudades_unicas)}'
            )

            existentes = set(
                Seccional.objects.filter(ciudad__in=ciudades_unicas).values_list('ciudad', flat=True)
            )
            por_crear = [c for c in ciudades_unicas if c not in existentes]

            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'[DRY-RUN] Nuevas: {len(por_crear)} | Existentes: {len(existentes)}'
                    )
                )
                if por_crear:
                    self.stdout.write(f'Por crear: {", ".join(por_crear)}')
                return

            self.stdout.write(self.style.WARNING('Modo REAL: se guardaran cambios en base de datos'))
            response = input('Deseas continuar? (s/n): ').strip().lower()
            if response != 's':
                self.stdout.write(self.style.WARNING('Operacion cancelada'))
                return

            creadas = 0
            reactivadas = 0
            with transaction.atomic():
                for ciudad in ciudades_unicas:
                    seccional, creada = Seccional.objects.get_or_create(
                        ciudad=ciudad,
                        defaults={'activa': True},
                    )
                    if creada:
                        creadas += 1
                        continue
                    if not seccional.activa:
                        seccional.activa = True
                        seccional.save(update_fields=['activa'])
                        reactivadas += 1

            sin_cambios = len(ciudades_unicas) - creadas - reactivadas
            self.stdout.write(
                self.style.SUCCESS(
                    f'Sincronizacion completada. Unicas: {len(ciudades_unicas)} | '
                    f'Creadas: {creadas} | Reactivadas: {reactivadas} | Sin cambios: {sin_cambios}'
                )
            )

        except oracledb.DatabaseError as e:
            self.stdout.write(self.style.ERROR(f'Error Oracle: {e}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
        finally:
            if cursor:
                cursor.close()
            if connection:
                connection.close()
