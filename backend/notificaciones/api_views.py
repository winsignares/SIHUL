from datetime import timedelta

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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


class NotificacionEstadisticasAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        id_usuario = request.query_params.get('id_usuario')

        if not id_usuario:
            return Response({'error': 'id_usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        total = Notificacion.objects.filter(id_usuario=id_usuario).count()
        no_leidas = Notificacion.objects.filter(id_usuario=id_usuario, es_leida=False).count()
        leidas = total - no_leidas

        por_prioridad = {
            prioridad: Notificacion.objects.filter(id_usuario=id_usuario, prioridad=prioridad).count()
            for prioridad in ['alta', 'media', 'baja']
        }

        return Response({
            'total': total,
            'leidas': leidas,
            'no_leidas': no_leidas,
            'por_prioridad': por_prioridad,
        }, status=status.HTTP_200_OK)


class NotificacionListAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Notificacion.objects.all().order_by('-fecha_creacion')
        user = getattr(request, 'user', None)

        if user and not is_admin_global(user):
            if not user.is_authenticated:
                queryset = queryset.none()
            else:
                queryset = queryset.filter(id_usuario=user.id)

        id_usuario = request.query_params.get('id_usuario')
        no_leidas = request.query_params.get('no_leidas', 'false').lower() == 'true'

        if id_usuario:
            queryset = queryset.filter(id_usuario=id_usuario)

        if no_leidas:
            queryset = queryset.filter(es_leida=False)

        data = [
            {
                'id': item.id,
                'id_usuario': item.id_usuario,
                'tipo_notificacion': item.tipo_notificacion,
                'mensaje': item.mensaje,
                'es_leida': item.es_leida,
                'fecha_creacion': item.fecha_creacion.isoformat(),
                'prioridad': item.prioridad,
            }
            for item in queryset
        ]
        return Response({'notificaciones': data}, status=status.HTTP_200_OK)


class NotificacionMisNotificacionesAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        id_usuario = request.query_params.get('id_usuario')
        no_leidas = request.query_params.get('no_leidas', 'false').lower() == 'true'
        pagina = max(int(request.query_params.get('pagina', 1)), 1)
        limite = min(max(int(request.query_params.get('limite', 10)), 1), 100)
        busqueda = request.query_params.get('busqueda', '').strip()
        tipo = request.query_params.get('tipo', '').strip()
        prioridad = request.query_params.get('prioridad', '').strip()
        filtro_tiempo = request.query_params.get('filtro_tiempo', '').strip()
        categoria = request.query_params.get('categoria', '').strip()

        if not id_usuario:
            return Response({'error': 'id_usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        queryset = Notificacion.objects.filter(id_usuario=id_usuario)

        if no_leidas:
            queryset = queryset.filter(es_leida=False)

        if busqueda:
            queryset = queryset.filter(
                Q(mensaje__icontains=busqueda) | Q(tipo_notificacion__icontains=busqueda)
            )

        if tipo:
            queryset = queryset.filter(tipo_notificacion__icontains=tipo)

        if categoria:
            tipos_importantes = [
                'solicitud', 'solicitud_espacio', 'solicitud_aprobada', 'solicitud_rechazada',
                'horario', 'grupo', 'prestamo', 'profesor_sin_asignar', 'grupo_sin_espacio',
                'licencia', 'periodo_academico',
            ]

            if categoria == 'importantes':
                queryset = queryset.filter(tipo_notificacion__in=tipos_importantes, es_leida=False)
            elif categoria == 'pendientes':
                queryset = queryset.filter(es_leida=False)
            elif categoria == 'leidas':
                queryset = queryset.filter(es_leida=True)

        if prioridad and prioridad in ['alta', 'media', 'baja']:
            queryset = queryset.filter(prioridad=prioridad)

        if filtro_tiempo:
            now = timezone.now()
            if filtro_tiempo == 'dia':
                queryset = queryset.filter(fecha_creacion__gte=now - timedelta(days=1))
            elif filtro_tiempo == 'semana':
                queryset = queryset.filter(fecha_creacion__gte=now - timedelta(weeks=1))
            elif filtro_tiempo == 'mes':
                queryset = queryset.filter(fecha_creacion__gte=now - timedelta(days=30))

        queryset = queryset.order_by('-fecha_creacion')
        total = queryset.count()
        inicio = (pagina - 1) * limite
        fin = inicio + limite
        paginadas = queryset[inicio:fin]

        data = [
            {
                'id': item.id,
                'id_usuario': item.id_usuario,
                'tipo_notificacion': item.tipo_notificacion,
                'mensaje': item.mensaje,
                'es_leida': item.es_leida,
                'fecha_creacion': item.fecha_creacion.isoformat(),
                'prioridad': item.prioridad,
            }
            for item in paginadas
        ]

        return Response({
            'notificaciones': data,
            'total': total,
            'pagina_actual': pagina,
            'total_paginas': (total + limite - 1) // limite,
            'tiene_siguiente': fin < total,
            'tiene_anterior': pagina > 1,
        }, status=status.HTTP_200_OK)


class NotificacionMarcarLeidaAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, id=None):
        if id is None:
            return Response({'error': 'El ID es requerido en la URL'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            notif = Notificacion.objects.get(id=id)
        except Notificacion.DoesNotExist:
            return Response({'error': 'Notificación no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        notif.es_leida = True
        notif.save(update_fields=['es_leida'])
        return Response({'message': 'Notificación marcada como leída', 'id': notif.id}, status=status.HTTP_200_OK)


class NotificacionMarcarTodasLeidasAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        id_usuario = request.data.get('id_usuario')

        if not id_usuario:
            return Response({'error': 'id_usuario es requerido'}, status=status.HTTP_400_BAD_REQUEST)

        count = Notificacion.objects.filter(id_usuario=id_usuario, es_leida=False).update(es_leida=True)
        return Response({
            'message': f'{count} notificación(es) marcada(s) como leída(s)',
            'cantidad': count,
        }, status=status.HTTP_200_OK)
