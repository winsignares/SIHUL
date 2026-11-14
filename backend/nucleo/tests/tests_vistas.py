import json

from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase

from nucleo.vistas import VistaJson


class _SoloGet(VistaJson):
    def get(self, request):
        return JsonResponse({'usuario': getattr(request.user, 'correo', None), 'metodo': request.method})


class _GetYPut(VistaJson):
    def get(self, request):
        return JsonResponse({})

    def put(self, request):
        return JsonResponse({})


def _todas_las_vistas():
    """Todas las vistas de endpoint del proyecto (se importan al cargar las rutas)."""
    import config.urls  # noqa: F401

    pendientes, vistas = list(VistaJson.__subclasses__()), []
    while pendientes:
        clase = pendientes.pop()
        pendientes.extend(clase.__subclasses__())
        if clase.__module__.startswith('nucleo.tests'):
            continue
        vistas.append(clase)
    return vistas


class VistaJsonTests(SimpleTestCase):
    def setUp(self):
        self.fabrica = RequestFactory()

    def test_metodo_no_permitido_responde_405_en_json(self):
        r = _SoloGet.as_view()(self.fabrica.post('/x/'))
        self.assertEqual(r.status_code, 405)
        self.assertEqual(json.loads(r.content), {'error': 'Solo se permite GET'})

    def test_varios_metodos_se_listan_en_orden(self):
        r = _GetYPut.as_view()(self.fabrica.delete('/x/'))
        self.assertEqual(json.loads(r.content), {'error': 'Solo se permite GET o PUT'})

    def test_la_cabecera_accept_no_rechaza_la_peticion(self):
        r = _SoloGet.as_view()(self.fabrica.get('/x/', HTTP_ACCEPT='application/pdf'))
        self.assertEqual(r.status_code, 200)

    def test_request_user_es_el_de_la_peticion_django(self):
        peticion = self.fabrica.get('/x/')
        peticion.user = type('U', (), {'is_authenticated': True, 'correo': 'a@b.co'})()
        self.assertEqual(json.loads(_SoloGet.as_view()(peticion).content)['usuario'], 'a@b.co')

    def test_sin_usuario_no_exige_autenticacion(self):
        peticion = self.fabrica.get('/x/')
        peticion.user = AnonymousUser()
        self.assertEqual(_SoloGet.as_view()(peticion).status_code, 200)

    def test_todas_las_vistas_convertidas_rechazan_con_405_los_metodos_que_no_tienen(self):
        vistas = _todas_las_vistas()
        self.assertGreaterEqual(len(vistas), 30)
        for clase in vistas:
            with self.subTest(vista=clase.__name__):
                r = clase.as_view()(self.fabrica.generic('PURGE', '/x/'))
                self.assertEqual(r.status_code, 405)
                self.assertTrue(json.loads(r.content)['error'].startswith('Solo se permite'))
