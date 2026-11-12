"""Permisos de rol por seccional: una plantilla general y ajustes que solo valen para una seccional."""
from componentes.models import Componente, ComponenteRol, ComponenteUsuario
from mysite.auth_helpers import construir_componentes, user_can_edit_componente
from usuarios.models import Rol

from .tests_aislamiento import AislamientoBase, _cliente


def _permisos(usuario):
    return {c['nombre']: c['permiso'] for c in construir_componentes(usuario)}


class ResolucionDePermisosTests(AislamientoBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.horarios = Componente.objects.create(nombre='Gestión de Horarios')
        cls.reportes = Componente.objects.create(nombre='Reportes Académicos')
        ComponenteRol.objects.create(rol=cls.rol_docente, componente=cls.horarios, permiso='VER')

    def test_sin_ajustes_todas_las_seccionales_reciben_la_plantilla(self):
        self.assertEqual(_permisos(self.docente_bq), {'Gestión de Horarios': 'VER'})
        self.assertEqual(_permisos(self.docente_cali), {'Gestión de Horarios': 'VER'})

    def test_un_ajuste_cambia_el_permiso_solo_en_su_seccional(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.horarios, permiso='EDITAR', seccional=self.bq)
        self.assertEqual(_permisos(self.docente_bq), {'Gestión de Horarios': 'EDITAR'})
        self.assertEqual(_permisos(self.docente_cali), {'Gestión de Horarios': 'VER'})
        self.assertTrue(user_can_edit_componente(self.docente_bq, 'Gestión de Horarios'))
        self.assertFalse(user_can_edit_componente(self.docente_cali, 'Gestión de Horarios'))

    def test_un_ajuste_puede_quitar_un_componente_de_la_plantilla(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.horarios, permiso='NINGUNO', seccional=self.bq)
        self.assertEqual(_permisos(self.docente_bq), {})
        self.assertEqual(_permisos(self.docente_cali), {'Gestión de Horarios': 'VER'})

    def test_un_ajuste_puede_agregar_un_componente_que_la_plantilla_no_da(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.reportes, permiso='VER', seccional=self.cali)
        self.assertEqual(_permisos(self.docente_cali), {'Gestión de Horarios': 'VER', 'Reportes Académicos': 'VER'})
        self.assertEqual(_permisos(self.docente_bq), {'Gestión de Horarios': 'VER'})

    def test_cambiar_la_plantilla_llega_a_quien_no_tiene_ajuste(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.horarios, permiso='NINGUNO', seccional=self.bq)
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.reportes, permiso='VER')
        self.assertEqual(_permisos(self.docente_bq), {'Reportes Académicos': 'VER'})
        self.assertEqual(set(_permisos(self.docente_cali)), {'Gestión de Horarios', 'Reportes Académicos'})

    def test_el_permiso_individual_sigue_mandando(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.horarios, permiso='EDITAR', seccional=self.bq)
        ComponenteUsuario.objects.create(usuario=self.docente_bq, componente=self.horarios, permiso='VER')
        self.assertEqual(_permisos(self.docente_bq), {'Gestión de Horarios': 'VER'})
        ComponenteUsuario.objects.filter(usuario=self.docente_bq).update(activo=False)
        self.assertEqual(_permisos(self.docente_bq), {})

    def test_el_ajuste_de_otra_seccional_no_cuenta(self):
        ComponenteRol.objects.create(rol=self.rol_docente, componente=self.horarios, permiso='NINGUNO', seccional=self.cali)
        self.assertEqual(_permisos(self.docente_bq), {'Gestión de Horarios': 'VER'})


class ApiPermisosPorSeccionalTests(AislamientoBase):
    URL = '/api/componentes/roles/'

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.horarios = Componente.objects.create(nombre='Gestión de Horarios')
        cls.factura = Componente.objects.create(nombre='Consultar Facturas')
        cls.plantilla = ComponenteRol.objects.create(rol=cls.rol_docente, componente=cls.horarios, permiso='VER')
        cls.ajuste_bq = ComponenteRol.objects.create(
            rol=cls.rol_docente, componente=cls.componente, permiso='VER', seccional=cls.bq)
        cls.ajuste_cali = ComponenteRol.objects.create(
            rol=cls.rol_docente, componente=cls.componente, permiso='EDITAR', seccional=cls.cali)

    def _ids(self, respuesta):
        self.assertEqual(respuesta.status_code, 200, respuesta.content)
        return {fila['id'] for fila in respuesta.json()}

    # ---- lectura ----

    def test_sin_parametros_devuelve_solo_la_plantilla_como_siempre(self):
        for usuario in (self.general, self.admin_bq, self.docente_bq):
            self.assertEqual(self._ids(_cliente(usuario).get(self.URL)) & {self.plantilla.id, self.ajuste_bq.id, self.ajuste_cali.id},
                             {self.plantilla.id}, usuario.nombre)

    def test_el_administrador_de_seccional_ve_la_plantilla_y_lo_suyo(self):
        ids = self._ids(_cliente(self.admin_bq).get(self.URL, {'seccional': self.bq.id}))
        self.assertEqual(ids & {self.plantilla.id, self.ajuste_bq.id, self.ajuste_cali.id}, {self.plantilla.id, self.ajuste_bq.id})

    def test_pedir_otra_seccional_devuelve_la_suya(self):
        ids = self._ids(_cliente(self.admin_bq).get(self.URL, {'seccional': self.cali.id}))
        self.assertNotIn(self.ajuste_cali.id, ids)
        self.assertIn(self.ajuste_bq.id, ids)

    def test_el_administrador_general_ve_cualquier_seccional(self):
        c = _cliente(self.general)
        ids = self._ids(c.get(self.URL, {'seccional': self.cali.id}))
        self.assertEqual(ids & {self.plantilla.id, self.ajuste_bq.id, self.ajuste_cali.id}, {self.plantilla.id, self.ajuste_cali.id})
        self.assertTrue({self.plantilla.id, self.ajuste_bq.id, self.ajuste_cali.id} <= self._ids(c.get(self.URL, {'seccional': 'todas'})))

    def test_no_se_ve_el_ajuste_de_otra_seccional_por_id(self):
        c = _cliente(self.admin_bq)
        self.assertEqual(c.get(f'{self.URL}{self.ajuste_cali.id}/').status_code, 404)

    # ---- escritura del administrador de seccional ----

    def test_lo_que_crea_el_administrador_de_seccional_queda_en_su_seccional(self):
        c = _cliente(self.admin_bq)
        r = c.post(self.URL, {'componente': self.horarios.id, 'rol': self.rol_docente.id, 'permiso': 'NINGUNO'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.json()['seccional'], self.bq.id)
        self.assertEqual(ComponenteRol.objects.get(pk=self.plantilla.pk).permiso, 'VER')  # la plantilla no cambia

    def test_no_crea_ajustes_para_otra_seccional(self):
        r = _cliente(self.admin_bq).post(
            self.URL, {'componente': self.horarios.id, 'rol': self.rol_docente.id, 'permiso': 'VER', 'seccional': self.cali.id}, format='json')
        self.assertEqual(r.status_code, 403, r.content)

    def test_edita_y_borra_su_propio_ajuste_pero_no_la_plantilla_ni_lo_de_otra(self):
        c = _cliente(self.admin_bq)
        self.assertEqual(c.patch(f'{self.URL}{self.ajuste_bq.id}/', {'permiso': 'EDITAR'}, format='json').status_code, 200)
        self.assertEqual(c.patch(f'{self.URL}{self.plantilla.id}/', {'permiso': 'EDITAR'}, format='json').status_code, 403)
        self.assertEqual(c.delete(f'{self.URL}{self.plantilla.id}/').status_code, 403)
        self.assertEqual(c.patch(f'{self.URL}{self.ajuste_cali.id}/', {'permiso': 'VER'}, format='json').status_code, 404)
        self.assertEqual(c.delete(f'{self.URL}{self.ajuste_cali.id}/').status_code, 404)
        self.assertEqual(c.delete(f'{self.URL}{self.ajuste_bq.id}/').status_code, 204)
        self.assertEqual(ComponenteRol.objects.get(pk=self.plantilla.pk).permiso, 'VER')
        self.assertEqual(ComponenteRol.objects.get(pk=self.ajuste_cali.pk).permiso, 'EDITAR')

    def test_no_pasa_su_ajuste_a_otra_seccional_ni_a_la_plantilla(self):
        c = _cliente(self.admin_bq)
        self.assertEqual(c.patch(f'{self.URL}{self.ajuste_bq.id}/', {'seccional': self.cali.id}, format='json').status_code, 403)
        self.assertEqual(c.patch(f'{self.URL}{self.ajuste_bq.id}/', {'seccional': None}, format='json').status_code, 403)
        self.ajuste_bq.refresh_from_db()
        self.assertEqual(self.ajuste_bq.seccional_id, self.bq.id)

    def test_no_da_componentes_financieros_ni_toca_roles_financieros(self):
        c = _cliente(self.admin_bq)
        r = c.post(self.URL, {'componente': self.factura.id, 'rol': self.rol_docente.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 403, r.content)
        contabilidad = Rol.objects.get(nombre='Contabilidad')
        r = c.post(self.URL, {'componente': self.horarios.id, 'rol': contabilidad.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 403, r.content)
        rol_global = Rol.objects.get_or_create(nombre='admin_global')[0]
        r = c.post(self.URL, {'componente': self.horarios.id, 'rol': rol_global.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 403, r.content)

    def test_otros_roles_no_escriben(self):
        for usuario in (self.docente_bq, self.gestor_bq, self.admin_fin):
            r = _cliente(usuario).post(
                self.URL, {'componente': self.horarios.id, 'rol': self.rol_docente.id, 'permiso': 'VER', 'seccional': self.bq.id}, format='json')
            self.assertEqual(r.status_code, 403, usuario.nombre)

    # ---- escritura del administrador general ----

    def test_el_administrador_general_escribe_plantilla_y_ajustes_de_cualquier_seccional(self):
        c = _cliente(self.general)
        r = c.post(self.URL, {'componente': self.factura.id, 'rol': self.rol_docente.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertIsNone(r.json()['seccional'])
        r = c.post(self.URL, {'componente': self.horarios.id, 'rol': self.rol_docente.id, 'permiso': 'NINGUNO', 'seccional': self.cali.id}, format='json')
        self.assertEqual(r.status_code, 201, r.content)

    def test_sin_acceso_no_vale_en_la_plantilla(self):
        r = _cliente(self.general).post(
            self.URL, {'componente': self.factura.id, 'rol': self.rol_docente.id, 'permiso': 'NINGUNO'}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        r = _cliente(self.general).patch(f'{self.URL}{self.plantilla.id}/', {'permiso': 'NINGUNO'}, format='json')
        self.assertEqual(r.status_code, 400, r.content)

    def test_no_se_repite_el_ajuste_de_un_componente_en_la_misma_seccional(self):
        r = _cliente(self.admin_bq).post(
            self.URL, {'componente': self.componente.id, 'rol': self.rol_docente.id, 'permiso': 'EDITAR'}, format='json')
        self.assertEqual(r.status_code, 400, r.content)

    # ---- alcance y asignación individual ----

    def test_el_alcance_dice_que_puede_hacer_cada_quien(self):
        general = _cliente(self.general).get('/api/componentes/alcance/').json()
        self.assertTrue(general['es_general'])
        self.assertTrue(general['puede_ajustar'])
        self.assertTrue({self.bq.id, self.cali.id} <= {s['id'] for s in general['seccionales']})
        propio = _cliente(self.admin_bq).get('/api/componentes/alcance/').json()
        self.assertFalse(propio['es_general'])
        self.assertTrue(propio['puede_ajustar'])
        self.assertEqual(propio['seccional']['id'], self.bq.id)
        self.assertEqual(propio['seccionales'], [])
        docente = _cliente(self.docente_bq).get('/api/componentes/alcance/').json()
        self.assertFalse(docente['puede_ajustar'])

    def test_el_administrador_de_seccional_no_da_componentes_financieros_a_una_persona(self):
        r = _cliente(self.admin_bq).post(
            '/api/componentes/usuarios/', {'componente': self.factura.id, 'usuario': self.docente_bq.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 403, r.content)
        r = _cliente(self.general).post(
            '/api/componentes/usuarios/', {'componente': self.factura.id, 'usuario': self.docente_bq.id, 'permiso': 'VER'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
