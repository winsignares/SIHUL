"""Inicio de sesión, estado de sesión, cambio de contraseña y salida.

Las rutas /api/usuarios/<accion>/ y /usuarios/<accion>/ (a la que nginx reescribe la primera) son la misma vista,
así que las pruebas corren en las dos.

- Tras 5 intentos fallidos (clave incorrecta o correo inexistente) desde la misma IP, ese correo queda bloqueado
  2 minutos desde esa IP, incluso con la clave correcta. Un inicio correcto reinicia el conteo.
- El correo se compara sin mayúsculas ni espacios alrededor.
- Un hash heredado (werkzeug) se migra al formato de Django al iniciar sesión.
- Cualquiera puede cerrar su sesión y cambiar su contraseña con la actual; sin sesión, el estado responde 401.
- El cambio de contraseña comparte el conteo de intentos del inicio de sesión: los fallos de los dos suman, y el
  bloqueo aplica a los dos.
"""
import json
import time
from unittest import mock

from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import TestCase
from werkzeug.security import generate_password_hash

from instalaciones.espacios.models import EspacioFisico, EspacioPermitido, TipoEspacio
from academico.sedes.models import Seccional, Sede
from identidad.usuarios.models import Rol, Usuario

CLAVE = 'Clave-test-1'
BLOQUEO = {'error': 'Demasiados intentos. Intenta de nuevo en unos minutos.'}
INVALIDAS = {'error': 'Credenciales inválidas'}


def _con_clave(usuario, hash_clave=None):
    hash_clave = hash_clave or make_password(CLAVE)
    Usuario.objects.filter(pk=usuario.pk).update(contrasena_hash=hash_clave, password=hash_clave)


class InicioDeSesionTests(TestCase):
    PREFIJO = '/api/usuarios/'

    @classmethod
    def setUpTestData(cls):
        seccional = Seccional.objects.create(ciudad='Barranquilla')
        cls.sede = Sede.objects.create(nombre='Sede Centro', seccional=seccional, direccion='Calle 1')
        otra_sede = Sede.objects.create(nombre='Sede Norte', seccional=seccional)
        cls.rol = Rol.objects.create(nombre='supervisor_prueba', descripcion='Supervisa', supervisa_espacios=True)
        cls.usuario = Usuario.objects.create_user(correo='docente@prueba.test', nombre='Docente', rol=cls.rol, sede=cls.sede)
        _con_clave(cls.usuario)
        tipo = TipoEspacio.objects.create(nombre='Aula')
        cls.espacio = EspacioFisico.objects.create(sede=cls.sede, tipo=tipo, capacidad=30, ubicacion='Piso 2')
        lejano = EspacioFisico.objects.create(sede=otra_sede, tipo=tipo, capacidad=10)
        EspacioPermitido.objects.create(usuario=cls.usuario, espacio=cls.espacio)
        EspacioPermitido.objects.create(usuario=cls.usuario, espacio=lejano)

        rol_admin = Rol.objects.get_or_create(nombre='admin_global')[0]
        cls.admin = Usuario.objects.create_user(correo='admin@prueba.test', nombre='Admin', rol=rol_admin, sede=cls.sede)
        _con_clave(cls.admin)

    def setUp(self):
        cache.clear()
        self.LOGIN, self.ESTADO, self.CAMBIO, self.SALIDA = (
            f'{self.PREFIJO}{accion}/' for accion in ('login', 'session-auth-state', 'change-password', 'logout'))

    def entrar(self, correo=None, contrasena=CLAVE, ip=None, cliente=None):
        extra = {'HTTP_X_FORWARDED_FOR': ip} if ip else {}
        return (cliente or self.client).post(
            self.LOGIN, json.dumps({'correo': correo or self.usuario.correo, 'contrasena': contrasena}),
            content_type='application/json', **extra)

    # ------------------------------------------------ datos y credenciales
    def test_sin_correo_o_sin_clave_responde_400(self):
        for datos in ({}, {'correo': self.usuario.correo}, {'contrasena': CLAVE}):
            r = self.client.post(self.LOGIN, json.dumps(datos), content_type='application/json')
            self.assertEqual((r.status_code, r.json()), (400, {'error': 'correo y contrasena son requeridos'}))

    def test_correo_inexistente_o_clave_incorrecta_responden_401(self):
        for r in (self.entrar(correo='nadie@prueba.test'), self.entrar(contrasena='otra')):
            self.assertEqual((r.status_code, r.json()), (401, INVALIDAS))
        self.assertIsNone(self.client.session.get('user_id'))

    def test_el_correo_se_compara_sin_mayusculas_ni_espacios(self):
        r = self.entrar(correo='  DOCENTE@Prueba.TEST ')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.json()['id'], self.usuario.id)

    # ------------------------------------------------ bloqueo por intentos
    def test_al_quinto_fallo_bloquea_aunque_luego_la_clave_sea_correcta(self):
        codigos = [self.entrar(contrasena='mala').status_code for _ in range(6)]
        self.assertEqual(codigos, [401, 401, 401, 401, 429, 429])
        r = self.entrar()
        self.assertEqual((r.status_code, r.json()), (429, BLOQUEO))
        self.assertIsNone(self.client.session.get('user_id'))

    def test_los_correos_inexistentes_tambien_cuentan(self):
        codigos = [self.entrar(correo='Nadie@prueba.test ', contrasena='x').status_code for _ in range(5)]
        self.assertEqual(codigos, [401, 401, 401, 401, 429])
        self.assertEqual(self.entrar(correo='nadie@prueba.test').json(), BLOQUEO)

    def test_un_inicio_correcto_reinicia_el_conteo(self):
        for _ in range(4):
            self.entrar(contrasena='mala')
        self.assertEqual(self.entrar().status_code, 200)
        self.assertEqual([self.entrar(contrasena='mala').status_code for _ in range(5)], [401, 401, 401, 401, 429])

    def test_el_bloqueo_es_por_correo(self):
        for _ in range(5):
            self.entrar(contrasena='mala')
        self.assertEqual(self.entrar(correo=self.admin.correo).status_code, 200)

    def test_el_bloqueo_es_por_ip_y_usa_la_primera_de_x_forwarded_for(self):
        for _ in range(5):
            self.entrar(contrasena='mala', ip='10.0.0.1, 10.9.9.9')
        self.assertEqual(self.entrar(ip='10.0.0.1').status_code, 429)
        self.assertEqual(self.entrar(ip='10.9.9.9').status_code, 200)
        self.assertEqual(self.entrar().status_code, 200)  # sin X-Forwarded-For usa REMOTE_ADDR

    def test_el_bloqueo_dura_dos_minutos(self):
        inicio = time.time()
        for _ in range(5):
            self.entrar(contrasena='mala')
        with mock.patch('time.time', return_value=inicio + 115):
            self.assertEqual(self.entrar().status_code, 429)
        with mock.patch('time.time', return_value=inicio + 125):
            self.assertEqual(self.entrar().status_code, 200)

    def test_los_fallos_vencen_a_los_dos_minutos(self):
        inicio = time.time()
        for _ in range(4):
            self.entrar(contrasena='mala')
        with mock.patch('time.time', return_value=inicio + 125):
            self.assertEqual([self.entrar(contrasena='mala').status_code for _ in range(4)], [401] * 4)

    def test_cuenta_desactivada_con_clave_correcta_reinicia_el_conteo_y_responde_403(self):
        Usuario.objects.filter(pk=self.usuario.pk).update(activo=False)
        for _ in range(4):
            self.entrar(contrasena='mala')
        self.assertEqual(self.entrar().status_code, 403)
        self.assertEqual([self.entrar(contrasena='mala').status_code for _ in range(4)], [401] * 4)

    # ------------------------------------------------ inicio correcto
    def test_un_hash_heredado_se_migra_al_formato_de_django(self):
        _con_clave(self.usuario, generate_password_hash(CLAVE, method='pbkdf2:sha256'))
        self.assertEqual(self.entrar().status_code, 200)
        usuario = Usuario.objects.get(pk=self.usuario.pk)
        self.assertTrue(usuario.contrasena_hash.startswith('pbkdf2_'))
        self.assertEqual(usuario.password, usuario.contrasena_hash)
        self.assertEqual(self.entrar().status_code, 200)

    def test_un_hash_de_django_no_se_reescribe(self):
        antes = Usuario.objects.get(pk=self.usuario.pk).contrasena_hash
        self.entrar()
        self.assertEqual(Usuario.objects.get(pk=self.usuario.pk).contrasena_hash, antes)

    def test_la_sesion_guarda_el_usuario_el_rol_y_el_token(self):
        datos = self.entrar().json()
        sesion = self.client.session
        self.assertEqual(
            {k: sesion.get(k) for k in ('user_id', 'correo', 'is_authenticated', 'token', 'rol', 'id_rol')},
            {'user_id': self.usuario.id, 'correo': self.usuario.correo, 'is_authenticated': True,
             'token': datos['token'], 'rol': self.rol.nombre, 'id_rol': self.rol.id})

    def test_la_respuesta_trae_el_perfil_los_permisos_y_los_espacios_de_su_sede(self):
        datos = self.entrar().json()
        self.assertEqual(len(datos.pop('token')), 43)
        self.assertEqual(datos.pop('componentes'), [])
        self.assertEqual(datos, {
            'message': 'Login exitoso',
            'id': self.usuario.id,
            'nombre': 'Docente',
            'correo': 'docente@prueba.test',
            'rol': {'id': self.rol.id, 'nombre': 'supervisor_prueba', 'descripcion': 'Supervisa',
                    'supervisa_espacios': True},
            'facultad': None,
            'sede': {'id': self.sede.id, 'nombre': 'Sede Centro', 'seccional_id': self.sede.seccional_id,
                     'seccional_ciudad': 'Barranquilla', 'direccion': 'Calle 1'},
            'seccional': {'id': self.sede.seccional_id, 'ciudad': 'Barranquilla'},
            'espacios_permitidos': [{'id': self.espacio.id, 'tipo': 'Aula', 'capacidad': 30, 'ubicacion': 'Piso 2',
                                     'disponible': True, 'sede_id': self.sede.id, 'sede_nombre': 'Sede Centro'}],
            'tipos_espacio_permitidos': [],
            'puede_crear_espacios': False,
        })

    # ------------------------------------------------ estado de sesión
    def test_estado_de_sesion_solo_envia_los_permisos_si_cambiaron(self):
        self.entrar()
        r = self.client.get(self.ESTADO)
        self.assertEqual(r.status_code, 200)
        datos = r.json()
        firma = datos['signature']
        self.assertEqual(len(firma), 16)
        self.assertEqual(datos, {'changed': True, 'signature': firma, 'componentes': [], 'rol': {
            'id': self.rol.id, 'nombre': 'supervisor_prueba', 'descripcion': 'Supervisa', 'supervisa_espacios': True}})
        self.assertEqual(self.client.get(self.ESTADO, {'since': firma}).json(), {'changed': False, 'signature': firma})
        self.assertTrue(self.client.get(self.ESTADO, {'since': 'otra'}).json()['changed'])

    def test_estado_de_sesion_sin_sesion_responde_401(self):
        r = self.client.get(self.ESTADO)
        self.assertEqual((r.status_code, r.json()), (401, {'error': 'No autenticado'}))

    # ------------------------------------------------ cambio de contraseña y salida
    def test_cambiar_contrasena(self):
        def cambiar(**datos):
            return self.client.put(self.CAMBIO, json.dumps(datos), content_type='application/json')

        r = cambiar(correo=self.usuario.correo, old_contrasena=CLAVE)
        self.assertEqual((r.status_code, r.json()),
                         (400, {'error': 'correo, old_contrasena y new_contrasena son requeridos'}))
        for datos in ({'correo': 'nadie@prueba.test', 'old_contrasena': CLAVE, 'new_contrasena': 'Nueva-1'},
                      {'correo': self.usuario.correo, 'old_contrasena': 'mala', 'new_contrasena': 'Nueva-1'}):
            r = cambiar(**datos)
            self.assertEqual((r.status_code, r.json()), (401, INVALIDAS))
        r = cambiar(correo=self.usuario.correo, old_contrasena=CLAVE, new_contrasena='Nueva-1')
        self.assertEqual((r.status_code, r.json()), (200, {'message': 'Contraseña cambiada exitosamente'}))
        usuario = Usuario.objects.get(pk=self.usuario.pk)
        self.assertEqual(usuario.password, usuario.contrasena_hash)
        cliente = self.client_class()
        self.assertEqual(self.entrar(contrasena=CLAVE, cliente=cliente).status_code, 401)
        self.assertEqual(self.entrar(contrasena='Nueva-1', cliente=cliente).status_code, 200)

    def cambiar(self, actual, nueva='Nueva-1', correo=None, ip=None):
        extra = {'HTTP_X_FORWARDED_FOR': ip} if ip else {}
        return self.client_class().put(self.CAMBIO, json.dumps({
            'correo': correo or self.usuario.correo, 'old_contrasena': actual, 'new_contrasena': nueva}),
            content_type='application/json', **extra)

    def clave_guardada(self):
        return Usuario.objects.get(pk=self.usuario.pk).contrasena_hash

    def test_cambiar_contrasena_bloquea_al_quinto_fallo(self):
        antes = self.clave_guardada()
        self.assertEqual([self.cambiar('mala').status_code for _ in range(5)], [401, 401, 401, 401, 429])
        r = self.cambiar(CLAVE)
        self.assertEqual((r.status_code, r.json()), (429, BLOQUEO))
        self.assertEqual(self.clave_guardada(), antes)
        self.assertEqual(self.cambiar(CLAVE, ip='10.0.0.7').status_code, 200)  # otra IP no está bloqueada

    def test_cambiar_contrasena_con_correo_inexistente_tambien_cuenta(self):
        codigos = [self.cambiar('x', correo='Nadie@prueba.test').status_code for _ in range(5)]
        self.assertEqual(codigos, [401, 401, 401, 401, 429])

    def test_los_fallos_del_inicio_de_sesion_bloquean_el_cambio_de_contrasena(self):
        for _ in range(5):
            self.entrar(contrasena='mala')
        self.assertEqual(self.cambiar(CLAVE).status_code, 429)

    def test_los_fallos_del_cambio_de_contrasena_bloquean_el_inicio_de_sesion(self):
        for _ in range(3):
            self.cambiar('mala')
        self.assertEqual([self.entrar(contrasena='mala').status_code for _ in range(2)], [401, 429])
        self.assertEqual(self.entrar().status_code, 429)

    def test_un_cambio_correcto_reinicia_el_conteo(self):
        for _ in range(4):
            self.cambiar('mala')
        self.assertEqual(self.cambiar(CLAVE).status_code, 200)
        self.assertEqual([self.entrar(contrasena='mala').status_code for _ in range(4)], [401] * 4)

    def test_cambiar_contrasena_sin_datos_no_cuenta(self):
        self.assertEqual({self.cambiar('').status_code for _ in range(6)}, {400})
        self.assertEqual(self.cambiar(CLAVE).status_code, 200)

    def test_quien_no_gestiona_usuarios_cambia_su_contrasena_con_y_sin_sesion(self):
        for cliente, actual, nueva in ((self.client_class(), CLAVE, 'Nueva-1'), (self.client, 'Nueva-1', 'Nueva-2')):
            if cliente is self.client:
                self.entrar(contrasena=actual)
            r = cliente.put(self.CAMBIO, json.dumps({'correo': self.usuario.correo, 'old_contrasena': actual,
                                                     'new_contrasena': nueva}), content_type='application/json')
            self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.entrar(contrasena='Nueva-2', cliente=self.client_class()).status_code, 200)

    def test_salir_borra_la_sesion(self):
        for quien in (self.usuario, self.admin):
            self.entrar(correo=quien.correo)
            self.assertEqual(self.client.session.get('user_id'), quien.id)
            r = self.client.post(self.SALIDA)
            self.assertEqual((r.status_code, r.json()), (200, {'message': 'Logout exitoso'}))
            self.assertIsNone(self.client.session.get('user_id'))
        self.assertEqual(self.client.get(self.SALIDA).status_code, 200)


class InicioDeSesionSinPrefijoApiTests(InicioDeSesionTests):
    """Las mismas pruebas en /usuarios/<accion>/, la ruta a la que nginx reescribe /api/usuarios/<accion>/."""
    PREFIJO = '/usuarios/'
