# Migration para reemplazar ChatMessage con Conversacion

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0004_chatmessage'),
    ]

    operations = [
        # Eliminar modelo anterior
        migrations.DeleteModel(
            name='ChatMessage',
        ),
        
        # Crear nuevo modelo
        migrations.CreateModel(
            name='Conversacion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chat_id', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
                ('id_usuario', models.IntegerField(db_index=True, help_text='ID del usuario que envió el mensaje')),
                ('usuario', models.CharField(help_text='Nombre completo del usuario', max_length=255)),
                ('mensaje', models.TextField(help_text='Pregunta enviada por el usuario')),
                ('respuesta', models.TextField(help_text='Respuesta generada por el agente IA')),
                ('fecha', models.DateTimeField(db_index=True, default=django.utils.timezone.now)),
                ('chatbot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='conversaciones', to='chatbot.agente')),
            ],
            options={
                'verbose_name': 'Conversación',
                'verbose_name_plural': 'Conversaciones',
                'ordering': ['-fecha'],
            },
        ),
        
        # Agregar índices
        migrations.AddIndex(
            model_name='conversacion',
            index=models.Index(fields=['chat_id', 'fecha'], name='chatbot_con_chat_id_idx'),
        ),
        migrations.AddIndex(
            model_name='conversacion',
            index=models.Index(fields=['chatbot', 'id_usuario', 'fecha'], name='chatbot_con_chatbot_idx'),
        ),
        migrations.AddIndex(
            model_name='conversacion',
            index=models.Index(fields=['id_usuario', 'fecha'], name='chatbot_con_usuario_idx'),
        ),
    ]
