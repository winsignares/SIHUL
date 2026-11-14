"""Rechazo y devolución de una factura."""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from ... import flujo_factura
from ..expediente_nas import _archivar_documentos_devueltos


class DevolucionFactura:
    """Rechazo y devolución de una factura."""

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        try:
            estado_destino = flujo_factura.rechazar(factura, request.user, request.data, _archivar_documentos_devueltos)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)
        return Response(
            {'mensaje': f'Factura rechazada y enviada a {estado_destino}'},
            status=status.HTTP_200_OK
        )
