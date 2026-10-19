"""
Comando de Django para cargar los datos que el sistema SIEMPRE necesita para
funcionar, independientemente de si hay acceso a los ETL de Oracle o no.

A diferencia de `seed_initial_data` (que carga además datos académicos de
demostración: facultades, programas, asignaturas, grupos, horarios y decenas
de docentes/estudiantes de prueba que en producción llegan por los ETL de
Oracle — ver `*/management/commands/etl_oracle_*.py`), este comando solo
carga configuración y catálogos propios de SIHUL que Oracle no provee:

  - Roles del sistema
  - Sedes (bootstrap: los usuarios fundamentales requieren una sede válida;
    idempotente, así que no genera conflicto si luego el ETL de Oracle de
    sedes carga las mismas u otras adicionales)
  - Tipos de espacio físico y tipos de actividad (catálogos de préstamos)
  - Recursos para espacios físicos
  - Componentes del sistema de permisos y su asignación a roles
  - Periodos académicos
  - Usuarios fundamentales del sistema (admin, admin de planeación,
    planeación de facultad, supervisor general) — NO incluye el listado de
    ~150 docentes de prueba de `seed_initial_data`, ya que en producción los
    docentes reales llegan por `etl_oracle_docentes`
  - Espacios permitidos para supervisores (si ya existen espacios físicos)
  - Agentes de chatbot y sus preguntas sugeridas

Uso: python manage.py seed_required_data

Nota: el módulo Financiero tiene su propio seeder (`financiero_seeder`) y
se deja fuera de este comando; se sigue cargando únicamente desde
`seed_initial_data` hasta que se decida su tratamiento específico.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from .seeders import (
    roles_seeder,
    sedes_seeder,
    tipos_espacio_seeder,
    tipos_actividad_seeder,
    recursos_seeder,
    componentes_seeder,
    componentes_rol_seeder,
    periodos_seeder,
    usuarios_seeder,
    espacios_permitidos_seeder,
    agentes_seeder,
    preguntas_sugeridas_seeder,
)


class Command(BaseCommand):
    help = (
        'Carga los datos de configuración/catálogo que SIHUL necesita siempre, '
        'sin depender de los ETL de Oracle (roles, sedes, componentes, recursos, '
        'periodos, usuarios fundamentales, agentes de chatbot, etc.)'
    )

    def handle(self, *args, **options):
        out = self.stdout
        sty = self.style

        out.write(sty.WARNING('\n'))
        out.write(sty.WARNING('   CARGANDO DATOS REQUERIDOS SIHUL (independientes de Oracle)'))
        out.write(sty.WARNING('\n'))

        try:
            with transaction.atomic():
                #  1. Roles del sistema
                out.write(sty.SUCCESS('\n[1/11] Roles del Sistema'))
                roles_seeder.create_roles(out, sty)

                #  2. Sedes (bootstrap para usuarios fundamentales)
                out.write(sty.SUCCESS('\n[2/11] Sedes'))
                sedes_seeder.create_sedes(out, sty)

                #  3. Catálogos de espacios y actividades
                out.write(sty.SUCCESS('\n[3/11] Tipos de Espacio y Tipos de Actividad'))
                tipos_espacio_seeder.create_tipos_espacio(out, sty)
                tipos_actividad_seeder.create_tipos_actividad(out, sty)

                #  4. Recursos para espacios
                out.write(sty.SUCCESS('\n[4/11] Recursos para Espacios'))
                recursos_seeder.create_recursos(out, sty)

                #  5. Componentes del sistema de permisos
                out.write(sty.SUCCESS('\n[5/11] Componentes del Sistema'))
                componentes_seeder.create_componentes(out, sty)

                #  6. Asignación de componentes a roles
                out.write(sty.SUCCESS('\n[6/11] Asignación de Componentes a Roles'))
                componentes_rol_seeder.create_componentes_rol(out, sty)

                #  7. Periodos académicos
                out.write(sty.SUCCESS('\n[7/11] Periodos Académicos'))
                periodos_seeder.create_periodos_academicos(out, sty)

                #  8. Usuarios fundamentales del sistema (admin, supervisor, etc.)
                out.write(sty.SUCCESS('\n[8/11] Usuarios Fundamentales del Sistema'))
                usuarios_seeder.create_usuarios_sistema(out, sty)

                #  9. Espacios permitidos para supervisores
                out.write(sty.SUCCESS('\n[9/11] Espacios Permitidos (si ya hay espacios físicos cargados)'))
                espacios_permitidos_seeder.create_espacios_permitidos(out, sty)

                #  10. Agentes de chatbot
                out.write(sty.SUCCESS('\n[10/11] Agentes de Chatbot'))
                agentes_seeder.create_agentes(out, sty)

                #  11. Preguntas sugeridas
                out.write(sty.SUCCESS('\n[11/11] Preguntas Sugeridas'))
                preguntas_sugeridas_seeder.create_preguntas_sugeridas(out, sty)

            out.write(sty.SUCCESS('\n'))
            out.write(sty.SUCCESS(' DATOS REQUERIDOS CARGADOS EXITOSAMENTE'))
            out.write(sty.SUCCESS('\n'))
            out.write(
                'Recuerda ejecutar los ETL de Oracle (o `seed_initial_data` si no tienes '
                'acceso a Oracle) para cargar facultades, programas, asignaturas, espacios, '
                'grupos, horarios, docentes y estudiantes.\n'
            )

        except Exception as e:
            out.write(sty.ERROR(f'\n Error al cargar datos requeridos: {str(e)}'))
            import traceback
            traceback.print_exc()
            raise
