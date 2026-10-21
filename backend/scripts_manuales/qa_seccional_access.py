from types import SimpleNamespace

from mysite.api_views import EspacioFisicoViewSet
from sedes.models import Seccional, Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario


def get_visible_espacios(user):
    view = EspacioFisicoViewSet()
    view.request = SimpleNamespace(user=user, user_obj=None, seccional=None)
    return list(view.get_queryset().order_by('nombre').values_list('nombre', flat=True))


def ensure_user(correo, nombre, rol, sede, seccional, is_superuser=False):
    usuario, created = Usuario.objects.get_or_create(
        correo=correo,
        defaults={
            'nombre': nombre,
            'rol': rol,
            'sede': sede,
            'seccional': seccional,
            'activo': True,
            'es_superusuario': is_superuser,
            'is_superuser': is_superuser,
            'is_staff': is_superuser,
        },
    )

    if not created:
        usuario.nombre = nombre
        usuario.rol = rol
        usuario.sede = sede
        usuario.seccional = seccional
        usuario.activo = True
        usuario.es_superusuario = is_superuser
        usuario.is_superuser = is_superuser
        usuario.is_staff = is_superuser

    usuario.set_password('QaPass123!')
    usuario.contrasena_hash = usuario.password
    usuario.save()
    return usuario


failures = []

seccional_a, _ = Seccional.objects.get_or_create(
    ciudad='QA Ciudad Norte',
    defaults={'activa': True},
)
seccional_b, _ = Seccional.objects.get_or_create(
    ciudad='QA Ciudad Sur',
    defaults={'activa': True},
)

sede_a, _ = Sede.objects.get_or_create(
    nombre='QA Sede Norte',
    defaults={
        'direccion': 'QA Calle 1',
        'seccional': seccional_a,
        'activa': True,
    },
)
if sede_a.seccional_id != seccional_a.id:
    sede_a.seccional = seccional_a
    sede_a.save(update_fields=['seccional'])

sede_b, _ = Sede.objects.get_or_create(
    nombre='QA Sede Sur',
    defaults={
        'direccion': 'QA Calle 2',
        'seccional': seccional_b,
        'activa': True,
    },
)
if sede_b.seccional_id != seccional_b.id:
    sede_b.seccional = seccional_b
    sede_b.save(update_fields=['seccional'])

tipo, _ = TipoEspacio.objects.get_or_create(nombre='QA Aula', defaults={'descripcion': 'Espacio QA'})

espacio_a, _ = EspacioFisico.objects.get_or_create(
    nombre='QA ESPACIO NORTE',
    defaults={
        'sede': sede_a,
        'tipo': tipo,
        'capacidad': 30,
        'ubicacion': 'Bloque N',
        'estado': 'Disponible',
    },
)
if espacio_a.sede_id != sede_a.id:
    espacio_a.sede = sede_a
    espacio_a.save(update_fields=['sede'])

espacio_b, _ = EspacioFisico.objects.get_or_create(
    nombre='QA ESPACIO SUR',
    defaults={
        'sede': sede_b,
        'tipo': tipo,
        'capacidad': 30,
        'ubicacion': 'Bloque S',
        'estado': 'Disponible',
    },
)
if espacio_b.sede_id != sede_b.id:
    espacio_b.sede = sede_b
    espacio_b.save(update_fields=['sede'])

rol_docente, _ = Rol.objects.get_or_create(nombre='DOCENTE', defaults={'descripcion': 'Rol docente QA'})
rol_admin_global, _ = Rol.objects.get_or_create(
    nombre='ADMIN_GLOBAL',
    defaults={'descripcion': 'Rol admin global QA'},
)

user_norte = ensure_user(
    correo='qa.norte@sihul.local',
    nombre='QA Usuario Norte',
    rol=rol_docente,
    sede=sede_a,
    seccional=seccional_a,
    is_superuser=False,
)

user_sur = ensure_user(
    correo='qa.sur@sihul.local',
    nombre='QA Usuario Sur',
    rol=rol_docente,
    sede=sede_b,
    seccional=seccional_b,
    is_superuser=False,
)

user_admin_global = ensure_user(
    correo='qa.admin.global@sihul.local',
    nombre='QA Admin Global',
    rol=rol_admin_global,
    sede=sede_a,
    seccional=seccional_a,
    is_superuser=False,
)

user_superuser = ensure_user(
    correo='qa.superuser@sihul.local',
    nombre='QA Superuser',
    rol=rol_docente,
    sede=sede_b,
    seccional=seccional_b,
    is_superuser=True,
)

visible_norte = get_visible_espacios(user_norte)
visible_sur = get_visible_espacios(user_sur)
visible_admin = get_visible_espacios(user_admin_global)
visible_super = get_visible_espacios(user_superuser)

print('--- RESULTADOS DE ACCESO POR SECCIONAL ---')
print(f'Usuario Norte ve: {visible_norte}')
print(f'Usuario Sur ve: {visible_sur}')
print(f'Admin Global ve: {visible_admin}')
print(f'Superuser ve: {visible_super}')

if 'QA ESPACIO NORTE' not in visible_norte or 'QA ESPACIO SUR' in visible_norte:
    failures.append('Usuario Norte no está filtrado correctamente por su seccional.')

if 'QA ESPACIO SUR' not in visible_sur or 'QA ESPACIO NORTE' in visible_sur:
    failures.append('Usuario Sur no está filtrado correctamente por su seccional.')

if 'QA ESPACIO NORTE' not in visible_admin or 'QA ESPACIO SUR' not in visible_admin:
    failures.append('Admin Global debería ver espacios de todas las seccionales.')

if 'QA ESPACIO NORTE' not in visible_super or 'QA ESPACIO SUR' not in visible_super:
    failures.append('Superuser debería ver espacios de todas las seccionales.')

if failures:
    print('--- FALLAS ---')
    for failure in failures:
        print(f'- {failure}')
    raise SystemExit(1)

print('--- OK: Todas las validaciones pasaron ---')
