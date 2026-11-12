"""Fronteras entre los módulos del backend.

El módulo financiero es un sistema aparte del académico (horarios, espacios y préstamos):
- nada fuera de `financiero` lo importa (la plataforma y lo académico no dependen de él);
- `financiero` solo toma de la plataforma (usuarios, sedes, facultades, notificaciones, componentes y mysite) y
  nunca de espacios, horario, préstamos u otras apps académicas.
No se revisan las pruebas, las migraciones ni los comandos de gestión (seeders y ETL), que arman datos de todo el sistema.
"""
import ast
import pathlib

from django.test import SimpleTestCase

RAIZ = pathlib.Path(__file__).resolve().parent.parent

ACADEMICAS = {'espacios', 'horario', 'prestamos', 'programas', 'grupos', 'asignaturas', 'recursos', 'periodos'}
PLATAFORMA = {'usuarios', 'sedes', 'facultades', 'notificaciones', 'componentes', 'mysite'}
OMITIDAS = ('migrations', 'management', 'tests', 'static_assets')


def _modulos_importados(ruta):
    arbol = ast.parse(ruta.read_text(encoding='utf-8-sig'))
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Import):
            for alias in nodo.names:
                yield alias.name.split('.')[0]
        elif isinstance(nodo, ast.ImportFrom) and nodo.level == 0 and nodo.module:
            yield nodo.module.split('.')[0]


def _archivos(app):
    for ruta in (RAIZ / app).rglob('*.py'):
        partes = ruta.relative_to(RAIZ).parts
        if any(p in OMITIDAS for p in partes) or ruta.name.startswith('tests'):
            continue
        yield ruta


class FronterasTests(SimpleTestCase):
    def _violaciones(self, apps_origen, prohibidos):
        encontradas = []
        for app in sorted(apps_origen):
            for ruta in _archivos(app):
                for modulo in set(_modulos_importados(ruta)):
                    if modulo in prohibidos:
                        encontradas.append(f'{ruta.relative_to(RAIZ).as_posix()} importa {modulo}')
        return encontradas

    def test_nada_fuera_de_financiero_lo_importa(self):
        otras = (ACADEMICAS | PLATAFORMA | {'chatbot'}) - {'financiero'}
        self.assertEqual(self._violaciones(otras, {'financiero'}), [])

    def test_financiero_solo_toma_de_la_plataforma(self):
        self.assertEqual(self._violaciones({'financiero'}, ACADEMICAS | {'chatbot'}), [])
