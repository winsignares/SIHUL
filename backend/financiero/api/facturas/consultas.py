"""Consultas de facturas: número sugerido, pendientes, estadísticas, SLA y seguimiento."""
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from ... import models, serializers
from ...sla import build_parametros_sla_map, sincronizar_sla_facturas


class ConsultasFactura:
    """Consultas de facturas: número sugerido, pendientes, estadísticas, SLA y seguimiento."""

    @action(detail=False, methods=['get'])
    def numero_sugerido(self, request):
        """Retorna el próximo número sugerido de factura con formato FAC-YYYY-####."""
        year = timezone.now().year
        prefix = f"FAC-{year}-"
        
        # Obtener todas las facturas del año para ordenarlas numéricamente
        all_facturas = (
            models.Factura.objects
            .filter(numero_factura__startswith=prefix)
            .values_list('numero_factura', flat=True)
        )
        
        next_seq = 1
        if all_facturas:
            try:
                # Extraer secuencias numéricas y encontrar la máxima
                sequences = []
                for num in all_facturas:
                    seq_str = str(num).split('-')[-1]
                    try:
                        seq = int(seq_str)
                        sequences.append(seq)
                    except (TypeError, ValueError):
                        continue
                
                if sequences:
                    next_seq = max(sequences) + 1
            except Exception:
                next_seq = 1
        
        numero_sugerido = f"{prefix}{next_seq:04d}"
        return Response({'numero_factura': numero_sugerido})

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
        pendientes = models.Factura.objects.filter(
            usuario_responsable__isnull=True, 
            estado='Recibida'
        ).order_by('-fecha_recepcion', '-id')
        
        serializer = serializers.FacturaListSerializer(pendientes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de facturas"""
        queryset = models.Factura.objects.all()
        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()
        if rol_nombre == 'Funcionario':
            queryset = queryset.filter(estado__in=['Recibida', 'Registrada'])

        total = queryset.count()
        por_estado = {}
        estados = [choice[0] for choice in models.Factura.ESTADO_CHOICES]
        
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
        facturas = models.Factura.objects.exclude(estado__in=['Pagada', 'Anulada'])
        parametros_map = build_parametros_sla_map()
        actualizadas = sincronizar_sla_facturas(facturas, parametros_map=parametros_map)
        return Response({'actualizadas': actualizadas, 'total': facturas.count()})

    @action(detail=True, methods=['get'])
    def seguimiento(self, request, pk=None):
        """Obtener seguimiento completo de una factura"""
        factura = self.get_object()
        ctx = {'request': request}
        return Response({
            'factura': serializers.FacturaDetailSerializer(factura, context=ctx).data,
            'historial': serializers.HistorialFacturaSerializer(
                factura.historial.all(), many=True, context=ctx
            ).data,
            'comentarios': serializers.ComentarioFacturaSerializer(
                factura.comentarios.all(), many=True, context=ctx
            ).data
        })
