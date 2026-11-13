from django.utils import timezone

from ..models import ConsentimientoUbicacion

VERSION_TEXTO = '1'


def vigente(usuario):
    return ConsentimientoUbicacion.objects.filter(usuario=usuario, revocado_en__isnull=True).exists()


def otorgar(usuario):
    if vigente(usuario):
        return
    ConsentimientoUbicacion.objects.create(usuario=usuario, version_texto=VERSION_TEXTO)


def revocar(usuario):
    ConsentimientoUbicacion.objects.filter(usuario=usuario, revocado_en__isnull=True).update(revocado_en=timezone.now())
