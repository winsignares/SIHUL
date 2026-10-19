from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):

    dependencies = [
        ('facultades', '0002_facultad_sede'),
    ]

    operations = [
        migrations.AddField(
            model_name='facultad',
            name='external_id',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='facultad',
            name='source_system',
            field=models.CharField(blank=True, db_index=True, max_length=50, null=True),
        ),
        migrations.AddConstraint(
            model_name='facultad',
            constraint=models.UniqueConstraint(
                condition=Q(('external_id__isnull', False), ('source_system__isnull', False)),
                fields=('source_system', 'external_id'),
                name='uq_facultad_source_external',
            ),
        ),
    ]
