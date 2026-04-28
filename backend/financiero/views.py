from rest_framework import viewsets, filters, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
import json
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from . import models, serializers
from usuarios.models import Usuario
from notificaciones.signals import crear_notificacion


# ============================================================
# VIEWSETS SIMPLES
# ============================================================

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = models.Proveedor.objects.all()
    serializer_class = serializers.ProveedorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'tipo_proveedor']
    search_fields = ['nit', 'razon_social', 'email']
    ordering_fields = ['fecha_creacion', 'razon_social']
    ordering = ['-fecha_creacion']

    @action(detail=False, methods=['get'], url_path='mi_perfil')
    def mi_perfil(self, request):
        """Encuentra el proveedor asociado al usuario actual por vínculo directo, email o NIT."""
        user = request.user
        proveedor = models.Proveedor.objects.filter(usuario=user).first()

        # 1. Fallback por email del usuario
        if not proveedor and user.correo:
            proveedor = models.Proveedor.objects.filter(email__iexact=user.correo).first()

        # 2. Fallback por NIT pasado como query param
        if not proveedor:
            nit = (request.query_params.get('nit') or '').strip()
            if nit:
                proveedor = models.Proveedor.objects.filter(nit=nit).first()

        if proveedor and proveedor.usuario_id and proveedor.usuario_id != user.id:
            return Response(
                {'detail': 'Este proveedor ya está vinculado a otro usuario.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Auto-vincular en primer acceso para consolidar la relación usuario <-> proveedor
        if proveedor and not proveedor.usuario_id:
            proveedor.usuario = user
            proveedor.save(update_fields=['usuario'])

        if proveedor:
            return Response(serializers.ProveedorSerializer(proveedor).data)

        return Response(
            {'detail': 'No se encontró un proveedor asociado a este usuario.'},
            status=status.HTTP_404_NOT_FOUND
        )


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = models.Departamento.objects.all()
    serializer_class = serializers.DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def areas_solicitantes(self, request):
        """Lista de áreas solicitantes para registro inicial (excluye áreas del flujo financiero)."""
        excluded_default = [
            'Financiero',
            'Contabilidad',
            'Tesorería',
            'Auditoría',
            'Dirección Financiera',
            'Rectoría',
        ]

        excluded = excluded_default
        config = models.ParametrosFinanciero.objects.filter(
            clave='areas_solicitantes_excluidas'
        ).first()

        if config and config.valor:
            try:
                parsed = json.loads(config.valor)
                if isinstance(parsed, list):
                    excluded = [str(item).strip() for item in parsed if str(item).strip()]
            except (TypeError, ValueError, json.JSONDecodeError):
                excluded = excluded_default

        queryset = models.Departamento.objects.filter(estado='Activo').exclude(nombre__in=excluded).order_by('nombre')
        serializer = serializers.DepartamentoSerializer(queryset, many=True)
        return Response(serializer.data)


class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = models.CuentaContable.objects.all()
    serializer_class = serializers.CuentaContableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']


class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = models.CentroCosto.objects.all()
    serializer_class = serializers.CentroCostoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']


class ParametroSLAViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ParametroSLA.objects.filter(activo=True)
    serializer_class = serializers.ParametroSLASerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']


class ParametrosFinancieroViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ParametrosFinanciero.objects.all()
    serializer_class = serializers.ParametrosFinancieroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria']

    @action(detail=False, methods=['get'])
    def por_categoria(self, request):
        """Obtener parámetros agrupados por categoría"""
        params = models.ParametrosFinanciero.objects.all()
        grouped = {}
        for param in params:
            if param.categoria not in grouped:
                grouped[param.categoria] = []
            grouped[param.categoria].append({
                'clave': param.clave,
                'valor': param.valor,
                'tipo_dato': param.tipo_dato
            })
        return Response(grouped)


class ReporteGeneradoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.ReporteGenerado.objects.all()
    serializer_class = serializers.ReporteGeneradoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tipo_reporte', 'formato']
    ordering = ['-fecha_generacion']

    def get_queryset(self):
        # Cada usuario ve solo sus reportes
        return models.ReporteGenerado.objects.filter(generado_por=self.request.user)


# ============================================================
# VIEWSETS COMPLEJOS
# ============================================================

class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.DocumentoAdjuntoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'tipo_documento']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.DocumentoAdjunto.objects.filter(factura_id=factura_id)
        return models.DocumentoAdjunto.objects.all()

    def perform_create(self, serializer):
        archivo = self.request.FILES.get('archivo')
        url_storage = self.request.data.get('url_storage', '') or ''
        instance = serializer.save(cargado_por=self.request.user, url_storage=url_storage)
        if archivo and instance.archivo:
            try:
                instance.url_storage = instance.archivo.url
                instance.save(update_fields=['url_storage'])
            except Exception:
                pass


class HistorialFacturaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.HistorialFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'accion']
    ordering = ['-fecha_accion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.HistorialFactura.objects.filter(factura_id=factura_id)
        return models.HistorialFactura.objects.all()


class ComentarioFacturaViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.ComentarioFacturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'tipo']
    ordering = ['fecha_creacion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.ComentarioFactura.objects.filter(factura_id=factura_id)
        return models.ComentarioFactura.objects.all()

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class RechazoDevolacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.RechazoDevolacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'tipo', 'estado_devolucion']

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            return models.RechazoDevolucion.objects.filter(factura_id=factura_id)
        return models.RechazoDevolucion.objects.all()


# ============================================================
# FACTURA VIEWSET (PRINCIPAL)
# ============================================================

class FacturaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'indicador_riesgo', 'proveedor', 'departamento', 'urgente']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    ordering_fields = ['fecha_recepcion', 'valor_total', 'estado']
    ordering = ['-fecha_recepcion']

    def get_queryset(self):
        user = self.request.user
        queryset = models.Factura.objects.all()

        rol_nombre = (user.rol.nombre if getattr(user, 'rol', None) else '').strip()
        if rol_nombre == 'Funcionario':
            queryset = queryset.filter(
                Q(creado_por=user) |
                Q(usuario_responsable=user) |
                Q(usuario_responsable__isnull=True, estado='Recibida')
            ).distinct()
        elif rol_nombre == 'Proveedor':
            # Proveedor solo ve sus propias facturas (por vínculo directo o email)
            proveedor = models.Proveedor.objects.filter(usuario=user).first()
            if not proveedor and user.correo:
                proveedor = models.Proveedor.objects.filter(email__iexact=user.correo).first()

            if proveedor and not proveedor.usuario_id:
                proveedor.usuario = user
                proveedor.save(update_fields=['usuario'])

            if proveedor:
                queryset = queryset.filter(proveedor=proveedor)
            else:
                queryset = queryset.filter(creado_por=user)

        return queryset

    def _usuarios_por_rol(self, roles):
        if not roles:
            return []
        return list(
            Usuario.objects.filter(rol__nombre__in=roles, activo=True).values_list('id', flat=True)
        )

    def _notificar_transicion(self, factura, estado_anterior, estado_nuevo):
        numero = factura.numero_factura
        creador_id = factura.creado_por_id

        siguientes_roles = {
            'Recibida': ['Contabilidad'],
            'Radicada': ['Contabilidad'],
            'Causada': ['Tesorería'],
            'Alistada': ['Auditoría'],
            'Aprobada Auditoría': ['Dirección Financiera'],
            'Cargada': ['Rectoría'],
            'Autorizada': ['Tesorería'],
            'Pago Aplicado': ['Tesorería'],
        }

        destinatarios = set()
        if creador_id:
            destinatarios.add(creador_id)

        for user_id in self._usuarios_por_rol(siguientes_roles.get(estado_nuevo, [])):
            destinatarios.add(user_id)

        enlace = f'/financiero/funcionario/consultar?factura={factura.id}'
        mensaje = (
            f'Factura actualizada: {numero} cambió de etapa '
            f'{estado_anterior or "Sin estado"} -> {estado_nuevo}. '
            f'Enlace: {enlace}'
        )

        for user_id in destinatarios:
            crear_notificacion(
                id_usuario=user_id,
                tipo='FACTURA_ETAPA_ACTUALIZADA',
                mensaje=mensaje,
                prioridad='alta' if estado_nuevo in ['Recibida', 'Devuelta', 'Rechazada'] else 'media',
            )

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return serializers.FacturaDetailSerializer
        elif self.action == 'create':
            return serializers.FacturaCreateSerializer
        elif self.action == 'list':
            return serializers.FacturaListSerializer
        return serializers.FacturaDetailSerializer

    def perform_create(self, serializer):
        factura = serializer.save(creado_por=self.request.user)

        if not factura.etapa_actual:
            factura.etapa_actual = 'Recepción y Registro'
            factura.save(update_fields=['etapa_actual', 'fecha_modificacion'])
        
        # Crear entrada en historial
        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura registrada',
            estado_nuevo='Recibida',
            usuario=self.request.user,
            usuario_nombre=self.request.user.nombre,
            usuario_rol=self.request.user.rol.nombre if self.request.user.rol else 'Sin rol'
        )

        self._notificar_transicion(factura, None, factura.estado)

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

    @action(detail=True, methods=['post'])
    def radicar(self, request, pk=None):
        """Radicar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Recibida':
            return Response(
                {'error': 'La factura debe estar en estado Recibida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        factura.estado = 'Radicada'
        factura.fecha_radicacion = timezone.now().date()
        factura.numero_radicado = f"RAD-{factura.id:06d}"
        factura.etapa_actual = 'Radicación'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura radicada',
            estado_anterior='Recibida',
            estado_nuevo='Radicada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol'
        )

        self._notificar_transicion(factura, 'Recibida', 'Radicada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def causar(self, request, pk=None):
        """Causar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Radicada':
            return Response(
                {'error': 'La factura debe estar radicada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cuenta_contable_id = request.data.get('cuenta_contable_id')
        centro_costo_id = request.data.get('centro_costo_id')
        observaciones = request.data.get('observaciones', '')

        if cuenta_contable_id:
            try:
                factura.cuenta_contable = models.CuentaContable.objects.get(pk=cuenta_contable_id)
            except models.CuentaContable.DoesNotExist:
                return Response({'error': 'Cuenta contable no encontrada'}, status=status.HTTP_400_BAD_REQUEST)

        if centro_costo_id:
            try:
                factura.centro_costo = models.CentroCosto.objects.get(pk=centro_costo_id)
            except models.CentroCosto.DoesNotExist:
                return Response({'error': 'Centro de costo no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        factura.estado = 'Causada'
        factura.fecha_causacion = timezone.now().date()
        factura.etapa_actual = 'Causación'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura causada',
            estado_anterior='Radicada',
            estado_nuevo='Causada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None
        )

        self._notificar_transicion(factura, 'Radicada', 'Causada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def alistar(self, request, pk=None):
        """Alistar una factura"""
        factura = self.get_object()
        
        if factura.estado != 'Causada':
            return Response(
                {'error': 'La factura debe estar causada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        factura.estado = 'Alistada'
        factura.fecha_alistamiento = timezone.now().date()
        factura.etapa_actual = 'Alistamiento'
        factura.usuario_responsable = request.user
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura alistada',
            estado_anterior='Causada',
            estado_nuevo='Alistada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol'
        )

        self._notificar_transicion(factura, 'Causada', 'Alistada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        motivo = request.data.get('motivo', 'Sin especificar')
        estado_anterior = factura.estado
        
        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=factura.etapa_actual,
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user
        )

        factura.estado = 'Devuelta'
        factura.etapa_actual = 'Devolución'
        factura.usuario_responsable = None
        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura devuelta',
            estado_anterior=estado_anterior,
            estado_nuevo='Devuelta',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo
        )

        self._notificar_transicion(factura, estado_anterior, 'Devuelta')

        return Response(
            {'mensaje': 'Factura rechazada y devuelta'},
            status=status.HTTP_200_OK
        )

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
        total = models.Factura.objects.count()
        por_estado = {}
        estados = [choice[0] for choice in models.Factura.ESTADO_CHOICES]
        
        for estado in estados:
            count = models.Factura.objects.filter(estado=estado).count()
            if count > 0:
                por_estado[estado] = count

        vencidas = models.Factura.objects.filter(indicador_riesgo='vencida').count()
        atrasadas = models.Factura.objects.filter(indicador_riesgo='atrasada').count()

        return Response({
            'total_facturas': total,
            'por_estado': por_estado,
            'vencidas': vencidas,
            'atrasadas': atrasadas
        })

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

    @action(detail=True, methods=['patch'], url_path='completar_registro')
    def completar_registro(self, request, pk=None):
        """Completar registro de una factura pendiente (desde Mis Pendientes)"""
        factura = self.get_object()
        
        # Permitir facturas en estado 'Recibida' o 'Registrada'
        if factura.estado not in ['Recibida', 'Registrada']:
            return Response(
                {'error': f'Solo se pueden completar facturas en estado Recibida o Registrada. Estado actual: {factura.estado}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Permitir actualización de campos específicos sin validaciones estrictas
        serializer = serializers.FacturaDetailSerializer(
            factura, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            # Cambiar estado a 'Registrada' al completar el registro
            factura.estado = 'Registrada'
            # Asignar responsable si no está asignado
            if not factura.usuario_responsable:
                factura.usuario_responsable = request.user
            
            serializer.save()
            factura.save(update_fields=['estado', 'usuario_responsable'])
            
            # Crear registro en historial
            from .models import HistorialFactura
            HistorialFactura.objects.create(
                factura=factura,
                accion='Completar Registro',
                estado_anterior='Recibida',
                estado_nuevo='Registrada',
                usuario=request.user,
                usuario_nombre=request.user.get_full_name() or request.user.username,
                usuario_rol='Funcionario',
                observacion='Factura registrada correctamente por el funcionario'
            )
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
