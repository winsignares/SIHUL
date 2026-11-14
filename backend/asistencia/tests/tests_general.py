import json
from datetime import time, timedelta
from io import StringIO

from django.core.management import call_command
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone

from identidad.usuarios.models import Rol, Usuario
from notificaciones.models import Notificacion

from ..models import AsignacionPractica, LugarPractica, RegistroAsistencia
from ..servicios.geografia import distancia_metros

LAT, LON = 10.968500, -74.781300
CERCA = (10.968600, -74.781300)   # unos 11 m
LEJOS = (10.978500, -74.781300)   # unos 1,1 km


class GeografiaTests(SimpleTestCase):
    def test_un_grado_de_latitud_son_unos_111_km(self):
        self.assertAlmostEqual(distancia_metros(10, -74, 11, -74) / 1000, 111.2, delta=0.5)

    def test_mismo_punto_es_cero(self):
        self.assertEqual(distancia_metros(LAT, LON, LAT, LON), 0)


class _Base(TestCase):
    @classmethod
    def setUpTestData(cls):
        rol, _ = Rol.objects.get_or_create(nombre='estudiante')
        cls.estudiante = Usuario.objects.create(nombre='Est', correo='est.asistencia@unilibre.edu.co', contrasena_hash='x', rol=rol)
        cls.responsable = Usuario.objects.create(nombre='Resp', correo='resp.asistencia@unilibre.edu.co', contrasena_hash='x', rol=rol)
        cls.otro = Usuario.objects.create(nombre='Otro', correo='otro.asistencia@unilibre.edu.co', contrasena_hash='x', rol=rol)
        cls.lugar = LugarPractica.objects.create(nombre='Hospital', latitud=LAT, longitud=LON, radio_metros=100, precision_maxima_metros=50)
        hoy = timezone.localdate()
        cls.asignacion = AsignacionPractica.objects.create(
            estudiante=cls.estudiante, lugar=cls.lugar, responsable=cls.responsable,
            fecha_inicio=hoy - timedelta(days=1), fecha_fin=hoy + timedelta(days=1),
            hora_inicio=time(0, 0), hora_fin=time(23, 59, 59),
        )

    def entrar_como(self, usuario):
        sesion = self.client.session
        sesion['user_id'] = usuario.id
        sesion.save()

    def registrar(self, tipo, punto=CERCA, precision=10, asignacion=None):
        cuerpo = {
            'asignacion_id': (asignacion or self.asignacion).id, 'tipo': tipo,
            'latitud': f'{punto[0]:.6f}', 'longitud': f'{punto[1]:.6f}', 'precision_metros': precision,
        }
        return self.client.post(reverse('api-asistencia-registrar'), json.dumps(cuerpo), content_type='application/json')

    def consentir(self):
        self.client.post(reverse('api-asistencia-consentimiento'), json.dumps({'otorgar': True}), content_type='application/json')


class ConsentimientoTests(_Base):
    def test_otorgar_y_revocar(self):
        self.entrar_como(self.estudiante)
        url = reverse('api-asistencia-consentimiento')
        self.assertFalse(self.client.get(url).json()['otorgado'])
        self.consentir()
        self.assertTrue(self.client.get(url).json()['otorgado'])
        self.client.post(url, json.dumps({'otorgar': False}), content_type='application/json')
        self.assertFalse(self.client.get(url).json()['otorgado'])

    def test_requiere_sesion(self):
        self.assertEqual(self.client.get(reverse('api-asistencia-consentimiento')).status_code, 403)


class RegistrarTests(_Base):
    def setUp(self):
        self.entrar_como(self.estudiante)

    def test_sin_consentimiento_no_guarda_nada(self):
        r = self.registrar('entrada')
        self.assertEqual((r.status_code, r.json()['codigo']), (403, 'sin_consentimiento'))
        self.assertEqual(RegistroAsistencia.objects.count(), 0)

    def test_entrada_dentro_del_radio(self):
        self.consentir()
        r = self.registrar('entrada')
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.json()['dentro_del_radio'])

    def test_entrada_lejos_se_rechaza(self):
        self.consentir()
        r = self.registrar('entrada', punto=LEJOS)
        self.assertEqual((r.status_code, r.json()['codigo']), (400, 'fuera_del_radio'))
        self.assertEqual(RegistroAsistencia.objects.count(), 0)

    def test_lectura_imprecisa_se_rechaza(self):
        self.consentir()
        r = self.registrar('entrada', precision=500)
        self.assertEqual(r.json()['codigo'], 'precision_insuficiente')

    def test_fuera_de_horario_no_guarda_ubicacion(self):
        self.consentir()
        self.asignacion.fecha_fin = timezone.localdate() - timedelta(days=1)
        self.asignacion.save()
        r = self.registrar('entrada')
        self.assertEqual((r.status_code, r.json()['codigo']), (400, 'fuera_de_horario'))
        self.assertEqual(RegistroAsistencia.objects.count(), 0)

    def test_posicion_y_salida_exigen_entrada(self):
        self.consentir()
        self.assertEqual(self.registrar('posicion').json()['codigo'], 'sin_entrada')
        self.assertEqual(self.registrar('salida').json()['codigo'], 'sin_entrada')

    def test_no_se_repite_la_entrada_abierta(self):
        self.consentir()
        self.registrar('entrada')
        self.assertEqual(self.registrar('entrada').json()['codigo'], 'entrada_abierta')

    def test_salir_del_radio_avisa_una_sola_vez_al_responsable(self):
        self.consentir()
        self.registrar('entrada')
        self.assertEqual(self.registrar('posicion').status_code, 201)
        self.assertFalse(Notificacion.objects.filter(tipo_notificacion='asistencia_fuera_del_radio').exists())
        self.assertFalse(self.registrar('posicion', punto=LEJOS).json()['dentro_del_radio'])
        self.registrar('posicion', punto=LEJOS)
        avisos = Notificacion.objects.filter(tipo_notificacion='asistencia_fuera_del_radio')
        self.assertEqual(avisos.count(), 1)
        self.assertEqual(avisos.first().id_usuario, self.responsable.id)

    def test_salida_cierra_el_dia(self):
        self.consentir()
        self.registrar('entrada')
        self.assertEqual(self.registrar('salida').status_code, 201)
        self.assertEqual(self.registrar('posicion').json()['codigo'], 'sin_entrada')

    def test_no_se_registra_en_la_practica_de_otro(self):
        self.entrar_como(self.otro)
        self.consentir()
        self.assertEqual(self.registrar('entrada').status_code, 404)


class ConsultasTests(_Base):
    def test_mis_practicas_solo_las_propias(self):
        self.entrar_como(self.estudiante)
        self.assertEqual([p['id'] for p in self.client.get(reverse('api-asistencia-mis-practicas')).json()], [self.asignacion.id])
        self.entrar_como(self.otro)
        self.assertEqual(self.client.get(reverse('api-asistencia-mis-practicas')).json(), [])

    def test_registros_los_ve_el_responsable_y_no_un_tercero(self):
        RegistroAsistencia.objects.create(
            asignacion=self.asignacion, tipo='entrada', latitud=LAT, longitud=LON,
            precision_metros=5, distancia_metros=0, dentro_del_radio=True,
        )
        url = reverse('api-asistencia-registros', args=[self.asignacion.id])
        self.entrar_como(self.responsable)
        self.assertEqual(len(self.client.get(url).json()), 1)
        self.entrar_como(self.otro)
        self.assertEqual(self.client.get(url).status_code, 404)


class PurgarTests(_Base):
    def test_borra_solo_lo_viejo(self):
        viejo = RegistroAsistencia.objects.create(
            asignacion=self.asignacion, tipo='entrada', latitud=LAT, longitud=LON,
            precision_metros=5, distancia_metros=0, dentro_del_radio=True,
        )
        RegistroAsistencia.objects.filter(id=viejo.id).update(registrado_en=timezone.now() - timedelta(days=200))
        RegistroAsistencia.objects.create(
            asignacion=self.asignacion, tipo='salida', latitud=LAT, longitud=LON,
            precision_metros=5, distancia_metros=0, dentro_del_radio=True,
        )
        call_command('purgar_asistencia', '--dias', '90', stdout=StringIO())
        self.assertEqual(RegistroAsistencia.objects.count(), 1)
