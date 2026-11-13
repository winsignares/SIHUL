"""Sedes y responsables candidatos para la gestión de chatbots."""
import requests
from django.db.models import Q
from identidad.usuarios.models import Usuario
from nucleo.auth_helpers import get_user_seccional_id
from nucleo.auth_helpers import is_admin_global
from nucleo.auth_helpers import q_usuarios_de_seccional
from rest_framework.response import Response
from rest_framework.views import APIView
from ..views import fastapi_base_url
from .permisos import PuedeGestionarChatbots
from .permisos import PuedeGestionarDocumentosChatbots
from .proxy import _forward_response
from .proxy import _proxy_error_response


class ChatbotSedesProxyView(APIView):
    """Lista las sedes válidas para asociar documentos, según el servicio RAG."""

    permission_classes = [PuedeGestionarDocumentosChatbots]

    def get(self, request):
        try:
            resp = requests.get(f'{fastapi_base_url()}/sedes', timeout=15)
        except requests.exceptions.RequestException as exc:
            return _proxy_error_response(exc)
        return _forward_response(resp)


class ResponsablesCandidatosView(APIView):
    """Personas a las que se puede asignar la carga de documentación de un chatbot.

    Búsqueda por nombre o correo (mínimo 2 letras, máximo 20 resultados). Solo usuarios activos con
    seccional (de ahí sale la seccional con la que subirán); se excluyen los estudiantes.
    """

    permission_classes = [PuedeGestionarChatbots]

    def get(self, request):
        texto = (request.query_params.get('q') or '').strip()
        if len(texto) < 2:
            return Response([])
        usuarios = (
            Usuario.objects.filter(activo=True)
            .filter(Q(nombre__icontains=texto) | Q(correo__icontains=texto))
            .filter(Q(seccional__isnull=False) | Q(sede__seccional__isnull=False))
            .exclude(rol__nombre__iexact='estudiante')
            .select_related('seccional', 'sede__seccional')
        )
        if not is_admin_global(request.user):
            # Quien no es administrador general solo ofrece personas de su propia seccional
            propia = get_user_seccional_id(request.user)
            if propia is None:
                return Response([])
            usuarios = usuarios.filter(q_usuarios_de_seccional(propia))
        usuarios = usuarios.order_by('nombre')[:20]
        return Response([
            {
                'id': u.id,
                'nombre': u.nombre,
                'correo': u.correo,
                'seccional': (u.seccional.ciudad if u.seccional else (u.sede.seccional.ciudad if u.sede and u.sede.seccional else None)),
            }
            for u in usuarios
        ])
