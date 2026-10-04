from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Refleja en el estado de migraciones las columnas que el servicio RAG añadió a sus
    tablas (documents, chat_messages). Los modelos son managed=False, así que esta
    migración no ejecuta SQL: las columnas las crea FastAPI al arrancar.
    """

    dependencies = [
        ('chatbot', '0008_add_chatbot_fk_to_chatbot_tables'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatbotdocument',
            name='content_hash',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='chatbotdocument',
            name='embedding_model',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='chatbotappmessage',
            name='chat_id',
            field=models.CharField(blank=True, db_index=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name='chatbotappmessage',
            name='id_usuario',
            field=models.BigIntegerField(blank=True, db_index=True, null=True),
        ),
    ]
