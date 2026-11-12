"""Flujo de la factura: caracterización de lo que no cubre el recorrido principal.

- La interfaz pública de `financiero.flujo_factura` (la usan las vistas): todos los nombres siguen disponibles.
- El cierre de facturas antiguas con pago aplicado como Pagada (`generar_comprobante`).
"""
import datetime
from datetime import date
from unittest import mock

from django.test import SimpleTestCase, TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from usuarios.models import Rol, Usuario

from . import flujo_factura, models

AHORA = timezone.make_aware(datetime.datetime(2026, 11, 11, 15, 30))
HOY = date(2026, 11, 11)


class InterfazPublicaTests(SimpleTestCase):
    NOMBRES = [
        'ESTADO_AUTORIZADA', 'ESTADO_CARGADA', 'ESTADO_DEVUELTA', 'ESTADO_ENVIADA_RECTORIA',
        'ESTADO_RECHAZADA_POR_RECTORIA', 'ESTADO_REVISADA_DIRECCION_FINANCIERA', 'QUIEN_ACTUA', 'SIGUIENTES_ROLES',
        'SOPORTES_RADICACION', 'PasoRechazado', 'alistar', 'aprobar_auditoria', 'asignar_numero_confirmacion',
        'autorizar_rectoria', 'cargar_direccion_financiera', 'causar', 'ciclo_documental_actual',
        'completar_registro', 'confirmar_control_pago', 'destino_del_rechazo', 'detener_en_tesoreria',
        'enviar_direccion_financiera', 'enviar_rectoria', 'estado_es', 'faltantes_radicacion', 'generar_comprobante',
        'generar_numero_confirmacion', 'notificar_transicion', 'radicar', 'rechazar', 'rechazar_auditoria',
        'rechazar_rectoria', 'registrar_creacion', 'registrar_historial', 'registrar_pago_aplicado',
        'reenviar_correccion', 'validar_completar_registro', 'validar_correccion',
    ]

    def test_los_nombres_publicos_siguen_disponibles(self):
        faltan = [nombre for nombre in self.NOMBRES if not hasattr(flujo_factura, nombre)]
        self.assertEqual(faltan, [])

    def test_las_constantes_no_cambian(self):
        self.assertEqual(flujo_factura.SIGUIENTES_ROLES['Causada'], ['Tesorería'])
        self.assertEqual(flujo_factura.SIGUIENTES_ROLES['Enviada Rectoría'], ['Rectoría'])
        self.assertNotIn('Autorizada', flujo_factura.SIGUIENTES_ROLES)
        self.assertEqual(sorted(flujo_factura.SOPORTES_RADICACION), ['Certificación Bancaria', 'Factura', 'Orden de Compra'])
        self.assertEqual(flujo_factura.ESTADO_RECHAZADA_POR_RECTORIA, 'Rechazada por Rectoría')

    def test_estado_es_ignora_tildes_y_mayusculas(self):
        self.assertTrue(flujo_factura.estado_es('Enviada Rectoría', 'enviada rectoria'))
        self.assertFalse(flujo_factura.estado_es('Autorizada', 'Cargada'))


class GenerarComprobanteTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        rol = Rol.objects.get_or_create(nombre='Tesorería')[0]
        cls.tesoreria = Usuario.objects.create_user(correo='teso@comprobante.test', nombre='Tesorería', rol=rol)
        cls.funcionario = Usuario.objects.create_user(
            correo='func@comprobante.test', nombre='Funcionario', rol=Rol.objects.get_or_create(nombre='Funcionario')[0])
        cls.proveedor = models.Proveedor.objects.create(nit='900124', razon_social='Proveedor Comprobante',
                                                         tipo_proveedor='Servicios', usuario=cls.funcionario)
        cls.departamento = models.Departamento.objects.create(codigo='DC', nombre='Depto Comprobante', tipo='Administrativo')

    def setUp(self):
        reloj = mock.patch('django.utils.timezone.now', return_value=AHORA)
        reloj.start()
        self.addCleanup(reloj.stop)

    def factura(self, estado, **extra):
        return models.Factura.objects.create(
            numero_factura='FAC-C-1', proveedor=self.proveedor, departamento=self.departamento, valor_subtotal=1000,
            valor_total=1190, tipo_documento='Factura', fecha_factura=date(2026, 10, 1), fecha_recepcion=date(2026, 10, 2),
            creado_por=self.funcionario, estado=estado, etapa_actual='Etapa previa',
            fecha_inicio_etapa=date(2026, 10, 5), observaciones='Nota previa', **extra)

    def generar(self, f, **datos):
        c = APIClient()
        c.force_authenticate(user=self.tesoreria)
        r = c.post(f'/api/financiero/facturas/{f.id}/generar_comprobante/', datos, format='json')
        f.refresh_from_db()
        return r

    def test_cierra_una_factura_antigua_con_pago_aplicado_como_pagada(self):
        f = self.factura('Pago Aplicado')
        r = self.generar(f, numero_comprobante='CMP-1', observaciones='Cierre antiguo')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((f.estado, f.etapa_actual), ('Pagada', 'Pago Aplicado'))
        self.assertEqual(f.numero_comprobante, 'CMP-1')
        self.assertEqual(f.fecha_comprobante, HOY)
        self.assertEqual(f.fecha_inicio_etapa, HOY)
        self.assertIn('[Tesorería] Cierre antiguo', f.observaciones)
        historial = models.HistorialFactura.objects.filter(factura=f).order_by('-id').first()
        self.assertEqual((historial.accion, historial.estado_anterior, historial.estado_nuevo),
                         ('Factura marcada como pagada', 'Pago Aplicado', 'Pagada'))

    def test_conserva_la_fecha_de_pago_aplicado_si_la_hay(self):
        f = self.factura('Pago Aplicado', fecha_pago_aplicado=date(2026, 11, 3))
        r = self.generar(f)
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(f.fecha_comprobante, date(2026, 11, 3))

    def test_exige_pago_aplicado_o_pagada(self):
        f = self.factura('Radicada')
        r = self.generar(f)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data['error'], 'La factura debe estar con pago aplicado o pagada')
        self.assertEqual(f.estado, 'Radicada')
