from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('chatbot', '0007_chatbotappmessage_chatbotchunk_chatbotdocument'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatbotdocument',
            name='chatbot',
            field=models.ForeignKey(
                blank=True,
                null=True,
                db_column='chatbot_id',
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='documentos',
                to='chatbot.agente',
            ),
        ),
        migrations.AddField(
            model_name='chatbotchunk',
            name='chatbot',
            field=models.ForeignKey(
                blank=True,
                null=True,
                db_column='chatbot_id',
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='chunks',
                to='chatbot.agente',
            ),
        ),
        migrations.AddField(
            model_name='chatbotappmessage',
            name='chatbot',
            field=models.ForeignKey(
                blank=True,
                null=True,
                db_column='chatbot_id',
                db_constraint=False,
                on_delete=django.db.models.deletion.DO_NOTHING,
                related_name='mensajes_app',
                to='chatbot.agente',
            ),
        ),
    ]
