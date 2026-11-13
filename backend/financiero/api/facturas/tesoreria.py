"""Etapa de tesorería: control de pago, confirmación, pago aplicado y comprobante."""
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from ... import flujo_factura, models, serializers
from ..archivos_documentos import _documento_upload_metadata, _guardar_documento_en_carpeta_compartida
from ..expediente_nas import _expediente, _regenerar_pdf_unificado_nas


class TesoreriaFactura:
    """Etapa de tesorería: control de pago, confirmación, pago aplicado y comprobante."""

    @action(detail=True, methods=['post'], url_path='confirmar_control_pago')
    def confirmar_control_pago(self, request, pk=None):
        """Registrar control de pago sin cerrar la etapa de pago aplicado."""
        return self._aplicar_paso(request, flujo_factura.confirmar_control_pago)

    @action(detail=True, methods=['post'], url_path='generar_numero_confirmacion')
    def generar_numero_confirmacion(self, request, pk=None):
        """Generar y persistir el numero de confirmacion antes de confirmar el control."""
        return self._aplicar_paso(request, flujo_factura.generar_numero_confirmacion)

    @action(detail=True, methods=['post'], url_path='registrar_pago_aplicado')
    def registrar_pago_aplicado(self, request, pk=None):
        """Registrar pago aplicado en tesorería."""
        factura = self.get_object()

        def guardar_comprobante(factura, comprobante_bancario):
            documento_data = {
                'factura': factura.id,
                'nombre_archivo': comprobante_bancario.name,
                'tipo_documento': 'Comprobante de Pago',
                'url_storage': comprobante_bancario.name,
                'tamano_bytes': comprobante_bancario.size,
                'tipo_mime': getattr(comprobante_bancario, 'content_type', '') or None,
                'archivo': comprobante_bancario,
            }
            try:
                documento_serializer = serializers.DocumentoAdjuntoSerializer(
                    data=documento_data,
                    context={'request': request}
                )
                documento_serializer.is_valid(raise_exception=True)
                content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(comprobante_bancario)
                _guardar_documento_en_carpeta_compartida(
                    factura=factura,
                    nombre_archivo=documento_serializer.validated_data.get('nombre_archivo') or comprobante_bancario.name,
                    tipo_documento='Comprobante de Pago',
                    tipo_mime=documento_serializer.validated_data.get('tipo_mime') or getattr(comprobante_bancario, 'content_type', ''),
                    content_bytes=content_bytes,
                    tamano_bytes=tamano_bytes,
                    hash_archivo=hash_archivo,
                    usuario=request.user,
                )
            except ValidationError as exc:
                raise flujo_factura.PasoRechazado('Datos de validacion incorrectos.', detail=exc.detail)

        try:
            flujo_factura.registrar_pago_aplicado(factura, request.user, request.data,
                                                  request.FILES.get('comprobante_bancario'),
                                                  guardar_comprobante, _regenerar_pdf_unificado_nas)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)
        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='generar_comprobante')
    def generar_comprobante(self, request, pk=None):
        """Compatibilidad: cerrar facturas antiguas en Pago Aplicado como Pagada."""
        return self._aplicar_paso(request, flujo_factura.generar_comprobante)

    @action(detail=True, methods=['get'], url_path='comprobante_pdf')
    def comprobante_pdf(self, request, pk=None):
        """Compatibilidad: entregar el expediente unificado de la factura pagada."""
        factura = self.get_object()

        if factura.estado not in ['Pago Aplicado', 'Pagada']:
            return Response(
                {'error': 'La factura debe estar en pago aplicado o pagada para descargar el expediente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        scope = self._resolve_scope_documental(request)
        documentos = self._documentos_filtrados_por_scope(factura, scope)
        content = _expediente(factura, documentos, scope)
        filename = f"Expediente_{models._safe_path_segment(factura.numero_factura or factura.id)}.pdf"
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'], url_path='detener_en_tesoreria')
    def detener_en_tesoreria(self, request, pk=None):
        """Detener una factura en tesorería por inconsistencias sin enviarla a auditoría."""
        return self._aplicar_paso(request, flujo_factura.detener_en_tesoreria)
