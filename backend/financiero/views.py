from rest_framework import viewsets, filters, parsers, status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError, transaction, close_old_connections
from django.db.models import Q, Sum, Count
from django.http import HttpResponse
from django.conf import settings
import hashlib
import json
import logging
import mimetypes
import os
import threading
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
from . import models, serializers
from .sla import build_parametros_sla_map, actualizar_sla_factura, sincronizar_sla_facturas
from usuarios.models import Usuario
from notificaciones.signals import crear_notificacion

logger = logging.getLogger(__name__)


DOCUMENTOS_SENSIBLES_POR_ROL = {
    'archivo plano bancario',
    'soporte causacion seven',
}

ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES = {
    'auditoria',
    'direccion financiera',
}


def _normalizar_texto_permiso(value):
    normalized = unicodedata.normalize('NFD', str(value or '').strip().lower())
    without_marks = ''.join(ch for ch in normalized if unicodedata.category(ch) != 'Mn')
    return ' '.join(without_marks.replace('_', ' ').replace('-', ' ').split())


def _rol_usuario_normalizado(user):
    return _normalizar_texto_permiso(getattr(getattr(user, 'rol', None), 'nombre', ''))


def _usuario_puede_ver_documentos_sensibles(user):
    return _rol_usuario_normalizado(user) in ROLES_CON_ACCESO_DOCUMENTOS_SENSIBLES


def _documento_es_sensible(documento):
    tipo = _normalizar_texto_permiso(getattr(documento, 'tipo_documento', ''))
    nombre = _normalizar_texto_permiso(getattr(documento, 'nombre_archivo', ''))
    return tipo in DOCUMENTOS_SENSIBLES_POR_ROL or 'archivo plano' in nombre


def _resolve_documento_local_path(documento):
    archivo = getattr(documento, 'archivo', None)
    if archivo:
        try:
            archivo_name = (getattr(archivo, 'name', None) or '').strip()
            if archivo_name:
                candidate = Path(settings.MEDIA_ROOT) / archivo_name
                if candidate.exists():
                    return candidate
        except Exception:
            pass

        try:
            candidate = Path(archivo.path)
            if candidate.exists():
                return candidate
        except Exception:
            pass

    raw_storage = (getattr(documento, 'url_storage', None) or '').strip()
    if not raw_storage:
        return None

    parsed = urlparse(raw_storage)
    storage_path = (parsed.path or raw_storage).strip()
    normalized = storage_path.replace('\\', '/')

    if normalized.startswith('/media/'):
        relative = normalized.replace('/media/', '', 1)
    elif normalized.startswith('media/'):
        relative = normalized.replace('media/', '', 1)
    elif normalized.startswith('/'):
        relative = normalized.lstrip('/')
    else:
        relative = normalized

    candidate = Path(settings.MEDIA_ROOT) / relative
    if candidate.exists():
        return candidate

    return None


def _documento_bytes(documento):
    db_content = getattr(documento, 'contenido_archivo', None)
    if db_content is not None:
        return bytes(db_content)

    local_path = _resolve_documento_local_path(documento)
    if local_path:
        try:
            return local_path.read_bytes()
        except Exception as exc:
            logger.warning(
                '_documento_bytes: fallo leyendo archivo local doc_id=%s path=%s error=%s',
                documento.id, local_path, exc,
            )

    nas_path = (getattr(documento, 'nas_relative_path', None) or '').strip()
    if nas_path:
        try:
            from financiero.services.shared_storage_service import shared_storage, _parse_unc, _smb_path
            if shared_storage.enabled:
                smbclient, _ = shared_storage._get_smb_client()
                server, share, base = _parse_unc(shared_storage.unc_root)
                full_rel = f'{base}/{nas_path}' if base else nas_path
                smb_file = _smb_path(server, share, full_rel)
                with smbclient.open_file(smb_file, mode='rb') as f:
                    return f.read()
        except Exception as exc:
            logger.warning(
                '_documento_bytes: fallo leyendo NAS doc_id=%s nas_path=%s error=%s',
                documento.id, nas_path, exc,
            )

    logger.warning(
        '_documento_bytes: no se pudo obtener bytes de ninguna fuente doc_id=%s nombre=%s url=%s nas=%s',
        documento.id,
        documento.nombre_archivo,
        getattr(documento, 'url_storage', None) or '',
        nas_path or '',
    )
    return None


def _documento_content_type(documento):
    content_type = (getattr(documento, 'tipo_mime', None) or '').strip()
    if content_type:
        return content_type
    guessed, _ = mimetypes.guess_type(getattr(documento, 'nombre_archivo', '') or '')
    return guessed or 'application/octet-stream'


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
    date = getattr(factura, 'fecha_recepcion', None) or timezone.localdate()
    factura_label = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    return Path(settings.MEDIA_ROOT) / f'{date:%Y}' / f'{date:%m}' / factura_label


def _factura_ciclo_documental_actual(factura):
    return getattr(factura, 'ciclo_documental_actual', 1) or 1


def _documentos_queryset_ciclo_actual(factura):
    return models.DocumentoAdjunto.objects.filter(
        factura=factura,
        ciclo_documental=_factura_ciclo_documental_actual(factura),
    )


def _documento_upload_metadata(uploaded_file):
    if uploaded_file is None:
        return None, None, None

    uploaded_file.seek(0)
    content = uploaded_file.read()
    try:
        uploaded_file.seek(0)
    except Exception:
        pass

    return (
        content,
        len(content),
        hashlib.sha256(content).hexdigest(),
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

    def _coerce_geo_catalog_data(self, payload):
        data = dict(payload)

        pais_id = data.pop('pais_id', None)
        departamento_id = data.pop('departamento_geo_id', None)
        ciudad_id = data.pop('ciudad_id', None)
        banco_id = data.pop('banco_id', None)
        tipo_cuenta_id = data.pop('tipo_cuenta_id', None)

        ciudad = None
        departamento = None
        pais = None

        if ciudad_id:
            ciudad = models.Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento__pais').first()
            if ciudad:
                departamento = ciudad.departamento
                pais = departamento.pais

        if departamento is None and departamento_id:
            departamento = models.DepartamentoGeografico.objects.filter(id=departamento_id, activo=True).select_related('pais').first()
            if departamento:
                pais = departamento.pais

        if pais is None and pais_id:
            pais = models.Pais.objects.filter(id=pais_id, activo=True).first()

        if ciudad:
            data['ciudad'] = ciudad.nombre
        if departamento:
            data['departamento'] = departamento.nombre
        if pais:
            data['pais'] = pais.nombre

        if banco_id:
            banco = models.Banco.objects.filter(id=banco_id, activo=True).first()
            if banco:
                data['banco'] = banco.nombre

        if tipo_cuenta_id:
            tipo_cuenta = models.TipoCuenta.objects.filter(id=tipo_cuenta_id, activo=True).first()
            if tipo_cuenta:
                data['tipo_cuenta'] = tipo_cuenta.nombre

        return data

    def create(self, request, *args, **kwargs):
        data = self._coerce_geo_catalog_data(request.data)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._coerce_geo_catalog_data(request.data)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='crear_con_usuario')
    def crear_con_usuario(self, request):
        """Crea un usuario con rol Proveedor y vincula el perfil de proveedor en una transacción atómica."""
        from django.contrib.auth.hashers import make_password
        from usuarios.models import Rol

        nombre = (request.data.get('nombre') or '').strip()
        correo = (request.data.get('correo') or '').strip()
        contrasena = (request.data.get('contrasena') or '').strip()
        nit = (request.data.get('nit') or '').strip()
        razon_social = (request.data.get('razon_social') or '').strip()
        tipo_proveedor = (request.data.get('tipo_proveedor') or '').strip()

        if not all([nombre, correo, contrasena, nit, razon_social, tipo_proveedor]):
            return Response(
                {'error': 'Los campos nombre, correo, contrasena, nit, razon_social y tipo_proveedor son obligatorios.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            rol_proveedor = Rol.objects.get(nombre__iexact='Proveedor')
        except Rol.DoesNotExist:
            return Response(
                {'error': 'El rol "Proveedor" no existe en el sistema. Créalo antes de continuar.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Usuario.objects.filter(correo__iexact=correo).exists():
            return Response(
                {'error': f'Ya existe un usuario con el correo "{correo}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if models.Proveedor.objects.filter(nit=nit).exists():
            return Response(
                {'error': f'Ya existe un proveedor con el NIT "{nit}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        campos_opcionales = [
            'nombre_comercial', 'tipo_persona', 'direccion', 'ciudad', 'departamento',
            'pais', 'telefono', 'email', 'contacto_principal', 'telefono_contacto',
            'banco', 'tipo_cuenta', 'numero_cuenta', 'cuenta_bancaria_completa',
            'regimen_tributario', 'retencion_renta', 'retencion_iva', 'retencion_ica',
            'autoretenedor', 'estado', 'calificacion_riesgo', 'observaciones',
        ]

        proveedor_data = {'nit': nit, 'razon_social': razon_social, 'tipo_proveedor': tipo_proveedor}
        for campo in campos_opcionales:
            if campo in request.data:
                proveedor_data[campo] = request.data[campo]
        proveedor_data = self._coerce_geo_catalog_data(proveedor_data)

        try:
            with transaction.atomic():
                hashed = make_password(contrasena)
                nuevo_usuario = Usuario(
                    nombre=nombre,
                    correo=correo,
                    password=hashed,
                    contrasena_hash=hashed,
                    rol=rol_proveedor,
                    activo=True,
                )
                nuevo_usuario.save()

                proveedor_data['usuario'] = nuevo_usuario
                proveedor_data['creado_por'] = request.user
                proveedor = models.Proveedor.objects.create(**proveedor_data)

        except IntegrityError as exc:
            return Response({'error': f'Error de integridad: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'usuario_id': nuevo_usuario.id,
                'proveedor': serializers.ProveedorSerializer(proveedor).data,
            },
            status=status.HTTP_201_CREATED,
        )

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


class PaisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = models.Pais.objects.filter(activo=True).order_by('nombre')
    serializer_class = serializers.PaisSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'codigo_iso']
    search_fields = ['nombre', 'codigo_iso']
    ordering = ['nombre']


class DepartamentoGeograficoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.DepartamentoGeograficoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'pais']
    search_fields = ['nombre', 'codigo', 'pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = models.DepartamentoGeografico.objects.filter(activo=True).select_related('pais').order_by('nombre')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')
        ciudad_id = self.request.query_params.get('ciudad_id')

        if ciudad_id:
            ciudad = models.Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento').first()
            if ciudad:
                queryset = queryset.filter(id=ciudad.departamento_id)

        if pais_id:
            queryset = queryset.filter(pais_id=pais_id)

        return queryset


class CiudadViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.CiudadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'departamento']
    search_fields = ['nombre', 'departamento__nombre', 'departamento__pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = models.Ciudad.objects.filter(activo=True).select_related('departamento__pais').order_by('nombre')
        departamento_id = self.request.query_params.get('departamento_id') or self.request.query_params.get('departamento')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')

        if departamento_id:
            queryset = queryset.filter(departamento_id=departamento_id)

        if pais_id:
            queryset = queryset.filter(departamento__pais_id=pais_id)

        return queryset


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
        puede_ver_sensibles = _usuario_puede_ver_documentos_sensibles(self.request.user)
        factura_id = self.request.query_params.get('factura_id') or self.request.query_params.get('factura')
        queryset = models.DocumentoAdjunto.objects.all()

        if not puede_ver_sensibles:
            queryset = queryset.exclude(
                Q(tipo_documento='Archivo Plano Bancario') |
                Q(tipo_documento='Soporte Causacion Seven') |
                Q(nombre_archivo__icontains='archivo plano')
            )

        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)
            include_historico = (self.request.query_params.get('include_historico') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
            if not include_historico:
                factura = models.Factura.objects.filter(id=factura_id).only('id', 'ciclo_documental_actual').first()
                if factura:
                    queryset = queryset.filter(ciclo_documental=_factura_ciclo_documental_actual(factura))
            return queryset.order_by('fecha_carga', 'id')
        return queryset

    @action(detail=True, methods=['get'], url_path='contenido')
    def contenido(self, request, pk=None):
        documento = self.get_object()
        raw_bytes = _documento_bytes(documento)
        if raw_bytes is None:
            return Response(
                {
                    'error': 'El documento no está disponible en ninguna fuente configurada.',
                    'documento_id': documento.id,
                    'nombre_archivo': documento.nombre_archivo,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        descargar = (request.query_params.get('descargar') or '').strip().lower() in {'1', 'true', 'si', 'yes'}
        filename = documento.nombre_archivo or f'documento-{documento.id}'
        response = HttpResponse(raw_bytes, content_type=_documento_content_type(documento))
        response['Content-Disposition'] = f'{"attachment" if descargar else "inline"}; filename="{filename}"'
        return response

    def perform_create(self, serializer):
        archivo = self.request.FILES.get('archivo')
        factura = serializer.validated_data.get('factura')
        content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(archivo)
        ciclo_documental = _factura_ciclo_documental_actual(factura)
        instance = serializer.save(
            cargado_por=self.request.user,
            url_storage='',
            archivo=None,
            contenido_archivo=content_bytes,
            tamano_bytes=tamano_bytes or serializer.validated_data.get('tamano_bytes'),
            hash_archivo=hash_archivo,
            ciclo_documental=ciclo_documental,
        )

        if content_bytes is not None:
            _programar_sincronizacion_nas_documento(instance.id)


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

        documentos = list(_documentos_queryset_ciclo_actual(factura))
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
        return _documento_bytes(documento)

    def _guardar_pdf_unificado(self, factura, content, scope):
        safe_scope = models._safe_path_segment(scope or 'all')
        safe_factura = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
        nombre_archivo = f'Documentos_{safe_factura}_{safe_scope}.pdf'
        ciclo_documental = _factura_ciclo_documental_actual(factura)

        models.DocumentoUnificado.objects.update_or_create(
            factura=factura,
            scope=scope or 'all',
            ciclo_documental=ciclo_documental,
            defaults={
                'nombre_archivo': nombre_archivo,
                'tipo_mime': 'application/pdf',
                'tamano_bytes': len(content),
                'contenido_archivo': content,
                'hash_archivo': hashlib.sha256(content).hexdigest(),
            },
        )

        from financiero.services.shared_storage_service import shared_storage
        result = shared_storage.copy_unified_pdf(content, factura, scope)
        defaults = {
            'nas_relative_path': result.nas_relative_path or '',
            'nas_storage_status': (
                models.DocumentoAdjunto.NAS_STATUS_STORED if result.success
                else (result.error_code or models.DocumentoAdjunto.NAS_STATUS_FAILED)
            ),
        }
        models.DocumentoUnificado.objects.filter(
            factura=factura,
            scope=scope or 'all',
            ciclo_documental=ciclo_documental,
        ).update(**defaults)

        if not result.success:
            logger.warning(
                '[SHARED_STORAGE] PDF unificado no copiado al NAS. factura_id=%s error_code=%s message=%s',
                factura.id, result.error_code, result.message,
            )

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

            if raw_bytes is not None:
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
            self._factura_response_data(factura),
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='documentos_consolidados')
    def documentos_consolidados(self, request, pk=None):
        factura = self.get_object()
        scope = self._resolve_scope_documental(request)
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
        scope = self._resolve_scope_documental(request)
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

                if raw_bytes is not None:
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
        content_bytes, tamano_bytes, hash_archivo = _documento_upload_metadata(soporte_causacion)

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
            tipo_mime=getattr(soporte_causacion, 'content_type', '') or 'application/pdf',
            tamano_bytes=tamano_bytes,
            cargado_por=request.user,
            contenido_archivo=content_bytes,
            hash_archivo=hash_archivo,
            ciclo_documental=_factura_ciclo_documental_actual(factura),
        )

        _programar_sincronizacion_nas_documento(documento.id)

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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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
                documento = documento_serializer.save(cargado_por=request.user)
                _programar_sincronizacion_nas_documento(documento.id)

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
            self._factura_response_data(factura),
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
            self._factura_response_data(factura),
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

        scope = self._resolve_scope_documental(request)
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
            self._factura_response_data(factura),
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
        
        n_devoluciones = models.RechazoDevolucion.objects.filter(factura=factura).count()

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
        factura.ciclo_documental_actual = _factura_ciclo_documental_actual(factura) + 1
        factura.save()

        # Archivar documentos del NAS cuando se devuelve al proveedor
        if estado_destino == 'Devuelta':
            from financiero.services.shared_storage_service import shared_storage
            version_label = f'devolucion_{n_devoluciones + 1:02d}'
            result = shared_storage.archive_documents_folder(factura, version_label)
            if not result.success and result.error_code not in ('DISABLED', 'NETWORK_ERROR'):
                logger.warning(
                    '[SHARED_STORAGE] No se pudieron archivar documentos al devolver. factura_id=%s error=%s',
                    factura.id, result.error_code,
                )

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
# HELPERS DE PDF — accesibles desde cualquier ViewSet
# ============================================================

def _sincronizar_documento_y_pdf_nas(documento_id):
    """
    Sincroniza en segundo plano el documento individual y el PDF unificado con el NAS.
    Nunca interrumpe el flujo HTTP del usuario.
    """
    close_old_connections()
    try:
        from financiero.services.shared_storage_service import shared_storage

        documento = (
            models.DocumentoAdjunto.objects
            .select_related('factura')
            .filter(id=documento_id)
            .first()
        )
        if not documento or not documento.factura_id:
            return

        raw_bytes = _documento_bytes(documento)
        if raw_bytes is None:
            logger.warning(
                '[SHARED_STORAGE] No fue posible obtener bytes del documento para sincronizar NAS. documento_id=%s',
                documento_id,
            )
            return

        index = (
            models.DocumentoAdjunto.objects
            .filter(
                factura=documento.factura,
                ciclo_documental=_factura_ciclo_documental_actual(documento.factura),
            )
            .filter(fecha_carga__lt=documento.fecha_carga)
            .count()
        ) + 1

        result = shared_storage.copy_document(
            factura=documento.factura,
            index=index,
            original_filename=documento.nombre_archivo,
            content_bytes=raw_bytes,
        )
        documento.nas_relative_path = result.nas_relative_path or ''
        documento.nas_storage_status = (
            models.DocumentoAdjunto.NAS_STATUS_STORED if result.success
            else (result.error_code or models.DocumentoAdjunto.NAS_STATUS_FAILED)
        )
        documento.save(update_fields=['nas_relative_path', 'nas_storage_status'])

        if not result.success:
            logger.warning(
                '[SHARED_STORAGE] Documento no copiado al NAS. documento_id=%s factura_id=%s error_code=%s message=%s',
                documento.id,
                documento.factura_id,
                result.error_code,
                result.message,
            )

        _regenerar_pdf_unificado_nas(documento.factura)
    except Exception:
        logger.exception('[SHARED_STORAGE] Error sincronizando documento/PDF con NAS. documento_id=%s', documento_id)
    finally:
        close_old_connections()


def _programar_sincronizacion_nas_documento(documento_id):
    def _runner():
        _sincronizar_documento_y_pdf_nas(documento_id)

    try:
        transaction.on_commit(lambda: threading.Thread(target=_runner, daemon=True).start())
    except Exception:
        logger.exception('[SHARED_STORAGE] No se pudo programar sincronización NAS. documento_id=%s', documento_id)


def _regenerar_pdf_unificado_nas(factura):
    """
    Regenera el PDF unificado con todos los documentos actuales de la factura
    y lo sube al NAS, reemplazando el anterior.
    Se llama automáticamente cada vez que se agrega un documento.
    """
    try:
        documentos = list(
            models.DocumentoAdjunto.objects
            .filter(
                factura=factura,
                ciclo_documental=_factura_ciclo_documental_actual(factura),
            )
            .select_related('cargado_por__rol')
            .order_by('fecha_carga', 'id')
        )
        _vs = FacturaViewSet()
        _vs._pdf_consolidado_documentos(factura, documentos, 'all')
    except Exception:
        logger.exception('[SHARED_STORAGE] Error regenerando PDF unificado. factura_id=%s', factura.id)


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
