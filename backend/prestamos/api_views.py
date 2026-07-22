from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.seccional_auth import SeccionalMixin
from mysite.auth_helpers import user_supervisa_espacios
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
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]


class TipoActividadDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = TipoActividad.objects.all()
    serializer_class = TipoActividadSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = None


class PrestamoEspacioListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').prefetch_related('prestamo_recursos__recurso').all()
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').prefetch_related('prestamo_recursos__recurso').all()
        return super().get_queryset()

class PrestamoEspacioDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').prefetch_related('prestamo_recursos__recurso').all()
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'


class PrestamoEspacioPublicoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioPublicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        if self.request.method in ['GET', 'POST']:
            return [permissions.AllowAny()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
        return super().get_queryset()


class PrestamoEspacioPublicoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioPublicoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_permissions(self):
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.get_current_user()
        if not user:
            return PrestamoEspacioPublico.objects.select_related('espacio', 'administrador', 'tipo_actividad').all()
        return super().get_queryset()


class PrestamoRecursoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = PrestamoRecurso.objects.select_related('prestamo', 'recurso').all()
    serializer_class = PrestamoRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'prestamo__espacio__sede__seccional'


class PrestamoRecursoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoRecurso.objects.select_related('prestamo', 'recurso').all()
    serializer_class = PrestamoRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'prestamo__espacio__sede__seccional'


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
        
        # Validar que el usuario tenga capacidad de supervisar espacios.
        if not user_supervisa_espacios(user):
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


class PublicAccessRecaptchaVerifyAPIView(APIView):
    """
    Verifica el token reCAPTCHA para acceso público.
    Endpoint: POST /api/prestamos/public/recaptcha/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings
        import requests
        import os

        token = request.data.get('recaptcha_token') or request.data.get('token')
        if not token:
            return Response(
                {'success': False, 'error': 'Token reCAPTCHA requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar con Google reCAPTCHA - leer de settings o del environment
        secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', None) or os.getenv('RECAPTCHA_SECRET_KEY')
        if not secret_key:
            return Response(
                {'success': False, 'error': 'Servicio no configurado'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        try:
            response = requests.post(
                'https://www.google.com/recaptcha/api/siteverify',
                data={'secret': secret_key, 'response': token},
                timeout=10
            )
            result = response.json()

            if result.get('success'):
                return Response({
                    'success': True,
                    'score': result.get('score', 0.0),
                    'action': result.get('action', ''),
                    'challenge_ts': result.get('challenge_ts', ''),
                    'hostname': result.get('hostname', '')
                })
            else:
                return Response(
                    {'success': False, 'error': 'Verificación fallida', 'codes': result.get('error-codes', [])},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except requests.RequestException as e:
            return Response(
                {'success': False, 'error': f'Error de comunicación: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
