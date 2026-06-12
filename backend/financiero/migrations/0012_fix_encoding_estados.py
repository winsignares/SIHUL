"""
Migration to fix double-encoded UTF-8 characters in estado and etapa_actual fields
of the Factura model, and in nombre fields of CuentaContable and CentroCosto.

These garbled strings were caused by the views.py source file being saved with wrong
encoding (UTF-8 bytes misinterpreted as Latin-1 and then re-saved as UTF-8).
"""
from django.db import migrations

ENCODING_FIXES = [
    # (garbled, correct)
    ('Aprobada AuditorÃ­a', 'Aprobada Auditoría'),
    ('Rechazada AuditorÃ­a', 'Rechazada Auditoría'),
    ('Enviada RectorÃ­a', 'Enviada Rectoría'),
    ('Rechazada por RectorÃ­a', 'Rechazada por Rectoría'),
    ('Rechazada por RectorÃƒÂ­', 'Rechazada por Rectoría'),
    ('Enviada RectorÃƒÂ­', 'Enviada Rectoría'),
    # Simpler ASCII-like fallbacks kept for safety
    ('AuditorÃ­a', 'Auditoría'),
    ('TesorÃ­a', 'Tesorería'),
    ('DirecciÃ³n Financiera', 'Dirección Financiera'),
    ('RectorÃ­a', 'Rectoría'),
    ('CausaciÃ³n', 'Causación'),
    ('CorrecciÃ³n', 'Corrección'),
    ('AutorizaciÃ³n', 'Autorización'),
    ('RecepciÃ³n', 'Recepción'),
    ('Servicios pÃºblicos', 'Servicios públicos'),
    ('DÃ©bito', 'Débito'),
    ('CrÃ©dito', 'Crédito'),
    ('AdministraciÃ³n General', 'Administración General'),
    ('GestiÃ³n AcadÃ©mica', 'Gestión Académica'),
    ('AcadÃ©mico', 'Académico'),
    ('OperaciÃ³n Institucional', 'Operación Institucional'),
]


def fix_encoding_in_db(apps, schema_editor):
    Factura = apps.get_model('financiero', 'Factura')
    CuentaContable = apps.get_model('financiero', 'CuentaContable')
    CentroCosto = apps.get_model('financiero', 'CentroCosto')

    garbled_chars = [old for old, _ in ENCODING_FIXES]

    # Fix Factura.estado
    for factura in Factura.objects.all():
        changed = False
        for garbled, correct in ENCODING_FIXES:
            if garbled in (factura.estado or ''):
                factura.estado = factura.estado.replace(garbled, correct)
                changed = True
            if garbled in (factura.etapa_actual or ''):
                factura.etapa_actual = factura.etapa_actual.replace(garbled, correct)
                changed = True
            if garbled in (factura.observaciones or ''):
                factura.observaciones = factura.observaciones.replace(garbled, correct)
                changed = True
        if changed:
            factura.save(update_fields=['estado', 'etapa_actual', 'observaciones'])

    # Fix CuentaContable.nombre and naturaleza
    for cuenta in CuentaContable.objects.all():
        changed = False
        for garbled, correct in ENCODING_FIXES:
            if garbled in (cuenta.nombre or ''):
                cuenta.nombre = cuenta.nombre.replace(garbled, correct)
                changed = True
            if garbled in (cuenta.naturaleza or ''):
                cuenta.naturaleza = cuenta.naturaleza.replace(garbled, correct)
                changed = True
        if changed:
            cuenta.save(update_fields=['nombre', 'naturaleza'])

    # Fix CentroCosto.nombre and tipo
    for centro in CentroCosto.objects.all():
        changed = False
        for garbled, correct in ENCODING_FIXES:
            if garbled in (centro.nombre or ''):
                centro.nombre = centro.nombre.replace(garbled, correct)
                changed = True
            if garbled in (getattr(centro, 'tipo', '') or ''):
                centro.tipo = centro.tipo.replace(garbled, correct)
                changed = True
        if changed:
            centro.save(update_fields=['nombre', 'tipo'])


def reverse_noop(apps, schema_editor):
    pass  # Non-destructive: no reverse needed


class Migration(migrations.Migration):

    dependencies = [
        ('financiero', '0011_documento_adjunto_upload_to_organizado'),
    ]

    operations = [
        migrations.RunPython(fix_encoding_in_db, reverse_noop),
    ]
