from django.db import migrations, models
import django.db.models.deletion


def _usuario_seccional_id(usuario):
    if not usuario:
        return None
    if getattr(usuario, 'seccional_id', None):
        return usuario.seccional_id
    sede = getattr(usuario, 'sede', None)
    return getattr(sede, 'seccional_id', None)


def backfill_financiero_seccional(apps, schema_editor):
    Proveedor = apps.get_model('financiero', 'Proveedor')
    Departamento = apps.get_model('financiero', 'Departamento')
    CentroCosto = apps.get_model('financiero', 'CentroCosto')
    Factura = apps.get_model('financiero', 'Factura')
    ParametroSLA = apps.get_model('financiero', 'ParametroSLA')
    ParametrosFinanciero = apps.get_model('financiero', 'ParametrosFinanciero')
    ReporteGenerado = apps.get_model('financiero', 'ReporteGenerado')

    for proveedor in Proveedor.objects.select_related('usuario__sede', 'creado_por__sede').filter(seccional__isnull=True):
        seccional_id = _usuario_seccional_id(proveedor.usuario) or _usuario_seccional_id(proveedor.creado_por)
        if seccional_id:
            proveedor.seccional_id = seccional_id
            proveedor.save(update_fields=['seccional'])

    for departamento in Departamento.objects.select_related('facultad__sede', 'responsable__sede').filter(seccional__isnull=True):
        seccional_id = getattr(getattr(departamento.facultad, 'sede', None), 'seccional_id', None) or _usuario_seccional_id(departamento.responsable)
        if seccional_id:
            departamento.seccional_id = seccional_id
            departamento.save(update_fields=['seccional'])

    for centro in CentroCosto.objects.select_related('departamento').filter(seccional__isnull=True):
        if getattr(centro.departamento, 'seccional_id', None):
            centro.seccional_id = centro.departamento.seccional_id
            centro.save(update_fields=['seccional'])

    for factura in Factura.objects.select_related(
        'proveedor',
        'departamento',
        'centro_costo',
        'creado_por__sede',
        'usuario_responsable__sede',
    ).filter(seccional__isnull=True):
        seccional_id = (
            getattr(factura.departamento, 'seccional_id', None)
            or getattr(factura.centro_costo, 'seccional_id', None)
            or getattr(factura.proveedor, 'seccional_id', None)
            or _usuario_seccional_id(factura.creado_por)
            or _usuario_seccional_id(factura.usuario_responsable)
        )
        if seccional_id:
            factura.seccional_id = seccional_id
            factura.save(update_fields=['seccional'])

    for parametro in ParametroSLA.objects.select_related('modificado_por__sede').filter(seccional__isnull=True):
        seccional_id = _usuario_seccional_id(parametro.modificado_por)
        if seccional_id:
            parametro.seccional_id = seccional_id
            parametro.save(update_fields=['seccional'])

    for parametro in ParametrosFinanciero.objects.select_related('modificado_por__sede').filter(seccional__isnull=True):
        seccional_id = _usuario_seccional_id(parametro.modificado_por)
        if seccional_id:
            parametro.seccional_id = seccional_id
            parametro.save(update_fields=['seccional'])

    for reporte in ReporteGenerado.objects.select_related('generado_por__sede').filter(seccional__isnull=True):
        seccional_id = _usuario_seccional_id(reporte.generado_por)
        if seccional_id:
            reporte.seccional_id = seccional_id
            reporte.save(update_fields=['seccional'])


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0012_usuario_origen'),
        ('facultades', '0003_facultad_external_source_fields'),
        ('sedes', '0004_oracle_staging_mapping_and_external_fields'),
        ('financiero', '0017_geografia_proveedores'),
    ]

    operations = [
        migrations.AddField(
            model_name='proveedor',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='proveedores_financieros', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='departamento',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='departamentos_financieros', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='cuentacontable',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='cuentas_contables_financieras', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='centrocosto',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='centros_costo_financieros', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='factura',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='facturas_financieras', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='parametrosla',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='parametros_sla_financieros', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='parametrosfinanciero',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='parametros_financieros', to='sedes.seccional'),
        ),
        migrations.AddField(
            model_name='reportegenerado',
            name='seccional',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='reportes_financieros', to='sedes.seccional'),
        ),
        migrations.AlterField(
            model_name='proveedor',
            name='nit',
            field=models.CharField(max_length=50),
        ),
        migrations.AlterField(
            model_name='departamento',
            name='codigo',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='cuentacontable',
            name='codigo',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='centrocosto',
            name='codigo',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='parametrosla',
            name='etapa',
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name='parametrosfinanciero',
            name='clave',
            field=models.CharField(max_length=100),
        ),
        migrations.RunPython(backfill_financiero_seccional, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='proveedor',
            constraint=models.UniqueConstraint(fields=('seccional', 'nit'), name='uq_proveedor_seccional_nit'),
        ),
        migrations.AddConstraint(
            model_name='departamento',
            constraint=models.UniqueConstraint(fields=('seccional', 'codigo'), name='uq_departamento_seccional_codigo'),
        ),
        migrations.AddConstraint(
            model_name='cuentacontable',
            constraint=models.UniqueConstraint(fields=('seccional', 'codigo'), name='uq_cuenta_seccional_codigo'),
        ),
        migrations.AddConstraint(
            model_name='centrocosto',
            constraint=models.UniqueConstraint(fields=('seccional', 'codigo'), name='uq_centro_costo_seccional_codigo'),
        ),
        migrations.AddConstraint(
            model_name='parametrosla',
            constraint=models.UniqueConstraint(fields=('seccional', 'etapa'), name='uq_sla_seccional_etapa'),
        ),
        migrations.AddConstraint(
            model_name='parametrosfinanciero',
            constraint=models.UniqueConstraint(fields=('seccional', 'clave'), name='uq_parametro_seccional_clave'),
        ),
    ]
