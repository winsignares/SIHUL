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

from .models import ParametroSLA, ParametrosFinanciero
from .serializers import ParametroSLASerializer, ParametrosFinancieroSerializer

logger = logging.getLogger(__name__)


class ParametroSLAViewSet(viewsets.ModelViewSet):
    queryset = ParametroSLA.objects.all()
    serializer_class = ParametroSLASerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['etapa', 'rol_responsable']

    def perform_create(self, serializer):
        serializer.save(modificado_por=self.request.user)

    def perform_update(self, serializer):
        serializer.save(modificado_por=self.request.user)
class ParametrosFinancieroViewSet(viewsets.ModelViewSet):
    queryset = ParametrosFinanciero.objects.all()
    serializer_class = ParametrosFinancieroSerializer
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
        params = ParametrosFinanciero.objects.all()
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
