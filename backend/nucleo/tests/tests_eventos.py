import json
from unittest import mock

from django.test import SimpleTestCase, TestCase

from academico.sedes.models import Seccional, Sede
from identidad.usuarios.models import Rol, Usuario
from nucleo.eventos import audiencia, canal, vista
from nucleo.eventos.publicar import construir_evento, seccional_de
from notificaciones.models import Notificacion


class CanalFalso:
    """Reemplaza a Redis: guarda lo publicado y entrega una lista fija de mensajes a quien se suscribe."""

    def __init__(self, entrantes=()):
        self.publicados = []
        self.entrantes = list(entrantes)
        self.cerrada = False

    def publicar_mensaje(self, texto):
        self.publicados.append(json.loads(texto))

    def suscribir(self):
        falso = self

        class _Suscripcion:
            def siguiente(self, espera):
                return falso.entrantes.pop(0) if falso.entrantes else None

            def cerrar(self):
                falso.cerrada = True

        return _Suscripcion()


def _con_canal(falso):
    return mock.patch.multiple(
        canal, disponible=lambda: True, publicar_mensaje=falso.publicar_mensaje, suscribir=falso.suscribir,
    )


class PublicacionTests(TestCase):
    def test_crear_una_sede_publica_un_evento_con_su_seccional(self):
        falso = CanalFalso()
        seccional = Seccional.objects.get_or_create(ciudad='Cali')[0]
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            sede = Sede.objects.create(nombre='Sede Nueva', seccional=seccional)
        eventos = [e for e in falso.publicados if e['recurso'] == 'sedes']
        self.assertEqual(eventos, [{'recurso': 'sedes', 'accion': 'creado', 'id': sede.id, 'seccional': seccional.id, 'usuario': None}])

    def test_editar_y_borrar_publican_su_accion(self):
        falso = CanalFalso()
        sede = Sede.objects.create(nombre='Temporal')
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            sede.nombre = 'Otro'
            sede.save()
            sede.delete()
        acciones = [e['accion'] for e in falso.publicados if e['recurso'] == 'sedes']
        self.assertEqual(acciones, ['actualizado', 'eliminado'])

    def test_no_publica_si_la_transaccion_no_termina(self):
        falso = CanalFalso()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=False):
            Sede.objects.create(nombre='Sin commit')
        self.assertEqual(falso.publicados, [])

    def test_sin_redis_no_hace_nada(self):
        with mock.patch.object(canal, 'disponible', return_value=False), \
                mock.patch.object(canal, 'publicar_mensaje') as enviar, self.captureOnCommitCallbacks(execute=True):
            Sede.objects.create(nombre='Sin redis')
        enviar.assert_not_called()

    def test_un_fallo_de_redis_no_rompe_el_guardado(self):
        with mock.patch.object(canal, 'disponible', return_value=True), \
                mock.patch.object(canal, 'publicar_mensaje', side_effect=ConnectionError), \
                self.captureOnCommitCallbacks(execute=True):
            sede = Sede.objects.create(nombre='Redis caído')
        self.assertTrue(Sede.objects.filter(id=sede.id).exists())

    def test_la_notificacion_es_personal_de_su_destinatario(self):
        falso = CanalFalso()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            n = Notificacion.objects.create(id_usuario=77, tipo_notificacion='alerta', mensaje='x')
        evento = [e for e in falso.publicados if e['recurso'] == 'notificaciones' and e['id'] == n.id][0]
        self.assertEqual((evento['usuario'], evento['seccional']), (77, None))

    def test_seccional_de_sigue_la_ruta_por_la_sede(self):
        seccional = Seccional.objects.get_or_create(ciudad='Cali')[0]
        sede = Sede.objects.create(nombre='Con seccional', seccional=seccional)
        objeto = type('Registro', (), {'seccional_id': None, 'sede': sede})()
        self.assertEqual(seccional_de(objeto), seccional.id)
        self.assertIsNone(seccional_de(object()))
        self.assertIsNone(construir_evento('roles', 'creado', type('R', (), {'pk': 1})())['seccional'])


class AudienciaTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.cali = Seccional.objects.get_or_create(ciudad='Cali')[0]
        cls.bq = Seccional.objects.get_or_create(ciudad='Barranquilla')[0]
        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        rol_admin = Rol.objects.get_or_create(nombre='admin_global')[0]
        cls.est_cali = Usuario.objects.create(nombre='E', correo='e.ev@unilibre.edu.co', contrasena_hash='x', rol=rol, seccional=cls.cali)
        cls.admin = Usuario.objects.create(nombre='A', correo='a.ev@unilibre.edu.co', contrasena_hash='x', rol=rol_admin)

    def test_evento_de_otra_seccional_no_llega(self):
        evento = {'recurso': 'sedes', 'seccional': self.bq.id, 'usuario': None}
        self.assertFalse(audiencia.debe_recibir(evento, self.est_cali))

    def test_evento_de_su_seccional_llega(self):
        self.assertTrue(audiencia.debe_recibir({'seccional': self.cali.id, 'usuario': None}, self.est_cali))

    def test_el_administrador_general_recibe_todo(self):
        self.assertTrue(audiencia.debe_recibir({'seccional': self.bq.id, 'usuario': None}, self.admin))

    def test_evento_global_llega_a_todos(self):
        self.assertTrue(audiencia.debe_recibir({'seccional': None, 'usuario': None}, self.est_cali))

    def test_evento_personal_solo_a_su_dueno(self):
        evento = {'seccional': None, 'usuario': self.est_cali.id}
        self.assertTrue(audiencia.debe_recibir(evento, self.est_cali))
        self.assertFalse(audiencia.debe_recibir(evento, self.admin))


class VistaEventosTests(TestCase):
    def test_sin_sesion_es_401(self):
        self.assertEqual(self.client.get('/api/eventos/').status_code, 401)

    def test_sin_redis_es_503(self):
        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        u = Usuario.objects.create(nombre='V', correo='v.ev@unilibre.edu.co', contrasena_hash='x', rol=rol)
        sesion = self.client.session
        sesion['user_id'] = u.id
        sesion.save()
        with mock.patch.object(canal, 'disponible', return_value=False):
            self.assertEqual(self.client.get('/api/eventos/').status_code, 503)

    def test_el_flujo_entrega_solo_lo_que_le_corresponde_y_cancela_su_cola(self):
        import queue

        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        cali = Seccional.objects.get_or_create(ciudad='Cali')[0]
        u = Usuario.objects.create(nombre='F', correo='f.ev@unilibre.edu.co', contrasena_hash='x', rol=rol, seccional=cali)
        cola = queue.Queue()
        for texto in (
            json.dumps({'recurso': 'sedes', 'accion': 'creado', 'id': 1, 'seccional': cali.id, 'usuario': None}),
            json.dumps({'recurso': 'sedes', 'accion': 'creado', 'id': 2, 'seccional': 999, 'usuario': None}),
            'no es json',
        ):
            cola.put(texto)
        difusor = mock.Mock()
        difusor.suscribir.return_value = cola
        with mock.patch.object(vista, 'difusor', difusor):
            partes = []
            flujo = vista._flujo(audiencia.perfil_de(u), vida_maxima=0.05)
            for parte in flujo:
                partes.append(parte)
                if len(partes) >= 2:
                    break
            flujo.close()
        self.assertEqual(partes[0], f'retry: {vista.REINTENTO_MS}\n\n')
        self.assertEqual(json.loads(partes[1].removeprefix('data: ')), {'recurso': 'sedes', 'accion': 'creado', 'id': 1})
        difusor.cancelar.assert_called_once_with(cola)

    def test_la_conexion_abierta_no_retiene_la_conexion_a_la_base(self):
        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        u = Usuario.objects.create(nombre='G', correo='g.ev@unilibre.edu.co', contrasena_hash='x', rol=rol)
        sesion = self.client.session
        sesion['user_id'] = u.id
        sesion.save()
        with mock.patch.object(canal, 'disponible', return_value=True), \
                mock.patch.object(vista.connections, 'close_all') as cerrar:
            respuesta = self.client.get('/api/eventos/')
        self.assertEqual(respuesta.status_code, 200)
        cerrar.assert_called_once_with()

    def test_el_perfil_se_calcula_una_vez_y_no_consulta_la_base_al_decidir(self):
        rol = Rol.objects.get_or_create(nombre='estudiante')[0]
        cali = Seccional.objects.get_or_create(ciudad='Cali')[0]
        u = Usuario.objects.create(nombre='H', correo='h.ev@unilibre.edu.co', contrasena_hash='x', rol=rol, seccional=cali)
        perfil = audiencia.perfil_de(u)
        with self.assertNumQueries(0):
            self.assertTrue(audiencia.debe_recibir({'seccional': cali.id, 'usuario': None}, perfil))
            self.assertFalse(audiencia.debe_recibir({'seccional': 12345, 'usuario': None}, perfil))
            self.assertFalse(audiencia.debe_recibir({'usuarios': [], 'roles': ['contabilidad']}, perfil))


class DifusorTests(SimpleTestCase):
    def test_reparte_cada_evento_a_todas_las_colas_con_una_sola_suscripcion(self):
        import time
        from nucleo.eventos.difusion import Difusor

        entregas = ['uno', 'dos']
        suscripciones = []

        class _Suscripcion:
            def siguiente(self, espera):
                if entregas:
                    return entregas.pop(0)
                time.sleep(0.01)
                return None

            def cerrar(self):
                pass

        def _suscribir():
            suscripciones.append(1)
            return _Suscripcion()

        difusor = Difusor()
        with mock.patch.object(canal, 'suscribir', side_effect=_suscribir):
            a, b = difusor.suscribir(), difusor.suscribir()
            recibido_a = [a.get(timeout=2), a.get(timeout=2)]
            recibido_b = [b.get(timeout=2), b.get(timeout=2)]
            difusor.cancelar(a)
            difusor.cancelar(b)
        self.assertEqual(recibido_a, ['uno', 'dos'])
        self.assertEqual(recibido_b, ['uno', 'dos'])
        self.assertEqual(len(suscripciones), 1)

    def test_una_cola_llena_descarta_lo_mas_viejo(self):
        import queue
        from nucleo.eventos import difusion

        d = difusion.Difusor()
        cola = queue.Queue(maxsize=2)
        d._colas.add(cola)
        for texto in ('a', 'b', 'c'):
            d._repartir(texto)
        self.assertEqual([cola.get_nowait(), cola.get_nowait()], ['b', 'c'])


class EventoNoExponeDatosTests(SimpleTestCase):
    def test_el_evento_enviado_al_navegador_solo_trae_recurso_accion_e_id(self):
        evento = {'recurso': 'sedes', 'accion': 'creado', 'id': 1, 'seccional': 3, 'usuario': 9, 'extra': 'x'}
        enviado = {k: evento.get(k) for k in ('recurso', 'accion', 'id')}
        self.assertEqual(set(enviado), {'recurso', 'accion', 'id'})
