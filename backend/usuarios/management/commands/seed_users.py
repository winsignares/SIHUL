from django.core.management.base import BaseCommand
from usuarios.models import Usuario, Rol
from facultades.models import Facultad

class Command(BaseCommand):
    help = 'Seeds the database with initial users'

    def handle(self, *args, **options):
        # Definir usuarios de prueba
        users_data = [
            {
                'nombre': 'Administrador General',
                'correo': 'admin@unilibre.edu.co',
                'contrasena': 'admin123',
                'rol': 'admin',
                'facultad': None
            },
            {
                'nombre': 'Planeación Ingeniería',
                'correo': 'planeacion.ingenieria@unilibre.edu.co',
                'contrasena': 'plan123',
                'rol': 'planeacion_facultad',
                'facultad': 'Ingeniería'
            },
            {
                'nombre': 'Planeación Derecho',
                'correo': 'planeacion.derecho@unilibre.edu.co',
                'contrasena': 'plan123',
                'rol': 'planeacion_facultad',
                'facultad': 'Derecho'
            },
            {
                'nombre': 'Supervisor General',
                'correo': 'supervisor@unilibre.edu.co',
                'contrasena': 'sup123',
                'rol': 'supervisor_general',
                'facultad': None
            },
            {
                'nombre': 'Docente Prueba',
                'correo': 'docente@unilibre.edu.co',
                'contrasena': 'doc123',
                'rol': 'docente',
                'facultad': 'Ingeniería'
            },
            {
                'nombre': 'Estudiante Prueba',
                'correo': 'estudiante@unilibre.edu.co',
                'contrasena': 'est123',
                'rol': 'estudiante',
                'facultad': 'Ingeniería'
            }
        ]

        for u_data in users_data:
            try:
                rol = Rol.objects.get(nombre=u_data['rol'])
                facultad = None
                if u_data['facultad']:
                    facultad = Facultad.objects.get(nombre=u_data['facultad'])
                
                user, created = Usuario.objects.get_or_create(
                    correo=u_data['correo'],
                    defaults={
                        'nombre': u_data['nombre'],
                        'contrasena_hash': u_data['contrasena'],
                        'rol': rol,
                        'facultad': facultad,
                        'activo': True
                    }
                )
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Created user "{user.nombre}" ({user.correo})'))
                else:
                    # Actualizar si ya existe para asegurar consistencia
                    user.nombre = u_data['nombre']
                    user.contrasena_hash = u_data['contrasena']
                    user.rol = rol
                    user.facultad = facultad
                    user.save()
                    self.stdout.write(f'Updated user "{user.nombre}"')

            except Rol.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Role "{u_data["rol"]}" not found. Run seed_roles first.'))
            except Facultad.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Faculty "{u_data["facultad"]}" not found. Run seed_facultades first.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating user {u_data["correo"]}: {str(e)}'))
