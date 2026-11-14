"""Regla única de documentos sensibles del módulo financiero.

Algunos soportes (archivo plano bancario, soporte de causación) solo los ven los roles de
auditoría y dirección financiera. La usan la vista de facturas y su serializador.
"""
import unicodedata

DOCUMENTOS_SENSIBLES_POR_ROL = {
    'archivo plano bancario',
    'soporte causacion seven',
}

ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES = {
    'auditoria',
    'direccion financiera',
}


def normalizar_texto_permiso(value):
    normalized = unicodedata.normalize('NFD', str(value or '').strip().lower())
    without_marks = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
    return ' '.join(without_marks.replace('_', ' ').replace('-', ' ').split())


def usuario_puede_ver_documentos_sensibles(user):
    rol = normalizar_texto_permiso(getattr(getattr(user, 'rol', None), 'nombre', ''))
    return rol in ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES


def documento_es_sensible(documento):
    tipo = normalizar_texto_permiso(getattr(documento, 'tipo_documento', ''))
    nombre = normalizar_texto_permiso(getattr(documento, 'nombre_archivo', ''))
    return tipo in DOCUMENTOS_SENSIBLES_POR_ROL or 'archivo plano' in nombre
