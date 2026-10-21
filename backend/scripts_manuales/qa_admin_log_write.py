from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.contenttypes.models import ContentType

from usuarios.models import Usuario

user = Usuario.objects.filter(is_superuser=True).first()
if not user:
    raise SystemExit('No hay usuario superuser para probar django_admin_log')

ct = ContentType.objects.get_for_model(Usuario)
entry = LogEntry.objects.log_action(
    user_id=user.id,
    content_type_id=ct.id,
    object_id=str(user.id),
    object_repr=user.nombre,
    action_flag=CHANGE,
    change_message='Prueba de escritura en django_admin_log tras fix de FK',
)

print(f'LogEntry creado: id={entry.id}, user_id={entry.user_id}')
