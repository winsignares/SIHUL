from rest_framework.response import Response
from rest_framework.views import APIView

from nucleo.auth_helpers import is_admin_global, is_authenticated_user

from ..models import AsignacionPractica


class RegistrosDeAsignacionView(APIView):
    """GET: registros de una práctica. Los ve el estudiante, su responsable y el administrador general."""

    def get(self, request, asignacion_id):
        user = request.user
        if not is_authenticated_user(user):
            return Response({'error': 'No autenticado'}, status=401)
        asignacion = AsignacionPractica.objects.filter(id=asignacion_id).first()
        permitido = asignacion is not None and (
            is_admin_global(user) or user.id in (asignacion.estudiante_id, asignacion.responsable_id)
        )
        if not permitido:
            return Response({'error': 'Práctica no encontrada'}, status=404)
        return Response([
            {
                'id': r.id, 'tipo': r.tipo, 'registrado_en': r.registrado_en.isoformat(),
                'dentro_del_radio': r.dentro_del_radio, 'distancia_metros': round(r.distancia_metros, 1),
            }
            for r in asignacion.registros.all()
        ])
