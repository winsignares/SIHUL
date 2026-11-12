from rest_framework import viewsets, filters, parsers, status
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from ..permissions import EsUsuarioFinanciero
from rest_framework.pagination import PageNumberPagination
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
import zipfile
from io import BytesIO
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .. import flujo_factura, models, serializers
from ..sla import build_parametros_sla_map, sincronizar_sla_facturas
from ..documentos_sensibles import (
    documento_es_sensible as _documento_es_sensible,
    usuario_puede_ver_documentos_sensibles as _usuario_puede_ver_documentos_sensibles,
)
from .archivos_documentos import _documento_bytes, _documento_upload_metadata, _documentos_queryset_ciclo_actual, _factura_ciclo_documental_actual, _guardar_documento_en_carpeta_compartida
from .expediente_nas import _archivar_documentos_devueltos, _expediente, _regenerar_pdf_unificado_nas


class FacturaPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class FacturaViewSet(viewsets.ModelViewSet):
    permission_classes = [EsUsuarioFinanciero]
    pagination_class = FacturaPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['estado', 'indicador_riesgo', 'proveedor', 'departamento', 'urgente']
    search_fields = ['numero_factura', 'numero_radicado', 'proveedor__razon_social']
    ordering_fields = ['fecha_recepcion', 'valor_total', 'estado']
    ordering = ['-fecha_recepcion']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        queryset = models.Factura.objects.all()

        if self.action == 'list':
            queryset = queryset.select_related(
                'proveedor', 'departamento', 'cuenta_contable', 'centro_costo',
            ).prefetch_related('items')

        rol_nombre = (user.rol.nombre if getattr(user, 'rol', None) else '').strip()
        if rol_nombre == 'Funcionario':
            queryset = queryset.filter(
                Q(creado_por=user) |
                Q(usuario_responsable=user) |
                Q(historial__usuario=user) |
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

    def _aplicar_paso(self, request, paso):
        """Aplica un paso de flujo_factura a la factura y responde su detalle, o el error del paso."""
        factura = self.get_object()
        try:
            paso(factura, request.user, request.data)
        except flujo_factura.PasoRechazado as rechazo:
            return Response(rechazo.respuesta, status=rechazo.codigo)
        return Response(
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )

    def _scope_documental_por_rol(self, request):
        rol_nombre = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
        if rol_nombre == 'funcionario':
            return 'funcionario'
        if rol_nombre == 'contabilidad':
            return 'contabilidad'
        return 'all'

    def _resolve_scope_documental(self, request):
        requested_scope = (request.query_params.get('scope') or '').strip()
        return requested_scope or self._scope_documental_por_rol(request)

    def _factura_response_data(self, factura):
        return serializers.FacturaDetailSerializer(
            factura,
            context={'request': self.request},
        ).data

    def _roles_hasta_scope(self, scope):
        scope_normalizado = (scope or 'all').strip().lower()
        if scope_normalizado == 'proveedor':
            return {'proveedor'}
        if scope_normalizado == 'funcionario':
            return {'proveedor', 'funcionario'}
        if scope_normalizado == 'contabilidad':
            return {'proveedor', 'funcionario', 'contabilidad'}
        return None

    def _documentos_filtrados_por_scope(self, factura, scope):
        allowed_roles = self._roles_hasta_scope(scope)
        queryset = (
            _documentos_queryset_ciclo_actual(factura)
            .select_related('cargado_por__rol')
            .order_by('fecha_carga', 'id')
        )

        if allowed_roles is None:
            documentos = list(queryset)
        else:
            documentos = []
            for documento in queryset:
                usuario = getattr(documento, 'cargado_por', None)
                rol = (getattr(getattr(usuario, 'rol', None), 'nombre', '') or '').strip().lower()
                if not rol or rol in allowed_roles:
                    documentos.append(documento)

        # Deduplicar por tipo_documento: conservar solo el más reciente de cada tipo
        seen_tipos = {}
        for doc in documentos:
            if not _usuario_puede_ver_documentos_sensibles(self.request.user) and _documento_es_sensible(doc):
                continue
            seen_tipos[doc.tipo_documento] = doc  # sobrescribe con el más reciente (orden ASC por fecha)
        return list(seen_tipos.values())

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return serializers.FacturaDetailSerializer
        elif self.action == 'create':
            return serializers.FacturaCreateSerializer
        elif self.action == 'list':
            return serializers.FacturaListSerializer
        return serializers.FacturaDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        if self.action == 'list':
            context['parametros_map'] = build_parametros_sla_map()
        return context

    def perform_create(self, serializer):
        factura = serializer.save(creado_por=self.request.user)
        flujo_factura.registrar_creacion(factura, self.request.user)

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
        return self._aplicar_paso(request, flujo_factura.radicar)

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

    @action(detail=True, methods=['post'], url_path='cargar_direccion_financiera')
    def cargar_direccion_financiera(self, request, pk=None):
        """Registrar el cargue formal en Dirección Financiera antes de rectoría."""
        return self._aplicar_paso(request, flujo_factura.cargar_direccion_financiera)

    @action(detail=True, methods=['post'], url_path='enviar_rectoria')
    def enviar_rectoria(self, request, pk=None):
        """Enviar una factura cargada a Rectoría para autorización final."""
        return self._aplicar_paso(request, flujo_factura.enviar_rectoria)

    @action(detail=True, methods=['post'], url_path='autorizar_rectoria')
    def autorizar_rectoria(self, request, pk=None):
        """Autorizar una factura desde Rectoría para continuar con tesorería."""
        return self._aplicar_paso(request, flujo_factura.autorizar_rectoria)

    @action(detail=True, methods=['post'], url_path='rechazar_rectoria')
    def rechazar_rectoria(self, request, pk=None):
        """Rechazar una factura desde Rectoría y devolverla a Dirección Financiera."""
        return self._aplicar_paso(request, flujo_factura.rechazar_rectoria)

    @action(detail=True, methods=['post'], url_path='confirmar_control_pago')
    def confirmar_control_pago(self, request, pk=None):
        """Registrar control de pago sin cerrar la etapa de pago aplicado."""
        return self._aplicar_paso(request, flujo_factura.confirmar_control_pago)

    @action(detail=True, methods=['post'], url_path='generar_numero_confirmacion')
    def generar_numero_confirmacion(self, request, pk=None):
        """Generar y persistir el numero de confirmacion antes de confirmar el control."""
        return self._aplicar_paso(request, flujo_factura.generar_numero_confirmacion)

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

    @action(detail=True, methods=['post'], url_path='aprobar_auditoria')
    def aprobar_auditoria(self, request, pk=None):
        """Aprobar una factura en control previo de auditoría."""
        return self._aplicar_paso(request, flujo_factura.aprobar_auditoria)

    @action(detail=True, methods=['post'], url_path='rechazar_auditoria')
    def rechazar_auditoria(self, request, pk=None):
        """Rechazar una factura en auditoría y devolverla a tesorería."""
        return self._aplicar_paso(request, flujo_factura.rechazar_auditoria)

    @action(detail=True, methods=['post'], url_path='enviar_direccion_financiera')
    def enviar_direccion_financiera(self, request, pk=None):
        """Enviar una factura aprobada a Dirección Financiera."""
        return self._aplicar_paso(request, flujo_factura.enviar_direccion_financiera)

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
