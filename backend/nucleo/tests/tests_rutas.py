"""
Rutas que publica el backend.

nginx solo reenvía al backend /api/, /media/, /accounts/, /panel-sihul-gestion/ y las cuatro rutas
de sesión /api/usuarios/(login|logout|session-auth-state|change-password)/, que reescribe a
/usuarios/<ruta>/ (ver despliegue/nginx/). Estas pruebas evitan que vuelvan a aparecer rutas
fuera de esos prefijos, que nadie usaría y que habría que mantener alineadas con las de /api.
"""
import re

from django.test import TestCase
from django.urls import URLPattern, URLResolver, get_resolver, resolve, reverse

PREFIJOS_PUBLICADOS = re.compile(
    r'^(\^?api/|health/|panel-sihul-gestion/|accounts/|\^?media/|\^?static/'
    r'|usuarios/(login|logout|session-auth-state|change-password)/$)'
)


def _todas_las_rutas(resolver=None, prefijo=''):
    resolver = resolver or get_resolver()
    for patron in resolver.url_patterns:
        ruta = prefijo + str(patron.pattern)
        if isinstance(patron, URLResolver):
            yield from _todas_las_rutas(patron, ruta)
        elif isinstance(patron, URLPattern):
            yield ruta


class RutasPublicadasTests(TestCase):
    def test_todas_las_rutas_estan_bajo_un_prefijo_publicado(self):
        fuera = [ruta for ruta in _todas_las_rutas() if not PREFIJOS_PUBLICADOS.match(ruta)]
        self.assertEqual(fuera, [])

    def test_las_rutas_de_sesion_siguen_en_usuarios_y_son_las_de_la_api(self):
        for nombre, accion in [
            ('login_usuario', 'login'),
            ('logout_usuario', 'logout'),
            ('session_auth_state', 'session-auth-state'),
            ('change_password', 'change-password'),
        ]:
            with self.subTest(nombre=nombre):
                self.assertEqual(reverse(nombre), f'/usuarios/{accion}/')
                self.assertIs(resolve(f'/usuarios/{accion}/').func, resolve(f'/api/usuarios/{accion}/').func)

    def test_las_rutas_antiguas_sin_api_no_existen(self):
        for ruta in [
            '/usuarios/list/', '/usuarios/roles/list/', '/sedes/list/', '/facultades/list/', '/programas/',
            '/periodos/list/', '/grupos/list/', '/asignaturas/list/', '/espacios/list/', '/recursos/list/',
            '/componentes/list/', '/horario/list/', '/prestamos/list/', '/prestamos/public/list/',
            '/chatbot/agentes/', '/notificaciones/list/',
        ]:
            with self.subTest(ruta=ruta):
                self.assertEqual(self.client.get(ruta, HTTP_HOST='localhost').status_code, 404)
