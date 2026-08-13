from django.db import migrations, models
import django.db.models.deletion


def backfill_conversacion_usuario_ref(apps, schema_editor):
    Conversacion = apps.get_model('chatbot', 'Conversacion')
    Usuario = apps.get_model('usuarios', 'Usuario')
    usuario_ids = set(Usuario.objects.values_list('id', flat=True))
    for conversacion in Conversacion.objects.filter(usuario_ref__isnull=True).only('id', 'id_usuario'):
        if conversacion.id_usuario in usuario_ids:
            conversacion.usuario_ref_id = conversacion.id_usuario
            conversacion.save(update_fields=['usuario_ref'])


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_usuario_origen'),
        ('chatbot', '0006_rename_chatbot_con_chat_id_idx_chatbot_con_chat_id_75d75e_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversacion',
            name='usuario_ref',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='conversaciones_chatbot', to='usuarios.usuario'),
        ),
        migrations.AddIndex(
            model_name='conversacion',
            index=models.Index(fields=['usuario_ref', 'fecha'], name='chatbot_con_userref_fecha_idx'),
        ),
        migrations.RunPython(backfill_conversacion_usuario_ref, migrations.RunPython.noop),
    ]
