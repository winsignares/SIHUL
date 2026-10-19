from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
import logging
import zipfile
from io import BytesIO

from financiero.facturas.models import DocumentoUnificado, Factura
from financiero.facturas.serializers import ComentarioFacturaSerializer, FacturaDetailSerializer, FacturaListSerializer, HistorialFacturaSerializer
from financiero.facturas.upload_paths import _safe_path_segment
from financiero.facturas.sla import build_parametros_sla_map, sincronizar_sla_facturas


from .helpers import _factura_ciclo_documental_actual

logger = logging.getLogger(__name__)


class FacturaConsultasMixin:
    """Consultas y reportes de la factura (pendientes, estadisticas, SLA, seguimiento, expediente)."""


    @action(detail=True, methods=['get'], url_path='documentos_consolidados')
    def documentos_consolidados(self, request, pk=None):
        factura = self.get_object()
        scope = self._resolve_scope_documental(request)
        descargar = (request.query_params.get('descargar') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
        doc_id = request.query_params.get('doc_id')

        # El expediente consolidado se sirve desde la carpeta compartida. Solo se
        # regenera si aún no existe para este ciclo documental o si fue eliminado.
        if not doc_id:
            unificado = DocumentoUnificado.objects.filter(
                factura=factura,
                scope=scope,
                ciclo_documental=_factura_ciclo_documental_actual(factura),
            ).first()
            if unificado and unificado.nas_relative_path:
                from financiero.facturas.shared_storage import shared_storage
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
        content = self._pdf_consolidado_documentos(
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
        consolidado = self._pdf_consolidado_documentos(factura, documentos, scope)

        output = BytesIO()
        used_names = set()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('unificados/expediente_unificado.pdf', consolidado)

            for index, documento in enumerate(documentos, 1):
                raw_bytes = self._documento_bytes(documento)
                base_name = _safe_path_segment(documento.nombre_archivo or f'documento-{index}')
                folder = _safe_path_segment(documento.tipo_documento or 'documento')
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

        filename = f'Expediente_{_safe_path_segment(factura.numero_factura or factura.id)}.zip'
        response = HttpResponse(content, content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """
        Obtener SOLO facturas NUEVAS pendientes de registro.
        Estas son facturas en estado 'Recibida' sin responsable asignado.
        Una vez el usuario las registra/procesa completamente, desaparecen de aquí.
        """
        user = request.user
        rol_nombre = (user.rol.nombre if getattr(user, 'rol', None) else '').strip()
        
        # Solo Funcionario ve sus pendientes
        if rol_nombre != 'Funcionario':
            return Response([])
        
        # Pendientes = SOLO facturas sin responsable en estado Recibida
        # (facturas nuevas que vienen del proveedor y deben ser procesadas)
        pendientes = Factura.objects.filter(
            usuario_responsable__isnull=True, 
            estado='Recibida'
        ).order_by('-fecha_recepcion', '-id')
        
        serializer = FacturaListSerializer(pendientes, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de facturas"""
        queryset = Factura.objects.all()
        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()
        if rol_nombre == 'Funcionario':
            queryset = queryset.filter(estado__in=['Recibida', 'Registrada'])

        total = queryset.count()
        por_estado = {}
        estados = [choice[0] for choice in Factura.ESTADO_CHOICES]
        
        for estado in estados:
            count = queryset.filter(estado=estado).count()
            if count > 0:
                por_estado[estado] = count

        vencidas = queryset.filter(indicador_riesgo='vencida').count()
        atrasadas = queryset.filter(indicador_riesgo='atrasada').count()

        return Response({
            'total_facturas': total,
            'por_estado': por_estado,
            'vencidas': vencidas,
            'atrasadas': atrasadas
        })


    @action(detail=False, methods=['post'], url_path='sincronizar_sla')
    def sincronizar_sla(self, request):
        """Sincroniza indicadores SLA para facturas en proceso."""
        facturas = Factura.objects.exclude(estado__in=['Pagada', 'Anulada'])
        parametros_map = build_parametros_sla_map()
        actualizadas = sincronizar_sla_facturas(facturas, parametros_map=parametros_map)
        return Response({'actualizadas': actualizadas, 'total': facturas.count()})


    @action(detail=True, methods=['get'])
    def seguimiento(self, request, pk=None):
        """Obtener seguimiento completo de una factura"""
        factura = self.get_object()
        ctx = {'request': request}
        return Response({
            'factura': FacturaDetailSerializer(factura, context=ctx).data,
            'historial': HistorialFacturaSerializer(
                factura.historial.all(), many=True, context=ctx
            ).data,
            'comentarios': ComentarioFacturaSerializer(
                factura.comentarios.all(), many=True, context=ctx
            ).data
        })
