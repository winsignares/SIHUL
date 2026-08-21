from rest_framework import generics, permissions

from mysite.auth_helpers import get_role_name, is_admin_global, is_admin_sistema
from mysite.permissions import IsAdminOnly

from .models import Componente, ComponenteRol, ComponenteUsuario
from .serializers import ComponenteRolSerializer, ComponenteSerializer, ComponenteUsuarioSerializer


FINANCIAL_ROLE_NAMES = (
    'Funcionario',
    'Contabilidad',
    'Tesorería',
    'Auditoría',
    'Dirección Financiera',
    'Rectoría',
    'Admin Financiero',
)


class ComponenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Componente.objects.all().order_by('nombre')
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

    def get_queryset(self):
        queryset = Componente.objects.all().order_by('nombre')
        if self.request.query_params.get('financiero') == '1':
            queryset = queryset.filter(
                componenterol__rol__nombre__in=FINANCIAL_ROLE_NAMES
            ).distinct()
        return queryset


class ComponenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class ComponenteRolListCreateAPIView(generics.ListCreateAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

    def get_queryset(self):
        queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
        if self.request.query_params.get('financiero') == '1':
            queryset = queryset.filter(rol__nombre__in=FINANCIAL_ROLE_NAMES)
        return queryset


class ComponenteRolDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol').all()
    serializer_class = ComponenteRolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class ComponenteUsuarioListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

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
            if self.request.query_params.get('financiero') == '1':
                return queryset.filter(usuario__rol__nombre__in=FINANCIAL_ROLE_NAMES)
            return queryset

        return queryset.filter(usuario_id=user.id)


class ComponenteUsuarioDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteUsuario.objects.select_related('componente', 'usuario').all()
    serializer_class = ComponenteUsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        role_name = get_role_name(user)
        if is_admin_global(user) or is_admin_sistema(user) or role_name == 'admin financiero':
            return queryset

        return queryset.filter(usuario_id=user.id)
