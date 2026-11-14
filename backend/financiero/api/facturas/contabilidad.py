"""Etapa de contabilidad: causar y alistar la factura."""
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from ... import flujo_factura
from ..archivos_documentos import _documento_upload_metadata, _guardar_documento_en_carpeta_compartida
from ..expediente_nas import _regenerar_pdf_unificado_nas


class ContabilidadFactura:
    """Etapa de contabilidad: causar y alistar la factura."""

    @action(detail=True, methods=['post'])
    def causar(self, request, pk=None):
        """Causar una factura"""
        factura = self.get_object()

        def guardar_soporte(factura, soporte, nombre_archivo):
            content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(soporte)
            try:
                _guardar_documento_en_carpeta_compartida(
                    factura=factura,
                    nombre_archivo=nombre_archivo,
                    tipo_documento='Soporte Causacion Seven',
                    tipo_mime=getattr(soporte, 'content_type', '') or 'application/pdf',
                    content_bytes=content_bytes,
                    tamano_bytes=tamano_bytes,
                    hash_archivo=hash_archivo,
                    usuario=request.user,
                )
            except ValidationError as exc:
                raise flujo_factura.PasoRechazado(
                    'No fue posible guardar el soporte en la carpeta compartida.',
                    codigo=status.HTTP_503_SERVICE_UNAVAILABLE, detail=exc.detail,
                )

        try:
            flujo_factura.causar(factura, request.user, request.data, request.FILES.get('soporte_causacion'),
                                 guardar_soporte, _regenerar_pdf_unificado_nas)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)
        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def alistar(self, request, pk=None):
        """Alistar una factura"""
        return self._aplicar_paso(request, flujo_factura.alistar)
