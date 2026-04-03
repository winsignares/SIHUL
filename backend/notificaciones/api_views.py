from rest_framework import generics, permissions

from mysite.auth_helpers import is_admin_global

from .models import Notificacion
from .serializers import NotificacionSerializer


class NotificacionListCreateAPIView(generics.ListCreateAPIView):
    queryset = Notificacion.objects.all().order_by('-fecha_creacion')
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)

        if user and is_admin_global(user):
            return queryset

        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        return queryset.filter(id_usuario=user.id)

    def perform_create(self, serializer):
        user = getattr(self.request, 'user', None)
        if user and getattr(user, 'is_authenticated', False) and not is_admin_global(user):
            serializer.save(id_usuario=user.id)
            return
        serializer.save()


class NotificacionDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = getattr(self.request, 'user', None)

        if user and is_admin_global(user):
            return queryset

        if not user or not getattr(user, 'is_authenticated', False):
            return queryset.none()

        return queryset.filter(id_usuario=user.id)
