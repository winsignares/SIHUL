"""
Comando de Django para cargar datos iniciales completos en la base de datos SIHUL.

Cada responsabilidad de seed está delegada a su propio módulo en seeders/:
  roles_seeder, sedes_seeder, tipos_espacio_seeder, tipos_actividad_seeder,
  facultades_seeder, programas_seeder, usuarios_seeder, asignaturas_seeder,
  asignaturas_programa_seeder, espacios_seeder, componentes_seeder,
  componentes_rol_seeder, periodos_seeder, grupos_seeder, horarios_seeder,
  agentes_seeder, preguntas_sugeridas_seeder.

Uso: python manage.py seed_initial_data

Para agregar datos, edita únicamente el seeder correspondiente y
vuelve a ejecutar el comando.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from .seeders import (
    roles_seeder,
    sedes_seeder,
    tipos_espacio_seeder,
    tipos_actividad_seeder,
    facultades_seeder,
    programas_seeder,
    usuarios_seeder,
    asignaturas_seeder,
    asignaturas_programa_seeder,
    espacios_seeder,
    componentes_seeder,
    componentes_rol_seeder,
    periodos_seeder,
    grupos_seeder,
    horarios_seeder,
    agentes_seeder,
    preguntas_sugeridas_seeder,
)


class Command(BaseCommand):
    help = 'Carga datos iniciales completos en la base de datos SIHUL'

    def handle(self, *args, **options):
        out = self.stdout
        sty = self.style

        out.write(sty.WARNING('\n'))
        out.write(sty.WARNING('   CARGANDO DATOS INICIALES SIHUL'))
        out.write(sty.WARNING('\n'))

        try:
            with transaction.atomic():
                #  1. Tablas primarias (sin foreign keys) 
                out.write(sty.SUCCESS('\n[1/14] Tablas Primarias'))
                roles_seeder.create_roles(out, sty)
                sedes_seeder.create_sedes(out, sty)
                tipos_espacio_seeder.create_tipos_espacio(out, sty)
                tipos_actividad_seeder.create_tipos_actividad(out, sty)

                #  2. Estructura académica 
                out.write(sty.SUCCESS('\n[2/14] Estructura Académica'))
                facultades_seeder.create_facultades(out, sty)
                programas_seeder.create_programas(out, sty)
                periodos_seeder.create_periodos_academicos(out, sty)

                #  3. Asignaturas 
                out.write(sty.SUCCESS('\n[3/14] Asignaturas'))
                asignaturas_seeder.create_asignaturas(out, sty)

                #  4. Relaciones Asignatura-Programa 
                out.write(sty.SUCCESS('\n[4/14] Asignaturas por Programa'))
                asignaturas_programa_seeder.create_asignaturas_programa(out, sty)

                #  5. Usuarios del sistema 
                out.write(sty.SUCCESS('\n[5/14] Usuarios del Sistema'))
                usuarios_seeder.create_usuarios_sistema(out, sty)

                #  6. Docentes 
                out.write(sty.SUCCESS('\n[6/14] Docentes'))
                usuarios_seeder.create_usuarios_docentes(out, sty)

                #  7. Espacios físicos 
                out.write(sty.SUCCESS('\n[7/14] Espacios Físicos'))
                espacios_seeder.create_espacios_fisicos(out, sty)

                #  8. Componentes del sistema 
                out.write(sty.SUCCESS('\n[8/14] Componentes del Sistema'))
                componentes_seeder.create_componentes(out, sty)

                #  9. Asignación de componentes a roles 
                out.write(sty.SUCCESS('\n[9/14] Asignación de Componentes a Roles'))
                componentes_rol_seeder.create_componentes_rol(out, sty)

                #  10. Grupos académicos 
                out.write(sty.SUCCESS('\n[10/14] Grupos Académicos'))
                grupos_seeder.create_grupos(out, sty)

                #  11. Horarios Sede Centro 
                out.write(sty.SUCCESS('\n[11/14] Horarios Sede Centro'))
                horarios_seeder.create_horarios_sede_centro(out, sty)

                #  12. Horarios Sede Principal 
                out.write(sty.SUCCESS('\n[12/14] Horarios Sede Principal'))
                horarios_seeder.create_horarios_sede_principal(out, sty)

                #  13. Agentes de chatbot 
                out.write(sty.SUCCESS('\n[13/14] Agentes de Chatbot'))
                agentes_seeder.create_agentes(out, sty)

                #  14. Preguntas Sugeridas 
                out.write(sty.SUCCESS('\n[14/14] Preguntas Sugeridas'))
                preguntas_sugeridas_seeder.create_preguntas_sugeridas(out, sty)

            out.write(sty.SUCCESS('\n'))
            out.write(sty.SUCCESS(' DATOS CARGADOS EXITOSAMENTE'))
            out.write(sty.SUCCESS('\n'))

        except Exception as e:
            out.write(sty.ERROR(f'\n Error al cargar datos: {str(e)}'))
            import traceback
            traceback.print_exc()
            raise
