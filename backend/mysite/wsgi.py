"""Compatibilidad con DJANGO_WSGI=mysite.wsgi:application de entornos que aun no actualizan su variable."""
from config.wsgi import application  # noqa: F401
