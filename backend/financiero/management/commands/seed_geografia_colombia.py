"""Carga los departamentos y municipios colombianos desde DIVIPOLA (DANE)."""

from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q

from financiero.models import Ciudad, DepartamentoGeografico, Pais


DANE_BASE_URL = (
    'https://geoportal.dane.gov.co/mparcgis/rest/services/'
    'Divipola/Serv_DIVIPOLA_MGN_2025/MapServer'
)
DEPARTAMENTOS_LAYER = f'{DANE_BASE_URL}/319/query'
MUNICIPIOS_LAYER = f'{DANE_BASE_URL}/317/query'


def _fetch_features(url: str, fields: str) -> list[dict]:
    query = urlencode({
        'f': 'json',
        'where': '1=1',
        'outFields': fields,
        'returnGeometry': 'false',
    })
    request = Request(
        f'{url}?{query}',
        headers={'User-Agent': 'SIHUL/1.0 (catalogo-geografico)'},
    )
    try:
        with urlopen(request, timeout=90) as response:
            payload = json.load(response)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise CommandError(f'No fue posible consultar DIVIPOLA del DANE: {exc}') from exc

    if payload.get('error'):
        raise CommandError(f"DIVIPOLA del DANE devolvió un error: {payload['error']}")

    features = payload.get('features')
    if not isinstance(features, list):
        raise CommandError('La respuesta de DIVIPOLA no contiene entidades geográficas válidas.')
    return features


class Command(BaseCommand):
    help = (
        'Carga o actualiza todos los departamentos y municipios de Colombia '
        'desde el servicio oficial DIVIPOLA del DANE. No elimina datos existentes.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Consulta y valida la fuente, pero no realiza cambios en la base de datos.',
        )

    def handle(self, *args, **options):
        self.stdout.write('Consultando DIVIPOLA del DANE...')
        departamentos_features = _fetch_features(
            DEPARTAMENTOS_LAYER,
            'DPTO_CCDGO,DPTO_CNMBRE',
        )
        municipios_features = _fetch_features(
            MUNICIPIOS_LAYER,
            'DPTO_CCDGO,DPTO_CNMBRE,MPIO_CCDGO,MPIO_CDPMP,MPIO_CNMBRE',
        )

        departamentos = {
            str(feature.get('attributes', {}).get('DPTO_CCDGO') or '').zfill(2):
            str(feature.get('attributes', {}).get('DPTO_CNMBRE') or '').strip()
            for feature in departamentos_features
        }
        departamentos = {
            codigo: nombre for codigo, nombre in departamentos.items()
            if codigo and nombre
        }

        municipios = []
        for feature in municipios_features:
            attributes = feature.get('attributes', {})
            codigo_departamento = str(attributes.get('DPTO_CCDGO') or '').zfill(2)
            nombre_departamento = str(attributes.get('DPTO_CNMBRE') or '').strip()
            nombre_municipio = str(attributes.get('MPIO_CNMBRE') or '').strip()
            if codigo_departamento and nombre_departamento and nombre_municipio:
                municipios.append((codigo_departamento, nombre_departamento, nombre_municipio))

        # DIVIPOLA contiene 33 entidades departamentales y más de 1.100 municipios.
        if len(departamentos) < 33 or len(municipios) < 1100:
            raise CommandError(
                f'La respuesta parece incompleta ({len(departamentos)} departamentos, '
                f'{len(municipios)} municipios). No se modificó la base de datos.'
            )

        self.stdout.write(
            f'Fuente validada: {len(departamentos)} departamentos y {len(municipios)} municipios.'
        )
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('Simulación completada: no se realizaron cambios.'))
            return

        with transaction.atomic():
            colombia, _ = Pais.objects.update_or_create(
                codigo_iso='COL',
                defaults={'nombre': 'Colombia', 'activo': True},
            )

            departamentos_db = {}
            for codigo, nombre in departamentos.items():
                departamento = DepartamentoGeografico.objects.filter(pais=colombia).filter(
                    Q(codigo=codigo) | Q(nombre=nombre)
                ).first()
                if departamento:
                    departamento.codigo = codigo
                    departamento.nombre = nombre
                    departamento.activo = True
                    departamento.save(update_fields=['codigo', 'nombre', 'activo', 'fecha_modificacion'])
                else:
                    departamento = DepartamentoGeografico.objects.create(
                        pais=colombia,
                        codigo=codigo,
                        nombre=nombre,
                        activo=True,
                    )
                departamentos_db[codigo] = departamento

            ciudades_creadas = 0
            ciudades_actualizadas = 0
            for codigo_departamento, nombre_departamento, nombre_municipio in municipios:
                departamento = departamentos_db.get(codigo_departamento)
                if not departamento:
                    departamento = DepartamentoGeografico.objects.filter(pais=colombia).filter(
                        Q(codigo=codigo_departamento) | Q(nombre=nombre_departamento)
                    ).first()
                    if departamento:
                        departamento.codigo = codigo_departamento
                        departamento.nombre = nombre_departamento
                        departamento.activo = True
                        departamento.save(update_fields=['codigo', 'nombre', 'activo', 'fecha_modificacion'])
                    else:
                        departamento = DepartamentoGeografico.objects.create(
                            pais=colombia,
                            codigo=codigo_departamento,
                            nombre=nombre_departamento,
                            activo=True,
                        )
                    departamentos_db[codigo_departamento] = departamento

                _, created = Ciudad.objects.update_or_create(
                    departamento=departamento,
                    nombre=nombre_municipio,
                    defaults={'activo': True},
                )
                if created:
                    ciudades_creadas += 1
                else:
                    ciudades_actualizadas += 1

        self.stdout.write(self.style.SUCCESS(
            'Catálogo geográfico actualizado: '
            f'{len(departamentos_db)} departamentos; '
            f'{ciudades_creadas} municipios creados; '
            f'{ciudades_actualizadas} municipios verificados/actualizados.'
        ))
