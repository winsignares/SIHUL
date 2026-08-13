from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from mysite.auth_helpers import get_role_name, get_user_seccional_id, is_admin_global, is_admin_sistema
from mysite.permissions import IsAdminOnly

from .models import Componente, ComponenteRol, ComponenteUsuario
from .serializers import ComponenteRolSerializer, ComponenteSerializer, ComponenteUsuarioSerializer


class ComponenteListCreateAPIView(generics.ListCreateAPIView):
    queryset = Componente.objects.all().order_by('nombre')
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class ComponenteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Componente.objects.all()
    serializer_class = ComponenteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [IsAdminOnly()]


class ComponenteRolListCreateAPIView(generics.ListCreateAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol', 'seccional').all()
    serializer_class = ComponenteRolSerializer
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

        if is_admin_global(user):
            seccional_id = self.request.query_params.get('seccional')
            if seccional_id:
                return queryset.filter(seccional_id=seccional_id)
            return queryset

        seccional_id = get_user_seccional_id(user)
        if not seccional_id:
            return queryset.none()
        return queryset.filter(seccional_id=seccional_id)

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        rol = serializer.validated_data.get('rol')
        if user and not is_admin_global(user):
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                raise ValidationError('El usuario autenticado no tiene una seccional asignada.')
            if rol and rol.seccional_id and rol.seccional_id != seccional_id:
                raise ValidationError({'rol': 'El rol seleccionado no pertenece a la seccional del usuario autenticado.'})
            serializer.save(seccional_id=seccional_id)
            return

        seccional = serializer.validated_data.get('seccional') or getattr(rol, 'seccional', None)
        serializer.save(seccional=seccional)


class ComponenteRolDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ComponenteRol.objects.select_related('componente', 'rol', 'seccional').all()
    serializer_class = ComponenteRolSerializer
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

        if is_admin_global(user):
            return queryset

        seccional_id = get_user_seccional_id(user)
        if not seccional_id:
            return queryset.none()
        return queryset.filter(seccional_id=seccional_id)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        rol = serializer.validated_data.get('rol', getattr(serializer.instance, 'rol', None))
        if user and not is_admin_global(user):
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                raise ValidationError('El usuario autenticado no tiene una seccional asignada.')
            if rol and rol.seccional_id and rol.seccional_id != seccional_id:
                raise ValidationError({'rol': 'El rol seleccionado no pertenece a la seccional del usuario autenticado.'})
            serializer.save(seccional_id=seccional_id)
            return

        seccional = serializer.validated_data.get('seccional') or getattr(rol, 'seccional', None)
        serializer.save(seccional=seccional)


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
        if is_admin_global(user):
            usuario_id = self.request.query_params.get('usuario')
            if usuario_id:
                return queryset.filter(usuario_id=usuario_id)
            return queryset

        if is_admin_sistema(user) or role_name == 'admin financiero':
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                return queryset.none()
            queryset = queryset.filter(usuario__seccional_id=seccional_id)
            usuario_id = self.request.query_params.get('usuario')
            if usuario_id:
                return queryset.filter(usuario_id=usuario_id)
            return queryset

        return queryset.filter(usuario_id=user.id)

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        target_user = serializer.validated_data.get('usuario')

        if user and not is_admin_global(user):
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                raise ValidationError('El usuario autenticado no tiene una seccional asignada.')
            if target_user and target_user.seccional_id != seccional_id:
                raise ValidationError({'usuario': 'El usuario seleccionado no pertenece a la seccional del usuario autenticado.'})

        serializer.save()


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
        if is_admin_global(user):
            return queryset

        if is_admin_sistema(user) or role_name == 'admin financiero':
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                return queryset.none()
            return queryset.filter(usuario__seccional_id=seccional_id)

        return queryset.filter(usuario_id=user.id)

    def perform_update(self, serializer):
        user = getattr(self.request, 'user', None)
        target_user = serializer.validated_data.get('usuario', getattr(serializer.instance, 'usuario', None))

        if user and not is_admin_global(user):
            seccional_id = get_user_seccional_id(user)
            if not seccional_id:
                raise ValidationError('El usuario autenticado no tiene una seccional asignada.')
            if target_user and target_user.seccional_id != seccional_id:
                raise ValidationError({'usuario': 'El usuario seleccionado no pertenece a la seccional del usuario autenticado.'})

        serializer.save()
