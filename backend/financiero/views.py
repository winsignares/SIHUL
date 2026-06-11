from rest_framework import viewsets, filters, parsers, status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError, transaction
from django.db.models import Q, Sum, Count
from django.http import HttpResponse
from django.conf import settings
import json
import logging
import os
import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.utils.dateparse import parse_date
import unicodedata
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from . import models, serializers
from .sla import build_parametros_sla_map, actualizar_sla_factura, sincronizar_sla_facturas
from usuarios.models import Usuario
from notificaciones.signals import crear_notificacion

logger = logging.getLogger(__name__)


DEFAULT_CUENTAS_CONTABLES = [
    {
        'codigo': '513505',
        'nombre': 'Servicios públicos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '513595',
        'nombre': 'Otros servicios administrativos',
        'tipo_cuenta': 'Gasto',
        'nivel': 4,
        'cuenta_padre': '5135',
        'naturaleza': 'Débito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': True,
        'estado': 'Activo',
    },
    {
        'codigo': '220505',
        'nombre': 'Proveedores nacionales',
        'tipo_cuenta': 'Pasivo',
        'nivel': 4,
        'cuenta_padre': '2205',
        'naturaleza': 'Crédito',
        'acepta_movimiento': True,
        'requiere_tercero': True,
        'requiere_centro_costo': False,
        'estado': 'Activo',
    },
]

DEFAULT_CENTROS_COSTO = [
    {'codigo': 'CC-ADM-001', 'nombre': 'Administración General', 'tipo': 'Administrativo', 'estado': 'Activo'},
    {'codigo': 'CC-ACA-001', 'nombre': 'Gestión Académica', 'tipo': 'Académico', 'estado': 'Activo'},
    {'codigo': 'CC-OPE-001', 'nombre': 'Operación Institucional', 'tipo': 'Operativo', 'estado': 'Activo'},
]

ESTADO_ENVIADA_RECTORIA = 'Enviada Rector\u00eda'
ESTADO_AUTORIZADA = 'Autorizada'
ESTADO_RECHAZADA_POR_RECTORIA = 'Rechazada por Rector\u00eda'
ESTADO_REVISADA_DIRECCION_FINANCIERA = 'Revisada Dir. Financiera'
ESTADO_DEVUELTA = 'Devuelta'
ESTADO_CARGADA = 'Cargada'


def _normalize_text(value):
    return unicodedata.normalize('NFD', value or '').encode('ascii', 'ignore').decode('ascii').lower().strip()


def _estado_matches(actual, expected):
    return _normalize_text(actual) == _normalize_text(expected)


def _factura_document_base_path(factura):
    today = timezone.localdate()
    factura_label = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    return (
        Path(settings.MEDIA_ROOT)
        / f'{today:%Y}'
        / f'{today:%m}'
        / f'semana-{today.isocalendar().week:02d}'
        / factura_label
    )


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

    def list(self, request, *args, **kwargs):
        if not models.CuentaContable.objects.exists():
            for cuenta in DEFAULT_CUENTAS_CONTABLES:
                models.CuentaContable.objects.get_or_create(codigo=cuenta['codigo'], defaults=cuenta)
        return super().list(request, *args, **kwargs)


class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = models.CentroCosto.objects.all()
    serializer_class = serializers.CentroCostoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not models.CentroCosto.objects.exists():
            for centro in DEFAULT_CENTROS_COSTO:
                models.CentroCosto.objects.get_or_create(codigo=centro['codigo'], defaults=centro)
        return super().list(request, *args, **kwargs)


class ParametroSLAViewSet(viewsets.ModelViewSet):
    queryset = models.ParametroSLA.objects.all()
    serializer_class = serializers.ParametroSLASerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)


class ParametrosFinancieroViewSet(viewsets.ModelViewSet):
    queryset = models.ParametrosFinanciero.objects.all()
    serializer_class = serializers.ParametrosFinancieroSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['categoria']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)

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

    def _parse_date(self, value):
        if not value:
            return None
        try:
            return datetime.strptime(str(value), '%Y-%m-%d').date()
        except ValueError:
            return None

    def _filtrar_facturas(self, filtros):
        queryset = models.Factura.objects.select_related('proveedor', 'departamento').all()

        fecha_inicio = self._parse_date(filtros.get('fecha_inicio'))
        fecha_fin = self._parse_date(filtros.get('fecha_fin'))
        estado = (filtros.get('estado') or '').strip()
        proveedor_id = filtros.get('proveedor_id')

        if fecha_inicio:
            queryset = queryset.filter(fecha_recepcion__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(fecha_recepcion__lte=fecha_fin)
        if estado:
            queryset = queryset.filter(estado=estado)
        if proveedor_id:
            queryset = queryset.filter(proveedor_id=proveedor_id)

        return queryset.order_by('-fecha_recepcion')

    def _build_factura_rows(self, queryset):
        rows = []
        for factura in queryset:
            rows.append([
                factura.numero_factura,
                factura.proveedor.razon_social if factura.proveedor else '',
                factura.proveedor.nit if factura.proveedor else '',
                factura.departamento.nombre if factura.departamento else '',
                factura.estado,
                float(factura.valor_total or 0),
                str(factura.fecha_recepcion or ''),
                str(factura.fecha_autorizacion or ''),
                str(factura.fecha_pago_aplicado or ''),
                str(factura.fecha_comprobante or ''),
                factura.numero_transaccion or '',
                factura.numero_comprobante or '',
            ])
        return rows

    def _registrar_reporte(self, *, tipo_reporte, formato, filtros, nombre, cantidad_registros, tamano):
        return models.ReporteGenerado.objects.create(
            tipo_reporte=tipo_reporte,
            nombre_reporte=nombre,
            formato=formato,
            parametros_filtros=filtros or {},
            cantidad_registros=cantidad_registros,
            tamano_archivo_bytes=tamano,
            generado_por=self.request.user,
        )

    @action(detail=False, methods=['get'], url_path='dashboard_admin')
    def dashboard_admin(self, request):
        facturas = models.Factura.objects.all()
        estados_cierre = ['Pagada', 'Anulada']
        facturas_en_proceso = facturas.exclude(estado__in=estados_cierre)

        roles_financieros = [
            'Funcionario',
            'Contabilidad',
            'Tesorería',
            'Tesoreria',
            'Auditoría',
            'Auditoria',
            'Dirección Financiera',
            'Direccion Financiera',
            'Rectoría',
            'Rectoria',
            'Admin Financiero',
            'admin_financiero',
        ]
        roles_q = Q()
        for nombre_rol in roles_financieros:
            roles_q |= Q(rol__nombre__iexact=nombre_rol)

        usuarios_activos = Usuario.objects.filter(activo=True).filter(roles_q).count()
        proveedores_activos = models.Proveedor.objects.filter(estado='Activo').count()

        total_facturas = facturas.count()
        cantidad_proceso = facturas_en_proceso.count()
        monto_total = facturas_en_proceso.aggregate(total=Sum('valor_total')).get('total') or 0
        facturas_riesgo = facturas.filter(indicador_riesgo__in=['atencion', 'atrasada', 'vencida']).count()
        facturas_vencidas = facturas.filter(indicador_riesgo='vencida').count()

        now = timezone.now()
        pagos_aplicados_mes = facturas.filter(
            estado__in=['Pago Aplicado', 'Pagada'],
            fecha_pago_aplicado__year=now.year,
            fecha_pago_aplicado__month=now.month,
        ).count()

        dias = [f.dias_transcurridos for f in facturas_en_proceso.only('fecha_recepcion')]
        tiempo_promedio = round((sum(dias) / len(dias)), 2) if dias else 0

        distribucion = list(
            facturas.values('estado').annotate(cantidad=Count('id')).order_by('-cantidad')
        )

        alertas_qs = models.Factura.objects.filter(indicador_riesgo__in=['atencion', 'atrasada', 'vencida']).order_by('-fecha_recepcion')[:15]
        alertas = [
            {
                'id': f.id,
                'numero_factura': f.numero_factura,
                'estado': f.estado,
                'indicador_riesgo': f.indicador_riesgo,
                'dias_transcurridos': f.dias_transcurridos,
                'valor_total': float(f.valor_total or 0),
            }
            for f in alertas_qs
        ]

        actividades_qs = models.HistorialFactura.objects.select_related('factura', 'usuario').order_by('-fecha_accion')[:12]
        actividades = [
            {
                'id': h.id,
                'numero_factura': h.factura.numero_factura if h.factura else None,
                'usuario_nombre': h.usuario_nombre or (h.usuario.nombre if h.usuario else 'Sistema'),
                'accion': h.accion,
                'estado_nuevo': h.estado_nuevo,
                'fecha_accion': h.fecha_accion,
            }
            for h in actividades_qs
        ]

        return Response({
            'resumen': {
                'usuarios_activos': usuarios_activos,
                'proveedores_activos': proveedores_activos,
                'total_facturas': total_facturas,
                'facturas_en_proceso': cantidad_proceso,
                'facturas_riesgo': facturas_riesgo,
                'facturas_vencidas': facturas_vencidas,
                'monto_total_tramite': float(monto_total),
                'tiempo_promedio_dias': tiempo_promedio,
                'pagos_aplicados_mes': pagos_aplicados_mes,
            },
            'distribucion_estados': distribucion,
            'alertas': alertas,
            'actividades': actividades,
        })

    @action(detail=False, methods=['post'], url_path='exportar')
    def exportar(self, request):
        formato = (request.data.get('formato') or 'Excel').strip()
        tipo_reporte = (request.data.get('tipo_reporte') or 'consolidado_facturas').strip()
        filtros = request.data.get('filtros') if isinstance(request.data.get('filtros'), dict) else {}

        if formato not in ['Excel', 'PDF']:
            return Response({'error': 'Formato no soportado. Use Excel o PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = self._filtrar_facturas(filtros)
        rows = self._build_factura_rows(queryset)
        now_stamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        filename_base = f"{tipo_reporte}_{now_stamp}"

        headers = [
            'Numero Factura', 'Proveedor', 'NIT', 'Departamento', 'Estado', 'Valor Total',
            'Fecha Recepcion', 'Fecha Autorizacion', 'Fecha Pago Aplicado', 'Fecha Comprobante',
            'Numero Transaccion', 'Numero Comprobante'
        ]

        if formato == 'Excel':
            wb = Workbook()
            ws = wb.active
            ws.title = 'Reporte Financiero'
            ws.append(headers)
            for row in rows:
                ws.append(row)

            output = BytesIO()
            wb.save(output)
            content = output.getvalue()
            output.close()

            self._registrar_reporte(
                tipo_reporte=tipo_reporte,
                formato='Excel',
                filtros=filtros,
                nombre=f'{filename_base}.xlsx',
                cantidad_registros=len(rows),
                tamano=len(content),
            )

            response = HttpResponse(
                content,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="{filename_base}.xlsx"'
            return response

        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        _, height = letter

        pdf.setFont('Helvetica-Bold', 12)
        pdf.drawString(40, height - 40, f'Reporte Financiero - {tipo_reporte}')
        pdf.setFont('Helvetica', 9)
        pdf.drawString(40, height - 55, f'Generado: {timezone.now().strftime("%Y-%m-%d %H:%M") }')
        pdf.drawString(40, height - 70, f'Registros: {len(rows)}')

        y = height - 95
        for row in rows:
            line = f"{row[0]} | {row[1][:22]} | {row[4]} | ${row[5]:,.0f}"
            pdf.drawString(40, y, line)
            y -= 13
            if y < 50:
                pdf.showPage()
                pdf.setFont('Helvetica', 9)
                y = height - 40

        pdf.save()
        content = output.getvalue()
        output.close()

        self._registrar_reporte(
            tipo_reporte=tipo_reporte,
            formato='PDF',
            filtros=filtros,
            nombre=f'{filename_base}.pdf',
            cantidad_registros=len(rows),
            tamano=len(content),
        )

        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename_base}.pdf"'
        return response


# ============================================================
# VIEWSETS COMPLEJOS
# ============================================================

class DocumentoAdjuntoViewSet(viewsets.ModelViewSet):
    serializer_class = serializers.DocumentoAdjuntoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['factura', 'factura_id', 'tipo_documento']
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        factura_id = self.request.query_params.get('factura_id') or self.request.query_params.get('factura')
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
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        queryset = models.Factura.objects.all()

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

    def _usuarios_por_rol(self, roles):
        if not roles:
            return []
        return list(
            Usuario.objects.filter(rol__nombre__in=roles, activo=True).values_list('id', flat=True)
        )

    def _ruta_factura_por_rol(self, factura, usuario):
        rol_nombre = (getattr(getattr(usuario, 'rol', None), 'nombre', '') or '').strip().lower()
        if rol_nombre == 'proveedor':
            return f'/financiero/proveedor/mis-facturas/{factura.id}'
        return f'/financiero/funcionario/consultar?factura={factura.id}'

    def _notificar_transicion(self, factura, estado_anterior, estado_nuevo):
        numero = factura.numero_factura
        creador_id = factura.creado_por_id

        siguientes_roles = {
            'Recibida': ['Contabilidad'],
            'Registrada': ['Contabilidad'],
            'Radicada': ['Contabilidad'],
            'Causada': ['Tesorería'],
            'Alistada': ['Auditoría'],
            'Aprobada Auditoría': ['Dirección Financiera'],
            'Rechazada Auditoría': ['Tesorería'],
            'Revisada Dir. Financiera': ['Dirección Financiera'],
            'Cargada': ['Rectoría'],
            'Enviada Rectoría': ['Rectoría'],
            'Rechazada por Rectoría': ['Dirección Financiera'],
            'Devuelta': ['Dirección Financiera'],
            'Pago Aplicado': ['Tesorería'],
        }

        destinatarios = set()
        if creador_id:
            destinatarios.add(creador_id)

        for user_id in self._usuarios_por_rol(siguientes_roles.get(estado_nuevo, [])):
            destinatarios.add(user_id)

        usuarios_destino = {
            usuario.id: usuario
            for usuario in Usuario.objects.filter(id__in=destinatarios).select_related('rol')
        }

        es_devolucion = estado_nuevo == 'Devuelta' or factura.etapa_actual == 'Corrección Funcionario'
        motivo_devolucion = None
        if es_devolucion:
            motivo_devolucion = (
                models.RechazoDevolucion.objects
                .filter(factura=factura)
                .order_by('-fecha_rechazo')
                .values_list('motivo', flat=True)
                .first()
            )

        for user_id in destinatarios:
            usuario_destino = usuarios_destino.get(user_id)
            enlace = self._ruta_factura_por_rol(factura, usuario_destino)

            tipo_notificacion = 'FACTURA_ETAPA_ACTUALIZADA'
            mensaje = (
                f'La factura {numero} ha avanzado en su proceso de revisión. '
                f'Estado anterior: {estado_anterior or "Sin estado"}. '
                f'Estado actual: {estado_nuevo}. '
                f'Puedes revisar los detalles en tu panel de facturas.'
            )
            prioridad = 'alta' if estado_nuevo in ['Recibida', 'Devuelta', 'Rechazada', 'Rechazada por Rectoría'] else 'media'

            if es_devolucion and user_id == creador_id:
                tipo_notificacion = 'FACTURA_DEVUELTA'
                mensaje = (
                    f'La factura {numero} ha sido devuelta para corrección. '
                    f'Motivo: {motivo_devolucion or "Revisar observaciones en el historial de cambios"}. '
                    f'Por favor, realiza los ajustes necesarios y vuelve a enviarla.'
                )
                prioridad = 'alta'

            crear_notificacion(
                id_usuario=user_id,
                tipo=tipo_notificacion,
                mensaje=mensaje,
                prioridad=prioridad,
            )

    def _generar_numero_confirmacion(self):
        year = timezone.now().year
        prefix = f"CONF-{year}-"
        last_number = (
            models.Factura.objects
            .filter(numero_confirmacion__startswith=prefix)
            .order_by('-numero_confirmacion')
            .values_list('numero_confirmacion', flat=True)
            .first()
        )

        next_seq = 1
        if last_number:
            try:
                next_seq = int(str(last_number).split('-')[-1]) + 1
            except (TypeError, ValueError):
                next_seq = 1

        return f"{prefix}{next_seq:04d}"

    def _texto_normalizado(self, value):
        return str(value or '').strip().lower()

    def _doc_cumple_tipo(self, documento, tipo_requerido, keywords):
        tipo_doc = self._texto_normalizado(getattr(documento, 'tipo_documento', ''))
        nombre_doc = self._texto_normalizado(getattr(documento, 'nombre_archivo', ''))
        tipo_ref = self._texto_normalizado(tipo_requerido)

        if tipo_doc == tipo_ref:
            return True

        return any(keyword in nombre_doc for keyword in keywords)

    def _obtener_faltantes_radicacion(self, factura):
        requeridos = {
            'Factura': ['factura'],
            'Orden de Compra': ['orden', 'compra', 'contrato'],
            'Certificación Bancaria': ['certif', 'bancari'],
        }

        documentos = list(models.DocumentoAdjunto.objects.filter(factura=factura))
        faltantes = []

        for tipo_requerido, keywords in requeridos.items():
            existe = any(
                self._doc_cumple_tipo(doc, tipo_requerido, keywords)
                for doc in documentos
            )
            if not existe:
                faltantes.append(tipo_requerido)

        return faltantes

    def _scope_documental_por_rol(self, request):
        rol_nombre = (getattr(getattr(request.user, 'rol', None), 'nombre', '') or '').strip().lower()
        if rol_nombre == 'funcionario':
            return 'funcionario'
        if rol_nombre == 'contabilidad':
            return 'contabilidad'
        return 'all'

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
            models.DocumentoAdjunto.objects
            .filter(factura=factura)
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
            seen_tipos[doc.tipo_documento] = doc  # sobrescribe con el más reciente (orden ASC por fecha)
        return list(seen_tipos.values())

    def _build_pdf_page(self, titulo, lineas):
        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        y = height - 50

        pdf.setFont('Helvetica-Bold', 14)
        pdf.drawString(40, y, titulo)
        y -= 24
        pdf.setFont('Helvetica', 10)

        for linea in lineas:
            for segmento in str(linea).split('\n'):
                pdf.drawString(40, y, segmento[:110])
                y -= 16
                if y < 60:
                    pdf.showPage()
                    pdf.setFont('Helvetica', 10)
                    y = height - 50

        pdf.save()
        return output.getvalue()

    def _build_portada_factura(self, factura, documentos, scope):
        """Genera una portada profesional e informativa para el PDF consolidado."""
        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        
        # Colores
        COLOR_HEADER = colors.HexColor('#1e40af')
        COLOR_ACCENT = colors.HexColor('#0369a1')
        COLOR_TEXT = colors.HexColor('#1f2937')
        COLOR_LIGHT = colors.HexColor('#f3f4f6')
        
        # Encabezado con fondo
        pdf.setFillColor(COLOR_HEADER)
        pdf.rect(0, height - 100, width, 100, fill=1, stroke=0)
        
        # Título principal
        pdf.setFont('Helvetica-Bold', 24)
        pdf.setFillColor(colors.white)
        pdf.drawString(40, height - 50, 'DOCUMENTACIÓN CONSOLIDADA')
        
        # Número de factura
        pdf.setFont('Helvetica-Bold', 16)
        pdf.setFillColor(colors.HexColor('#fbbf24'))
        pdf.drawString(40, height - 75, f'Factura: {factura.numero_factura}')
        
        y = height - 120
        
        # Sección 1: Información de la Factura
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '📋 INFORMACIÓN DE LA FACTURA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        info_factura = [
            ('Número Factura:', factura.numero_factura),
            ('Estado Actual:', factura.estado or 'N/A'),
            ('Etapa:', factura.etapa_actual or 'N/A'),
            ('Fecha Factura:', str(factura.fecha_factura) if factura.fecha_factura else 'N/A'),
            ('Fecha Recepción:', str(factura.fecha_recepcion) if factura.fecha_recepcion else 'N/A'),
        ]
        
        for label, valor in info_factura:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 2: Información del Proveedor
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '👤 INFORMACIÓN DEL PROVEEDOR')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        proveedor = factura.proveedor
        info_proveedor = [
            ('Razón Social:', getattr(proveedor, 'razon_social', 'N/A') if proveedor else 'N/A'),
            ('NIT:', getattr(proveedor, 'nit', 'N/A') if proveedor else 'N/A'),
            ('Email:', getattr(proveedor, 'email', 'N/A') if proveedor else 'N/A'),
        ]
        
        for label, valor in info_proveedor:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 3: Información Financiera
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '💰 INFORMACIÓN FINANCIERA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        info_financiera = [
            ('Subtotal:', f'${float(factura.valor_subtotal or 0):,.2f}'),
            ('IVA:', f'${float(factura.valor_iva or 0):,.2f}'),
            ('Total:', f'${float(factura.valor_total or 0):,.2f}'),
        ]
        
        for label, valor in info_financiera:
            pdf.drawString(50, y, f'{label}')
            pdf.setFont('Helvetica-Bold', 10)
            pdf.drawString(200, y, str(valor))
            pdf.setFont('Helvetica', 10)
            y -= 16
        
        y -= 10
        
        # Sección 4: Información Operativa
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '⚙️ INFORMACIÓN OPERATIVA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        dias_transcurridos = factura.dias_transcurridos or 0
        info_operativa = [
            ('Días Transcurridos:', f'{dias_transcurridos} días'),
            ('Área Solicitante:', getattr(factura.departamento, 'nombre', 'N/A') if factura.departamento else 'N/A'),
            ('Observaciones:', (factura.observaciones or 'Sin observaciones')[:50]),
        ]
        
        for label, valor in info_operativa:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 5: Documentos Incluidos
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, f'📎 DOCUMENTOS INCLUIDOS ({len(documentos)})')
        y -= 20
        
        pdf.setFont('Helvetica', 9)
        pdf.setFillColor(COLOR_TEXT)
        
        for idx, doc in enumerate(documentos, 1):
            doc_text = f'{idx}. {doc.tipo_documento} - {doc.nombre_archivo}'
            pdf.drawString(50, y, doc_text[:80])
            y -= 14
            if y < 60:
                pdf.showPage()
                y = height - 50
        
        # Pie de página
        pdf.setFont('Helvetica', 8)
        pdf.setFillColor(colors.HexColor('#9ca3af'))
        pdf.drawString(40, 30, f'Generado: {timezone.now().strftime("%d/%m/%Y %H:%M:%S")} | Scope: {scope}')
        
        pdf.save()
        return output.getvalue()

    def _append_pdf_bytes(self, writer, raw_bytes):
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(raw_bytes))
            for page in reader.pages:
                writer.add_page(page)
            return True
        except Exception:
            return False

    def _append_image_bytes_as_pdf(self, writer, raw_bytes):
        try:
            from PIL import Image
            image = Image.open(BytesIO(raw_bytes))
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            output = BytesIO()
            image.save(output, format='PDF')
            output.seek(0)
            return self._append_pdf_bytes(writer, output.read())
        except Exception:
            return False

    def _documento_bytes(self, documento):
        if documento.archivo:
            try:
                documento.archivo.open('rb')
                data = documento.archivo.read()
                documento.archivo.close()
                return data
            except Exception:
                return None

        raw_storage = (documento.url_storage or '').strip()
        if not raw_storage:
            return None

        possible_path = raw_storage
        if raw_storage.startswith('/media/'):
            possible_path = os.path.join(settings.MEDIA_ROOT, raw_storage.replace('/media/', '', 1))
        elif raw_storage.startswith('media/'):
            possible_path = os.path.join(settings.MEDIA_ROOT, raw_storage.replace('media/', '', 1))

        if os.path.exists(possible_path):
            try:
                with open(possible_path, 'rb') as file_handle:
                    return file_handle.read()
            except Exception:
                return None
        return None

    def _guardar_pdf_unificado(self, factura, content, scope):
        try:
            output_dir = _factura_document_base_path(factura) / 'unificados'
            output_dir.mkdir(parents=True, exist_ok=True)
            safe_scope = models._safe_path_segment(scope or 'all')
            safe_factura = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
            output_path = output_dir / f'Documentos_{safe_factura}_{safe_scope}.pdf'
            output_path.write_bytes(content)
        except Exception:
            logger.exception('No fue posible guardar PDF unificado factura_id=%s', factura.id)

    def _pdf_consolidado_documentos(self, factura, documentos, scope):
        try:
            from pypdf import PdfWriter
        except Exception:
            PdfWriter = None

        if PdfWriter is None:
            return self._build_pdf_page(
                f'Documentacion consolidada - {factura.numero_factura}',
                [
                    f'Scope solicitado: {scope}',
                    'No fue posible consolidar los soportes porque el motor PDF no esta disponible en el servidor.',
                ],
            )

        writer = PdfWriter()
        portada = self._build_portada_factura(factura, documentos, scope)
        self._append_pdf_bytes(writer, portada)

        if not documentos:
            buffer = BytesIO()
            writer.write(buffer)
            content = buffer.getvalue()
            self._guardar_pdf_unificado(factura, content, scope)
            return content

        for documento in documentos:
            raw_bytes = self._documento_bytes(documento)
            lower_name = (documento.nombre_archivo or '').lower()
            lower_mime = (documento.tipo_mime or '').lower()
            merged = False

            if raw_bytes:
                if lower_name.endswith('.pdf') or lower_mime == 'application/pdf':
                    merged = self._append_pdf_bytes(writer, raw_bytes)
                elif lower_name.endswith(('.png', '.jpg', '.jpeg')) or lower_mime in {'image/png', 'image/jpeg'}:
                    merged = self._append_image_bytes_as_pdf(writer, raw_bytes)
                elif lower_name.endswith('.txt') or lower_mime in {'text/plain', 'application/octet-stream'}:
                    try:
                        texto = raw_bytes.decode('utf-8', errors='replace')
                        lineas = [f'Archivo: {documento.nombre_archivo}', '']
                        lineas += texto.splitlines()
                        resumen = self._build_pdf_page('Archivo Plano SEVEN', lineas)
                        merged = self._append_pdf_bytes(writer, resumen)
                    except Exception:
                        pass

            if not merged:
                resumen = self._build_pdf_page(
                    f'Soporte no integrado: {documento.tipo_documento}',
                    [
                        f'Archivo: {documento.nombre_archivo}',
                        f'Tipo MIME: {documento.tipo_mime or "No registrado"}',
                        f'Fecha de carga: {documento.fecha_carga}',
                        '',
                        'Este soporte no pudo integrarse como pagina PDF, pero hace parte del expediente de la factura.',
                        f'URL registrada: {documento.url_storage or "Sin URL disponible"}',
                    ],
                )
                self._append_pdf_bytes(writer, resumen)

        buffer = BytesIO()
        writer.write(buffer)
        content = buffer.getvalue()
        self._guardar_pdf_unificado(factura, content, scope)
        return content

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
        if not factura.fecha_inicio_etapa:
            factura.fecha_inicio_etapa = factura.fecha_recepcion or timezone.now().date()

        factura.save(update_fields=['etapa_actual', 'fecha_inicio_etapa', 'fecha_modificacion'])
        
        # Crear entrada en historial
        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura registrada',
            estado_nuevo='Recibida',
            usuario=self.request.user,
            usuario_nombre=self.request.user.nombre,
            usuario_rol=self.request.user.rol.nombre if self.request.user.rol else 'Sin rol'
        )

        actualizar_sla_factura(factura)
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

        if factura.estado not in ['Recibida', 'Registrada']:
            return Response(
                {'error': 'La factura debe estar en estado Recibida o Registrada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        faltantes = self._obtener_faltantes_radicacion(factura)
        if faltantes:
            return Response(
                {
                    'error': 'No se puede radicar: faltan soportes obligatorios.',
                    'faltantes': faltantes,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        observaciones = (request.data.get('observaciones') or '').strip()
        numero_operacion = (request.data.get('numero_operacion_contable') or '').strip()
        consecutivo_operacion = (request.data.get('consecutivo_operacion') or '').strip()

        if not observaciones:
            return Response(
                {'error': 'Las observaciones son obligatorias para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not numero_operacion:
            return Response(
                {'error': 'El numero de operacion contable es obligatorio para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not consecutivo_operacion:
            return Response(
                {'error': 'El consecutivo de operacion es obligatorio para radicar.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        duplicado = models.Factura.objects.filter(
            consecutivo_operacion=consecutivo_operacion
        ).exclude(pk=factura.pk).first()
        if duplicado:
            return Response(
                {
                    'error': f'El consecutivo "{consecutivo_operacion}" ya está registrado en la factura {duplicado.numero_factura} (Radicado: {duplicado.numero_radicado}). El consecutivo debe ser único en el sistema.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        factura.estado = 'Radicada'
        factura.fecha_radicacion = timezone.now().date()
        factura.fecha_causacion = timezone.now().date()
        factura.numero_radicado = f"{numero_operacion}-{consecutivo_operacion}"
        factura.numero_operacion_contable = numero_operacion
        factura.consecutivo_operacion = consecutivo_operacion
        factura.etapa_actual = 'Radicación'
        factura.fecha_inicio_etapa = factura.fecha_radicacion
        factura.usuario_responsable = request.user
        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura radicada',
            estado_anterior=estado_anterior,
            estado_nuevo='Radicada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Radicada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='documentos_consolidados')
    def documentos_consolidados(self, request, pk=None):
        factura = self.get_object()
        scope = request.query_params.get('scope') or self._scope_documental_por_rol(request)
        descargar = (request.query_params.get('descargar') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
        doc_id = request.query_params.get('doc_id')

        documentos = self._documentos_filtrados_por_scope(factura, scope)
        if doc_id:
            documentos = [d for d in documentos if str(d.id) == str(doc_id)]
        content = self._pdf_consolidado_documentos(factura, documentos, scope)

        filename = f'Documentos_{factura.numero_factura}_{scope}.pdf'
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'{"attachment" if descargar else "inline"}; filename="{filename}"'
        return response

    @action(detail=True, methods=['get'], url_path='documentos_historial_zip')
    def documentos_historial_zip(self, request, pk=None):
        """Descarga el expediente completo: archivos originales y PDF unificado."""
        factura = self.get_object()
        scope = request.query_params.get('scope') or self._scope_documental_por_rol(request)
        documentos = self._documentos_filtrados_por_scope(factura, scope)
        consolidado = self._pdf_consolidado_documentos(factura, documentos, scope)

        output = BytesIO()
        used_names = set()
        with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('unificados/expediente_unificado.pdf', consolidado)

            for index, documento in enumerate(documentos, 1):
                raw_bytes = self._documento_bytes(documento)
                base_name = models._safe_path_segment(documento.nombre_archivo or f'documento-{index}')
                folder = models._safe_path_segment(documento.tipo_documento or 'documento')
                zip_name = f'especificos/{folder}/{index:02d}-{base_name}'

                if zip_name in used_names:
                    zip_name = f'especificos/{folder}/{index:02d}-{documento.id}-{base_name}'
                used_names.add(zip_name)

                if raw_bytes:
                    zip_file.writestr(zip_name, raw_bytes)
                else:
                    zip_file.writestr(
                        f'{zip_name}.txt',
                        'No fue posible leer este archivo desde el almacenamiento, pero existe el registro documental en SIHUL.',
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
        factura = self.get_object()

        if not any(
            _estado_matches(factura.estado, estado_valido)
            for estado_valido in [
                ESTADO_REVISADA_DIRECCION_FINANCIERA,
                ESTADO_DEVUELTA,
                ESTADO_RECHAZADA_POR_RECTORIA,
            ]
        ):
            return Response(
                {'error': 'La factura debe estar revisada o devuelta para ser cargada en Dirección Financiera'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = ESTADO_CARGADA
        factura.fecha_cargue = timezone.now().date()
        factura.etapa_actual = 'Cargue Formal'
        factura.fecha_inicio_etapa = factura.fecha_cargue
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Dirección Financiera] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura cargada en dirección financiera',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_CARGADA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_CARGADA)

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='enviar_rectoria')
    def enviar_rectoria(self, request, pk=None):
        """Enviar una factura cargada a Rectoría para autorización final."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_CARGADA):
            return Response(
                {'error': 'La factura debe estar cargada para enviarla a Rectoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = ESTADO_ENVIADA_RECTORIA
        factura.fecha_envio_rectoria = timezone.now().date()
        factura.etapa_actual = 'Autorización Rectoría'
        factura.fecha_inicio_etapa = factura.fecha_envio_rectoria
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Dirección Financiera - Envío] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura enviada a rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_ENVIADA_RECTORIA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_ENVIADA_RECTORIA)

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='autorizar_rectoria')
    def autorizar_rectoria(self, request, pk=None):
        """Autorizar una factura desde Rectoría para continuar con tesorería."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_ENVIADA_RECTORIA):
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para autorizarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        hoy = timezone.now().date()

        factura.estado = 'Pago Aplicado'
        factura.fecha_autorizacion = hoy
        factura.fecha_pago_aplicado = hoy
        factura.fecha_comprobante = hoy
        factura.etapa_actual = 'Pago Aplicado'
        factura.fecha_inicio_etapa = hoy
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura autorizada por Rectoría — pago aplicado',
            estado_anterior=estado_anterior,
            estado_nuevo='Pago Aplicado',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Pago Aplicado')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='rechazar_rectoria')
    def rechazar_rectoria(self, request, pk=None):
        """Rechazar una factura desde Rectoría y devolverla a Dirección Financiera."""
        factura = self.get_object()

        if not _estado_matches(factura.estado, ESTADO_ENVIADA_RECTORIA):
            return Response(
                {'error': 'La factura debe estar enviada a Rectoría para rechazarla'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = ESTADO_RECHAZADA_POR_RECTORIA
        factura.etapa_actual = 'Corrección Dirección Financiera'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Rectoría - Rechazo] {motivo}"]))
        factura.save()

        actualizar_sla_factura(factura)

        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo='Rectoría',
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user,
        )

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por rectoría',
            estado_anterior=estado_anterior,
            estado_nuevo=ESTADO_RECHAZADA_POR_RECTORIA,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, ESTADO_RECHAZADA_POR_RECTORIA)

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='confirmar_control_pago')
    def confirmar_control_pago(self, request, pk=None):
        """Registrar control de pago sin cerrar la etapa de pago aplicado."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para confirmar control de pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()

        if not factura.numero_confirmacion:
            for _ in range(5):
                factura.numero_confirmacion = self._generar_numero_confirmacion()
                try:
                    factura.save(update_fields=['numero_confirmacion'])
                    break
                except IntegrityError:
                    factura.numero_confirmacion = None

            if not factura.numero_confirmacion:
                return Response(
                    {'error': 'No fue posible generar un número de confirmación único'},
                    status=status.HTTP_409_CONFLICT
                )

        factura.etapa_actual = 'Control de Pago Bancario'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Control Pago] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Control de pago bancario confirmado',
            estado_anterior='Autorizada',
            estado_nuevo='Control de Pago Bancario',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
            datos_adicionales={'numero_confirmacion': factura.numero_confirmacion},
        )

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='generar_numero_confirmacion')
    def generar_numero_confirmacion(self, request, pk=None):
        """Generar y persistir el numero de confirmacion antes de confirmar el control."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para generar el numero de confirmacion'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not factura.numero_confirmacion:
            for _ in range(5):
                factura.numero_confirmacion = self._generar_numero_confirmacion()
                try:
                    factura.save(update_fields=['numero_confirmacion'])
                    break
                except IntegrityError:
                    factura.numero_confirmacion = None

            if not factura.numero_confirmacion:
                return Response(
                    {'error': 'No fue posible generar un numero de confirmacion unico'},
                    status=status.HTTP_409_CONFLICT
                )

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

        observaciones = request.data.get('observaciones', '')
        soporte_causacion = request.FILES.get('soporte_causacion')

        if not soporte_causacion:
            return Response({'error': 'Debe adjuntar el soporte PDF de causacion en Seven.'}, status=status.HTTP_400_BAD_REQUEST)

        nombre_archivo = getattr(soporte_causacion, 'name', 'soporte_causacion_seven.pdf') or 'soporte_causacion_seven.pdf'
        if not nombre_archivo.lower().endswith('.pdf'):
            return Response({'error': 'El soporte de causacion debe estar en formato PDF.'}, status=status.HTTP_400_BAD_REQUEST)

        factura.estado = 'Causada'
        factura.fecha_causacion = timezone.now().date()
        factura.etapa_actual = 'Causación'
        factura.fecha_inicio_etapa = factura.fecha_causacion
        factura.usuario_responsable = request.user
        factura.save()

        documento = models.DocumentoAdjunto.objects.create(
            factura=factura,
            nombre_archivo=nombre_archivo[:255],
            tipo_documento='Soporte Causacion Seven',
            archivo=soporte_causacion,
            tipo_mime=getattr(soporte_causacion, 'content_type', '') or 'application/pdf',
            tamano_bytes=getattr(soporte_causacion, 'size', None),
            cargado_por=request.user,
        )
        if documento.archivo and hasattr(documento.archivo, 'url'):
            documento.url_storage = documento.archivo.url
            documento.save(update_fields=['url_storage'])

        actualizar_sla_factura(factura)

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
        
        if factura.estado not in ['Radicada', 'Causada', 'Detenida']:
            return Response(
                {'error': 'La factura debe estar causada o detenida en tesorería'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_proceso_pago = (request.data.get('numero_proceso_pago') or '').strip()
        archivo_plano_generado = (request.data.get('archivo_plano_generado') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        if not numero_proceso_pago and not archivo_plano_generado:
            return Response(
                {'error': 'Debe registrar el número de proceso de pago o un archivo plano generado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if numero_proceso_pago:
            duplicado = models.Factura.objects.filter(
                numero_proceso_pago=numero_proceso_pago
            ).exclude(pk=factura.pk).first()
            if duplicado:
                return Response(
                    {'error': f'El número de proceso de pago "{numero_proceso_pago}" ya está registrado en la factura {duplicado.numero_factura}. Cada proceso de pago debe ser único.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        estado_anterior = factura.estado

        if numero_proceso_pago:
            factura.numero_proceso_pago = numero_proceso_pago
        if archivo_plano_generado:
            factura.archivo_plano_generado = archivo_plano_generado
        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.estado = 'Alistada'
        factura.fecha_alistamiento = timezone.now().date()
        factura.etapa_actual = 'Alistamiento'
        factura.fecha_inicio_etapa = factura.fecha_alistamiento
        factura.usuario_responsable = request.user
        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura alistada',
            estado_anterior=estado_anterior,
            estado_nuevo='Alistada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Alistada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='aprobar_auditoria')
    def aprobar_auditoria(self, request, pk=None):
        """Aprobar una factura en control previo de auditoría."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Aprobada Auditoría'
        factura.fecha_aprobacion_auditoria = timezone.now().date()
        factura.etapa_actual = 'Control Previo'
        factura.fecha_inicio_etapa = factura.fecha_aprobacion_auditoria
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría] {observaciones}"]))

        factura.save()

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura aprobada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Aprobada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Aprobada Auditoría')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='rechazar_auditoria')
    def rechazar_auditoria(self, request, pk=None):
        """Rechazar una factura en auditoría y devolverla a tesorería."""
        factura = self.get_object()

        if factura.estado != 'Alistada':
            return Response(
                {'error': 'La factura debe estar alistada para auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = (request.data.get('motivo') or '').strip()
        if len(motivo) < 10:
            return Response(
                {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Rechazada Auditoría'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = None
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Auditoría - Rechazo] {motivo}"]))
        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura rechazada por auditoría',
            estado_anterior=estado_anterior,
            estado_nuevo='Rechazada Auditoría',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo,
        )

        self._notificar_transicion(factura, estado_anterior, 'Rechazada Auditoría')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='enviar_direccion_financiera')
    def enviar_direccion_financiera(self, request, pk=None):
        """Enviar una factura aprobada a Dirección Financiera."""
        factura = self.get_object()

        if factura.estado != 'Aprobada Auditoría':
            return Response(
                {'error': 'La factura debe estar aprobada por Auditoría'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        estado_anterior = factura.estado

        factura.estado = 'Revisada Dir. Financiera'
        factura.fecha_revision_direccion = timezone.now().date()
        factura.etapa_actual = 'Envío a Dirección Financiera'
        factura.fecha_inicio_etapa = factura.fecha_revision_direccion
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura enviada a Dirección Financiera',
            estado_anterior=estado_anterior,
            estado_nuevo='Revisada Dir. Financiera',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Revisada Dir. Financiera')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='registrar_pago_aplicado')
    def registrar_pago_aplicado(self, request, pk=None):
        """Registrar pago aplicado en tesorería."""
        factura = self.get_object()

        if factura.estado != 'Autorizada':
            return Response(
                {'error': 'La factura debe estar autorizada para pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not factura.numero_confirmacion:
            return Response(
                {'error': 'Debe confirmar el control de pago en Dirección Financiera antes de registrar el pago aplicado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_transaccion = (request.data.get('numero_transaccion') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()
        fecha_pago = request.data.get('fecha_pago_aplicado')
        fecha_pago_parsed = None
        if fecha_pago:
            fecha_pago_parsed = parse_date(str(fecha_pago))
            if not fecha_pago_parsed:
                return Response(
                    {'error': 'La fecha de pago aplicado no es valida. Use el formato YYYY-MM-DD.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        comprobante_bancario = request.FILES.get('comprobante_bancario')

        if not numero_transaccion:
            return Response(
                {'error': 'Debe registrar el número de transacción bancaria'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if models.Factura.objects.filter(numero_transaccion=numero_transaccion).exclude(pk=factura.pk).exists():
            return Response(
                {'error': 'El número de transacción bancaria ya está registrado en otra factura.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not comprobante_bancario:
            return Response(
                {'error': 'Debe adjuntar el comprobante bancario en archivo (PDF/XML/PNG/JPG).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        try:
            with transaction.atomic():
                factura.numero_transaccion = numero_transaccion
                factura.fecha_pago_aplicado = fecha_pago_parsed or timezone.now().date()
                factura.fecha_comprobante = factura.fecha_pago_aplicado
                factura.estado = 'Pagada'
                factura.etapa_actual = 'Pago Aplicado'
                factura.fecha_inicio_etapa = factura.fecha_pago_aplicado
                factura.usuario_responsable = request.user

                if observaciones:
                    factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

                factura.save()

                actualizar_sla_factura(factura)

                documento_data = {
                    'factura': factura.id,
                    'nombre_archivo': comprobante_bancario.name,
                    'tipo_documento': 'Comprobante de Pago',
                    'url_storage': comprobante_bancario.name,
                    'tamano_bytes': comprobante_bancario.size,
                    'tipo_mime': getattr(comprobante_bancario, 'content_type', '') or None,
                    'archivo': comprobante_bancario,
                }
                documento_serializer = serializers.DocumentoAdjuntoSerializer(
                    data=documento_data,
                    context={'request': request}
                )
                documento_serializer.is_valid(raise_exception=True)
                documento_serializer.save(cargado_por=request.user)

                models.HistorialFactura.objects.create(
                    factura=factura,
                    accion='Pago aplicado y factura pagada',
                    estado_anterior=estado_anterior,
                    estado_nuevo='Pagada',
                    usuario=request.user,
                    usuario_nombre=request.user.nombre,
                    usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
                    observacion=observaciones or None,
                )

                self._notificar_transicion(factura, estado_anterior, 'Pagada')
        except IntegrityError:
            return Response(
                {'error': 'El número de transacción bancaria ya está registrado en otra factura.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as exc:
            return Response(
                {
                    'error': 'Datos de validacion incorrectos.',
                    'detail': exc.detail,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as exc:
            logger.exception('Error registrando pago aplicado factura_id=%s', factura.id)
            return Response(
                {
                    'error': 'No fue posible registrar el pago aplicado.',
                    'detail': str(exc),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='generar_comprobante')
    def generar_comprobante(self, request, pk=None):
        """Compatibilidad: cerrar facturas antiguas en Pago Aplicado como Pagada."""
        factura = self.get_object()

        if factura.estado not in ['Pago Aplicado', 'Pagada']:
            return Response(
                {'error': 'La factura debe estar con pago aplicado o pagada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        numero_comprobante = (request.data.get('numero_comprobante') or '').strip()
        observaciones = (request.data.get('observaciones') or '').strip()

        estado_anterior = factura.estado

        if numero_comprobante:
            factura.numero_comprobante = numero_comprobante
        factura.fecha_comprobante = factura.fecha_comprobante or factura.fecha_pago_aplicado or timezone.now().date()
        factura.estado = 'Pagada'
        factura.etapa_actual = 'Pago Aplicado'
        factura.fecha_inicio_etapa = factura.fecha_comprobante
        factura.usuario_responsable = request.user

        if observaciones:
            factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería] {observaciones}"]))

        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura marcada como pagada',
            estado_anterior=estado_anterior,
            estado_nuevo='Pagada',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones or None,
        )

        self._notificar_transicion(factura, estado_anterior, 'Pagada')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='comprobante_pdf')
    def comprobante_pdf(self, request, pk=None):
        """Compatibilidad: entregar el expediente unificado de la factura pagada."""
        factura = self.get_object()

        if factura.estado not in ['Pago Aplicado', 'Pagada']:
            return Response(
                {'error': 'La factura debe estar en pago aplicado o pagada para descargar el expediente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        scope = request.query_params.get('scope') or 'tesoreria'
        documentos = self._documentos_filtrados_por_scope(factura, scope)
        content = self._pdf_consolidado_documentos(factura, documentos, scope)
        filename = f"Expediente_{models._safe_path_segment(factura.numero_factura or factura.id)}.pdf"
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

        proveedor = factura.proveedor
        departamento = factura.departamento
        fecha_emision = factura.fecha_comprobante or timezone.now().date()
        numero_factura = factura.numero_factura or f"FAC-{factura.id}"

        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter

        # Encabezado
        pdf.setFillColor(colors.HexColor('#991b1b'))
        pdf.rect(0, height - 80, width, 80, stroke=0, fill=1)
        pdf.setFillColor(colors.white)
        pdf.setFont('Helvetica-Bold', 16)
        pdf.drawString(40, height - 50, 'Comprobante de Egreso')
        pdf.setFont('Helvetica', 9)
        pdf.drawString(40, height - 66, 'Sistema SIHUL - Tesoreria')

        # Metadatos principales
        pdf.setFillColor(colors.black)
        pdf.setFont('Helvetica-Bold', 10)
        pdf.drawString(40, height - 110, f"Comprobante: {factura.numero_comprobante}")
        pdf.drawString(320, height - 110, f"Fecha: {fecha_emision}")

        # Seccion proveedor
        y = height - 145
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Proveedor')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Razon social: {proveedor.razon_social}")
        y -= 12
        pdf.drawString(40, y, f"NIT: {proveedor.nit}")
        y -= 12
        pdf.drawString(40, y, f"Contacto: {proveedor.email or 'Sin correo'} | {proveedor.telefono or 'Sin telefono'}")

        # Seccion factura
        y -= 22
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Factura')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Numero factura: {numero_factura}")
        pdf.drawString(320, y, f"Numero radicado: {factura.numero_radicado or 'Sin radicado'}")
        y -= 12
        pdf.drawString(40, y, f"Proceso de pago: {factura.numero_proceso_pago or 'Sin proceso'}")
        pdf.drawString(320, y, f"Transaccion bancaria: {factura.numero_transaccion or 'Sin transaccion'}")
        y -= 12
        pdf.drawString(40, y, f"Fecha autorizacion: {factura.fecha_autorizacion or 'Sin fecha'}")
        pdf.drawString(320, y, f"Fecha pago aplicado: {factura.fecha_pago_aplicado or 'Sin fecha'}")
        y -= 12
        pdf.drawString(40, y, f"Area solicitante: {departamento.nombre if departamento else 'Sin area'}")

        # Valores
        y -= 22
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Valores')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, f"Subtotal: ${factura.valor_subtotal:,.2f}")
        pdf.drawString(200, y, f"IVA: ${factura.valor_iva:,.2f}")
        pdf.drawString(320, y, f"Retenciones: ${factura.valor_retencion_renta + factura.valor_retencion_iva + factura.valor_retencion_ica:,.2f}")
        y -= 12
        pdf.setFont('Helvetica-Bold', 10)
        pdf.drawString(40, y, f"Total pagado: ${factura.valor_total:,.2f}")

        # Observaciones
        y -= 26
        pdf.setFont('Helvetica-Bold', 11)
        pdf.drawString(40, y, 'Observaciones')
        pdf.setFont('Helvetica', 9)
        y -= 14
        pdf.drawString(40, y, (factura.observaciones or 'Sin observaciones')[:160])

        # Firma
        pdf.setFont('Helvetica', 8)
        pdf.drawString(40, 60, f"Generado por: {request.user.nombre} | Rol: {request.user.rol.nombre if request.user.rol else 'Sin rol'}")
        pdf.drawString(40, 45, 'Este documento es valido sin firma manuscrita y queda registrado en el sistema.')

        pdf.save()
        content = output.getvalue()
        output.close()

        filename = f"Comprobante_Egreso_{factura.numero_comprobante}.pdf"
        response = HttpResponse(content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'], url_path='detener_en_tesoreria')
    def detener_en_tesoreria(self, request, pk=None):
        """Detener una factura en tesorería por inconsistencias sin enviarla a auditoría."""
        factura = self.get_object()

        if factura.estado not in ['Causada', 'Detenida']:
            return Response(
                {'error': 'Solo se pueden detener facturas en estado Causada o Detenida'},
                status=status.HTTP_400_BAD_REQUEST
            )

        observaciones = (request.data.get('observaciones') or '').strip()
        if len(observaciones) < 10:
            return Response(
                {'error': 'Debe registrar una observación de al menos 10 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado
        factura.estado = 'Detenida'
        factura.etapa_actual = 'Tesorería - Ajustes internos'
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = request.user
        factura.observaciones = '\n'.join(filter(None, [factura.observaciones, f"[Tesorería - Detenida] {observaciones}"]))
        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura detenida en tesorería',
            estado_anterior=estado_anterior,
            estado_nuevo='Detenida',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones,
        )

        self._notificar_transicion(factura, estado_anterior, 'Detenida')

        return Response(
            serializers.FacturaDetailSerializer(factura).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una factura con motivo"""
        factura = self.get_object()
        motivo = (request.data.get('motivo') or '').strip()

        if len(motivo) < 10:
            return Response(
                {'error': 'El motivo de rechazo/devolución es obligatorio (mínimo 10 caracteres).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        estado_anterior = factura.estado

        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()
        destino = (request.data.get('destino') or '').strip().lower()

        if rol_nombre == 'Funcionario':
            estado_destino = 'Devuelta'
            etapa_destino = 'Devolución'
            responsable_destino = None
        elif destino == 'radicacion':
            estado_destino = 'Radicada'
            etapa_destino = 'Corrección Radicación'
            responsable_destino = None
        elif destino == 'proveedor':
            estado_destino = 'Devuelta'
            etapa_destino = 'Corrección Proveedor'
            responsable_destino = factura.creado_por
        elif destino == 'funcionario' or estado_anterior in ['Recibida', 'Registrada', 'Radicada']:
            estado_destino = 'Registrada'
            etapa_destino = 'Corrección Funcionario'
            responsable_destino = factura.creado_por
        else:
            estado_destino = 'Devuelta'
            etapa_destino = 'Devolución'
            responsable_destino = None
        
        models.RechazoDevolucion.objects.create(
            factura=factura,
            tipo='Rechazo',
            etapa_rechazo=factura.etapa_actual,
            motivo=motivo,
            estado_devolucion='Pendiente Corrección',
            usuario_rechaza=request.user
        )

        factura.estado = estado_destino
        factura.etapa_actual = etapa_destino
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.usuario_responsable = responsable_destino
        factura.save()

        actualizar_sla_factura(factura)

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Factura devuelta',
            estado_anterior=estado_anterior,
            estado_nuevo=estado_destino,
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=motivo
        )

        self._notificar_transicion(factura, estado_anterior, estado_destino)

        return Response(
            {'mensaje': f'Factura rechazada y enviada a {estado_destino}'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['patch'])
    def corregir(self, request, pk=None):
        """Permite al proveedor corregir y reenviar una factura devuelta/rechazada."""
        factura = self.get_object()
        rol_nombre = (request.user.rol.nombre if getattr(request.user, 'rol', None) else '').strip()

        if rol_nombre != 'Proveedor':
            return Response({'error': 'No autorizado para corregir esta factura.'}, status=status.HTTP_403_FORBIDDEN)

        if factura.estado not in ['Devuelta', 'Rechazada']:
            return Response(
                {'error': 'Solo se pueden corregir facturas en estado Devuelta o Rechazada.'},
                status=status.HTTP_400_BAD_REQUEST
            )

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
            models.ItemFactura.objects.filter(factura=factura).delete()
            for orden, item in enumerate(items_data, start=1):
                models.ItemFactura.objects.create(
                    factura=factura,
                    orden=orden,
                    descripcion=item.get('descripcion', ''),
                    cantidad=item.get('cantidad', 1),
                    valor_unitario=item.get('valor_unitario', 0),
                    porcentaje_iva=item.get('porcentaje_iva', 0),
                    valor_subtotal=item.get('valor_subtotal', 0),
                    valor_iva=item.get('valor_iva', 0),
                    valor_total=item.get('valor_total', 0),
                )

        factura.estado = 'Recibida'
        factura.etapa_actual = 'Recepción y Registro'
        factura.usuario_responsable = None
        factura.fecha_inicio_etapa = timezone.now().date()
        factura.fecha_recepcion = timezone.now().date()
        factura.save(update_fields=['estado', 'etapa_actual', 'usuario_responsable', 'fecha_inicio_etapa', 'fecha_recepcion'])

        observaciones_correccion = (request.data.get('observaciones_correccion') or '').strip()
        if not observaciones_correccion:
            observaciones_correccion = 'Corrección enviada por proveedor.'

        ultimo_rechazo = (
            models.RechazoDevolucion.objects
            .filter(factura=factura)
            .order_by('-fecha_rechazo')
            .first()
        )
        if ultimo_rechazo:
            ultimo_rechazo.estado_devolucion = 'Reenviada'
            ultimo_rechazo.fecha_correccion = timezone.now()
            ultimo_rechazo.usuario_corrige = request.user
            ultimo_rechazo.observaciones_correccion = observaciones_correccion
            ultimo_rechazo.save(update_fields=[
                'estado_devolucion',
                'fecha_correccion',
                'usuario_corrige',
                'observaciones_correccion'
            ])

        models.HistorialFactura.objects.create(
            factura=factura,
            accion='Corrección enviada por proveedor',
            estado_anterior=estado_anterior,
            estado_nuevo='Recibida',
            usuario=request.user,
            usuario_nombre=request.user.nombre,
            usuario_rol=request.user.rol.nombre if request.user.rol else 'Sin rol',
            observacion=observaciones_correccion
        )

        actualizar_sla_factura(factura)
        self._notificar_transicion(factura, estado_anterior, factura.estado)

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
        
        # Permitir facturas en estado 'Recibida', 'Registrada' o 'Devuelta' para reproceso.
        if factura.estado not in ['Recibida', 'Registrada', 'Devuelta']:
            return Response(
                {'error': f'Solo se pueden completar facturas en estado Recibida, Registrada o Devuelta. Estado actual: {factura.estado}'},
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

            if not factura.fecha_inicio_etapa:
                factura.fecha_inicio_etapa = timezone.now().date()
            
            serializer.save()
            factura.save(update_fields=['estado', 'usuario_responsable', 'fecha_inicio_etapa'])

            actualizar_sla_factura(factura)
            
            # Crear registro en historial
            from .models import HistorialFactura
            HistorialFactura.objects.create(
                factura=factura,
                accion='Completar Registro',
                estado_anterior=estado_anterior,
                estado_nuevo='Registrada',
                usuario=request.user,
                usuario_nombre=request.user.get_full_name() or request.user.username,
                usuario_rol='Funcionario',
                observacion='Factura registrada correctamente por el funcionario'
            )

            self._notificar_transicion(factura, estado_anterior, 'Registrada')
            
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# VIEWSETS PARA BANCO Y TIPO DE CUENTA
# ============================================================

class BancoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Banco.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.BancoSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']


class TipoCuentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.TipoCuenta.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.TipoCuentaSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
