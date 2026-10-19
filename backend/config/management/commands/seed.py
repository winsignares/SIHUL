"""Comando unico de carga de datos: ejecuta los seeders de seeders/registro.py.

SIEMPRE manual: nada lo ejecuta automaticamente ni por periodo de tiempo.

Uso:
  python manage.py seed                      # todos (datos de demostracion completos)
  python manage.py seed --solo-requeridos    # solo lo que el sistema necesita siempre (prod)
  python manage.py seed --solo roles,sedes   # pasos concretos (incluye los opcionales)
  python manage.py seed --con-divipola       # ademas sincroniza municipios desde el DANE (red)
  python manage.py seed --listar             # muestra los pasos y sus banderas

Con Docker:  docker compose run --rm seed   (ver servicio `seed` en docker-compose.yml)
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from .seeders.registro import PASOS, PASOS_POR_CLAVE


class Command(BaseCommand):
    help = 'Ejecuta, en orden, todos los seeders registrados (seeders/registro.py)'

    def add_arguments(self, parser):
        parser.add_argument('--solo-requeridos', action='store_true',
                            help='Solo la configuracion/catalogos que el sistema necesita siempre.')
        parser.add_argument('--solo', default='',
                            help='Lista de claves separadas por coma (ver --listar).')
        parser.add_argument('--con-divipola', action='store_true',
                            help='Incluye la sincronizacion de municipios desde DIVIPOLA/DANE (requiere red).')
        parser.add_argument('--listar', action='store_true', help='Lista los pasos y termina.')

    def _seleccionar(self, options):
        if options['solo']:
            claves = [c.strip() for c in options['solo'].split(',') if c.strip()]
            desconocidas = [c for c in claves if c not in PASOS_POR_CLAVE]
            if desconocidas:
                raise CommandError(f"Pasos desconocidos: {', '.join(desconocidas)}. Usa --listar.")
            return [p for p in PASOS if p.clave in claves]  # respeta el orden del registro
        pasos = [p for p in PASOS if not p.opcional]
        if options['solo_requeridos']:
            pasos = [p for p in pasos if p.requerido]
        if options['con_divipola']:
            pasos.append(PASOS_POR_CLAVE['geografia_colombia'])
        return pasos

    def handle(self, *args, **options):
        out, sty = self.stdout, self.style

        if options['listar']:
            for i, p in enumerate(PASOS, 1):
                banderas = ' '.join(n for n, v in (('requerido', p.requerido), ('opcional', p.opcional), ('red', p.red)) if v)
                out.write(f'{i:>2}. {p.clave:<24} {p.etiqueta}  [{banderas}]')
            return

        pasos = self._seleccionar(options)
        if not pasos:
            raise CommandError('No hay pasos para ejecutar.')

        out.write(sty.WARNING('\n   CARGANDO DATOS SIHUL\n'))
        total = len(pasos)
        locales = [p for p in pasos if not p.red]
        de_red = [p for p in pasos if p.red]   # fuera de la transaccion principal
        try:
            with transaction.atomic():
                for i, p in enumerate(locales, 1):
                    out.write(sty.SUCCESS(f'\n[{i}/{total}] {p.etiqueta}'))
                    p.ejecutar(out, sty)
            for j, p in enumerate(de_red, len(locales) + 1):
                out.write(sty.SUCCESS(f'\n[{j}/{total}] {p.etiqueta}'))
                p.ejecutar(out, sty)
            out.write(sty.SUCCESS('\n DATOS CARGADOS EXITOSAMENTE\n'))
            if options['solo_requeridos']:
                out.write('Recuerda ejecutar los ETL de Oracle (o `seed` completo si no tienes '
                          'acceso a Oracle) para cargar facultades, programas, asignaturas, '
                          'espacios, grupos, horarios, docentes y estudiantes.\n')
        except Exception as exc:
            out.write(sty.ERROR(f'\n Error al cargar datos: {exc}'))
            raise
