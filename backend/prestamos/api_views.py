import json
import urllib.parse
import urllib.request
import uuid

from django.conf import settings
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.seccional_auth import SeccionalMixin
from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from espacios.models import EspacioPermitido

from .models import PrestamoEspacio, PrestamoEspacioPublico, PrestamoRecurso, TipoActividad
from .serializers import (
    PrestamoEspacioPublicoSerializer,
    PrestamoEspacioSerializer,
    PrestamoRecursoSerializer,
    TipoActividadSerializer,
)


class TipoActividadListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = TipoActividad.objects.all().order_by('nombre')
    serializer_class = TipoActividadSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = None

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        if self.request.method in permissions.SAFE_METHODS:
            return TipoActividad.objects.all().order_by('nombre')
        return super().get_queryset()


class TipoActividadDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = TipoActividad.objects.all()
    serializer_class = TipoActividadSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = None


class PrestamoEspacioListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacio.objects.none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(usuario_id=user.id)


class PrestamoEspacioDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacio.objects.none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(usuario_id=user.id)


class PrestamoEspacioPublicoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioPublicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def create(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha_token') or request.data.get('recaptcha')
        recaptcha_ok, recaptcha_error = _verify_recaptcha(
            recaptcha_token,
            request.META.get('REMOTE_ADDR')
        )
        if not recaptcha_ok:
            return Response({"error": recaptcha_error}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.copy()
        payload.pop('recaptcha_token', None)
        payload.pop('recaptcha', None)

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        token_publico = uuid.uuid4().hex
        serializer.save(token_publico=token_publico)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacioPublico.objects.none()
        identificacion = (self.request.query_params.get('identificacion') or '').strip()
        correo = (self.request.query_params.get('correo') or '').strip()
        if identificacion and correo:
            return PrestamoEspacioPublico.objects.filter(
                identificacion_solicitante=identificacion,
                correo_solicitante__iexact=correo,
            )
        if is_admin_global(user) or is_admin_sistema(user) or get_role_name(user) == 'admin financiero':
            return super().get_queryset()
        return PrestamoEspacioPublico.objects.none()


def _verify_recaptcha(token, remote_ip=None):
    if not settings.RECAPTCHA_SECRET_KEY:
        if settings.DEBUG:
            return True, ""
        return False, "reCAPTCHA no está configurado"
    if not token:
        return False, "Token reCAPTCHA es requerido"

    payload = {
        'secret': settings.RECAPTCHA_SECRET_KEY,
        'response': token,
    }
    if remote_ip:
        payload['remoteip'] = remote_ip

    try:
        data = urllib.parse.urlencode(payload).encode()
        req = urllib.request.Request(
            'https://www.google.com/recaptcha/api/siteverify',
            data=data,
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=8) as response:
            parsed = json.loads(response.read().decode('utf-8'))
        if parsed.get('success'):
            return True, ""
        return False, "reCAPTCHA inválido"
    except Exception:
        return False, "No se pudo validar reCAPTCHA"


class PublicAccessRecaptchaVerifyAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        recaptcha_token = request.data.get('recaptcha_token') or request.data.get('recaptcha')
        recaptcha_ok, recaptcha_error = _verify_recaptcha(
            recaptcha_token,
            request.META.get('REMOTE_ADDR')
        )
        if not recaptcha_ok:
            return Response({"error": recaptcha_error}, status=status.HTTP_403_FORBIDDEN)
        return Response({"success": True}, status=status.HTTP_200_OK)


class PrestamoEspacioPublicoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioPublicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacioPublico.objects.none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return PrestamoEspacioPublico.objects.none()


class PrestamoRecursoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoRecurso.objects.select_related('prestamo', 'recurso').all()
    serializer_class = PrestamoRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'prestamo__espacio__sede__seccional'

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoRecurso.objects.none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(prestamo__usuario_id=user.id)


class PrestamoRecursoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoRecurso.objects.select_related('prestamo', 'recurso').all()
    serializer_class = PrestamoRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'prestamo__espacio__sede__seccional'

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoRecurso.objects.none()
        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return super().get_queryset()
        return super().get_queryset().filter(prestamo__usuario_id=user.id)


class SupervisorEspaciosPermitidosPrestamosAPIView(SeccionalMixin, generics.ListAPIView):
    """
    Retorna todos los préstamos de los espacios permitidos para un usuario supervisor.
    Solo accesible para usuarios con rol que comience con 'supervisor'.
    Endpoint: GET /api/prestamos/supervisor/espacios-prestamos/
    """
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = None

    def get_queryset(self):
        user = self.get_current_user()
        
        # Validar que el usuario sea supervisor
        role_name = get_role_name(user)
        if not role_name.startswith('supervisor'):
            return PrestamoEspacio.objects.none()
        
        # Obtener los espacios permitidos del supervisor
        espacios_permitidos = EspacioPermitido.objects.filter(
            usuario=user
        ).values_list('espacio_id', flat=True)
        
        # Retornar todos los préstamos de esos espacios
        queryset = PrestamoEspacio.objects.filter(
            espacio_id__in=espacios_permitidos
        ).select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').order_by('-fecha', '-hora_inicio')
        
        return queryset

    def get_permissions(self):
        return [permissions.IsAuthenticated()]
