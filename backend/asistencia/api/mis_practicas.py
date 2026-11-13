from rest_framework.response import Response
from rest_framework.views import APIView

from nucleo.auth_helpers import is_authenticated_user

from ..models import AsignacionPractica


def _serializar(a):
    return {
        'id': a.id,
        'lugar': {
            'id': a.lugar_id, 'nombre': a.lugar.nombre, 'latitud': str(a.lugar.latitud), 'longitud': str(a.lugar.longitud),
            'radio_metros': a.lugar.radio_metros, 'precision_maxima_metros': a.lugar.precision_maxima_metros,
        },
        'fecha_inicio': a.fecha_inicio.isoformat(), 'fecha_fin': a.fecha_fin.isoformat(),
        'hora_inicio': a.hora_inicio.strftime('%H:%M'), 'hora_fin': a.hora_fin.strftime('%H:%M'),
    }


class MisPracticasView(APIView):
    """GET: prácticas activas del estudiante que hace la petición."""

    def get(self, request):
        if not is_authenticated_user(request.user):
            return Response({'error': 'No autenticado'}, status=401)
        asignaciones = AsignacionPractica.objects.select_related('lugar').filter(
            estudiante=request.user, activa=True, lugar__activo=True,
        ).order_by('fecha_inicio', 'id')
        return Response([_serializar(a) for a in asignaciones])
