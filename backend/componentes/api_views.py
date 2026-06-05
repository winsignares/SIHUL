from rest_framework import generics, permissions

from .models import Componente, ComponenteRol, ComponenteUsuario
from .serializers import ComponenteRolSerializer, ComponenteSerializer, ComponenteUsuarioSerializer


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


class ComponenteUsuarioListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)
        return queryset


class ComponenteUsuarioDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
