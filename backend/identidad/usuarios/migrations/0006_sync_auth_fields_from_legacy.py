from django.db import migrations


def sync_auth_fields(apps, schema_editor):
    Usuario = apps.get_model('usuarios', 'Usuario')

    for usuario in Usuario.objects.all().iterator():
        changed = False

        if usuario.contrasena_hash and len(usuario.contrasena_hash) <= 128 and usuario.password != usuario.contrasena_hash:
            usuario.password = usuario.contrasena_hash
            changed = True

        if usuario.is_active != usuario.activo:
            usuario.is_active = usuario.activo
            changed = True

        if usuario.is_superuser != usuario.es_superusuario:
            usuario.is_superuser = usuario.es_superusuario
            changed = True

        if usuario.is_staff != usuario.es_superusuario:
            usuario.is_staff = usuario.es_superusuario
            changed = True

        if usuario.seccional_id is None and usuario.sede_id is not None:
            sede = getattr(usuario, 'sede', None)
            if sede is not None and getattr(sede, 'seccional_id', None) is not None:
                usuario.seccional_id = sede.seccional_id
                changed = True

        if changed:
            usuario.save(
                update_fields=[
                    'password',
                    'is_active',
                    'is_superuser',
                    'is_staff',
                    'seccional',
                ]
            )


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0005_alter_usuario_managers_usuario_date_joined_and_more'),
    ]

    operations = [
        migrations.RunPython(sync_auth_fields, migrations.RunPython.noop),
    ]
