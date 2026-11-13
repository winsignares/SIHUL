"""Préstamos: alcance del supervisor, datos personales y aprobación.

- Un supervisor de espacios solo ve y gestiona los préstamos de los espacios que tiene asignados.
- Sin sesión (o sin ser quien administra) no se ven nombre, correo, teléfono ni identificación de los solicitantes.
- Quien solicita crea el préstamo «Pendiente»: solo quien gestiona préstamos lo aprueba.
- Una solicitud pública solo la consulta, edita o cancela quien la hizo (correo + identificación).
"""
import datetime
import json

from django.conf import settings
from django.test import Client, TestCase

from identidad.componentes.models import Componente, ComponenteRol
from instalaciones.espacios.models import EspacioFisico, EspacioPermitido, TipoEspacio
from academico.sedes.models import Seccional, Sede
from academico.periodos.models import PeriodoAcademico
from identidad.usuarios.models import Rol, Usuario

from ..models import PrestamoEspacio, PrestamoEspacioPublico, TipoActividad

H = {'HTTP_HOST': 'localhost'}


def _cliente(usuario=None):
    c = Client()
    if usuario is not None:
        sesion = c.session
        sesion['user_id'] = usuario.id
        sesion.save()
        c.cookies[settings.SESSION_COOKIE_NAME] = sesion.session_key
    return c


def _json(r):
    return json.loads(r.content)


class PrestamosBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        bq = Seccional.objects.create(ciudad='Barranquilla')
        cls.bq = bq
        cali = Seccional.objects.create(ciudad='Cali')
        sede_bq = Sede.objects.create(nombre='Sede BQ', seccional=bq)
        sede_cali = Sede.objects.create(nombre='Sede Cali', seccional=cali)
        PeriodoAcademico.objects.create(
            nombre='2026-2', fecha_inicio=datetime.date(2026, 7, 1), fecha_fin=datetime.date(2026, 12, 31))
        tipo = TipoEspacio.objects.create(nombre='Sala')
        cls.actividad = TipoActividad.objects.create(nombre='Reunión')
        cls.esp1 = EspacioFisico.objects.create(nombre='Sala 1', sede=sede_bq, tipo=tipo, capacidad=20)
        cls.esp2 = EspacioFisico.objects.create(nombre='Sala 2', sede=sede_bq, tipo=tipo, capacidad=20)
        cls.esp_cali = EspacioFisico.objects.create(nombre='Sala Cali', sede=sede_cali, tipo=tipo, capacidad=20)

        def rol(nombre, **extra):
            return Rol.objects.get_or_create(nombre=nombre, defaults=extra)[0]

        def usuario(nombre, rol_obj, sede, **extra):
            return Usuario.objects.create_user(correo=f'{nombre}@prueba.test', nombre=nombre, rol=rol_obj, sede=sede, **extra)

        cls.general = usuario('general', rol('admin'), None, es_superusuario=True)
        cls.docente = usuario('docente', rol('docente'), sede_bq)
        cls.otro_docente = usuario('otro_docente', rol('docente'), sede_bq)
        cls.docente_cali = usuario('docente_cali', rol('docente'), sede_cali)
        cls.supervisor = usuario('supervisor', rol('supervisor_general', supervisa_espacios=True), sede_bq)
        EspacioPermitido.objects.create(espacio=cls.esp1, usuario=cls.supervisor, individual=True)

        # Rol que gestiona préstamos (EDITAR en «Préstamos de Espacios»)
        cls.rol_gestor = rol('gestor_prestamos')
        componente = Componente.objects.create(nombre='Préstamos de Espacios')
        ComponenteRol.objects.create(rol=cls.rol_gestor, componente=componente, permiso='EDITAR')
        cls.gestor = usuario('gestor', cls.rol_gestor, sede_bq)

        base = dict(tipo_actividad=cls.actividad, fecha=datetime.date(2026, 11, 10),
                    hora_inicio=datetime.time(10), hora_fin=datetime.time(11), estado='Aprobado')
        cls.p1 = PrestamoEspacio.objects.create(espacio=cls.esp1, usuario=cls.docente, motivo='P1', **base)
        cls.p2 = PrestamoEspacio.objects.create(espacio=cls.esp2, usuario=cls.otro_docente, motivo='P2', **base)
        cls.p_cali = PrestamoEspacio.objects.create(espacio=cls.esp_cali, usuario=cls.docente_cali, motivo='PC', **base)
        pub = dict(tipo_actividad=cls.actividad, fecha=datetime.date(2026, 11, 11), hora_inicio=datetime.time(10),
                   hora_fin=datetime.time(11), estado='Aprobado', telefono_solicitante='3001112222', token_publico='tok')
        cls.pub1 = PrestamoEspacioPublico.objects.create(
            espacio=cls.esp1, nombre_solicitante='Ana Pública', correo_solicitante='ana@externo.co',
            identificacion_solicitante='111', motivo='U1', **pub)
        cls.pub2 = PrestamoEspacioPublico.objects.create(
            espacio=cls.esp2, nombre_solicitante='Beto Público', correo_solicitante='beto@externo.co',
            identificacion_solicitante='222', motivo='U2', **pub)
        cls.pub_cali = PrestamoEspacioPublico.objects.create(
            espacio=cls.esp_cali, nombre_solicitante='Cali Pública', correo_solicitante='cali@externo.co',
            identificacion_solicitante='333', motivo='UC', **pub)


def _ids(r):
    datos = _json(r)
    return {x['id'] for x in (datos if isinstance(datos, list) else datos['results'])}


class SupervisorSoloVeSusEspaciosTests(PrestamosBase):
    def test_lista_privada_solo_de_sus_espacios_asignados(self):
        r = _cliente(self.supervisor).get('/api/prestamos/espacios/', **H)
        self.assertEqual(_ids(r), {self.p1.id})

    def test_lista_publica_solo_de_sus_espacios_asignados(self):
        r = _cliente(self.supervisor).get('/api/prestamos/publicos/', **H)
        self.assertEqual(_ids(r), {self.pub1.id})

    def test_no_abre_ni_edita_el_prestamo_de_otro_espacio_de_su_seccional(self):
        c = _cliente(self.supervisor)
        self.assertEqual(c.get(f'/api/prestamos/espacios/{self.p2.id}/', **H).status_code, 404)
        self.assertEqual(c.get(f'/api/prestamos/publicos/{self.pub2.id}/', **H).status_code, 404)

    def test_quien_no_es_supervisor_sigue_viendo_los_de_su_seccional(self):
        r = _cliente(self.gestor).get('/api/prestamos/espacios/', **H)
        self.assertEqual(_ids(r), {self.p1.id, self.p2.id})  # no ve el de Cali


class DatosPersonalesTests(PrestamosBase):
    def test_sin_sesion_el_calendario_es_de_la_seccional_elegida_y_sin_datos_personales(self):
        self.assertEqual(_json(_cliente().get('/api/prestamos/publicos/', **H)), [])  # sin elegir seccional
        publico = _cliente()
        publico.defaults['HTTP_X_SECCIONAL_PUBLICA'] = str(self.bq.id)
        publicos = _json(publico.get('/api/prestamos/publicos/', **H))
        self.assertEqual({p['id'] for p in publicos}, {self.pub1.id, self.pub2.id})
        self.assertEqual(_ids(publico.get('/api/prestamos/espacios/', **H)), {self.p1.id, self.p2.id})
        for p in publicos:
            for campo in ('nombre_solicitante', 'correo_solicitante', 'telefono_solicitante',
                          'identificacion_solicitante', 'token_publico'):
                self.assertEqual(p[campo], '', campo)
            self.assertTrue(p['fecha'] and p['hora_inicio'] and p['espacio'])  # lo que pinta el calendario
        privados = _json(publico.get('/api/prestamos/espacios/', **H))
        self.assertTrue(privados and all(p['usuario_correo'] == '' for p in privados))

    def test_el_solicitante_publico_ve_solo_lo_suyo_con_correo_e_identificacion(self):
        r = _cliente().get('/api/prestamos/publicos/', {'correo': 'ANA@externo.co', 'identificacion': '111'}, **H)
        datos = _json(r)
        self.assertEqual([p['id'] for p in datos], [self.pub1.id])
        self.assertEqual(datos[0]['correo_solicitante'], 'ana@externo.co')
        self.assertEqual(datos[0]['token_publico'], '')

    def test_con_datos_que_no_coinciden_no_recibe_nada(self):
        r = _cliente().get('/api/prestamos/publicos/', {'correo': 'ana@externo.co', 'identificacion': '999'}, **H)
        self.assertEqual(_json(r), [])

    def test_un_docente_no_ve_el_correo_de_prestamos_ajenos_pero_si_los_suyos(self):
        datos = {p['id']: p for p in _json(_cliente(self.docente).get('/api/prestamos/espacios/', **H))}
        self.assertEqual(datos[self.p1.id]['usuario_correo'], 'docente@prueba.test')
        self.assertEqual(datos[self.p2.id]['usuario_correo'], '')

    def test_quien_gestiona_prestamos_ve_los_datos_de_contacto(self):
        datos = {p['id']: p for p in _json(_cliente(self.gestor).get('/api/prestamos/publicos/', **H))}
        self.assertEqual(datos[self.pub1.id]['correo_solicitante'], 'ana@externo.co')
        self.assertEqual(datos[self.pub1.id]['token_publico'], '')


class SolicitudPublicaSoloLaGestionaSuDuenoTests(PrestamosBase):
    def _url(self, prestamo, **q):
        sufijo = ('?' + '&'.join(f'{k}={v}' for k, v in q.items())) if q else ''
        return f'/api/prestamos/publicos/{prestamo.id}/{sufijo}'

    def test_sin_credenciales_no_lee_ni_borra_la_solicitud_de_otro(self):
        c = _cliente()
        self.assertEqual(c.get(self._url(self.pub1), **H).status_code, 403)
        self.assertEqual(c.delete(self._url(self.pub1), **H).status_code, 403)
        self.assertEqual(c.put(self._url(self.pub1), json.dumps({'motivo': 'x'}), content_type='application/json', **H).status_code, 403)
        self.assertTrue(PrestamoEspacioPublico.objects.filter(id=self.pub1.id).exists())

    def test_credenciales_de_otra_persona_tampoco(self):
        r = _cliente().delete(self._url(self.pub1, correo='beto@externo.co', identificacion='222'), **H)
        self.assertEqual(r.status_code, 403)

    def test_con_sus_credenciales_la_consulta_y_la_cancela(self):
        c = _cliente()
        q = dict(correo='ana@externo.co', identificacion='111')
        self.assertEqual(c.get(self._url(self.pub1, **q), **H).status_code, 200)
        self.assertEqual(c.delete(self._url(self.pub1, **q), **H).status_code, 204)
        self.assertFalse(PrestamoEspacioPublico.objects.filter(id=self.pub1.id).exists())

    def test_el_personal_autenticado_sigue_gestionando_las_de_su_seccional(self):
        c = _cliente(self.gestor)
        self.assertEqual(c.get(self._url(self.pub1), **H).status_code, 200)
        self.assertEqual(c.get(self._url(self.pub_cali), **H).status_code, 404)  # otra seccional


class AprobacionTests(PrestamosBase):
    def _payload(self, espacio, **extra):
        return {'espacio': espacio.id, 'tipo_actividad': self.actividad.id, 'fecha': '2026-12-01',
                'hora_inicio': '08:00', 'hora_fin': '09:00', 'motivo': 'x', 'asistentes': 1, **extra}

    def _post(self, c, url, datos):
        return c.post(url, json.dumps(datos), content_type='application/json', **H)

    def test_el_publico_no_se_aprueba_a_si_mismo(self):
        datos = self._payload(self.esp1, estado='Aprobado', administrador=self.gestor.id,
                              nombre_solicitante='Z', correo_solicitante='z@x.co', telefono_solicitante='1',
                              identificacion_solicitante='9')
        r = self._post(_cliente(), '/api/prestamos/publicos/', datos)
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = PrestamoEspacioPublico.objects.get(id=_json(r)['id'])
        self.assertEqual(nuevo.estado, 'Pendiente')
        self.assertIsNone(nuevo.administrador)

    def test_un_docente_crea_pendiente_aunque_pida_aprobado(self):
        r = self._post(_cliente(self.docente), '/api/prestamos/espacios/',
                       self._payload(self.esp1, usuario=self.docente.id, estado='Aprobado'))
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(_json(r)['estado'], 'Pendiente')

    def test_un_docente_no_aprueba_su_propio_prestamo_pendiente(self):
        pendiente = PrestamoEspacio.objects.create(
            espacio=self.esp1, usuario=self.docente, tipo_actividad=self.actividad, fecha=datetime.date(2026, 12, 2),
            hora_inicio=datetime.time(14), hora_fin=datetime.time(15), estado='Pendiente')
        r = _cliente(self.docente).patch(f'/api/prestamos/espacios/{pendiente.id}/', json.dumps({'estado': 'Aprobado'}),
                                         content_type='application/json', **H)
        self.assertEqual(r.status_code, 200, r.content)
        pendiente.refresh_from_db()
        self.assertEqual(pendiente.estado, 'Pendiente')

    def test_quien_gestiona_prestamos_si_aprueba(self):
        pendiente = PrestamoEspacio.objects.create(
            espacio=self.esp1, usuario=self.docente, tipo_actividad=self.actividad, fecha=datetime.date(2026, 12, 3),
            hora_inicio=datetime.time(14), hora_fin=datetime.time(15), estado='Pendiente')
        r = _cliente(self.gestor).patch(f'/api/prestamos/espacios/{pendiente.id}/', json.dumps({'estado': 'Aprobado'}),
                                        content_type='application/json', **H)
        self.assertEqual(r.status_code, 200, r.content)
        pendiente.refresh_from_db()
        self.assertEqual(pendiente.estado, 'Aprobado')

