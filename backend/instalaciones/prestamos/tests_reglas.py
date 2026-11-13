"""Reglas de préstamos que aplican los serializers: caracterización del comportamiento actual.

- Quien no gestiona préstamos no asigna administrador ni aprueba; si edita uno aprobado, vuelve a «Pendiente».
- Al editar un préstamo aprobado sin cambiarle el estado, sigue aprobado solo si quien edita tiene EDITAR en
  «Disponibilidad de Espacios»; si no, vuelve a «Pendiente».
- Los recursos no se repiten; al editar con recursos se reemplazan y sin recursos se conservan.
"""
import json

from identidad.componentes.models import Componente, ComponenteRol
from instalaciones.recursos.models import Recurso
from identidad.usuarios.models import Rol, Usuario

from .models import PrestamoEspacio, PrestamoEspacioPublico, PrestamoRecurso
from .serializers import PrestamoEspacioSerializer
from .tests_alcance_privacidad import H, PrestamosBase, _cliente, _json


class ReglasDePrestamosTests(PrestamosBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        rol = Rol.objects.get_or_create(nombre='disponibilidad_espacios')[0]
        # Necesita EDITAR en «Préstamos de Espacios» para poder editar el préstamo (permiso del endpoint)
        for nombre in ('Disponibilidad de Espacios', 'Préstamos de Espacios'):
            componente = Componente.objects.get_or_create(nombre=nombre)[0]
            ComponenteRol.objects.create(rol=rol, componente=componente, permiso='EDITAR')
        cls.disponibilidad = Usuario.objects.create_user(
            correo='disponibilidad@prueba.test', nombre='disponibilidad', rol=rol, sede=cls.docente.sede)
        cls.videobeam = Recurso.objects.create(nombre='Videobeam')
        cls.parlante = Recurso.objects.create(nombre='Parlante')

    def payload(self, **extra):
        return {'espacio': self.esp1.id, 'tipo_actividad': self.actividad.id, 'fecha': '2026-12-01',
                'hora_inicio': '08:00', 'hora_fin': '09:00', 'motivo': 'x', 'asistentes': 1, **extra}

    def post(self, quien, url, datos):
        return _cliente(quien).post(url, json.dumps(datos), content_type='application/json', **H)

    def patch(self, quien, url, datos):
        return _cliente(quien).patch(url, json.dumps(datos), content_type='application/json', **H)

    def estado_tras_editar_motivo(self, quien, prestamo, ruta='espacios'):
        r = self.patch(quien, f'/api/prestamos/{ruta}/{prestamo.id}/', {'motivo': 'editado'})
        self.assertEqual(r.status_code, 200, r.content)
        prestamo.refresh_from_db()
        self.assertEqual(prestamo.motivo, 'editado')
        return prestamo.estado

    # ------------------------------------------------ editar uno aprobado
    def test_quien_gestiona_prestamos_al_editar_uno_aprobado_lo_devuelve_a_pendiente(self):
        self.assertEqual(self.estado_tras_editar_motivo(self.gestor, self.p1), 'Pendiente')

    def test_quien_tiene_disponibilidad_de_espacios_lo_deja_aprobado(self):
        self.assertEqual(self.estado_tras_editar_motivo(self.disponibilidad, self.p1), 'Aprobado')

    def test_el_docente_que_lo_solicito_lo_devuelve_a_pendiente(self):
        self.assertEqual(self.estado_tras_editar_motivo(self.docente, self.p1), 'Pendiente')

    def test_quien_gestiona_puede_rechazar_uno_aprobado(self):
        r = self.patch(self.gestor, f'/api/prestamos/espacios/{self.p1.id}/', {'estado': 'Rechazado'})
        self.assertEqual(r.status_code, 200, r.content)
        self.p1.refresh_from_db()
        self.assertEqual(self.p1.estado, 'Rechazado')

    def test_publico_aprobado_editado_por_quien_gestiona_vuelve_a_pendiente(self):
        self.assertEqual(self.estado_tras_editar_motivo(self.gestor, self.pub1, 'publicos'), 'Pendiente')

    def test_publico_aprobado_editado_con_disponibilidad_sigue_aprobado(self):
        self.assertEqual(self.estado_tras_editar_motivo(self.disponibilidad, self.pub1, 'publicos'), 'Aprobado')

    def test_sin_request_editar_uno_aprobado_lo_devuelve_a_pendiente(self):
        serializer = PrestamoEspacioSerializer(self.p1, data={'motivo': 'sin request'}, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.p1.refresh_from_db()
        self.assertEqual((self.p1.motivo, self.p1.estado), ('sin request', 'Pendiente'))

    # ------------------------------------------------ crear
    def test_el_docente_no_asigna_administrador(self):
        r = self.post(self.docente, '/api/prestamos/espacios/',
                      self.payload(usuario=self.docente.id, administrador=self.gestor.id))
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = PrestamoEspacio.objects.get(id=_json(r)['id'])
        self.assertEqual((nuevo.estado, nuevo.administrador_id), ('Pendiente', None))

    def test_quien_gestiona_crea_aprobado_y_con_administrador(self):
        r = self.post(self.gestor, '/api/prestamos/espacios/',
                      self.payload(usuario=self.docente.id, administrador=self.gestor.id, estado='Aprobado'))
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = PrestamoEspacio.objects.get(id=_json(r)['id'])
        self.assertEqual((nuevo.estado, nuevo.administrador_id), ('Aprobado', self.gestor.id))

    def test_hora_fin_antes_de_la_hora_inicio_no_se_crea(self):
        antes = PrestamoEspacio.objects.count()
        r = self.post(self.gestor, '/api/prestamos/espacios/', self.payload(hora_inicio='10:00', hora_fin='09:00'))
        self.assertEqual(r.status_code, 400)
        self.assertEqual(_json(r), {'non_field_errors': ['La hora fin debe ser mayor que la hora inicio.']})
        self.assertEqual(PrestamoEspacio.objects.count(), antes)

    # ------------------------------------------------ recursos
    def test_no_se_repite_un_recurso(self):
        recursos = [{'recurso_id': self.videobeam.id, 'cantidad': 1}, {'recurso_id': self.videobeam.id, 'cantidad': 2}]
        for ruta in ('espacios', 'publicos'):
            extra = {} if ruta == 'espacios' else {
                'nombre_solicitante': 'Z', 'correo_solicitante': 'z@x.co', 'telefono_solicitante': '1',
                'identificacion_solicitante': '9'}
            r = self.post(self.gestor, f'/api/prestamos/{ruta}/', self.payload(recursos=recursos, **extra))
            self.assertEqual(r.status_code, 400, r.content)
            self.assertEqual(_json(r), {'recursos': ['No se puede solicitar el mismo recurso más de una vez.']})

    def test_editar_con_recursos_los_reemplaza_y_sin_recursos_los_conserva(self):
        r = self.post(self.gestor, '/api/prestamos/espacios/', self.payload(
            recursos=[{'recurso_id': self.videobeam.id, 'cantidad': 2}]))
        self.assertEqual(r.status_code, 201, r.content)
        prestamo_id = _json(r)['id']

        def recursos():
            return sorted(PrestamoRecurso.objects.filter(prestamo_id=prestamo_id).values_list('recurso_id', 'cantidad'))

        self.assertEqual(recursos(), [(self.videobeam.id, 2)])
        self.patch(self.gestor, f'/api/prestamos/espacios/{prestamo_id}/', {'motivo': 'sin recursos'})
        self.assertEqual(recursos(), [(self.videobeam.id, 2)])
        self.patch(self.gestor, f'/api/prestamos/espacios/{prestamo_id}/',
                   {'recursos': [{'recurso_id': self.parlante.id, 'cantidad': 1}]})
        self.assertEqual(recursos(), [(self.parlante.id, 1)])
        self.patch(self.gestor, f'/api/prestamos/espacios/{prestamo_id}/', {'recursos': []})
        self.assertEqual(recursos(), [])

    def test_publico_guarda_sus_recursos(self):
        r = self.post(None, '/api/prestamos/publicos/', self.payload(
            recursos=[{'recurso_id': self.parlante.id, 'cantidad': 3}], nombre_solicitante='Z',
            correo_solicitante='z@x.co', telefono_solicitante='1', identificacion_solicitante='9'))
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = PrestamoEspacioPublico.objects.get(id=_json(r)['id'])
        self.assertEqual(list(nuevo.prestamo_recursos.values_list('recurso_id', 'cantidad')), [(self.parlante.id, 3)])
