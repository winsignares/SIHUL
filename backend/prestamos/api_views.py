from rest_framework import generics, permissions

from mysite.seccional_auth import SeccionalMixin

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
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').all()
    serializer_class = PrestamoEspacioSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'


class PrestamoEspacioDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PrestamoEspacio.objects.select_related('espacio', 'usuario', 'administrador', 'tipo_actividad').all()
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
