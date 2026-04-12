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

    def get_queryset(self):
        PeriodoAcademico.sincronizar_activos_por_fecha()
        return super().get_queryset()


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
        PeriodoAcademico.sincronizar_activos_por_fecha()
        periodo = PeriodoAcademico.objects.filter(activo=True).order_by('-id').first()
        if not periodo:
            return Response({'error': 'No hay período activo'}, status=status.HTTP_404_NOT_FOUND)
        return Response(PeriodoAcademicoSerializer(periodo).data, status=status.HTTP_200_OK)


class PeriodoPorRangoFechasAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Busca un período académico que se encuentre dentro de un rango de fechas específico.
        
        Query params:
        - fecha_inicio: str (requerido) - Fecha inicio del rango a buscar (YYYY-MM-DD)
        - fecha_fin: str (requerido) - Fecha fin del rango a buscar (YYYY-MM-DD)
        
        Retorna:
        - El período encontrado que intersecta con el rango especificado
        - Error 404 si no hay período en ese rango
        """
        fecha_inicio_str = request.query_params.get('fecha_inicio')
        fecha_fin_str = request.query_params.get('fecha_fin')

        if not fecha_inicio_str or not fecha_fin_str:
            return Response(
                {'error': 'fecha_inicio y fecha_fin son requeridos (formato YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            fecha_inicio = datetime.date.fromisoformat(fecha_inicio_str)
            fecha_fin = datetime.date.fromisoformat(fecha_fin_str)
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if fecha_fin < fecha_inicio:
            return Response(
                {'error': 'fecha_fin debe ser posterior o igual a fecha_inicio'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from django.db.models import Q

        periodos = PeriodoAcademico.objects.filter(
            Q(fecha_inicio__lte=fecha_fin) & Q(fecha_fin__gte=fecha_inicio)
        ).order_by('fecha_inicio')

        if not periodos.exists():
            return Response(
                {
                    'error': f'No hay período académico en el rango {fecha_inicio_str} a {fecha_fin_str}',
                    'fecha_inicio': fecha_inicio_str,
                    'fecha_fin': fecha_fin_str,
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = PeriodoAcademicoSerializer(periodos, many=True)
        return Response({
            'mensaje': f'Se encontraron {periodos.count()} período(s) en el rango especificado',
            'fecha_inicio_busqueda': fecha_inicio_str,
            'fecha_fin_busqueda': fecha_fin_str,
            'periodos': serializer.data
        }, status=status.HTTP_200_OK)
