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

from .models import Ciudad, DepartamentoGeografico, Pais, Proveedor
from financiero.contabilidad.models import Banco, TipoCuenta
from .serializers import CiudadSerializer, DepartamentoGeograficoSerializer, PaisSerializer, ProveedorSerializer
from unispace.usuarios.models import Usuario

logger = logging.getLogger(__name__)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.select_related('usuario').all()
    serializer_class = ProveedorSerializer
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
            ciudad = Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento__pais').first()
            if ciudad:
                departamento = ciudad.departamento
                pais = departamento.pais

        if departamento is None and departamento_id:
            departamento = DepartamentoGeografico.objects.filter(id=departamento_id, activo=True).select_related('pais').first()
            if departamento:
                pais = departamento.pais

        if pais is None and pais_id:
            pais = Pais.objects.filter(id=pais_id, activo=True).first()

        if ciudad:
            data['ciudad'] = ciudad.nombre
        if departamento:
            data['departamento'] = departamento.nombre
        if pais:
            data['pais'] = pais.nombre

        if banco_id:
            banco = Banco.objects.filter(id=banco_id, activo=True).first()
            if banco:
                data['banco'] = banco.nombre

        if tipo_cuenta_id:
            tipo_cuenta = TipoCuenta.objects.filter(id=tipo_cuenta_id, activo=True).first()
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
        from unispace.usuarios.models import Rol

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

        if Proveedor.objects.filter(nit=nit).exists():
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
                proveedor = Proveedor.objects.create(**proveedor_data)

        except IntegrityError as exc:
            return Response({'error': f'Error de integridad: {exc}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                'usuario_id': nuevo_usuario.id,
                'proveedor': ProveedorSerializer(proveedor).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=['get'], url_path='mi_perfil')
    def mi_perfil(self, request):
        """Encuentra el proveedor asociado al usuario actual por vínculo directo, email o NIT."""
        user = request.user
        proveedor = Proveedor.objects.filter(usuario=user).first()

        # 1. Fallback por email del usuario
        if not proveedor and user.correo:
            proveedor = Proveedor.objects.filter(email__iexact=user.correo).first()

        # 2. Fallback por NIT pasado como query param
        if not proveedor:
            nit = (request.query_params.get('nit') or '').strip()
            if nit:
                proveedor = Proveedor.objects.filter(nit=nit).first()

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
            return Response(ProveedorSerializer(proveedor).data)

        return Response(
            {'detail': 'No se encontró un proveedor asociado a este usuario.'},
            status=status.HTTP_404_NOT_FOUND
        )
class PaisViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pais.objects.filter(activo=True).order_by('nombre')
    serializer_class = PaisSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'codigo_iso']
    search_fields = ['nombre', 'codigo_iso']
    ordering = ['nombre']
class DepartamentoGeograficoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DepartamentoGeograficoSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'pais']
    search_fields = ['nombre', 'codigo', 'pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = DepartamentoGeografico.objects.filter(activo=True).select_related('pais').order_by('nombre')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')
        ciudad_id = self.request.query_params.get('ciudad_id')

        if ciudad_id:
            ciudad = Ciudad.objects.filter(id=ciudad_id, activo=True).select_related('departamento').first()
            if ciudad:
                queryset = queryset.filter(id=ciudad.departamento_id)

        if pais_id:
            queryset = queryset.filter(pais_id=pais_id)

        return queryset
class CiudadViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CiudadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activo', 'departamento']
    search_fields = ['nombre', 'departamento__nombre', 'departamento__pais__nombre']
    ordering = ['nombre']

    def get_queryset(self):
        queryset = Ciudad.objects.filter(activo=True).select_related('departamento__pais').order_by('nombre')
        departamento_id = self.request.query_params.get('departamento_id') or self.request.query_params.get('departamento')
        pais_id = self.request.query_params.get('pais_id') or self.request.query_params.get('pais')

        if departamento_id:
            queryset = queryset.filter(departamento_id=departamento_id)

        if pais_id:
            queryset = queryset.filter(departamento__pais_id=pais_id)

        return queryset
