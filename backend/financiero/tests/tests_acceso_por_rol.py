"""Acceso al módulo financiero por rol: solo los roles financieros (o con un componente financiero) lo usan.

Los endpoints públicos del registro de proveedores (catálogos y alta con usuario) siguen abiertos.
"""
from datetime import date

from django.test import TestCase
from rest_framework.test import APIClient

from identidad.componentes.models import Componente, ComponenteRol
from identidad.usuarios.models import Rol, Usuario

from .. import models

ROLES_FINANCIEROS = (
    'Funcionario', 'Contabilidad', 'Tesorería', 'Auditoría', 'Dirección Financiera', 'Rectoría', 'Admin Financiero', 'Proveedor',
)
ROLES_NO_FINANCIEROS = ('estudiante', 'docente', 'biblioteca', 'admin', 'personal_administrativo', 'coordinador_chatbots')

ENDPOINTS_PRIVADOS = (
    '/api/financiero/facturas/', '/api/financiero/proveedores/', '/api/financiero/centros-costo/',
    '/api/financiero/cuentas-contables/', '/api/financiero/parametros-sla/', '/api/financiero/parametros-financiero/',
    '/api/financiero/departamentos/', '/api/financiero/reportes/', '/api/financiero/documentos/',
    '/api/financiero/historial/', '/api/financiero/comentarios/', '/api/financiero/rechazos/',
)
ENDPOINTS_PUBLICOS = (
    '/api/financiero/paises/', '/api/financiero/departamentos-geograficos/', '/api/financiero/ciudades/',
    '/api/financiero/bancos/', '/api/financiero/tipos-cuenta/',
)


def _cliente(usuario=None):
    c = APIClient()
    if usuario is not None:
        c.force_authenticate(user=usuario)
    return c


class AccesoFinancieroPorRolTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.usuarios = {}
        for nombre in ROLES_FINANCIEROS + ROLES_NO_FINANCIEROS:
            rol = Rol.objects.get_or_create(nombre=nombre)[0]
            cls.usuarios[nombre] = Usuario.objects.create_user(
                correo=f'{nombre.lower().replace(" ", "")}@prueba.test', nombre=nombre, rol=rol)
        cls.contabilidad = cls.usuarios['Contabilidad']
        proveedor = models.Proveedor.objects.create(nit='900111222', razon_social='Proveedor Reservado S.A.S.', tipo_proveedor='Servicios')
        departamento = models.Departamento.objects.create(codigo='D1', nombre='Departamento', tipo='Administrativo')
        cls.factura = models.Factura.objects.create(
            numero_factura='FAC-RESERVADA', proveedor=proveedor, departamento=departamento, valor_subtotal=1000000,
            valor_total=1190000, tipo_documento='Factura', fecha_factura=date(2026, 4, 5), fecha_recepcion=date(2026, 4, 5),
            creado_por=cls.contabilidad)

    # ---- quienes NO son del módulo financiero ----------------------------------------------------

    def test_roles_no_financieros_no_leen_ningun_endpoint_privado(self):
        for rol in ROLES_NO_FINANCIEROS:
            c = _cliente(self.usuarios[rol])
            for url in ENDPOINTS_PRIVADOS:
                self.assertEqual(c.get(url).status_code, 403, f'{rol} no debería leer {url}')

    def test_roles_no_financieros_no_ven_ni_tocan_una_factura(self):
        for rol in ROLES_NO_FINANCIEROS:
            c = _cliente(self.usuarios[rol])
            detalle = f'/api/financiero/facturas/{self.factura.id}/'
            self.assertEqual(c.get(detalle).status_code, 403, rol)
            self.assertEqual(c.patch(detalle, {'observaciones': 'x'}, format='json').status_code, 403, rol)
            self.assertEqual(c.delete(detalle).status_code, 403, rol)
        self.assertTrue(models.Factura.objects.filter(pk=self.factura.pk).exists())

    def test_sin_sesion_no_hay_acceso(self):
        c = _cliente()
        for url in ENDPOINTS_PRIVADOS:
            self.assertIn(c.get(url).status_code, (401, 403), url)

    # ---- quienes SÍ son del módulo financiero ----------------------------------------------------

    def test_roles_financieros_siguen_entrando(self):
        for rol in ROLES_FINANCIEROS:
            c = _cliente(self.usuarios[rol])
            for url in ('/api/financiero/facturas/', '/api/financiero/proveedores/'):
                self.assertEqual(c.get(url).status_code, 200, f'{rol} debería leer {url}')

    def test_los_roles_de_la_operacion_leen_los_catalogos_y_la_factura(self):
        c = _cliente(self.contabilidad)
        for url in ('/api/financiero/centros-costo/', '/api/financiero/cuentas-contables/', '/api/financiero/parametros-sla/'):
            self.assertEqual(c.get(url).status_code, 200, url)
        self.assertEqual(c.get(f'/api/financiero/facturas/{self.factura.id}/').status_code, 200)

    def test_un_rol_propio_con_un_componente_financiero_entra(self):
        rol = Rol.objects.create(nombre='analista_externo')
        componente = Componente.objects.get_or_create(nombre='Consultar Facturas', defaults={'descripcion': 'x'})[0]
        ComponenteRol.objects.create(rol=rol, componente=componente, permiso='VER')
        usuario = Usuario.objects.create_user(correo='analista@prueba.test', nombre='Analista', rol=rol)
        self.assertEqual(_cliente(usuario).get('/api/financiero/facturas/').status_code, 200)

    def test_un_rol_con_componentes_academicos_no_entra(self):
        rol = Rol.objects.create(nombre='coordinador_academico')
        componente = Componente.objects.get_or_create(nombre='Centro de Horarios', defaults={'descripcion': 'x'})[0]
        ComponenteRol.objects.create(rol=rol, componente=componente, permiso='EDITAR')
        usuario = Usuario.objects.create_user(correo='coord@prueba.test', nombre='Coord', rol=rol)
        self.assertEqual(_cliente(usuario).get('/api/financiero/facturas/').status_code, 403)

    def test_el_superusuario_entra(self):
        usuario = Usuario.objects.create_user(
            correo='super@prueba.test', nombre='Super', rol=Rol.objects.get_or_create(nombre='admin')[0], es_superusuario=True)
        self.assertEqual(_cliente(usuario).get('/api/financiero/facturas/').status_code, 200)

    # ---- lo que debe seguir público (registro de proveedores) ------------------------------------

    def test_los_catalogos_del_registro_de_proveedores_siguen_publicos(self):
        c = _cliente()
        for url in ENDPOINTS_PUBLICOS:
            self.assertEqual(c.get(url).status_code, 200, url)

    def test_el_alta_publica_de_proveedor_sigue_abierta(self):
        r = _cliente().post('/api/financiero/proveedores/crear_con_usuario/', {}, format='json')
        self.assertEqual(r.status_code, 400, 'sin sesión debe llegar a la validación, no ser rechazada por permisos')
