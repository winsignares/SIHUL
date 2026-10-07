from django.db import migrations, models


class Migration(migrations.Migration):
    """
    Refleja en el estado de migraciones las columnas que el servicio RAG añadió a sus
    tablas (documents.perfil, chunks.page). Los modelos son managed=False: no ejecuta SQL,
    las columnas las crea FastAPI al arrancar.
    """

    dependencies = [
        ('chatbot', '0010_agente_tipo_instrucciones'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatbotdocument',
            name='perfil',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='chatbotchunk',
            name='page',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
