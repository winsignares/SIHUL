"""Registro de la factura: radicación, completar datos y corrección tras una devolución."""
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from ... import flujo_factura, models, serializers


class RegistroFactura:
    """Registro de la factura: radicación, completar datos y corrección tras una devolución."""

    @action(detail=True, methods=['post'])
    def radicar(self, request, pk=None):
        """Radicar una factura"""
        return self._aplicar_paso(request, flujo_factura.radicar)

    @action(detail=True, methods=['patch'], url_path='completar_registro')
    def completar_registro(self, request, pk=None):
        """Completar registro de una factura pendiente (desde Mis Pendientes)"""
        factura = self.get_object()
        estado_anterior = factura.estado
        try:
            flujo_factura.validar_completar_registro(factura)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)

        # Permitir actualización de campos específicos sin validaciones estrictas
        serializer = serializers.FacturaDetailSerializer(
            factura,
            data=request.data,
            partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        flujo_factura.completar_registro(factura, request.user, estado_anterior, serializer.save)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def corregir(self, request, pk=None):
        """Permite al proveedor corregir y reenviar una factura devuelta/rechazada."""
        factura = self.get_object()
        try:
            flujo_factura.validar_correccion(factura, request.user)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)

        estado_anterior = factura.estado
        # Separar items antes de pasar al serializer de detalle (que no los acepta en escritura)
        items_data = request.data.get('items', None)

        serializer = serializers.FacturaDetailSerializer(
            factura,
            data=request.data,
            partial=True,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        # Si vienen items nuevos, reemplazar los existentes
        if items_data is not None:
            items_serializer = serializers.ItemFacturaSerializer(data=items_data, many=True)
            items_serializer.is_valid(raise_exception=True)
            if not items_serializer.validated_data:
                return Response(
                    {'items': ['Debe registrar al menos un bien o servicio.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                models.ItemFactura.objects.filter(factura=factura).delete()
                for orden, item in enumerate(items_serializer.validated_data, start=1):
                    item.pop('orden', None)
                    models.ItemFactura.objects.create(factura=factura, orden=orden, **item)

        flujo_factura.reenviar_correccion(factura, request.user, estado_anterior,
                                          request.data.get('observaciones_correccion'))

        return Response(
            serializers.FacturaDetailSerializer(factura, context={'request': request}).data,
            status=status.HTTP_200_OK
        )
