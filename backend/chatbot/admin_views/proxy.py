"""Respuestas compartidas por los proxies hacia el servicio RAG."""
import requests
from rest_framework.response import Response


def _proxy_error_response(exc: requests.exceptions.RequestException) -> Response:
    return Response({'error': f'No se pudo contactar el servicio de chatbots: {exc}'}, status=502)


def _forward_response(resp: requests.Response) -> Response:
    if resp.status_code == 204 or not resp.content:
        return Response(status=resp.status_code)
    try:
        return Response(resp.json(), status=resp.status_code)
    except ValueError:
        return Response({'error': resp.text[:500]}, status=resp.status_code)
