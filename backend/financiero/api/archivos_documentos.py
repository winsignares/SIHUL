from rest_framework.exceptions import ValidationError
from django.conf import settings
import hashlib
import logging
import mimetypes
from pathlib import Path
from urllib.parse import urlparse
from django.utils import timezone
from .. import models
from ..documentos_sensibles import (
    normalizar_texto_permiso as _normalizar_texto_permiso,
)



logger = logging.getLogger(__name__)


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
            from financiero.services.shared_storage_service import shared_storage
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


def _factura_document_base_path(factura):
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    factura_label = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    return Path(settings.MEDIA_ROOT) / f'{date:%Y}' / f'{date:%m}' / factura_label


def _factura_ciclo_documental_actual(factura):
    return getattr(factura, 'ciclo_documental_actual', 1) or 1


def _documentos_queryset_ciclo_actual(factura):
    return models.DocumentoAdjunto.objects.filter(
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
    from financiero.services.shared_storage_service import shared_storage

    if not content_bytes:
        raise ValidationError({'archivo': 'No fue posible leer el contenido del archivo.'})
    if not shared_storage.enabled:
        raise ValidationError({'archivo': 'La carpeta compartida no está configurada. No se puede guardar el documento.'})

    ciclo_documental = _factura_ciclo_documental_actual(factura)
    index = models.DocumentoAdjunto.objects.filter(
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

    return models.DocumentoAdjunto.objects.create(
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
        nas_storage_status=models.DocumentoAdjunto.NAS_STATUS_STORED,
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
