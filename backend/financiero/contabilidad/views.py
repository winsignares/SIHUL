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

from .models import Banco, CentroCosto, CuentaContable, Departamento, TipoCuenta
from .serializers import BancoSerializer, CentroCostoSerializer, CuentaContableSerializer, DepartamentoSerializer, TipoCuentaSerializer

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
class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.all()
    serializer_class = DepartamentoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    @action(detail=False, methods=['get'])
    def areas_solicitantes(self, request):
        """Lista las áreas activas disponibles en la base de datos."""
        queryset = Departamento.objects.filter(
            estado='Activo',
            codigo__startswith='SOL-',
        ).order_by('nombre')
        serializer = DepartamentoSerializer(queryset, many=True)
        return Response(serializer.data)
class CuentaContableViewSet(viewsets.ModelViewSet):
    queryset = CuentaContable.objects.all()
    serializer_class = CuentaContableSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo_cuenta', 'nivel', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not CuentaContable.objects.exists():
            for cuenta in DEFAULT_CUENTAS_CONTABLES:
                CuentaContable.objects.get_or_create(codigo=cuenta['codigo'], defaults=cuenta)
        return super().list(request, *args, **kwargs)
class CentroCostoViewSet(viewsets.ModelViewSet):
    queryset = CentroCosto.objects.all()
    serializer_class = CentroCostoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['tipo', 'estado']
    search_fields = ['codigo', 'nombre']

    def list(self, request, *args, **kwargs):
        if not CentroCosto.objects.exists():
            for centro in DEFAULT_CENTROS_COSTO:
                CentroCosto.objects.get_or_create(codigo=centro['codigo'], defaults=centro)
        return super().list(request, *args, **kwargs)
class BancoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Banco.objects.filter(activo=True).order_by('nombre')
    serializer_class = BancoSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
class TipoCuentaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TipoCuenta.objects.filter(activo=True).order_by('nombre')
    serializer_class = TipoCuentaSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['activo']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['nombre']
