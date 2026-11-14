"""Crea (o restablece) un usuario de pruebas con acceso a todos los módulos, para probar el sistema sin entrar con
cuentas reales. La clave se genera al azar y se muestra una sola vez.

    python manage.py crear_usuario_pruebas                       # crea o restablece la clave
    python manage.py crear_usuario_pruebas --seccional Cali
    python manage.py crear_usuario_pruebas --eliminar            # borra el usuario

El usuario tiene rol administrador, permisos de edición sobre todos los componentes y alcance de administrador general.
Su correo empieza por «prueba.» para que `limpiar_pruebas` también lo encuentre. Debe borrarse al terminar.
"""
import secrets

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from academico.sedes.models import Seccional
from identidad.componentes.models import Componente, ComponenteRol, ComponenteUsuario
from identidad.usuarios.models import Rol, Usuario

CORREO_POR_DEFECTO = 'prueba.sistema@unilibre.edu.co'


class Command(BaseCommand):
    help = 'Crea o restablece un usuario de pruebas con todos los módulos (o lo elimina con --eliminar).'

    def add_arguments(self, parser):
        parser.add_argument('--correo', default=CORREO_POR_DEFECTO)
        parser.add_argument('--seccional', default='Barranquilla', help='Ciudad de la seccional del usuario.')
        parser.add_argument('--eliminar', action='store_true', help='Elimina el usuario de pruebas y sus permisos.')

    def handle(self, *args, **opciones):
        correo = opciones['correo'].strip().lower()
        if not correo.startswith('prueba.'):
            raise CommandError('El correo del usuario de pruebas debe empezar por «prueba.».')

        if opciones['eliminar']:
            borrados, _ = Usuario.objects.filter(correo=correo).delete()
            self.stdout.write(f'Usuario de pruebas eliminado ({borrados} registros).' if borrados else 'No existe ese usuario.')
            return

        seccional = Seccional.objects.filter(ciudad__iexact=opciones['seccional']).first()
        if seccional is None:
            raise CommandError(f'No existe la seccional «{opciones["seccional"]}».')
        rol = Rol.objects.filter(nombre='admin').first()
        if rol is None:
            raise CommandError('No existe el rol «admin».')

        clave = secrets.token_urlsafe(16)
        with transaction.atomic():
            usuario, creado = Usuario.objects.get_or_create(correo=correo, defaults={'nombre': 'Usuario de pruebas', 'rol': rol})
            usuario.nombre = 'Usuario de pruebas'
            usuario.rol = rol
            usuario.seccional = seccional
            usuario.activo = True
            usuario.es_superusuario = True
            usuario.contrasena_hash = make_password(clave)
            usuario.password = usuario.contrasena_hash
            usuario.save()
            for componente in Componente.objects.all():
                ComponenteUsuario.objects.update_or_create(
                    componente=componente, usuario=usuario,
                    defaults={'permiso': ComponenteRol.Permiso.EDITAR, 'activo': True},
                )

        self.stdout.write(self.style.SUCCESS(f'Usuario de pruebas {"creado" if creado else "restablecido"}.'))
        self.stdout.write(f'  correo: {correo}')
        self.stdout.write(f'  clave:  {clave}')
        self.stdout.write(f'  módulos con permiso de edición: {Componente.objects.count()}')
        self.stdout.write('La clave no se guarda en ningún lado: cópiala ahora. Al terminar: --eliminar.')
