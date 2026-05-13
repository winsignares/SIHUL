#!/usr/bin/env python
"""
Migraciones de datos desde staging -> modelos reales
Orden de ejecución:
1. PeriodosAcademicos
2. Grupos (requiere Programa + PeriodoAcademico)
3. Usuarios/Docentes (desde StgOracleDocente)
4. EspaciosFisicos (desde StgOracleEspacioFisico)
5. Horarios (requiere Grupo + Asignatura + Usuario + Espacio)
"""

from django.core.management.base import BaseCommand
from django.db.models import Q

from periodos.models import PeriodoAcademico
from programas.models import Programa
from grupos.models import StgOracleGrupoAcademico, Grupo
from usuarios.models import Rol, StgOracleDocente, StgOracleEstudiante, Usuario
from espacios.models import StgOracleEspacioFisico, EspacioFisico, TipoEspacio
from asignaturas.models import Asignatura
from horario.models import StgOracleHorario, Horario
from sedes.models import Sede

class Command(BaseCommand):
    help = 'Migra datos desde staging Oracle a modelos reales'

    def add_arguments(self, parser):
        parser.add_argument(
            '--etapa',
            type=str,
            choices=['periodos', 'grupos', 'docentes', 'estudiantes', 'espacios', 'horarios', 'all'],
            default='all',
            help='Etapa de migración a ejecutar'
        )
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--limit', type=int, default=None)

    def handle(self, *args, **options):
        etapa = options['etapa']
        dry_run = options['dry_run']
        limit = options['limit']

        if etapa in ['periodos', 'all']:
            self.migrate_periodos(dry_run, limit)
        if etapa in ['grupos', 'all']:
            self.migrate_grupos(dry_run, limit)
        if etapa in ['docentes', 'all']:
            self.migrate_docentes(dry_run, limit)
        if etapa in ['estudiantes', 'all']:
            self.migrate_estudiantes(dry_run, limit)
        if etapa in ['espacios', 'all']:
            self.migrate_espacios(dry_run, limit)
        if etapa in ['horarios', 'all']:
            self.migrate_horarios(dry_run, limit)

    @staticmethod
    def _find_role(nombre):
        return Rol.objects.filter(nombre__iexact=nombre).first()

    @staticmethod
    def _resolve_sede(source_system, external_id):
        external = str(external_id or '').strip()
        if not external:
            return None
        return Sede.objects.filter(
            Q(source_system=source_system, external_id=external) |
            Q(external_id=external)
        ).first()

    @staticmethod
    def _resolve_facultad(source_system, external_id):
        from facultades.models import Facultad
        external = str(external_id or '').strip()
        if not external:
            return None
        return Facultad.objects.filter(
            Q(source_system=source_system, external_id=external) |
            Q(external_id=external)
        ).first()

    def migrate_periodos(self, dry_run=False, limit=None):
        """Crea periodos académicos desde datos de staging"""
        from datetime import datetime, timedelta
        
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 1: Migrando Periodos Académicos")
        self.stdout.write("=" * 60)

        periodos_unicos = (
            StgOracleGrupoAcademico.objects
            .filter(estado_registro='valido')
            .values_list('periodo_academico', flat=True)
            .distinct()
        )

        if limit:
            periodos_unicos = periodos_unicos[:limit]

        periodos_creados = 0
        periodos_existentes = 0

        for periodo_nombre in periodos_unicos:
            if not periodo_nombre:
                continue

            if not dry_run:
                # Extraer año del nombre del período (ej: "2026-1" o "20261")
                try:
                    if 'C' in periodo_nombre or 'F' in periodo_nombre or 'V' in periodo_nombre:
                        year = int(periodo_nombre[:4])
                    else:
                        year = int(periodo_nombre[:4])
                except:
                    year = datetime.now().year

                # Crear fechas aproximadas para el período
                fecha_inicio = datetime(year, 1, 15).date()
                fecha_fin = datetime(year, 12, 15).date()

                obj, created = PeriodoAcademico.objects.get_or_create(
                    nombre=periodo_nombre,
                    defaults={
                        'fecha_inicio': fecha_inicio,
                        'fecha_fin': fecha_fin,
                        'activo': True
                    }
                )
                if created:
                    periodos_creados += 1
                else:
                    periodos_existentes += 1
            else:
                periodos_creados += 1

        self.stdout.write(
            self.style.SUCCESS(f'Periodos - Creados: {periodos_creados}, Existentes: {periodos_existentes}')
        )

    def migrate_grupos(self, dry_run=False, limit=None):
        """Migra grupos desde StgOracleGrupoAcademico"""
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 2: Migrando Grupos Académicos")
        self.stdout.write("=" * 60)

        stg_grupos = StgOracleGrupoAcademico.objects.filter(estado_registro='valido')
        if limit:
            stg_grupos = stg_grupos[:limit]

        grupos_creados = 0
        grupos_existentes = 0
        grupos_error = 0
        programa_no_encontrado = 0
        periodo_no_encontrado = 0

        for stg_grupo in stg_grupos:
            try:
                # Resolver Programa por nombre (más robusto que por ID)
                nombre_prog = stg_grupo.nombre_programa_oracle or ''
                programa = None
                if nombre_prog:
                    programa = Programa.objects.filter(nombre__icontains=nombre_prog[:50]).first()
                
                if not programa:
                    try:
                        id_programa = int(stg_grupo.id_programa_oracle)
                        programa = Programa.objects.filter(id=id_programa).first()
                    except (ValueError, TypeError):
                        programa = None

                if not programa:
                    programa_no_encontrado += 1
                    grupos_error += 1
                    if grupos_error <= 5:  # Log solo los primeros 5
                        self.stdout.write(
                            self.style.WARNING(
                                f'  Programa no encontrado: id={stg_grupo.id_programa_oracle}, nombre={nombre_prog}'
                            )
                        )
                    continue

                # Resolver Período (por nombre del período académico)
                periodo = PeriodoAcademico.objects.filter(
                    nombre=stg_grupo.periodo_academico
                ).first()

                if not periodo:
                    periodo_no_encontrado += 1
                    grupos_error += 1
                    if grupos_error <= 5:
                        self.stdout.write(
                            self.style.WARNING(
                                f'  Período no encontrado: {stg_grupo.periodo_academico}'
                            )
                        )
                    continue

                nombre = stg_grupo.nombre_grupo_oracle or f'Grupo {stg_grupo.id_grupo_oracle}'
                semestre = stg_grupo.semestre_oracle or 1

                if not dry_run:
                    obj, created = Grupo.objects.get_or_create(
                        nombre=nombre,
                        programa=programa,
                        periodo=periodo,
                        defaults={
                            'semestre': semestre,
                            'activo': True
                        }
                    )
                    if created:
                        grupos_creados += 1
                    else:
                        grupos_existentes += 1
                else:
                    grupos_creados += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  Error en grupo {stg_grupo.id_grupo_oracle}: {str(e)}'))
                grupos_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Grupos - Creados: {grupos_creados}, Existentes: {grupos_existentes}, Errores: {grupos_error} '
                f'(Programa no encontrado: {programa_no_encontrado}, Período no encontrado: {periodo_no_encontrado})'
            )
        )

    def migrate_docentes(self, dry_run=False, limit=None):
        """Migra docentes desde StgOracleDocente"""
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 3: Migrando Docentes")
        self.stdout.write("=" * 60)

        stg_docentes = StgOracleDocente.objects.filter(estado_registro='valido')
        if limit:
            stg_docentes = stg_docentes[:limit]

        docentes_creados = 0
        docentes_existentes = 0
        docentes_error = 0
        rol_docente = self._find_role('docente')

        for stg_docente in stg_docentes:
            try:
                # Construir nombre completo
                nombres = stg_docente.nombres or ''
                apellidos = stg_docente.apellidos or ''
                nombre = f"{nombres} {apellidos}".strip()
                if not nombre:
                    nombre = f"Docente {stg_docente.numero_documento}"

                source_system = stg_docente.source_system or 'ORACLE_SIU'

                # Seleccionar email
                correo = stg_docente.correo_institucional or stg_docente.correo_personal
                if not correo:
                    base_id = (
                        stg_docente.numero_documento
                        or stg_docente.id_docente_oracle
                        or stg_docente.external_id
                        or 'docente'
                    )
                    correo = f"{base_id}@docente.local"

                # Asegurar unicidad del email
                base_correo = correo
                counter = 1
                while Usuario.objects.filter(correo=correo).exists():
                    if '@' in base_correo:
                        local, domain = base_correo.rsplit('@', 1)
                        correo = f"{local}{counter}@{domain}"
                    else:
                        correo = f"{base_correo}{counter}@docente.local"
                    counter += 1

                sede = self._resolve_sede(source_system, stg_docente.id_sede_oracle)
                facultad = self._resolve_facultad(source_system, stg_docente.id_facultad_oracle)
                activo = (stg_docente.estado_docente or '').strip().lower() not in ('inactivo', '0', 'false', 'no')

                if not dry_run:
                    obj, created = Usuario.objects.get_or_create(
                        correo=correo,
                        defaults={
                            'nombre': nombre,
                            'activo': activo,
                            'is_active': activo,
                            'rol': rol_docente,
                            'sede': sede,
                            'facultad': facultad,
                        }
                    )
                    if not created:
                        changed = False
                        if obj.nombre != nombre:
                            obj.nombre = nombre
                            changed = True
                        if obj.activo != activo:
                            obj.activo = activo
                            obj.is_active = activo
                            changed = True
                        if rol_docente and obj.rol_id != rol_docente.id:
                            obj.rol = rol_docente
                            changed = True
                        if sede and obj.sede_id != sede.id:
                            obj.sede = sede
                            changed = True
                        if facultad and obj.facultad_id != facultad.id:
                            obj.facultad = facultad
                            changed = True
                        if changed:
                            obj.save()
                    if created:
                        docentes_creados += 1
                    else:
                        docentes_existentes += 1
                else:
                    docentes_creados += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error en docente {stg_docente.numero_documento}: {str(e)}')
                )
                docentes_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Docentes - Creados: {docentes_creados}, Existentes: {docentes_existentes}, Errores: {docentes_error}'
            )
        )

    def migrate_estudiantes(self, dry_run=False, limit=None):
        """Migra estudiantes desde StgOracleEstudiante"""
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 3B: Migrando Estudiantes")
        self.stdout.write("=" * 60)

        stg_estudiantes = StgOracleEstudiante.objects.filter(estado_registro='valido')
        if limit:
            stg_estudiantes = stg_estudiantes[:limit]

        estudiantes_creados = 0
        estudiantes_existentes = 0
        estudiantes_error = 0
        rol_estudiante = self._find_role('estudiante')

        for stg_estudiante in stg_estudiantes:
            try:
                nombres = stg_estudiante.nombres or ''
                apellidos = stg_estudiante.apellidos or ''
                nombre = f"{nombres} {apellidos}".strip() or stg_estudiante.nombre_completo or f"Estudiante {stg_estudiante.external_id}"

                base_id = (
                    stg_estudiante.codigo_estudiante_oracle
                    or stg_estudiante.id_estudiante_oracle
                    or stg_estudiante.external_id
                    or 'estudiante'
                )
                correo = f"{base_id}@estudiante.local"
                base_correo = correo
                counter = 1
                while Usuario.objects.filter(correo=correo).exists():
                    local, domain = base_correo.rsplit('@', 1)
                    correo = f"{local}{counter}@{domain}"
                    counter += 1

                if not dry_run:
                    obj, created = Usuario.objects.get_or_create(
                        correo=correo,
                        defaults={
                            'nombre': nombre,
                            'activo': True,
                            'is_active': True,
                            'rol': rol_estudiante,
                        }
                    )
                    if not created:
                        changed = False
                        if obj.nombre != nombre:
                            obj.nombre = nombre
                            changed = True
                        if rol_estudiante and obj.rol_id != rol_estudiante.id:
                            obj.rol = rol_estudiante
                            changed = True
                        if not obj.activo:
                            obj.activo = True
                            obj.is_active = True
                            changed = True
                        if changed:
                            obj.save()
                    if created:
                        estudiantes_creados += 1
                    else:
                        estudiantes_existentes += 1
                else:
                    estudiantes_creados += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error en estudiante {stg_estudiante.external_id}: {str(e)}')
                )
                estudiantes_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Estudiantes - Creados: {estudiantes_creados}, Existentes: {estudiantes_existentes}, Errores: {estudiantes_error}'
            )
        )

    def migrate_espacios(self, dry_run=False, limit=None):
        """Migra espacios físicos desde StgOracleEspacioFisico"""
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 4: Migrando Espacios Físicos")
        self.stdout.write("=" * 60)

        stg_espacios = StgOracleEspacioFisico.objects.filter(estado_registro='valido')
        if limit:
            stg_espacios = stg_espacios[:limit]

        espacios_creados = 0
        espacios_existentes = 0
        espacios_error = 0

        # Crear tipos de espacio si no existen
        tipo_aula, _ = TipoEspacio.objects.get_or_create(
            nombre='Aula',
            defaults={'descripcion': 'Aula de clase'}
        )

        for stg_espacio in stg_espacios:
            try:
                # Resolver Sede
                sede = self._resolve_sede(stg_espacio.source_system, stg_espacio.id_sede_oracle)

                if not sede:
                    espacios_error += 1
                    continue

                nombre = stg_espacio.nombre_espacio_oracle or stg_espacio.ident_aula_oracle
                if not nombre:
                    nombre = f'Espacio {stg_espacio.external_id}'

                if not dry_run:
                    obj, created = EspacioFisico.objects.get_or_create(
                        nombre=nombre,
                        sede=sede,
                        defaults={
                            'tipo': tipo_aula,
                            'capacidad': 0,
                            'ubicacion': stg_espacio.bloque_oracle or '',
                            'estado': 'Disponible'
                        }
                    )
                    if created:
                        espacios_creados += 1
                    else:
                        espacios_existentes += 1
                else:
                    espacios_creados += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error en espacio {stg_espacio.ident_aula_oracle}: {str(e)}')
                )
                espacios_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Espacios - Creados: {espacios_creados}, Existentes: {espacios_existentes}, Errores: {espacios_error}'
            )
        )

    def migrate_horarios(self, dry_run=False, limit=None):
        """Migra horarios desde StgOracleHorario"""
        from datetime import time as time_obj
        
        self.stdout.write("=" * 60)
        self.stdout.write("ETAPA 5: Migrando Horarios")
        self.stdout.write("=" * 60)

        stg_horarios = StgOracleHorario.objects.filter(estado_registro='valido')
        if limit:
            stg_horarios = stg_horarios[:limit]

        horarios_creados = 0
        horarios_error = 0

        for stg_horario in stg_horarios:
            try:
                # Resolver Grupo
                grupo = Grupo.objects.filter(
                    nombre__icontains=stg_horario.nombre_grupo_oracle or ''
                ).first()

                if not grupo:
                    horarios_error += 1
                    continue

                # Resolver Asignatura
                asignatura = Asignatura.objects.filter(codigo=stg_horario.id_asignatura_oracle).first()

                if not asignatura:
                    horarios_error += 1
                    continue

                # Resolver Espacio (búsqueda flexible)
                espacio = None
                if stg_horario.nom_aula_oracle:
                    espacio = EspacioFisico.objects.filter(
                        nombre__icontains=stg_horario.nom_aula_oracle
                    ).first()

                # Resolver Usuario (Docente)
                usuario = None
                if stg_horario.num_identificacion_docente:
                    usuario = Usuario.objects.filter(
                        correo__icontains=stg_horario.num_identificacion_docente
                    ).first()

                # Times por defecto
                hora_inicio = time_obj(8, 0)
                hora_fin = time_obj(10, 0)

                if not dry_run:
                    obj, created = Horario.objects.get_or_create(
                        grupo=grupo,
                        asignatura=asignatura,
                        defaults={
                            'docente': usuario,
                            'espacio': espacio,
                            'dia_semana': 'Lunes',
                            'hora_inicio': hora_inicio,
                            'hora_fin': hora_fin,
                            'estado': 'pendiente'
                        }
                    )
                    if created:
                        horarios_creados += 1
                else:
                    horarios_creados += 1

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  Error en horario: {str(e)[:100]}')
                )
                horarios_error += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Horarios - Creados: {horarios_creados}, Errores: {horarios_error}'
            )
        )
