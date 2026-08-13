from django.db import migrations, models
import django.db.models.deletion


def backfill_notificacion_usuario(apps, schema_editor):
    Notificacion = apps.get_model('notificaciones', 'Notificacion')
    Usuario = apps.get_model('usuarios', 'Usuario')
    usuario_ids = set(Usuario.objects.values_list('id', flat=True))
    for notificacion in Notificacion.objects.filter(usuario__isnull=True).only('id', 'id_usuario'):
        if notificacion.id_usuario in usuario_ids:
            notificacion.usuario_id = notificacion.id_usuario
            notificacion.save(update_fields=['usuario'])


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_usuario_origen'),
        ('notificaciones', '0003_alter_notificacion_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacion',
            name='usuario',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to='usuarios.usuario'),
        ),
        migrations.RunPython(backfill_notificacion_usuario, migrations.RunPython.noop),
    ]
