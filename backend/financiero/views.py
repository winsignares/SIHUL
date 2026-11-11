from rest_framework import viewsets, filters, parsers, status, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from .permissions import EsUsuarioFinanciero
from rest_framework.pagination import PageNumberPagination
from django.db import IntegrityError, transaction, close_old_connections
from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.conf import settings
import hashlib
import json
import logging
import mimetypes
import threading
import zipfile
from datetime import datetime
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from . import archivos, flujo_factura, models, serializers
from .sla import build_parametros_sla_map, sincronizar_sla_facturas
from usuarios.models import Usuario

logger = logging.getLogger(__name__)


class FacturaPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


from .documentos_sensibles import (
    documento_es_sensible as _documento_es_sensible,
    normalizar_texto_permiso as _normalizar_texto_permiso,
    usuario_puede_ver_documentos_sensibles as _usuario_puede_ver_documentos_sensibles,
)


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
    nas_path = (getattr(documento, 'nas_relative_path', None) or '').strip()
    if nas_path:
        try:
            from financiero.services.shared_storage_service import shared_storage
            result = shared_storage.read_file(nas_path)
            if result.success:
                return result.content_bytes
        except Exception as exc:
            logger.warning('_documento_bytes: fallo leyendo NAS doc_id=%s nas_path=%s error=%s', documento.id, nas_path, exc)

    local_path = _resolve_documento_local_path(documento)
    if local_path:
        try:
            return local_path.read_bytes()
        except Exception as exc:
            logger.warning(
                '_documento_bytes: fallo leyendo archivo local doc_id=%s path=%s error=%s',
                documento.id, local_path, exc,
            )

    # Compatibilidad temporal para documentos históricos que todavía tienen
    # contenido binario en PostgreSQL.
    db_content = getattr(documento, 'contenido_archivo', None)
    if db_content is not None:
        return bytes(db_content)

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

AREAS_SOLICITANTES = [
    ('SOL-DER', 'Facultad de Derecho y Ciencias Políticas'),
    ('SOL-ING', 'Facultad de Ingeniería'),
    ('SOL-SAL', 'Facultad de Ciencias de la Salud'),
    ('SOL-ECO', 'Facultad de Ciencias Económicas, Administrativas y Contables'),
    ('SOL-ADM', 'Administración'),
]

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


def _guardar_documento_en_carpeta_compartida(
    *, factura, nombre_archivo, tipo_documento, tipo_mime, content_bytes,
    tamano_bytes, hash_archivo, usuario,
):
    """Guarda el binario exclusivamente en el NAS y crea solo sus metadatos en BD."""
    from financiero.services.shared_storage_service import shared_storage

    if not content_bytes:
        raise ValidationError({'archivo': 'No fue posible leer el contenido del archivo.'})
    if not shared_storage.enabled:
        raise ValidationError({'archivo': 'La carpeta compartida no está configurada. No se puede guardar el documento.'})

    ciclo_documental = _factura_ciclo_documental_actual(factura)
    index = models.DocumentoAdjunto.objects.filter(
        factura=factura,
        ciclo_documental=ciclo_documental,
    ).count() + 1
    result = shared_storage.copy_document(
        factura=factura,
        index=index,
        original_filename=nombre_archivo,
        content_bytes=content_bytes,
    )
    if not result.success or not result.nas_relative_path:
        raise ValidationError({
            'archivo': f'No fue posible guardar el documento en la carpeta compartida: {result.message or result.error_code or "error desconocido"}.'
        })

    return models.DocumentoAdjunto.objects.create(
        factura=factura,
        nombre_archivo=nombre_archivo[:255],
        tipo_documento=tipo_documento,
        tipo_mime=tipo_mime or None,
        tamano_bytes=tamano_bytes,
        url_storage='',
        archivo=None,
        contenido_archivo=None,
        hash_archivo=hash_archivo,
        ciclo_documental=ciclo_documental,
        cargado_por=usuario,
        nas_relative_path=result.nas_relative_path,
        nas_storage_status=models.DocumentoAdjunto.NAS_STATUS_STORED,
    )


def _es_archivo_plano_txt(tipo_documento, nombre_archivo, tipo_mime):
    """Identifica el TXT que Tesorería genera para el proceso de pago."""
    tipo = _normalizar_texto_permiso(tipo_documento)
    nombre = (nombre_archivo or '').strip().lower()
    mime = (tipo_mime or '').split(';', 1)[0].strip().lower()
    return (
        tipo in {'archivo plano bancario', 'soporte causacion seven'}
        and (nombre.endswith('.txt') or mime in {'text/plain', 'application/octet-stream'})
    )


# ============================================================
# VIEWSETS SIMPLES
# ============================================================

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = models.Proveedor.objects.select_related('usuario').all()
    serializer_class = serializers.ProveedorSerializer
    permission_classes = [EsUsuarioFinanciero]
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

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        from django.contrib.auth.hashers import make_password

        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = self._coerce_geo_catalog_data(request.data)
        usuario_nombre = data.pop('usuario_nombre', None)
        usuario_correo = data.pop('usuario_correo', None)
        usuario_contrasena = data.pop('usuario_contrasena', None)

        usuario = instance.usuario
        if usuario is not None:
            if usuario_nombre is not None:
                usuario.nombre = str(usuario_nombre).strip()
            if usuario_correo is not None:
                correo_normalizado = str(usuario_correo).strip().lower()
                if not correo_normalizado:
                    raise ValidationError({'usuario_correo': 'El correo de acceso no puede estar vacío.'})
                if Usuario.objects.filter(correo__iexact=correo_normalizado).exclude(pk=usuario.pk).exists():
                    raise ValidationError({'usuario_correo': 'Ya existe un usuario con este correo.'})
                usuario.correo = correo_normalizado
            if usuario_contrasena:
                hashed = make_password(str(usuario_contrasena))
                usuario.password = hashed
                usuario.contrasena_hash = hashed
        elif any(value is not None for value in (usuario_nombre, usuario_correo, usuario_contrasena)):
            raise ValidationError({'usuario': 'El proveedor no tiene un usuario de acceso vinculado.'})

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if usuario is not None:
            usuario.activo = serializer.instance.estado == 'Activo'
            usuario.save()

        return Response(serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        usuario = instance.usuario
        if usuario is not None:
            rol_nombre = (getattr(usuario.rol, 'nombre', '') or '').strip().casefold()
            if rol_nombre != 'proveedor':
                raise ValidationError({
                    'usuario': 'No se puede eliminar el proveedor porque el usuario vinculado no tiene rol Proveedor.'
                })
        self.perform_destroy(instance)
        if usuario is not None:
            usuario.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=['post'],
        url_path='crear_con_usuario',
        permission_classes=[permissions.AllowAny],
    )
    def crear_con_usuario(self, request):
        """Crea un usuario con rol Proveedor y vincula su perfil en una transacción atómica."""
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

        es_registro_publico = not getattr(request.user, 'is_authenticated', False)

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
            'pais_id', 'departamento_geo_id', 'ciudad_id', 'banco_id', 'tipo_cuenta_id',
        ]

        proveedor_data = {'nit': nit, 'razon_social': razon_social, 'tipo_proveedor': tipo_proveedor}
        for campo in campos_opcionales:
            if campo in request.data:
                proveedor_data[campo] = request.data[campo]
        proveedor_data = self._coerce_geo_catalog_data(proveedor_data)

        # El registro público usa el correo y teléfono de acceso como datos
        # principales del proveedor, sin pedir campos de contacto duplicados.
        if es_registro_publico:
            proveedor_data['email'] = proveedor_data.get('email') or correo
            proveedor_data['contacto_principal'] = nombre
            proveedor_data['telefono_contacto'] = proveedor_data.get('telefono') or None

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
                if getattr(request.user, 'is_authenticated', False):
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
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def areas_solicitantes(self, request):
        """Lista las áreas activas disponibles en la base de datos."""
        queryset = models.Departamento.objects.filter(
            estado='Activo',
            codigo__startswith='SOL-',
        ).order_by('nombre')
        serializer = serializers.DepartamentoSerializer(queryset, many=True)
        return Response(serializer.data)


class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = models.CuentaContable.objects.all()
    serializer_class = serializers.CuentaContableSerializer
    permission_classes = [EsUsuarioFinanciero]
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
    permission_classes = [EsUsuarioFinanciero]
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
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)


class ParametrosFinancieroViewSet(viewsets.ModelViewSet):
    queryset = models.ParametrosFinanciero.objects.all()
    serializer_class = serializers.ParametrosFinancieroSerializer
    permission_classes = [EsUsuarioFinanciero]
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
    permission_classes = [EsUsuarioFinanciero]
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

        if formato == 'Excel':
            content = archivos.reporte_excel(rows)
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

        content = archivos.reporte_pdf(tipo_reporte, rows)
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
    permission_classes = [EsUsuarioFinanciero]
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
        nombre_archivo = serializer.validated_data.get('nombre_archivo') or getattr(archivo, 'name', '')
        tipo_documento = serializer.validated_data.get('tipo_documento')
        tipo_mime = serializer.validated_data.get('tipo_mime') or getattr(archivo, 'content_type', '')

        # El archivo plano se almacena como PDF. Así su vista individual y el
        # documento unificado muestran el contenido, no solo el nombre del TXT.
        if content_bytes is not None and _es_archivo_plano_txt(tipo_documento, nombre_archivo, tipo_mime):
            content_bytes = archivos.archivo_plano_a_pdf(content_bytes)
            nombre_archivo = archivos.nombre_pdf_archivo_plano(nombre_archivo)
            tipo_mime = 'application/pdf'
            tamano_bytes = len(content_bytes)
            hash_archivo = hashlib.sha256(content_bytes).hexdigest()

        instance = _guardar_documento_en_carpeta_compartida(
            factura=factura,
            nombre_archivo=nombre_archivo,
            tipo_documento=tipo_documento,
            tipo_mime=tipo_mime,
            content_bytes=content_bytes,
            tamano_bytes=tamano_bytes or serializer.validated_data.get('tamano_bytes'),
            hash_archivo=hash_archivo,
            usuario=self.request.user,
        )
        serializer.instance = instance
        _regenerar_pdf_unificado_nas(factura)

    def perform_update(self, serializer):
        verificado = serializer.validated_data.get('verificado')
        if verificado is True:
            serializer.save(verificado_por=self.request.user, fecha_verificacion=timezone.now())
        elif verificado is False:
            serializer.save(verificado_por=None, fecha_verificacion=None)
        else:
            serializer.save()


class HistorialFacturaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.HistorialFacturaSerializer
    permission_classes = [EsUsuarioFinanciero]
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
    permission_classes = [EsUsuarioFinanciero]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['factura', 'tipo']
    ordering = ['fecha_creacion']

    def get_queryset(self):
        queryset = models.ComentarioFactura.objects.select_related('usuario').prefetch_related(
            'respuestas__usuario', 'respuestas__respuestas__usuario',
        )
        factura_id = self.request.query_params.get('factura_id')
        if factura_id:
            queryset = queryset.filter(factura_id=factura_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class RechazoDevolacionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = serializers.RechazoDevolacionSerializer
    permission_classes = [EsUsuarioFinanciero]
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


def _archivar_documentos_devueltos(factura, numero_devolucion):
    """Archiva en el NAS los soportes del ciclo que se cierra al devolver la factura."""
    from financiero.services.shared_storage_service import shared_storage
    version_label = f'devolucion_{numero_devolucion:02d}'
    result = shared_storage.archive_documents_folder(factura, version_label)
    if not result.success and result.error_code not in ('DISABLED', 'NETWORK_ERROR'):
        logger.warning(
            '[SHARED_STORAGE] No se pudieron archivar documentos al devolver. factura_id=%s error=%s',
            factura.id, result.error_code,
        )


def _guardar_pdf_unificado(factura, content, scope):
    safe_scope = models._safe_path_segment(scope or 'all')
    safe_factura = models._safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
    nombre_archivo = f'Documentos_{safe_factura}_{safe_scope}.pdf'
    ciclo_documental = _factura_ciclo_documental_actual(factura)

    from financiero.services.shared_storage_service import shared_storage
    result = shared_storage.copy_unified_pdf(content, factura, scope)

    models.DocumentoUnificado.objects.update_or_create(
        factura=factura,
        scope=scope or 'all',
        ciclo_documental=ciclo_documental,
        defaults={
            'nombre_archivo': nombre_archivo,
            'tipo_mime': 'application/pdf',
            'tamano_bytes': len(content),
            'contenido_archivo': None,
            'hash_archivo': hashlib.sha256(content).hexdigest(),
            'nas_relative_path': result.nas_relative_path or '',
            'nas_storage_status': (
                models.DocumentoAdjunto.NAS_STATUS_STORED if result.success
                else (result.error_code or models.DocumentoAdjunto.NAS_STATUS_FAILED)
            ),
        },
    )

    if not result.success:
        logger.warning(
            '[SHARED_STORAGE] PDF unificado no copiado al NAS. factura_id=%s error_code=%s message=%s',
            factura.id, result.error_code, result.message,
        )


def _expediente(factura, documentos, scope, incluir_portada=True, guardar=True):
    """Arma el expediente consolidado y, si se pide, lo guarda como PDF unificado de la factura."""
    content, consolidado = archivos.expediente(factura, documentos, scope, _documento_bytes, incluir_portada)
    if guardar and consolidado:
        _guardar_pdf_unificado(factura, content, scope)
    return content


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
        _expediente(factura, documentos, 'all')
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
