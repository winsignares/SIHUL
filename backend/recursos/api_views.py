from rest_framework import generics, permissions

from mysite.seccional_auth import SeccionalMixin

from .models import EspacioRecurso, Recurso
from .serializers import EspacioRecursoSerializer, RecursoSerializer


class RecursoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'recurso_espacios__espacio__sede__seccional'

    def get_queryset(self):
        return super().get_queryset().distinct().order_by('nombre')


class RecursoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'recurso_espacios__espacio__sede__seccional'


class EspacioRecursoListCreateAPIView(SeccionalMixin, generics.ListCreateAPIView):
    queryset = EspacioRecurso.objects.select_related('espacio', 'recurso').all()
    serializer_class = EspacioRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'


class EspacioRecursoDetailAPIView(SeccionalMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = EspacioRecurso.objects.select_related('espacio', 'recurso').all()
    serializer_class = EspacioRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'


class EspacioRecursoByIdsAPIView(SeccionalMixin, generics.RetrieveAPIView):
    queryset = EspacioRecurso.objects.select_related('espacio', 'recurso').all()
    serializer_class = EspacioRecursoSerializer
    permission_classes = [permissions.IsAuthenticated]
    seccional_lookup = 'espacio__sede__seccional'

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        return generics.get_object_or_404(
            queryset,
            espacio_id=self.kwargs['espacio_id'],
            recurso_id=self.kwargs['recurso_id'],
        )
