from rest_framework.response import Response
from rest_framework.views import APIView

from mysite.auth_helpers import is_authenticated_user

from ..servicios import consentimiento


class ConsentimientoView(APIView):
    """GET: estado del consentimiento. POST {otorgar: true|false}: lo otorga o lo revoca."""

    def get(self, request):
        if not is_authenticated_user(request.user):
            return Response({'error': 'No autenticado'}, status=401)
        return Response({'otorgado': consentimiento.vigente(request.user)})

    def post(self, request):
        if not is_authenticated_user(request.user):
            return Response({'error': 'No autenticado'}, status=401)
        otorgar = request.data.get('otorgar')
        if not isinstance(otorgar, bool):
            return Response({'error': "El campo 'otorgar' debe ser verdadero o falso"}, status=400)
        if otorgar:
            consentimiento.otorgar(request.user)
        else:
            consentimiento.revocar(request.user)
        return Response({'otorgado': consentimiento.vigente(request.user)})
