import json
from datetime import date
from unittest import mock

from django.test import TestCase

from identidad.usuarios.models import Rol, Usuario
from nucleo.eventos import audiencia, canal

from .. import models

HOY = date(2026, 10, 5)


class _Canal:
    def __init__(self):
        self.publicados = []

    def publicar_mensaje(self, texto):
        self.publicados.append(json.loads(texto))


def _con_canal(falso):
    return mock.patch.multiple(canal, disponible=lambda: True, publicar_mensaje=falso.publicar_mensaje)


class EventosFinancierosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u = {}
        for i, nombre in enumerate(['Funcionario', 'Proveedor', 'Contabilidad', 'Tesorería', 'Estudiante X']):
            rol = Rol.objects.get_or_create(nombre=nombre)[0]
            cls.u[nombre] = Usuario.objects.create(
                nombre=f'U {nombre}', correo=f'ev.fin.{i}@unilibre.edu.co', contrasena_hash='x', rol=rol,
            )
        cls.otro_funcionario = Usuario.objects.create(
            nombre='Otro func', correo='ev.fin.otro@unilibre.edu.co', contrasena_hash='x', rol=cls.u['Funcionario'].rol,
        )
        cls.otro_proveedor = Usuario.objects.create(
            nombre='Otro prov', correo='ev.fin.otroprov@unilibre.edu.co', contrasena_hash='x', rol=cls.u['Proveedor'].rol,
        )
        cls.proveedor = models.Proveedor.objects.create(
            nit='900777', razon_social='Proveedor Ev', tipo_proveedor='Servicios', usuario=cls.u['Proveedor'],
        )

    def crear_factura(self, **extra):
        return models.Factura.objects.create(
            numero_factura='FAC-EV-1', proveedor=self.proveedor, valor_subtotal=1, valor_total=1,
            tipo_documento='Factura', fecha_factura=HOY, fecha_recepcion=HOY, creado_por=self.u['Funcionario'], **extra,
        )

    def eventos_de(self, falso, recurso):
        return [e for e in falso.publicados if e['recurso'] == recurso]

    def test_la_factura_publica_su_evento_con_destinatarios(self):
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            factura = self.crear_factura(estado='Registrada')
        evento = self.eventos_de(falso, 'facturas')[0]
        self.assertEqual((evento['accion'], evento['id']), ('creado', factura.id))
        self.assertEqual(set(evento['usuarios']), {self.u['Funcionario'].id, self.u['Proveedor'].id})
        self.assertIn('contabilidad', evento['roles'])
        self.assertNotIn('funcionario', evento['roles'])
        self.assertNotIn('proveedor', evento['roles'])

    def test_una_factura_recibida_sin_responsable_tambien_le_llega_a_los_funcionarios(self):
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            self.crear_factura(estado='Recibida')
        self.assertIn('funcionario', self.eventos_de(falso, 'facturas')[0]['roles'])

    def test_un_documento_que_cambia_es_una_actualizacion_de_su_factura(self):
        factura = self.crear_factura(estado='Registrada')
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            doc = models.DocumentoAdjunto.objects.create(factura=factura, nombre_archivo='a.pdf', tipo_documento='Factura')
            doc.delete()
        eventos = self.eventos_de(falso, 'facturas')
        self.assertEqual([(e['accion'], e['id']) for e in eventos], [('actualizado', factura.id)] * 2)

    def test_quien_recibe_el_evento_de_una_factura(self):
        factura = self.crear_factura(estado='Registrada')
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            factura.observaciones = 'x'
            factura.save()
        evento = self.eventos_de(falso, 'facturas')[0]
        recibe = {n: audiencia.debe_recibir(evento, u) for n, u in self.u.items()}
        self.assertTrue(recibe['Funcionario'])      # la creó
        self.assertTrue(recibe['Proveedor'])        # es su proveedor
        self.assertTrue(recibe['Contabilidad'])     # revisa todas
        self.assertTrue(recibe['Tesorería'])
        self.assertFalse(recibe['Estudiante X'])    # sin relación con el módulo
        self.assertFalse(audiencia.debe_recibir(evento, self.otro_funcionario))   # funcionario ajeno
        self.assertFalse(audiencia.debe_recibir(evento, self.otro_proveedor))     # proveedor ajeno

    def test_un_proveedor_ajeno_no_recibe_nada_de_la_factura_de_otro(self):
        evento = {'recurso': 'facturas', 'accion': 'actualizado', 'id': 1, 'usuarios': [self.u['Proveedor'].id], 'roles': ['contabilidad']}
        self.assertFalse(audiencia.debe_recibir(evento, self.otro_proveedor))

    def test_el_administrador_recibe_todo(self):
        admin = Usuario.objects.create(
            nombre='Adm', correo='ev.fin.admin@unilibre.edu.co', contrasena_hash='x',
            rol=Rol.objects.get_or_create(nombre='admin_global')[0],
        )
        self.assertTrue(audiencia.debe_recibir({'usuarios': [], 'roles': []}, admin))

    def test_los_catalogos_financieros_no_le_llegan_a_quien_no_es_del_modulo(self):
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            models.Departamento.objects.create(codigo='EV', nombre='Depto EV', tipo='Administrativo')
        evento = self.eventos_de(falso, 'catalogos-financieros')[0]
        self.assertTrue(audiencia.debe_recibir(evento, self.u['Funcionario']))
        self.assertTrue(audiencia.debe_recibir(evento, self.u['Proveedor']))
        self.assertFalse(audiencia.debe_recibir(evento, self.u['Estudiante X']))

    def test_el_proveedor_ve_su_propio_cambio_y_los_roles_internos_los_de_todos(self):
        falso = _Canal()
        with _con_canal(falso), self.captureOnCommitCallbacks(execute=True):
            self.proveedor.razon_social = 'Cambió'
            self.proveedor.save()
        evento = self.eventos_de(falso, 'proveedores')[0]
        self.assertTrue(audiencia.debe_recibir(evento, self.u['Proveedor']))
        self.assertTrue(audiencia.debe_recibir(evento, self.u['Contabilidad']))
        self.assertFalse(audiencia.debe_recibir(evento, self.otro_proveedor))
