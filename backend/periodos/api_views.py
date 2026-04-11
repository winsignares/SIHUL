import datetime

from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PeriodoAcademico
from .serializers import PeriodoAcademicoSerializer


class PeriodoAcademicoListCreateAPIView(generics.ListCreateAPIView):
    queryset = PeriodoAcademico.objects.all().order_by('-id')
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]


class PeriodoAcademicoDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PeriodoAcademico.objects.all()
    serializer_class = PeriodoAcademicoSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        from grupos.models import Grupo
        from horario.models import Horario

        periodo = self.get_object()

        grupos_asociados = Grupo.objects.filter(periodo=periodo)
        horarios_asociados = Horario.objects.filter(grupo__periodo=periodo)

        if grupos_asociados.exists() or horarios_asociados.exists():
            return Response(
                {
                    'error': (
                        'No se puede eliminar el período porque tiene datos asociados. '
                        'Primero debes dejarlo sin grupos ni horarios.'
                    ),
                    'grupos_asociados': grupos_asociados.count(),
                    'horarios_asociados': horarios_asociados.count(),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_destroy(periodo)

        return Response(
            {
                'message': 'Período eliminado correctamente.',
            },
            status=status.HTTP_200_OK,
        )


class PeriodoAcademicoCopyAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        from grupos.models import Grupo

        data = request.data or {}
        periodo_origen_id = data.get('periodo_origen_id')
        nombre = data.get('nombre')
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        activo = data.get('activo')

        if not periodo_origen_id or not nombre or not fecha_inicio or not fecha_fin:
            return Response(
                {'error': 'periodo_origen_id, nombre, fecha_inicio y fecha_fin son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            periodo_origen = PeriodoAcademico.objects.get(id=periodo_origen_id)
        except PeriodoAcademico.DoesNotExist:
            return Response({'error': 'Periodo origen no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        try:
            fi = datetime.date.fromisoformat(fecha_inicio)
            ff = datetime.date.fromisoformat(fecha_fin)
        except ValueError:
            return Response({'error': 'Formato de fecha inválido. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        if ff <= fi:
            return Response(
                {'error': 'La fecha_fin debe ser posterior a fecha_inicio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Si no se envía el campo, conservar el comportamiento legacy (nuevo activo).
        nuevo_activo = True if activo is None else bool(activo)

        if nuevo_activo:
            periodo_origen.activo = False
            periodo_origen.save(update_fields=['activo'])

        nuevo_periodo = PeriodoAcademico.objects.create(
            nombre=nombre,
            fecha_inicio=fi,
            fecha_fin=ff,
            activo=nuevo_activo,
        )

        grupos_actualizados = Grupo.objects.filter(periodo=periodo_origen).update(periodo=nuevo_periodo)

        return Response(
            {
                'message': 'Periodo copiado exitosamente',
                'id': nuevo_periodo.id,
                'grupos_actualizados': grupos_actualizados,
            },
            status=status.HTTP_201_CREATED,
        )


class PeriodoAcademicoActivoAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        periodo = PeriodoAcademico.objects.filter(activo=True).order_by('-id').first()
        if not periodo:
            return Response({'error': 'No hay período activo'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PeriodoAcademicoSerializer(periodo).data, status=status.HTTP_200_OK)
