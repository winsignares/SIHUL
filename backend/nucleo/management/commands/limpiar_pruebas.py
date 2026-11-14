"""Borra lo que se creó durante las pruebas: todo registro cuyo nombre empieza por «PRUEBA» (sin distinguir
mayúsculas), además del usuario de pruebas. Por defecto solo cuenta; para borrar hay que pasar --confirmar.

    python manage.py limpiar_pruebas                 # muestra qué se borraría
    python manage.py limpiar_pruebas --confirmar     # lo borra
    python manage.py limpiar_pruebas --prefijo PRUEBA-X --confirmar

Al probar, ponle ese prefijo a todo lo que crees (sedes, espacios, facturas, proveedores, motivos de préstamo...).
Si algo no se puede borrar porque otra cosa depende de él, se informa y se sigue con lo demás.
"""
from django.apps import apps
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import ProtectedError

# (app, modelo, campo por el que se busca el prefijo), en el orden en que se puede borrar sin romper dependencias.
OBJETIVOS = (
    ('prestamos', 'PrestamoEspacio', 'motivo'),
    ('horario', 'SolicitudEspacio', 'espacio_solicitado__nombre'),
    ('horario', 'Horario', 'espacio__nombre'),
    ('financiero', 'Factura', 'numero_factura'),
    ('financiero', 'Proveedor', 'razon_social'),
    ('espacios', 'EspacioFisico', 'nombre'),
    ('recursos', 'Recurso', 'nombre'),
    ('grupos', 'Grupo', 'nombre'),
    ('asignaturas', 'Asignatura', 'nombre'),
    ('programas', 'Programa', 'nombre'),
    ('facultades', 'Facultad', 'nombre'),
    ('periodos', 'PeriodoAcademico', 'nombre'),
    ('sedes', 'Sede', 'nombre'),
    ('usuarios', 'Usuario', 'correo'),
)


class Command(BaseCommand):
    help = 'Borra lo creado en las pruebas (registros cuyo nombre empieza por el prefijo). Sin --confirmar solo cuenta.'

    def add_arguments(self, parser):
        parser.add_argument('--prefijo', default='PRUEBA')
        parser.add_argument('--confirmar', action='store_true')

    def handle(self, *args, **opciones):
        prefijo = opciones['prefijo']
        confirmar = opciones['confirmar']
        total = 0
        for app, nombre, campo in OBJETIVOS:
            modelo = apps.get_model(app, nombre)
            consulta = modelo.objects.filter(**{f'{campo}__istartswith': prefijo})
            cantidad = consulta.count()
            if not cantidad:
                continue
            if not confirmar:
                self.stdout.write(f'  {nombre}: {cantidad}')
                total += cantidad
                continue
            ids_usuarios = list(consulta.values_list('id', flat=True)) if nombre == 'Usuario' else []
            try:
                with transaction.atomic():
                    consulta.delete()
                if ids_usuarios:  # al borrar un usuario el sistema puede generar avisos a su nombre: se quitan también
                    self._borrar_notificaciones(ids_usuarios)
                self.stdout.write(f'  {nombre}: {cantidad} borrados')
                total += cantidad
            except ProtectedError:
                self.stdout.write(self.style.WARNING(f'  {nombre}: {cantidad} no se pueden borrar todavía (algo depende de ellos)'))
        if not total:
            self.stdout.write('No hay nada con ese prefijo.')
        elif not confirmar:
            self.stdout.write(f'Se borrarían {total} registros. Para borrarlos: --confirmar')

    def _borrar_notificaciones(self, ids_usuarios):
        apps.get_model('notificaciones', 'Notificacion').objects.filter(id_usuario__in=ids_usuarios).delete()
