"""Serializador de los documentos adjuntos de la factura y sus límites de tipo y tamaño."""
from rest_framework import serializers
from .. import models
from identidad.usuarios.serializers import UsuarioSerializer
import os
import re
import uuid
from urllib.parse import urlparse


ALLOWED_DOC_EXTENSIONS = {'pdf', 'xml', 'png', 'jpg', 'jpeg', 'txt'}
ALLOWED_DOC_MIME_TYPES = {
    'application/pdf',
    'application/xml',
    'text/xml',
    'image/png',
    'image/jpeg',
    'text/plain',
    'application/octet-stream',  # .txt desde Windows/Chrome
}
MAX_DOC_SIZE_BYTES = 25 * 1024 * 1024


class DocumentoAdjuntoSerializer(serializers.ModelSerializer):
    archivo = serializers.FileField(write_only=True, required=False, allow_null=True)
    cargado_por = UsuarioSerializer(read_only=True)
    cargado_por_id = serializers.IntegerField(write_only=True, required=False)
    verificado_por = UsuarioSerializer(read_only=True)
    archivo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = models.DocumentoAdjunto
        fields = [
            'id', 'factura', 'nombre_archivo', 'tipo_documento', 'tipo_mime', 'tamano_bytes',
            'url_storage', 'archivo', 'hash_archivo', 'obligatorio', 'verificado',
            'verificado_por', 'fecha_verificacion', 'observaciones', 'fecha_carga',
            'cargado_por', 'cargado_por_id', 'archivo_url', 'nas_relative_path',
            'nas_storage_status', 'ciclo_documental',
        ]
        read_only_fields = [
            'fecha_carga', 'archivo_url', 'hash_archivo', 'nas_relative_path',
            'nas_storage_status', 'ciclo_documental',
        ]

    def get_archivo_url(self, obj):
        request = self.context.get('request')
        relative_url = f'/api/financiero/documentos/{obj.id}/contenido/'
        if request:
            return request.build_absolute_uri(relative_url)
        return relative_url

    def validate_archivo(self, archivo):
        filename = (getattr(archivo, 'name', '') or '').strip()
        extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''

        if extension not in ALLOWED_DOC_EXTENSIONS:
            raise serializers.ValidationError('Tipo de archivo no permitido. Use PDF, XML, PNG o JPG.')

        if getattr(archivo, 'size', 0) > MAX_DOC_SIZE_BYTES:
            raise serializers.ValidationError('El archivo supera el tamaño máximo permitido (25 MB).')

        content_type = (getattr(archivo, 'content_type', '') or '').split(';', 1)[0].strip().lower()
        if content_type and content_type not in ALLOWED_DOC_MIME_TYPES:
            raise serializers.ValidationError('El tipo MIME del archivo no es válido para documentos financieros.')

        head = archivo.read(512)
        archivo.seek(0)
        stripped = head.lstrip()

        if stripped.startswith(b'<!doctype html') or stripped.startswith(b'<html'):
            raise serializers.ValidationError('El archivo no es un documento válido; se detectó contenido HTML.')

        if extension == 'pdf' and not head.startswith(b'%PDF-'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a un PDF válido.')

        if extension == 'png' and not head.startswith(b'\x89PNG\r\n\x1a\n'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a una imagen PNG válida.')

        if extension in {'jpg', 'jpeg'} and not head.startswith(b'\xff\xd8\xff'):
            raise serializers.ValidationError('El contenido del archivo no corresponde a una imagen JPG válida.')

        if extension == 'xml' and not stripped.startswith((b'<?xml', b'<')):
            raise serializers.ValidationError('El contenido del archivo no corresponde a un XML válido.')

        return archivo

    def validate_nombre_archivo(self, value):
        base = os.path.basename((value or '').strip())
        if not base:
            raise serializers.ValidationError('El nombre del archivo es requerido.')
        # Sustituir caracteres peligrosos
        safe = re.sub(r'[^A-Za-z0-9._-]+', '_', base)
        return safe[:255]

    def validate_url_storage(self, value):
        v = (value or '').strip()
        if not v:
            return ''
        parsed = urlparse(v)
        # Solo permitir http/https o rutas relativas
        if parsed.scheme and parsed.scheme.lower() not in ('http', 'https'):
            raise serializers.ValidationError('Esquema de URL no permitido para url_storage.')
        return v

    def _safe_filename(self, original_name: str) -> str:
        base = os.path.basename((original_name or '').strip())
        ext = base.rsplit('.', 1)[-1].lower() if '.' in base else ''
        if ext not in ALLOWED_DOC_EXTENSIONS:
            ext = 'bin'
        return f"{uuid.uuid4().hex}.{ext}"

    def validate(self, data):
        archivo = data.get('archivo')
        url_storage = (data.get('url_storage') or '').strip()

        if not archivo and not url_storage:
            raise serializers.ValidationError('Debe adjuntar un archivo o especificar url_storage.')

        # Asegurar nombre_archivo legible y seguro
        nombre = data.get('nombre_archivo') or getattr(archivo, 'name', '')
        if nombre:
            data['nombre_archivo'] = self.validate_nombre_archivo(nombre)

        # Randomizar el nombre físico almacenado para evitar colisiones/filtración de nombres
        if archivo is not None and hasattr(archivo, 'name'):
            archivo.name = self._safe_filename(archivo.name)
            data['archivo'] = archivo

        return data

    def create(self, validated_data):
        # Revalidar url_storage cuando es pasado via kwargs en serializer.save(...)
        if 'url_storage' in validated_data:
            validated_data['url_storage'] = self.validate_url_storage(validated_data.get('url_storage'))
        return super().create(validated_data)


