"""
Servicio de almacenamiento compartido en red (NAS).

Usa el protocolo SMB2/3 nativo (librería smbprotocol) para escribir documentos
directamente en la carpeta compartida de la Universidad Libre desde el contenedor
Docker, sin necesidad de montar nada en el host.

Si el acceso falla por cualquier motivo, el servicio registra un log controlado
y retorna un resultado de fallo sin interrumpir el flujo de factura.

Estructura de carpetas en el NAS:
    <base>/facturas/<YYYY>/<MM>/<num_factura>/documentos_especificos/<NNN>_<nombre>.ext
    <base>/facturas/<YYYY>/<MM>/<num_factura>/documentos_unidos_<num_factura>_<scope>.pdf

Variables de entorno (configuradas en .env y pasadas por docker-compose.yml):
    FINANCIERO_DOCUMENT_NETWORK_ROOT     — ruta UNC (\\\\servidor\\share\\subcarpeta)
    FINANCIERO_DOCUMENT_NETWORK_USER     — usuario de red
    FINANCIERO_DOCUMENT_NETWORK_PASSWORD — contraseña de red
"""
import logging
import os
import re
import unicodedata
from dataclasses import dataclass
from typing import Optional

from django.conf import settings

logger = logging.getLogger(__name__)

_TAG = '[SHARED_STORAGE]'


@dataclass
class StorageResult:
    success: bool
    nas_relative_path: Optional[str] = None
    error_code: Optional[str] = None
    message: str = ''


# ------------------------------------------------------------------ #
# Helpers de ruta y nombre                                            #
# ------------------------------------------------------------------ #

def _safe_nas_segment(value: str, fallback: str = 'sin-dato') -> str:
    text = unicodedata.normalize('NFKD', str(value or fallback))
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = re.sub(r'[^A-Za-z0-9._-]+', '-', text).strip('.-')
    return text[:80] or fallback


def _validate_filename(filename: str) -> str:
    if not filename:
        return 'documento'
    name = os.path.basename(filename.replace('\\', '/'))
    name = _safe_nas_segment(name, fallback='documento')
    return name or 'documento'


def _factura_date_parts(factura):
    from django.utils import timezone
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    return date.year, date.month


def _factura_nas_label(factura) -> str:
    numero = getattr(factura, 'numero_factura', None)
    return _safe_nas_segment(numero or f'factura-{getattr(factura, "id", "desconocida")}')


def _parse_unc(unc_path: str):
    """
    Parsea una ruta UNC Windows o ruta SMB y retorna (server, share, base_path).

    Ejemplos válidos:
        \\\\nasul.unilibre.edu.co\\BARRANQUILLA\\sihulapp
        //nasul.unilibre.edu.co/BARRANQUILLA/sihulapp
        nasul.unilibre.edu.co/BARRANQUILLA/sihulapp

    Retorna:
        server     = 'nasul.unilibre.edu.co'
        share      = 'BARRANQUILLA'
        base_path  = 'sihulapp'   (puede ser vacío si no hay subcarpeta)
    """
    path = unc_path.strip().replace('\\', '/')
    path = path.lstrip('/')
    parts = [p for p in path.split('/') if p]
    if len(parts) < 2:
        raise ValueError(f'Ruta NAS inválida (se necesita al menos servidor y share): {unc_path}')
    server = parts[0]
    share = parts[1]
    base_path = '/'.join(parts[2:])
    return server, share, base_path


def _smb_path(server: str, share: str, *parts: str) -> str:
    """Construye una ruta SMB con formato //server/share/partes..."""
    joined = '/'.join(p.strip('/') for p in parts if p)
    if joined:
        return f'//{server}/{share}/{joined}'
    return f'//{server}/{share}'


# ------------------------------------------------------------------ #
# Service                                                             #
# ------------------------------------------------------------------ #

class SharedStorageService:
    """
    Acceso al almacenamiento compartido de red (NAS) vía SMB2/3.
    Todos los métodos son tolerantes a fallos: nunca propagan excepciones al caller.
    """

    def __init__(self):
        self.unc_root = getattr(settings, 'FINANCIERO_DOCUMENT_NETWORK_ROOT', '').strip()
        self.username = getattr(settings, 'FINANCIERO_DOCUMENT_NETWORK_USER', '').strip()
        self.password = getattr(settings, 'FINANCIERO_DOCUMENT_NETWORK_PASSWORD', '').strip()
        self._session_registered = False

    @property
    def enabled(self) -> bool:
        return bool(self.unc_root and self.username and self.password)

    # ---------------------------------------------------------------- #
    # Public API                                                        #
    # ---------------------------------------------------------------- #

    def copy_document(
        self,
        factura,
        index: int = 1,
        original_filename: str = '',
        local_path=None,
        content_bytes: Optional[bytes] = None,
    ) -> StorageResult:
        """
        Copia un documento al NAS en documentos_especificos/.
        Nunca lanza excepción.
        """
        if not self.enabled:
            logger.debug('%s Almacenamiento NAS no configurado; omitiendo copia.', _TAG)
            return StorageResult(False, error_code='DISABLED', message='NAS no configurado')

        try:
            return self._do_copy_document(
                factura=factura,
                index=index,
                original_filename=original_filename,
                local_path=local_path,
                content_bytes=content_bytes,
            )
        except Exception as exc:
            return self._handle_error(exc, 'copiar documento', factura)

    def archive_documents_folder(self, factura, version_label: str) -> StorageResult:
        """
        Mueve documentos_especificos/ → documentos_anteriores/{version_label}/ en el NAS.
        Llamar cuando la factura se devuelve al proveedor para corrección.
        """
        if not self.enabled:
            logger.debug('%s NAS no configurado; omitiendo archivado.', _TAG)
            return StorageResult(False, error_code='DISABLED', message='NAS no configurado')

        try:
            return self._do_archive_documents_folder(factura, version_label)
        except Exception as exc:
            return self._handle_error(exc, 'archivar documentos', factura)

    def copy_unified_pdf(self, content_bytes: bytes, factura, scope: str = 'all') -> StorageResult:
        """
        Guarda el PDF unificado en la raíz de la carpeta de la factura en el NAS.
        Nunca lanza excepción.
        """
        if not self.enabled:
            logger.debug('%s Almacenamiento NAS no configurado; omitiendo copia.', _TAG)
            return StorageResult(False, error_code='DISABLED', message='NAS no configurado')

        try:
            return self._do_copy_unified_pdf(content_bytes, factura, scope)
        except Exception as exc:
            return self._handle_error(exc, 'guardar PDF unificado', factura)

    # ---------------------------------------------------------------- #
    # Internal: SMB session                                             #
    # ---------------------------------------------------------------- #

    def _get_smb_client(self):
        """Importa smbclient y registra sesión si es necesario."""
        try:
            import smbclient
            import smbclient.shutil as smb_shutil
        except ImportError:
            raise ImportError('smbprotocol no está instalado. Ejecuta: pip install smbprotocol')

        server, _, _ = _parse_unc(self.unc_root)

        if not self._session_registered:
            smbclient.register_session(
                server,
                username=self.username,
                password=self.password,
                connection_timeout=10,
            )
            self._session_registered = True

        return smbclient, smb_shutil

    # ---------------------------------------------------------------- #
    # Internal: operaciones de archivo                                  #
    # ---------------------------------------------------------------- #

    def _do_copy_document(
        self,
        factura,
        index: int,
        original_filename: str,
        local_path=None,
        content_bytes: Optional[bytes] = None,
    ) -> StorageResult:
        smbclient, _ = self._get_smb_client()
        server, share, base = _parse_unc(self.unc_root)

        year, month = _factura_date_parts(factura)
        factura_label = _factura_nas_label(factura)

        dest_folder_rel = f'{base}/facturas/{year}/{month:02d}/{factura_label}/documentos_especificos'
        dest_folder_smb = _smb_path(server, share, dest_folder_rel)

        smbclient.makedirs(dest_folder_smb, exist_ok=True)

        target_name = f'{index:03d}_{_validate_filename(original_filename or str(local_path))}'
        dest_file_smb = f'{dest_folder_smb}/{target_name}'

        if smbclient.path.exists(dest_file_smb):
            stem, _, ext = target_name.rpartition('.')
            dest_file_smb = f'{dest_folder_smb}/{stem}_dup.{ext}' if ext else f'{dest_folder_smb}/{target_name}_dup'

        if content_bytes is None:
            if local_path is None:
                raise ValueError('Se requiere local_path o content_bytes para copiar el documento al NAS')
            with open(str(local_path), 'rb') as local_f:
                content_bytes = local_f.read()

        with smbclient.open_file(dest_file_smb, mode='wb') as remote_f:
            remote_f.write(content_bytes)

        rel = f'facturas/{year}/{month:02d}/{factura_label}/documentos_especificos/{target_name}'
        logger.info('%s Documento copiado al NAS: %s', _TAG, rel)
        return StorageResult(True, nas_relative_path=rel, message='Documento guardado en NAS')

    def _do_archive_documents_folder(self, factura, version_label: str) -> StorageResult:
        smbclient, _ = self._get_smb_client()
        server, share, base = _parse_unc(self.unc_root)

        year, month = _factura_date_parts(factura)
        factura_label = _factura_nas_label(factura)

        src_smb = _smb_path(
            server, share,
            f'{base}/facturas/{year}/{month:02d}/{factura_label}/documentos_especificos',
        )

        if not smbclient.path.exists(src_smb):
            logger.info('%s Sin documentos_especificos para archivar. factura_id=%s', _TAG, getattr(factura, 'id', '?'))
            return StorageResult(True, message='Sin documentos para archivar')

        safe_label = _safe_nas_segment(version_label)
        dst_rel = f'{base}/facturas/{year}/{month:02d}/{factura_label}/documentos_anteriores/{safe_label}'
        dst_smb = _smb_path(server, share, dst_rel)
        smbclient.makedirs(dst_smb, exist_ok=True)

        moved = 0
        for entry in smbclient.scandir(src_smb):
            src_file = f'{src_smb}/{entry.name}'
            dst_file = f'{dst_smb}/{entry.name}'
            with smbclient.open_file(src_file, mode='rb') as f:
                data = f.read()
            with smbclient.open_file(dst_file, mode='wb') as f:
                f.write(data)
            smbclient.remove(src_file)
            moved += 1

        logger.info('%s %d documentos archivados → %s', _TAG, moved, dst_rel)
        return StorageResult(True, nas_relative_path=dst_rel, message=f'{moved} documentos archivados')

    def _do_copy_unified_pdf(self, content_bytes: bytes, factura, scope: str) -> StorageResult:
        smbclient, _ = self._get_smb_client()
        server, share, base = _parse_unc(self.unc_root)

        year, month = _factura_date_parts(factura)
        factura_label = _factura_nas_label(factura)
        safe_scope = _safe_nas_segment(scope or 'all')
        safe_factura = _safe_nas_segment(
            getattr(factura, 'numero_factura', None) or f'factura-{getattr(factura, "id", "?")}'
        )

        dest_folder_rel = f'{base}/facturas/{year}/{month:02d}/{factura_label}'
        dest_folder_smb = _smb_path(server, share, dest_folder_rel)

        smbclient.makedirs(dest_folder_smb, exist_ok=True)

        filename = f'documentos_unidos_{safe_factura}_{safe_scope}.pdf'
        dest_file_smb = f'{dest_folder_smb}/{filename}'

        with smbclient.open_file(dest_file_smb, mode='wb') as remote_f:
            remote_f.write(content_bytes)

        rel = f'facturas/{year}/{month:02d}/{factura_label}/{filename}'
        logger.info('%s PDF unificado guardado en NAS: %s', _TAG, rel)
        return StorageResult(True, nas_relative_path=rel, message='PDF unificado guardado en NAS')

    # ---------------------------------------------------------------- #
    # Internal: manejo de errores                                       #
    # ---------------------------------------------------------------- #

    def _handle_error(self, exc: Exception, operation: str, factura) -> StorageResult:
        factura_id = getattr(factura, 'id', '?')
        exc_type = type(exc).__name__
        exc_msg = str(exc)

        self._session_registered = False

        # Credenciales inválidas
        if 'STATUS_LOGON_FAILURE' in exc_msg or 'STATUS_ACCESS_DENIED' in exc_msg or isinstance(exc, PermissionError):
            logger.error('%s Credenciales inválidas o acceso denegado al %s. factura_id=%s. El flujo continuará normalmente.', _TAG, operation, factura_id)
            return StorageResult(False, error_code='ACCESS_DENIED', message='Acceso denegado a carpeta compartida')

        # Carpeta o share no encontrado
        if 'STATUS_BAD_NETWORK_NAME' in exc_msg or 'STATUS_OBJECT_NAME_NOT_FOUND' in exc_msg or isinstance(exc, FileNotFoundError):
            logger.warning('%s Carpeta compartida no encontrada al %s. factura_id=%s. El flujo continuará normalmente.', _TAG, operation, factura_id)
            return StorageResult(False, error_code='PATH_NOT_FOUND', message='Carpeta compartida no encontrada')

        # Error de conexión o DNS — incluye ValueError de smbprotocol ("Failed to connect")
        # y gaierror (DNS no resuelto). Ocurre normalmente fuera de la red universitaria.
        is_connection_error = (
            isinstance(exc, (ConnectionError, TimeoutError, OSError))
            or exc_type == 'ValueError' and 'Failed to connect' in exc_msg
            or 'gaierror' in exc_type
            or 'Name or service not known' in exc_msg
            or 'socket' in exc_msg.lower()
        )
        if is_connection_error:
            logger.warning(
                '%s No se pudo conectar al NAS al %s. factura_id=%s. '
                'Verifica que el servidor esté en la red universitaria. El flujo continuará normalmente.',
                _TAG, operation, factura_id,
            )
            return StorageResult(False, error_code='NETWORK_ERROR', message='No se pudo conectar al NAS')

        # Error inesperado — loguea traceback completo solo para errores realmente desconocidos
        logger.exception('%s Error inesperado al %s. factura_id=%s', _TAG, operation, factura_id)
        return StorageResult(False, error_code='UNEXPECTED_ERROR', message=exc_type)


shared_storage = SharedStorageService()
