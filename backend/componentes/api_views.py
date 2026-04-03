from rest_framework import generics, permissions

from .models import Componente, ComponenteRol
from .serializers import ComponenteRolSerializer, ComponenteSerializer


class ComponenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Componente.objects.all().order_by('nombre')
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ComponenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]


class ComponenteRolListCreateAPIView(generics.ListCreateAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]


class ComponenteRolDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]
