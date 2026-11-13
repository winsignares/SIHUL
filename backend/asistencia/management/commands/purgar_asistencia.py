"""Borra los registros de ubicación más antiguos que el plazo de conservación."""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from asistencia.models import RegistroAsistencia


class Command(BaseCommand):
    help = 'Elimina registros de asistencia con más de N días (por defecto 90).'

    def add_arguments(self, parser):
        parser.add_argument('--dias', type=int, default=90)

    def handle(self, *args, **opciones):
        limite = timezone.now() - timedelta(days=opciones['dias'])
        borrados, _ = RegistroAsistencia.objects.filter(registrado_en__lt=limite).delete()
        self.stdout.write(f'Registros eliminados: {borrados}')
