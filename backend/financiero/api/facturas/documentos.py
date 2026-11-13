"""Documentos de una factura: expediente consolidado y descarga del historial en ZIP."""
import zipfile
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from io import BytesIO
from ... import models
from ..archivos_documentos import _documento_bytes, _factura_ciclo_documental_actual
from ..expediente_nas import _expediente


class DocumentosFactura:
    """Documentos de una factura: expediente consolidado y descarga del historial en ZIP."""

    @action(detail=True, methods=['get'], url_path='documentos_consolidados')
    def documentos_consolidados(self, request, pk=None):
        factura = self.get_object()
        scope = self._resolve_scope_documental(request)
        descargar = (request.query_params.get('descargar') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
        doc_id = request.query_params.get('doc_id')

        # El expediente consolidado se sirve desde la carpeta compartida. Solo se
        # regenera si aún no existe para este ciclo documental o si fue eliminado.
        if not doc_id:
            unificado = models.DocumentoUnificado.objects.filter(
                factura=factura,
                scope=scope,
                ciclo_documental=_factura_ciclo_documental_actual(factura),
            ).first()
            if unificado and unificado.nas_relative_path:
                from financiero.services.shared_storage_service import shared_storage
                result = shared_storage.read_file(unificado.nas_relative_path)
                if result.success and result.content_bytes is not None:
                    filename = unificado.nombre_archivo or f'Documentos_{factura.numero_factura}_{scope}.pdf'
                    response = HttpResponse(result.content_bytes, content_type='application/pdf')
                    response['Content-Disposition'] = f'{"attachment" if descargar else "inline"}; filename="{filename}"'
                    return response

        documentos = self._documentos_filtrados_por_scope(factura, scope)
        if doc_id:
            documentos = [d for d in documentos if str(d.id) == str(doc_id)]
            if not documentos:
                return Response({'error': 'El documento solicitado no está disponible.'}, status=status.HTTP_404_NOT_FOUND)
        # Al abrir un documento puntual no se agrega la portada del expediente ni
        # se reemplaza el PDF unificado almacenado de la factura.
        content = _expediente(
            factura,
            documentos,
            scope,
            incluir_portada=not bool(doc_id),
            guardar=not bool(doc_id),
        )

        filename = f'Documentos_{factura.numero_factura}_{scope}.pdf'
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'{"attachment" if descargar else "inline"}; filename="{filename}"'
        return response

    @action(detail=True, methods=['get'], url_path='documentos_historial_zip')
    def documentos_historial_zip(self, request, pk=None):
        """Descarga el expediente completo: archivos originales y PDF unificado."""
        factura = self.get_object()
        scope = self._resolve_scope_documental(request)
        documentos = self._documentos_filtrados_por_scope(factura, scope)
        consolidado = _expediente(factura, documentos, scope)

        output = BytesIO()
        used_names = set()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('unificados/expediente_unificado.pdf', consolidado)

            for index, documento in enumerate(documentos, 1):
                raw_bytes = _documento_bytes(documento)
                base_name = models._safe_path_segment(documento.nombre_archivo or f'documento-{index}')
                folder = models._safe_path_segment(documento.tipo_documento or 'documento')
                zip_name = f'especificos/{folder}/{index:02d}-{base_name}'

                if zip_name in used_names:
                    zip_name = f'especificos/{folder}/{index:02d}-{documento.id}-{base_name}'
                used_names.add(zip_name)

                if raw_bytes is not None:
                    zip_file.writestr(zip_name, raw_bytes)
                else:
                    zip_file.writestr(
                        f'{zip_name}.txt',
                        'No fue posible leer este archivo desde el almacenamiento, pero existe el registro documental en Benji.',
                    )

        content = output.getvalue()
        output.close()

        filename = f'Expediente_{models._safe_path_segment(factura.numero_factura or factura.id)}.zip'
        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
