"""Reinicia los datos operativos y catálogos del módulo financiero."""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from financiero.models import (
    Banco,
    CentroCosto,
    Ciudad,
    ComentarioFactura,
    CuentaContable,
    Departamento,
    DepartamentoGeografico,
    DocumentoAdjunto,
    DocumentoUnificado,
    Factura,
    HistorialFactura,
    Pais,
    ParametroSLA,
    ParametrosFinanciero,
    Proveedor,
    RechazoDevolucion,
    ReporteGenerado,
    TipoCuenta,
)
from mysite.management.commands.seeders.financiero_seeder import create_financiero_data


class Command(BaseCommand):
    help = (
        'Elimina datos del módulo financiero y restaura sus catálogos. '
        'Conserva usuarios, roles, componentes y cualquier otro módulo.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirma la eliminación irreversible de los registros financieros.',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            raise CommandError(
                'Operación cancelada. Ejecute de nuevo con --confirm para reiniciar financiero.'
            )

        with transaction.atomic():
            # Facturas y sus relaciones; no se elimina ningún Usuario.
            ReporteGenerado.objects.all().delete()
            ComentarioFactura.objects.all().delete()
            RechazoDevolucion.objects.all().delete()
            HistorialFactura.objects.all().delete()
            DocumentoUnificado.objects.all().delete()
            DocumentoAdjunto.objects.all().delete()
            Factura.objects.all().delete()
            Proveedor.objects.all().delete()

            # Catálogos y configuración que el seeder vuelve a crear.
            ParametroSLA.objects.all().delete()
            ParametrosFinanciero.objects.all().delete()
            CentroCosto.objects.all().delete()
            CuentaContable.objects.all().delete()
            Departamento.objects.all().delete()
            TipoCuenta.objects.all().delete()
            Banco.objects.all().delete()
            Ciudad.objects.all().delete()
            DepartamentoGeografico.objects.all().delete()
            Pais.objects.all().delete()

            create_financiero_data(self.stdout, self.style)

        self.stdout.write(self.style.SUCCESS(
            'Financiero fue reiniciado y sus catálogos fueron restaurados. '
            'No se eliminó ningún usuario.'
        ))
