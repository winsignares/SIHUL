from rest_framework import generics, permissions

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema

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
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            usuario_id = self.request.query_params.get('usuario')
            if usuario_id:
                return queryset.filter(usuario_id=usuario_id)
            return queryset

        return queryset.filter(usuario_id=user.id)


class ComponenteUsuarioDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return queryset

        return queryset.filter(usuario_id=user.id)
