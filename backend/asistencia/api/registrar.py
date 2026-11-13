from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from nucleo.auth_helpers import is_authenticated_user

from ..models import AsignacionPractica, RegistroAsistencia
from ..servicios import registro
from ..servicios.errores import ErrorAsistencia


class RegistroEntrada(serializers.Serializer):
    asignacion_id = serializers.IntegerField()
    tipo = serializers.ChoiceField(choices=[t for t, _ in RegistroAsistencia.TIPOS])
    latitud = serializers.DecimalField(max_digits=9, decimal_places=6, min_value=-90, max_value=90)
    longitud = serializers.DecimalField(max_digits=9, decimal_places=6, min_value=-180, max_value=180)
    precision_metros = serializers.FloatField(min_value=0)


class RegistrarView(APIView):
    """POST: entrada, salida o posición del estudiante en su lugar de práctica."""

    def post(self, request):
        if not is_authenticated_user(request.user):
            return Response({'error': 'No autenticado'}, status=401)
        datos = RegistroEntrada(data=request.data)
        datos.is_valid(raise_exception=True)
        d = datos.validated_data
        asignacion = (
            AsignacionPractica.objects.select_related('lugar', 'estudiante')
            .filter(id=d['asignacion_id'], estudiante=request.user).first()
        )
        if asignacion is None:
            return Response({'error': 'Práctica no encontrada'}, status=404)
        try:
            creado = registro.registrar(asignacion, d['tipo'], d['latitud'], d['longitud'], d['precision_metros'])
        except ErrorAsistencia as e:
            return Response({'error': e.mensaje, 'codigo': e.codigo}, status=e.estado)
        return Response({
            'id': creado.id, 'tipo': creado.tipo, 'dentro_del_radio': creado.dentro_del_radio,
            'distancia_metros': round(creado.distancia_metros, 1),
        }, status=201)
