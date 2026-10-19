# Generated migration

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('horario', '0003_horarioestudiante_seed'),
    ]

    operations = [
        migrations.AddField(
            model_name='horario',
            name='estado',
            field=models.CharField(
                choices=[('pendiente', 'Pendiente'), ('aprobado', 'Aprobado'), ('rechazado', 'Rechazado')],
                default='pendiente',
                max_length=20
            ),
        ),
        migrations.CreateModel(
            name='SolicitudEspacio',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('dia_semana', models.CharField(max_length=15)),
                ('hora_inicio', models.TimeField()),
                ('hora_fin', models.TimeField()),
                ('cantidad_estudiantes', models.IntegerField(blank=True, null=True)),
                ('estado', models.CharField(
                    choices=[('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')],
                    default='pendiente',
                    max_length=20
                )),
                ('fecha_solicitud', models.DateTimeField(auto_now_add=True)),
                ('fecha_aprobacion', models.DateTimeField(blank=True, null=True)),
                ('comentario', models.TextField(blank=True, null=True)),
                ('aprobado_por', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='solicitudes_aprobadas', to='usuarios.usuario')),
                ('asignatura', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solicitudes_espacio', to='asignaturas.asignatura')),
                ('docente', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='solicitudes_docente', to='usuarios.usuario')),
                ('espacio_solicitado', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solicitudes_espacio', to='espacios.espaciofisico')),
                ('grupo', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='solicitudes_espacio', to='grupos.grupo')),
                ('horario_generado', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='solicitud', to='horario.horario')),
                ('planificador', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='solicitudes_creadas', to='usuarios.usuario')),
            ],
        ),
        migrations.AddConstraint(
            model_name='solicitudespacio',
            constraint=models.CheckConstraint(check=models.Q(('hora_fin__gt', models.F('hora_inicio'))), name='chk_solicitud_horas'),
        ),
    ]
