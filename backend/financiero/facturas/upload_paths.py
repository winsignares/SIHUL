import re
import unicodedata

from django.utils import timezone


def _safe_path_segment(value, fallback='sin-dato'):
    text = unicodedata.normalize('NFKD', str(value or fallback))
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^A-Za-z0-9._-]+', '-', text).strip('.-')
    return text[:80] or fallback


def documento_financiero_upload_to(instance, filename):
    factura = getattr(instance, 'factura', None)
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    factura_label = _safe_path_segment(
        getattr(factura, 'numero_factura', None) or (f'factura-{getattr(factura, "id", "")}' if factura else 'sin-factura')
    )
    safe_filename = _safe_path_segment(filename, fallback='documento')
    return f'{date:%Y}/{date:%m}/{factura_label}/especificos/{safe_filename}'
