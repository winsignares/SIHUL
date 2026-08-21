"""Repara catálogos geográficos y los datos de prueba de financiero."""

from __future__ import annotations

import unicodedata
from collections import defaultdict

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from financiero.models import Ciudad, DepartamentoGeografico, Pais, Proveedor
from mysite.management.commands.seeders import financiero_seeder
from usuarios.models import Usuario


def normalize(value: str | None) -> str:
    value = unicodedata.normalize('NFD', str(value or '').strip().casefold())
    return ''.join(char for char in value if unicodedata.category(char) != 'Mn')


class Command(BaseCommand):
    help = (
        'Sincroniza DIVIPOLA, elimina duplicados geográficos y restaura los '
        'usuarios/proveedores de prueba. No borra facturas ni usuarios reales.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirma la consolidación de registros geográficos duplicados.',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            raise CommandError('Operación cancelada. Ejecute de nuevo con --confirm.')

        # Primero obtiene los nombres y códigos vigentes desde la fuente oficial.
        call_command('seed_geografia_colombia', stdout=self.stdout)

        with transaction.atomic():
            departamentos_eliminados, ciudades_eliminadas = self._consolidar_geografia()
            proveedores, usuarios = self._restaurar_datos_prueba()

        self.stdout.write(self.style.SUCCESS(
            'Reparación completada: '
            f'{departamentos_eliminados} departamentos duplicados y '
            f'{ciudades_eliminadas} municipios duplicados consolidados; '
            f'{proveedores} proveedores de prueba y {usuarios} usuarios de prueba listos.'
        ))

    def _consolidar_geografia(self) -> tuple[int, int]:
        departamentos_eliminados = 0
        ciudades_eliminadas = 0

        for pais in Pais.objects.all():
            departamentos_por_nombre: dict[str, list[DepartamentoGeografico]] = defaultdict(list)
            for departamento in DepartamentoGeografico.objects.filter(pais=pais).order_by('id'):
                departamentos_por_nombre[normalize(departamento.nombre)].append(departamento)

            for duplicados in departamentos_por_nombre.values():
                if len(duplicados) < 2:
                    continue
                # Se privilegia el registro que tiene código DIVIPOLA.
                duplicados.sort(key=lambda item: (not bool(item.codigo), item.id))
                destino = duplicados[0]
                ciudades_destino = {
                    normalize(ciudad.nombre): ciudad
                    for ciudad in Ciudad.objects.filter(departamento=destino).order_by('id')
                }

                for origen in duplicados[1:]:
                    for ciudad in Ciudad.objects.filter(departamento=origen).order_by('id'):
                        existente = ciudades_destino.get(normalize(ciudad.nombre))
                        if existente:
                            ciudad.delete()
                            ciudades_eliminadas += 1
                        else:
                            ciudad.departamento = destino
                            ciudad.save(update_fields=['departamento', 'fecha_modificacion'])
                            ciudades_destino[normalize(ciudad.nombre)] = ciudad
                    origen.delete()
                    departamentos_eliminados += 1

        # También consolida variaciones de mayúsculas o tildes dentro del mismo departamento.
        for departamento in DepartamentoGeografico.objects.all():
            ciudades_por_nombre: dict[str, list[Ciudad]] = defaultdict(list)
            for ciudad in Ciudad.objects.filter(departamento=departamento).order_by('id'):
                ciudades_por_nombre[normalize(ciudad.nombre)].append(ciudad)
            for duplicados in ciudades_por_nombre.values():
                for ciudad in duplicados[1:]:
                    ciudad.delete()
                    ciudades_eliminadas += 1

        return departamentos_eliminados, ciudades_eliminadas

    def _restaurar_datos_prueba(self) -> tuple[int, int]:
        roles = financiero_seeder._seed_roles(self.stdout, self.style)
        componentes = financiero_seeder._seed_componentes(self.stdout, self.style)
        financiero_seeder._seed_permisos(roles, componentes, self.stdout, self.style)
        financiero_seeder._seed_proveedores_demo(self.stdout, self.style)
        financiero_seeder._seed_usuarios_prueba(roles, self.stdout, self.style)

        usuarios_vinculados = 0
        rol_proveedor = roles['Proveedor']
        nits_prueba = (
            '900123456-7',
            '900234567-8',
            '900345678-9',
            '900456789-0',
            '900567890-1',
        )
        for proveedor in Proveedor.objects.filter(nit__in=nits_prueba):
            nit_limpio = ''.join(char for char in proveedor.nit if char.isdigit())
            usuario, created = Usuario.objects.get_or_create(
                correo=proveedor.email,
                defaults={
                    'nombre': proveedor.razon_social,
                    'rol': rol_proveedor,
                    'activo': True,
                },
            )
            # Solo las cuentas de prueba reciben la contraseña conocida del seeder.
            usuario.set_password(f'Prov{nit_limpio}*')
            usuario.rol = rol_proveedor
            usuario.activo = True
            usuario.save()
            if proveedor.usuario_id != usuario.id:
                proveedor.usuario = usuario
                proveedor.save(update_fields=['usuario'])
                usuarios_vinculados += 1

        return len(nits_prueba), usuarios_vinculados
