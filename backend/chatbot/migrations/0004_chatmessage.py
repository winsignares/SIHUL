# Generated migration for ChatMessage model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('chatbot', '0003_update_questions'),
    ]

    operations = [
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('sender', models.CharField(choices=[('user', 'Usuario'), ('agent', 'Agente')], max_length=10)),
                ('message', models.TextField()),
                ('metadata', models.JSONField(blank=True, default=dict, null=True)),
                ('created_at', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('chatbot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mensajes', to='chatbot.agente')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='chat_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Mensaje de Chat',
                'verbose_name_plural': 'Mensajes de Chat',
                'ordering': ['chat_id', 'created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['chat_id', 'created_at'], name='chatbot_cha_chat_id_f8c5d4_idx'),
        ),
        migrations.AddIndex(
            model_name='chatmessage',
            index=models.Index(fields=['chatbot', 'user', 'created_at'], name='chatbot_cha_chatbot_a1b2c3_idx'),
        ),
    ]
