import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0014_preguntas_respuestas_anexos'),
        ('usuarios', '0013_supervisor_general_supervisa_espacios'),
    ]

    operations = [
        migrations.CreateModel(
            name='AgenteResponsable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('creado', models.DateTimeField(auto_now_add=True)),
                ('agente', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responsables', to='chatbot.agente')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chatbots_asignados', to='usuarios.usuario')),
            ],
            options={
                'verbose_name': 'Responsable de chatbot',
                'verbose_name_plural': 'Responsables de chatbots',
                'constraints': [models.UniqueConstraint(fields=('agente', 'usuario'), name='uniq_agente_responsable')],
            },
        ),
    ]
