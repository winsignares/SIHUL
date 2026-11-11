"""Compresión gzip de las respuestas JSON.

Los listados grandes (horarios extendidos, horarios, espacios con horarios, usuarios) pesan cientos de KB y se
reducen unas 18 veces con gzip. Solo se comprime JSON: los PDF, Excel y ZIP ya vienen comprimidos o se descargan
como archivo. El navegador descomprime solo; el contenido y la forma de las respuestas no cambian.
"""
from django.middleware.gzip import GZipMiddleware


class GZipJSONMiddleware(GZipMiddleware):
    """GZipMiddleware de Django (con su protección contra BREACH) limitado a `application/json`."""

    def process_response(self, request, response):
        if not response.get('Content-Type', '').startswith('application/json'):
            return response
        return super().process_response(request, response)
