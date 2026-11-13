"""Proceso que ejecuta las tareas encoladas con `mysite.tareas.encolar` (TAREAS_COLA=rq)."""
from django.core.management.base import BaseCommand, CommandError

from mysite import tareas


class Command(BaseCommand):
    help = 'Ejecuta las tareas en segundo plano encoladas en Redis.'

    def add_arguments(self, parser):
        parser.add_argument('--burst', action='store_true', help='Termina al vaciar la cola.')

    def handle(self, *args, **opciones):
        if not (tareas._url_redis()):
            raise CommandError('Define REDIS_URL (o TAREAS_REDIS_URL) para usar la cola.')
        from rq import Worker

        cola = tareas.obtener_cola()
        Worker([cola], connection=cola.connection).work(burst=opciones['burst'])
