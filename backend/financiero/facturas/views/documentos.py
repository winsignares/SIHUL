from rest_framework import viewsets, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.http import HttpResponse
import hashlib
import logging
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from financiero.facturas.models import DocumentoAdjunto, Factura
from financiero.facturas.serializers import DocumentoAdjuntoSerializer


from .helpers import _convertir_archivo_plano_a_pdf, _documento_bytes, _documento_content_type, _documento_upload_metadata, _es_archivo_plano_txt, _factura_ciclo_documental_actual, _guardar_documento_en_carpeta_compartida, _nombre_pdf_archivo_plano, _regenerar_pdf_unificado_nas, _usuario_puede_ver_documentos_sensibles

logger = logging.getLogger(__name__)


class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentoAdjuntoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'factura_id', 'tipo_documento']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        puede_ver_sensibles = _usuario_puede_ver_documentos_sensibles(self.request.user)
        factura_id = self.request.query_params.get('factura_id') or self.request.query_params.get('factura')
        queryset = DocumentoAdjunto.objects.all()

        if not puede_ver_sensibles:
            queryset = queryset.exclude(
                Q(tipo_documento='Archivo Plano Bancario') |
                Q(tipo_documento='Soporte Causacion Seven') |
                Q(nombre_archivo__icontains='archivo plano')
            )

        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)
            include_historico = (self.request.query_params.get('include_historico') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
            if not include_historico:
                factura = Factura.objects.filter(id=factura_id).only('id', 'ciclo_documental_actual').first()
                if factura:
                    queryset = queryset.filter(ciclo_documental=_factura_ciclo_documental_actual(factura))
            return queryset.order_by('fecha_carga', 'id')
        return queryset

    @action(detail=True, methods=['get'], url_path='contenido')
    def contenido(self, request, pk=None):
        documento = self.get_object()
        raw_bytes = _documento_bytes(documento)
        if raw_bytes is None:
            return Response(
                {
                    'error': 'El documento no está disponible en ninguna fuente configurada.',
                    'documento_id': documento.id,
                    'nombre_archivo': documento.nombre_archivo,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        descargar = (request.query_params.get('descargar') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
        filename = documento.nombre_archivo or f'documento-{documento.id}'
        response = HttpResponse(raw_bytes, content_type=_documento_content_type(documento))
        response['Content-Disposition'] = f'{"attachment" if descargar else "inline"}; filename="{filename}"'
        return response

    def perform_create(self, serializer):
        archivo = self.request.FILES.get('archivo')
        factura = serializer.validated_data.get('factura')
        content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(archivo)
        nombre_archivo = serializer.validated_data.get('nombre_archivo') or getattr(archivo, 'name', '')
        tipo_documento = serializer.validated_data.get('tipo_documento')
        tipo_mime = serializer.validated_data.get('tipo_mime') or getattr(archivo, 'content_type', '')

        # El archivo plano se almacena como PDF. Así su vista individual y el
        # documento unificado muestran el contenido, no solo el nombre del TXT.
        if content_bytes is not None and _es_archivo_plano_txt(tipo_documento, nombre_archivo, tipo_mime):
            content_bytes = _convertir_archivo_plano_a_pdf(content_bytes, nombre_archivo)
            nombre_archivo = _nombre_pdf_archivo_plano(nombre_archivo)
            tipo_mime = 'application/pdf'
            tamano_bytes = len(content_bytes)
            hash_archivo = hashlib.sha256(content_bytes).hexdigest()

        instance = _guardar_documento_en_carpeta_compartida(
            factura=factura,
            nombre_archivo=nombre_archivo,
            tipo_documento=tipo_documento,
            tipo_mime=tipo_mime,
            content_bytes=content_bytes,
            tamano_bytes=tamano_bytes or serializer.validated_data.get('tamano_bytes'),
            hash_archivo=hash_archivo,
            usuario=self.request.user,
        )
        serializer.instance = instance
        _regenerar_pdf_unificado_nas(factura)

    def perform_update(self, serializer):
        verificado = serializer.validated_data.get('verificado')
        if verificado is True:
            serializer.save(verificado_por=self.request.user, fecha_verificacion=timezone.now())
        elif verificado is False:
            serializer.save(verificado_por=None, fecha_verificacion=None)
        else:
            serializer.save()
