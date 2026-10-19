"""
Anexos (documentos de soporte) de las preguntas-respuestas de los chatbots.

- Validación de los archivos que se adjuntan: solo Word, PDF y Excel, comprobando la
  extensión y el contenido real (firma binaria), no el tipo que declara el navegador.
- Enlaces de descarga firmados: el chat (también el público, sin sesión) recibe una URL
  con un token que caduca. Solo quien obtuvo el enlace del propio sistema puede usarlo y
  la ruta del archivo en disco nunca se expone.
- Aviso al servicio RAG cuando cambian las preguntas-respuestas de un agente y sede.
"""
import logging
import os
import zipfile

import requests
from django.conf import settings
from django.core import signing
from django.urls import reverse

logger = logging.getLogger(__name__)

# Extensión -> (tipo MIME con el que se guarda y se entrega, firma esperada del contenido)
FORMATOS_ANEXO = {
    'pdf': ('application/pdf', 'pdf'),
    'doc': ('application/msword', 'ole'),
    'docx': ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'),
    'xls': ('application/vnd.ms-excel', 'ole'),
    'xlsx': ('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'),
}

_FIRMA_PDF = b'%PDF-'
# Formato binario de Office 97-2003 (.doc, .xls): contenedor OLE2 / Compound File
_FIRMA_OLE = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'
# Office Open XML (.docx, .xlsx): ZIP con la carpeta de su aplicación
_FIRMA_ZIP = b'PK\x03\x04'
_CARPETA_OOXML = {'docx': 'word/', 'xlsx': 'xl/'}

_SALT_TOKEN = 'chatbot.anexo.descarga'


def max_anexo_bytes():
    return getattr(settings, 'CHATBOT_ANEXO_MAX_MB', 15) * 1024 * 1024


def max_anexos_por_respuesta():
    return getattr(settings, 'CHATBOT_ANEXO_MAX_POR_RESPUESTA', 5)


def extension_de(nombre):
    return os.path.splitext(nombre or '')[1].lower().lstrip('.')


class AnexoInvalido(ValueError):
    """El archivo no se puede adjuntar; el mensaje es apto para mostrarse al usuario."""


def validar_anexo(archivo):
    """
    Comprueba un archivo subido (UploadedFile) y devuelve el tipo MIME con el que se
    guardará. Lanza AnexoInvalido si el formato no está permitido, si el contenido no
    corresponde a la extensión o si supera el tamaño máximo.
    """
    nombre = archivo.name or ''
    extension = extension_de(nombre)
    if extension not in FORMATOS_ANEXO:
        raise AnexoInvalido(
            f'«{nombre}»: formato no permitido. Se aceptan Word (.doc, .docx), PDF (.pdf) y Excel (.xls, .xlsx).'
        )
    if archivo.size == 0:
        raise AnexoInvalido(f'«{nombre}» está vacío.')
    if archivo.size > max_anexo_bytes():
        raise AnexoInvalido(f'«{nombre}» supera el máximo de {getattr(settings, "CHATBOT_ANEXO_MAX_MB", 15)} MB.')

    tipo_mime, firma = FORMATOS_ANEXO[extension]
    archivo.seek(0)
    cabecera = archivo.read(8)
    archivo.seek(0)
    if firma == 'pdf':
        valido = cabecera.startswith(_FIRMA_PDF)
    elif firma == 'ole':
        valido = cabecera.startswith(_FIRMA_OLE)
    else:
        valido = cabecera.startswith(_FIRMA_ZIP) and _ooxml_contiene(archivo, _CARPETA_OOXML[firma])
    if not valido:
        raise AnexoInvalido(f'«{nombre}» no es un archivo .{extension} válido o está dañado.')
    return tipo_mime


def _ooxml_contiene(archivo, carpeta):
    # Un .docx y un .xlsx son ZIP; lo que los distingue (y de cualquier otro ZIP
    # renombrado) es la carpeta interna de su aplicación.
    try:
        with zipfile.ZipFile(archivo) as zf:
            return any(n.startswith(carpeta) for n in zf.namelist())
    except zipfile.BadZipFile:
        return False
    finally:
        archivo.seek(0)


#  Enlaces de descarga firmados

def generar_token(anexo_id, administracion=False):
    """
    Token firmado (con SECRET_KEY) que autoriza a descargar un anexo. `administracion`
    marca los enlaces emitidos en la gestión, que también abren anexos de preguntas
    inactivas; los del chat solo sirven mientras la pregunta y el agente estén activos.
    """
    return signing.dumps({'id': int(anexo_id), 'adm': bool(administracion)}, salt=_SALT_TOKEN, compress=True)


def leer_token(token, anexo_id):
    """Devuelve el contenido del token si es válido, no ha caducado y es de ese anexo; si no, None."""
    if not token:
        return None
    try:
        data = signing.loads(
            token,
            salt=_SALT_TOKEN,
            max_age=getattr(settings, 'CHATBOT_ANEXO_URL_MAX_AGE', 7 * 24 * 3600),
        )
    except signing.BadSignature:  # incluye SignatureExpired
        return None
    if not isinstance(data, dict) or data.get('id') != int(anexo_id):
        return None
    return data


def url_descarga(request, anexo, administracion=False):
    path = reverse('api-anexo-descargar', args=[anexo.id])
    query = f'?token={generar_token(anexo.id, administracion)}'
    if request is None:
        return f'{path}{query}'
    return request.build_absolute_uri(path) + query


def anexo_json(request, anexo, administracion=False):
    """Representación de un anexo para el frontend: `{id, nombre, url, tipo, extension, tamano}`."""
    return {
        'id': anexo.id,
        'nombre': anexo.nombre,
        'url': url_descarga(request, anexo, administracion),
        'tipo': anexo.tipo_mime,
        'extension': anexo.extension,
        'tamano': anexo.tamano,
    }


def anexos_json(request, anexos, administracion=False):
    return [anexo_json(request, anexo, administracion) for anexo in anexos]


#  Sincronización con el servicio RAG

def sincronizar_rag(agente_id, sede):
    """
    Pide al servicio RAG que actualice los embeddings de las preguntas-respuestas del
    agente en la sede y descarte las respuestas cacheadas. Es una optimización: si falla,
    el RAG igualmente se pone al día con la siguiente pregunta, así que el error solo se
    registra en el log.
    """
    from .views import fastapi_base_url

    try:
        resp = requests.post(
            f'{fastapi_base_url()}/qa/sync',
            params={'chatbot_id': agente_id, 'sede': sede},
            timeout=30,
        )
        if resp.status_code >= 400:
            logger.warning('El RAG no sincronizó las preguntas-respuestas (%s): %s', resp.status_code, resp.text[:300])
    except requests.exceptions.RequestException:
        logger.warning('No se pudo avisar al RAG del cambio en preguntas-respuestas', exc_info=True)
