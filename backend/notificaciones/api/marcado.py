"""Marcar notificaciones como leídas."""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from mysite.auth_helpers import is_admin_global
from ..models import Notificacion
from ._filtros import _resolve_target_user_id


class NotificacionMarcarLeidaAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id=None):
        user = getattr(request, 'user', None)
        if id is None:
            return Response({'error': 'El ID es requerido en la URL'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            notif = Notificacion.objects.get(id=id)
        except Notificacion.DoesNotExist:
            return Response({'error': 'Notificación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if user and not is_admin_global(user) and notif.id_usuario != user.id:
            return Response({'error': 'No autorizado para actualizar esta notificación'}, status=status.HTTP_403_FORBIDDEN)

        notif.es_leida = True
        notif.save(update_fields=['es_leida'])
        return Response({'message': 'Notificación marcada como leída', 'id': notif.id}, status=status.HTTP_200_OK)


class NotificacionMarcarTodasLeidasAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = getattr(request, 'user', None)
        id_usuario = request.data.get('id_usuario')
        id_usuario = _resolve_target_user_id(user, id_usuario)

        if not id_usuario:
            return Response({'error': 'id_usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        count = Notificacion.objects.filter(id_usuario=id_usuario, es_leida=False).update(es_leida=True)
        return Response({
            'message': f'{count} notificación(es) marcada(s) como leída(s)',
            'cantidad': count,
        }, status=status.HTTP_200_OK)
