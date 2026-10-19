from rest_framework import viewsets, filters, parsers, status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import IntegrityError, transaction, close_old_connections
from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.conf import settings
import hashlib
import json
import logging
import mimetypes
import os
import threading
import textwrap
import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.utils.dateparse import parse_date
import unicodedata
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from financiero.proveedores.models import Proveedor
from financiero.facturas.models import Factura, HistorialFactura
from .models import ReporteGenerado
from .serializers import ReporteGeneradoSerializer
from unispace.usuarios.models import Usuario

logger = logging.getLogger(__name__)


class ReporteGeneradoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReporteGenerado.objects.all()
    serializer_class = ReporteGeneradoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['tipo_reporte', 'formato']
    ordering = ['-fecha_generacion']

    def get_queryset(self):
        # Cada usuario ve solo sus reportes
        return ReporteGenerado.objects.filter(generado_por=self.request.user)

    def _parse_date(self, value):
        if not value:
            return None
        try:
            return datetime.strptime(str(value), '%Y-%m-%d').date()
        except ValueError:
            return None

    def _filtrar_facturas(self, filtros):
        queryset = Factura.objects.select_related('proveedor', 'departamento').all()

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
        return ReporteGenerado.objects.create(
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
        facturas = Factura.objects.all()
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
        proveedores_activos = Proveedor.objects.filter(estado='Activo').count()

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

        alertas_qs = Factura.objects.filter(indicador_riesgo__in=['atencion', 'atrasada', 'vencida']).order_by('-fecha_recepcion')[:15]
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

        actividades_qs = HistorialFactura.objects.select_related('factura', 'usuario').order_by('-fecha_accion')[:12]
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
