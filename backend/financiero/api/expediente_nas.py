from django.db import transaction, close_old_connections
import hashlib
import logging
from mysite import tareas
from .. import archivos, models
from .archivos_documentos import _documento_bytes, _factura_ciclo_documental_actual


logger = logging.getLogger(__name__)


def _sincronizar_documento_y_pdf_nas(documento_id):
    """
    Sincroniza en segundo plano el documento individual y el PDF unificado con el NAS.
    Nunca interrumpe el flujo HTTP del usuario.
    """
    close_old_connections()
    try:
        from financiero.services.shared_storage_service import shared_storage

        documento = (
            models.DocumentoAdjunto.objects
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
            models.DocumentoAdjunto.objects
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
            models.DocumentoAdjunto.NAS_STATUS_STORED if result.success
            else (result.error_code or models.DocumentoAdjunto.NAS_STATUS_FAILED)
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
    try:
        transaction.on_commit(lambda: tareas.encolar(_sincronizar_documento_y_pdf_nas, documento_id))
    except Exception:
        logger.exception('[SHARED_STORAGE] No se pudo programar sincronización NAS. documento_id=%s', documento_id)


def _archivar_documentos_devueltos(factura, numero_devolucion):
    """Archiva en el NAS los soportes del ciclo que se cierra al devolver la factura."""
    from financiero.services.shared_storage_service import shared_storage
    version_label = f'devolucion_{numero_devolucion:02d}'
    result = shared_storage.archive_documents_folder(factura, version_label)
    if not result.success and result.error_code not in ('DISABLED', 'NETWORK_ERROR'):
        logger.warning(
            '[SHARED_STORAGE] No se pudieron archivar documentos al devolver. factura_id=%s error=%s',
            factura.id, result.error_code,
        )


def _guardar_pdf_unificado(factura, content, scope):
    safe_scope = models._safe_path_segment(scope or 'all')
    safe_factura = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    nombre_archivo = f'Documentos_{safe_factura}_{safe_scope}.pdf'
    ciclo_documental = _factura_ciclo_documental_actual(factura)

    from financiero.services.shared_storage_service import shared_storage
    result = shared_storage.copy_unified_pdf(content, factura, scope)

    models.DocumentoUnificado.objects.update_or_create(
        factura=factura,
        scope=scope or 'all',
        ciclo_documental=ciclo_documental,
        defaults={
            'nombre_archivo': nombre_archivo,
            'tipo_mime': 'application/pdf',
            'tamano_bytes': len(content),
            'contenido_archivo': None,
            'hash_archivo': hashlib.sha256(content).hexdigest(),
            'nas_relative_path': result.nas_relative_path or '',
            'nas_storage_status': (
                models.DocumentoAdjunto.NAS_STATUS_STORED if result.success
                else (result.error_code or models.DocumentoAdjunto.NAS_STATUS_FAILED)
            ),
        },
    )

    if not result.success:
        logger.warning(
            '[SHARED_STORAGE] PDF unificado no copiado al NAS. factura_id=%s error_code=%s message=%s',
            factura.id, result.error_code, result.message,
        )


def _expediente(factura, documentos, scope, incluir_portada=True, guardar=True):
    """Arma el expediente consolidado y, si se pide, lo guarda como PDF unificado de la factura."""
    content, consolidado = archivos.expediente(factura, documentos, scope, _documento_bytes, incluir_portada)
    if guardar and consolidado:
        _guardar_pdf_unificado(factura, content, scope)
    return content


def _regenerar_pdf_unificado_nas(factura):
    """
    Regenera el PDF unificado con todos los documentos actuales de la factura
    y lo sube al NAS, reemplazando el anterior.
    Se llama automáticamente cada vez que se agrega un documento.
    """
    try:
        documentos = list(
            models.DocumentoAdjunto.objects
            .filter(
                factura=factura,
                ciclo_documental=_factura_ciclo_documental_actual(factura),
            )
            .select_related('cargado_por__rol')
            .order_by('fecha_carga', 'id')
        )
        _expediente(factura, documentos, 'all')
    except Exception:
        logger.exception('[SHARED_STORAGE] Error regenerando PDF unificado. factura_id=%s', factura.id)
