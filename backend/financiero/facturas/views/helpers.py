from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from django.db import transaction, close_old_connections
from django.conf import settings
import hashlib
import logging
import mimetypes
import os
import threading
import textwrap
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from django.utils import timezone
import unicodedata
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from financiero.facturas.models import DocumentoAdjunto
from financiero.facturas.upload_paths import _safe_path_segment


logger = logging.getLogger(__name__)


class FacturaPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200

DOCUMENTOS_SENSIBLES_POR_ROL = {
    'archivo plano bancario',
    'soporte causacion seven',
}

ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES = {
    'auditoria',
    'direccion financiera',
}

def _normalizar_texto_permiso(value):
    normalized = unicodedata.normalize('NFD', str(value or '').strip().lower())
    without_marks = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
    return ' '.join(without_marks.replace('_', ' ').replace('-', ' ').split())

def _rol_usuario_normalizado(user):
    return _normalizar_texto_permiso(getattr(getattr(user, 'rol', None), 'nombre', ''))

def _usuario_puede_ver_documentos_sensibles(user):
    return _rol_usuario_normalizado(user) in ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES

def _documento_es_sensible(documento):
    tipo = _normalizar_texto_permiso(getattr(documento, 'tipo_documento', ''))
    nombre = _normalizar_texto_permiso(getattr(documento, 'nombre_archivo', ''))
    return tipo in DOCUMENTOS_SENSIBLES_POR_ROL or 'archivo plano' in nombre

def _resolve_documento_local_path(documento):
    archivo = getattr(documento, 'archivo', None)
    if archivo:
        try:
            archivo_name = (getattr(archivo, 'name', None) or '').strip()
            if archivo_name:
                candidate = Path(settings.MEDIA_ROOT) / archivo_name
                if candidate.exists():
                    return candidate
        except Exception:
            pass

        try:
            candidate = Path(archivo.path)
            if candidate.exists():
                return candidate
        except Exception:
            pass

    raw_storage = (getattr(documento, 'url_storage', None) or '').strip()
    if not raw_storage:
        return None

    parsed = urlparse(raw_storage)
    storage_path = (parsed.path or raw_storage).strip()
    normalized = storage_path.replace('\\', '/')

    if normalized.startswith('/media/'):
        relative = normalized.replace('/media/', '', 1)
    elif normalized.startswith('media/'):
        relative = normalized.replace('media/', '', 1)
    elif normalized.startswith('/'):
        relative = normalized.lstrip('/')
    else:
        relative = normalized

    candidate = Path(settings.MEDIA_ROOT) / relative
    if candidate.exists():
        return candidate

    return None

def _documento_bytes(documento):
    nas_path = (getattr(documento, 'nas_relative_path', None) or '').strip()
    if nas_path:
        try:
            from financiero.facturas.shared_storage import shared_storage
            result = shared_storage.read_file(nas_path)
            if result.success:
                return result.content_bytes
        except Exception as exc:
            logger.warning('_documento_bytes: fallo leyendo NAS doc_id=%s nas_path=%s error=%s', documento.id, nas_path, exc)

    local_path = _resolve_documento_local_path(documento)
    if local_path:
        try:
            return local_path.read_bytes()
        except Exception as exc:
            logger.warning(
                '_documento_bytes: fallo leyendo archivo local doc_id=%s path=%s error=%s',
                documento.id, local_path, exc,
            )

    # Compatibilidad temporal para documentos históricos que todavía tienen
    # contenido binario en PostgreSQL.
    db_content = getattr(documento, 'contenido_archivo', None)
    if db_content is not None:
        return bytes(db_content)

    logger.warning(
        '_documento_bytes: no se pudo obtener bytes de ninguna fuente doc_id=%s nombre=%s url=%s nas=%s',
        documento.id,
        documento.nombre_archivo,
        getattr(documento, 'url_storage', None) or '',
        nas_path or '',
    )
    return None

def _documento_content_type(documento):
    content_type = (getattr(documento, 'tipo_mime', None) or '').strip()
    if content_type:
        return content_type
    guessed, _ = mimetypes.guess_type(getattr(documento, 'nombre_archivo', '') or '')
    return guessed or 'application/octet-stream'

AREAS_SOLICITANTES = [
    ('SOL-DER', 'Facultad de Derecho y Ciencias Políticas'),
    ('SOL-ING', 'Facultad de Ingeniería'),
    ('SOL-SAL', 'Facultad de Ciencias de la Salud'),
    ('SOL-ECO', 'Facultad de Ciencias Económicas, Administrativas y Contables'),
    ('SOL-ADM', 'Administración'),
]

ESTADO_ENVIADA_RECTORIA = 'Enviada Rector\u00eda'

ESTADO_AUTORIZADA = 'Autorizada'

ESTADO_RECHAZADA_POR_RECTORIA = 'Rechazada por Rector\u00eda'

ESTADO_REVISADA_DIRECCION_FINANCIERA = 'Revisada Dir. Financiera'

ESTADO_DEVUELTA = 'Devuelta'

ESTADO_CARGADA = 'Cargada'

def _normalize_text(value):
    return unicodedata.normalize('NFD', value or '').encode('ascii', 'ignore').decode('ascii').lower().strip()

def _estado_matches(actual, expected):
    return _normalize_text(actual) == _normalize_text(expected)

def _factura_document_base_path(factura):
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    factura_label = _safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    return Path(settings.MEDIA_ROOT) / f'{date:%Y}' / f'{date:%m}' / factura_label

def _factura_ciclo_documental_actual(factura):
    return getattr(factura, 'ciclo_documental_actual', 1) or 1

def _documentos_queryset_ciclo_actual(factura):
    return DocumentoAdjunto.objects.filter(
        factura=factura,
        ciclo_documental=_factura_ciclo_documental_actual(factura),
    )

def _documento_upload_metadata(uploaded_file):
    if uploaded_file is None:
        return None, None, None

    uploaded_file.seek(0)
    content = uploaded_file.read()
    try:
        uploaded_file.seek(0)
    except Exception:
        pass

    return (
        content,
        len(content),
        hashlib.sha256(content).hexdigest(),
    )

def _guardar_documento_en_carpeta_compartida(
    *, factura, nombre_archivo, tipo_documento, tipo_mime, content_bytes,
    tamano_bytes, hash_archivo, usuario,
):
    """Guarda el binario exclusivamente en el NAS y crea solo sus metadatos en BD."""
    from financiero.facturas.shared_storage import shared_storage

    if not content_bytes:
        raise ValidationError({'archivo': 'No fue posible leer el contenido del archivo.'})
    if not shared_storage.enabled:
        raise ValidationError({'archivo': 'La carpeta compartida no está configurada. No se puede guardar el documento.'})

    ciclo_documental = _factura_ciclo_documental_actual(factura)
    index = DocumentoAdjunto.objects.filter(
        factura=factura,
        ciclo_documental=ciclo_documental,
    ).count() + 1
    result = shared_storage.copy_document(
        factura=factura,
        index=index,
        original_filename=nombre_archivo,
        content_bytes=content_bytes,
    )
    if not result.success or not result.nas_relative_path:
        raise ValidationError({
            'archivo': f'No fue posible guardar el documento en la carpeta compartida: {result.message or result.error_code or "error desconocido"}.'
        })

    return DocumentoAdjunto.objects.create(
        factura=factura,
        nombre_archivo=nombre_archivo[:255],
        tipo_documento=tipo_documento,
        tipo_mime=tipo_mime or None,
        tamano_bytes=tamano_bytes,
        url_storage='',
        archivo=None,
        contenido_archivo=None,
        hash_archivo=hash_archivo,
        ciclo_documental=ciclo_documental,
        cargado_por=usuario,
        nas_relative_path=result.nas_relative_path,
        nas_storage_status=DocumentoAdjunto.NAS_STATUS_STORED,
    )

def _es_archivo_plano_txt(tipo_documento, nombre_archivo, tipo_mime):
    """Identifica el TXT que Tesorería genera para el proceso de pago."""
    tipo = _normalizar_texto_permiso(tipo_documento)
    nombre = (nombre_archivo or '').strip().lower()
    mime = (tipo_mime or '').split(';', 1)[0].strip().lower()
    return (
        tipo in {'archivo plano bancario', 'soporte causacion seven'}
        and (nombre.endswith('.txt') or mime in {'text/plain', 'application/octet-stream'})
    )

def _nombre_pdf_archivo_plano(nombre_archivo):
    base, _extension = os.path.splitext(os.path.basename(nombre_archivo or 'archivo_plano'))
    return f'{base or "archivo_plano"}.pdf'[:255]

def _convertir_archivo_plano_a_pdf(content_bytes, nombre_original):
    """Convierte el contenido de un archivo plano a un PDF legible y paginado."""
    try:
        texto = content_bytes.decode('utf-8-sig')
    except UnicodeDecodeError:
        texto = content_bytes.decode('latin-1', errors='replace')

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    _width, height = letter
    pdf.setFont('Courier', 7.5)
    y = height - 42
    lineas = texto.splitlines() or ['(El archivo plano no contiene líneas visibles.)']
    for linea in lineas:
        # Courier conserva la estructura tabular del TXT al abrirlo como PDF.
        segmentos = textwrap.wrap(
            linea.expandtabs(4), width=118, replace_whitespace=False,
            drop_whitespace=False, break_long_words=True,
        ) or ['']
        for segmento in segmentos:
            pdf.drawString(40, y, segmento)
            y -= 10
            if y < 48:
                pdf.showPage()
                pdf.setFont('Courier', 7.5)
                y = height - 42

    pdf.save()
    return output.getvalue()

def _sincronizar_documento_y_pdf_nas(documento_id):
    """
    Sincroniza en segundo plano el documento individual y el PDF unificado con el NAS.
    Nunca interrumpe el flujo HTTP del usuario.
    """
    close_old_connections()
    try:
        from financiero.facturas.shared_storage import shared_storage

        documento = (
            DocumentoAdjunto.objects
            .select_related('factura')
            .filter(id=documento_id)
            .first()
        )
        if not documento or not documento.factura_id:
            return

        raw_bytes = _documento_bytes(documento)
        if raw_bytes is None:
            logger.warning(
                '[SHARED_STORAGE] No fue posible obtener bytes del documento para sincronizar NAS. documento_id=%s',
                documento_id,
            )
            return

        index = (
            DocumentoAdjunto.objects
            .filter(
                factura=documento.factura,
                ciclo_documental=_factura_ciclo_documental_actual(documento.factura),
            )
            .filter(fecha_carga__lt=documento.fecha_carga)
            .count()
        ) + 1

        result = shared_storage.copy_document(
            factura=documento.factura,
            index=index,
            original_filename=documento.nombre_archivo,
            content_bytes=raw_bytes,
        )
        documento.nas_relative_path = result.nas_relative_path or ''
        documento.nas_storage_status = (
            DocumentoAdjunto.NAS_STATUS_STORED if result.success
            else (result.error_code or DocumentoAdjunto.NAS_STATUS_FAILED)
        )
        documento.save(update_fields=['nas_relative_path', 'nas_storage_status'])

        if not result.success:
            logger.warning(
                '[SHARED_STORAGE] Documento no copiado al NAS. documento_id=%s factura_id=%s error_code=%s message=%s',
                documento.id,
                documento.factura_id,
                result.error_code,
                result.message,
            )

        _regenerar_pdf_unificado_nas(documento.factura)
    except Exception:
        logger.exception('[SHARED_STORAGE] Error sincronizando documento/PDF con NAS. documento_id=%s', documento_id)
    finally:
        close_old_connections()

def _programar_sincronizacion_nas_documento(documento_id):
    def _runner():
        _sincronizar_documento_y_pdf_nas(documento_id)

    try:
        transaction.on_commit(lambda: threading.Thread(target=_runner, daemon=True).start())
    except Exception:
        logger.exception('[SHARED_STORAGE] No se pudo programar sincronización NAS. documento_id=%s', documento_id)

def _regenerar_pdf_unificado_nas(factura):
    """
    Regenera el PDF unificado con todos los documentos actuales de la factura
    y lo sube al NAS, reemplazando el anterior.
    Se llama automáticamente cada vez que se agrega un documento.
    """
    try:
        documentos = list(
            DocumentoAdjunto.objects
            .filter(
                factura=factura,
                ciclo_documental=_factura_ciclo_documental_actual(factura),
            )
            .select_related('cargado_por__rol')
            .order_by('fecha_carga', 'id')
        )
        from .factura import FacturaViewSet
        _vs = FacturaViewSet()
        _vs._pdf_consolidado_documentos(factura, documentos, 'all')
    except Exception:
        logger.exception('[SHARED_STORAGE] Error regenerando PDF unificado. factura_id=%s', factura.id)
