"""Pasos de la factura que suben archivos o pasan por el serializador: caracterización del comportamiento actual.

- Crear: la factura nace Recibida en «Recepción y Registro», con su historial y el aviso a Contabilidad.
- Causar: exige el soporte PDF de causación, lo guarda en la carpeta compartida (NAS) y pasa a Alistamiento.
- Registrar pago aplicado: exige número de confirmación, transacción única y comprobante; todo o nada.
- Corregir: solo el proveedor reenvía una factura devuelta o rechazada; vuelve a Recepción y Registro.
- Completar registro: deja la factura Registrada en «Radicación y Causación».
"""
import datetime
from datetime import date
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from notificaciones.models import Notificacion
from usuarios.models import Rol, Usuario

from . import models
from .tests_reloj import fijar_hoy
from .services.shared_storage_service import StorageResult

AHORA = timezone.make_aware(datetime.datetime(2026, 11, 11, 15, 30))
HOY = date(2026, 11, 11)
PDF = b'%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj ' \
      b'3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF'
ITEM = {'descripcion': 'Servicio', 'cantidad': '1', 'valor_unitario': '1000', 'porcentaje_iva': '19',
        'valor_subtotal': '1000', 'valor_iva': '190', 'valor_total': '1190'}


class FlujoFacturaArchivosTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u = {}
        for rol in ('Funcionario', 'Contabilidad', 'Tesorería', 'Dirección Financiera', 'Proveedor'):
            r = Rol.objects.get_or_create(nombre=rol)[0]
            cls.u[rol] = Usuario.objects.create_user(correo=f'{rol[:5].lower()}@archivos.test', nombre=f'Usuario {rol}', rol=r)
        cls.proveedor = models.Proveedor.objects.create(nit='900456', razon_social='Proveedor Archivos',
                                                         tipo_proveedor='Servicios', usuario=cls.u['Proveedor'])
        cls.departamento = models.Departamento.objects.create(codigo='DA', nombre='Depto Archivos', tipo='Administrativo')

    def setUp(self):
        reloj = mock.patch('django.utils.timezone.now', return_value=AHORA)
        reloj.start()
        self.addCleanup(reloj.stop)
        fijar_hoy(self, HOY)
        self.nas = mock.MagicMock()
        self.nas.enabled = True
        self.nas.copy_document.side_effect = lambda factura, index, original_filename, content_bytes: StorageResult(
            True, nas_relative_path=f'facturas/{factura.numero_factura}/{index:03d}_{original_filename}')
        self.nas.copy_unified_pdf.return_value = StorageResult(True, nas_relative_path='facturas/unificado.pdf')
        nas = mock.patch('financiero.services.shared_storage_service.shared_storage', self.nas)
        nas.start()
        self.addCleanup(nas.stop)

    def factura(self, estado, numero='FAC-A-1', **extra):
        campos = dict(
            numero_factura=numero, proveedor=self.proveedor, departamento=self.departamento, valor_subtotal=1000,
            valor_iva=190, valor_total=1190, tipo_documento='Factura', fecha_factura=date(2026, 10, 1),
            fecha_recepcion=date(2026, 10, 2), creado_por=self.u['Funcionario'], estado=estado,
            etapa_actual='Etapa previa', fecha_inicio_etapa=date(2026, 10, 5), observaciones='Nota previa')
        return models.Factura.objects.create(**{**campos, **extra})

    def cliente(self, quien):
        c = APIClient()
        c.force_authenticate(user=self.u[quien])
        return c

    def historial(self, f):
        return list(models.HistorialFactura.objects.filter(factura=f).order_by('id').values_list(
            'accion', 'estado_anterior', 'estado_nuevo', 'usuario_nombre', 'usuario_rol', 'observacion'))

    def notificados(self, desde):
        nombres = dict(Usuario.objects.values_list('id', 'nombre'))
        return {nombres[n.id_usuario]: (n.tipo_notificacion, n.prioridad) for n in Notificacion.objects.filter(id__gt=desde)}

    def marca(self):
        return Notificacion.objects.order_by('-id').values_list('id', flat=True).first() or 0

    # ------------------------------------------------------------------ crear
    def test_crear(self):
        marca = self.marca()
        r = self.cliente('Funcionario').post('/api/financiero/facturas/', {
            'proveedor_id': self.proveedor.id, 'departamento_id': self.departamento.id, 'tipo_documento': 'Factura',
            'valor_subtotal': '1000', 'valor_iva': '190', 'valor_total': '1190', 'fecha_factura': '2026-10-01',
            'fecha_recepcion': '2026-10-02', 'items': [ITEM]}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        f = models.Factura.objects.get(id=r.data['id'])
        self.assertEqual((f.numero_factura, f.estado, f.etapa_actual, f.fecha_inicio_etapa, f.creado_por),
                         ('FAC-2026-0001', 'Recibida', 'Recepción y Registro', date(2026, 10, 2), self.u['Funcionario']))
        self.assertEqual(self.historial(f), [('Factura registrada', None, 'Recibida', 'Usuario Funcionario', 'Funcionario', None)])
        self.assertEqual(self.notificados(marca), {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'alta'),
                                                   'Usuario Contabilidad': ('FACTURA_ETAPA_ACTUALIZADA', 'alta')})

    # ------------------------------------------------------------------ causar
    def causar(self, f, archivo=None, **datos):
        if archivo:
            datos['soporte_causacion'] = SimpleUploadedFile(*archivo)
        r = self.cliente('Contabilidad').post(f'/api/financiero/facturas/{f.id}/causar/', datos, format='multipart')
        f.refresh_from_db()
        return r

    def test_causar(self):
        f = self.factura('Radicada')
        self.assertEqual(self.causar(f).data, {'error': 'Debe adjuntar el soporte PDF de causacion en Seven.'})
        self.assertEqual(self.causar(f, ('soporte.txt', b'texto', 'text/plain')).data,
                         {'error': 'El soporte de causacion debe estar en formato PDF.'})
        marca = self.marca()
        r = self.causar(f, ('soporte.pdf', PDF, 'application/pdf'), observaciones='Causada en Seven')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((f.estado, f.etapa_actual, f.fecha_causacion, f.fecha_inicio_etapa, f.usuario_responsable,
                          f.observaciones),
                         ('Causada', 'Alistamiento', HOY, HOY, self.u['Contabilidad'], 'Nota previa'))
        self.assertEqual(list(models.DocumentoAdjunto.objects.filter(factura=f).values_list(
            'nombre_archivo', 'tipo_documento', 'nas_relative_path', 'nas_storage_status')),
            [('soporte.pdf', 'Soporte Causacion Seven', 'facturas/FAC-A-1/001_soporte.pdf', 'stored')])
        self.assertEqual(self.historial(f), [('Factura causada', 'Radicada', 'Causada', 'Usuario Contabilidad',
                                              'Contabilidad', 'Causada en Seven')])
        self.assertEqual(set(self.notificados(marca)), {'Usuario Funcionario', 'Usuario Tesorería'})
        self.assertTrue(self.nas.copy_unified_pdf.called)  # se regenera el PDF unificado

    def test_causar_sin_carpeta_compartida_o_en_otro_estado(self):
        f = self.factura('Radicada')
        self.nas.enabled = False
        r = self.causar(f, ('soporte.pdf', PDF, 'application/pdf'))
        self.assertEqual((r.status_code, r.data['error']), (503, 'No fue posible guardar el soporte en la carpeta compartida.'))
        self.assertEqual(str(r.data['detail']['archivo']),
                         'La carpeta compartida no está configurada. No se puede guardar el documento.')
        self.assertEqual(f.estado, 'Radicada')
        f = self.factura('Causada', numero='FAC-A-2')
        self.assertEqual(self.causar(f, ('soporte.pdf', PDF, 'application/pdf')).data,
                         {'error': 'La factura debe estar radicada'})

    # ------------------------------------------------------------------ pago aplicado
    def pagar(self, f, archivo=True, **datos):
        if archivo:
            datos['comprobante_bancario'] = SimpleUploadedFile('comprobante.pdf', PDF, 'application/pdf')
        r = self.cliente('Tesorería').post(f'/api/financiero/facturas/{f.id}/registrar_pago_aplicado/', datos,
                                           format='multipart')
        f.refresh_from_db()
        return r

    def test_registrar_pago_aplicado(self):
        self.factura('Pagada', numero='FAC-OTRA', numero_transaccion='TRX-1')
        sin_confirmacion = self.factura('Autorizada', numero='FAC-A-0')
        self.assertEqual(self.pagar(sin_confirmacion, numero_transaccion='TRX-9').data, {
            'error': 'Debe confirmar el control de pago en Dirección Financiera antes de registrar el pago aplicado'})
        f = self.factura('Autorizada', numero_confirmacion='CONF-2026-0001')
        for datos, archivo, error in (
            ({'numero_transaccion': 'TRX-9', 'fecha_pago_aplicado': '05/11/2026'}, True,
             'La fecha de pago aplicado no es valida. Use el formato YYYY-MM-DD.'),
            ({}, True, 'Debe registrar el número de transacción bancaria'),
            ({'numero_transaccion': 'TRX-1'}, True, 'El número de transacción bancaria ya está registrado en otra factura.'),
            ({'numero_transaccion': 'TRX-9'}, False, 'Debe adjuntar el comprobante bancario en archivo (PDF/XML/PNG/JPG).'),
        ):
            with self.subTest(error=error):
                self.assertEqual(self.pagar(f, archivo, **datos).data, {'error': error})
        marca = self.marca()
        r = self.pagar(f, numero_transaccion='TRX-9', fecha_pago_aplicado='2026-11-05', observaciones='Pago hecho')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual((f.estado, f.etapa_actual, f.numero_transaccion, f.fecha_pago_aplicado, f.fecha_comprobante,
                          f.fecha_inicio_etapa, f.usuario_responsable, f.observaciones),
                         ('Pagada', 'Pago Aplicado', 'TRX-9', date(2026, 11, 5), date(2026, 11, 5), date(2026, 11, 5),
                          self.u['Tesorería'], 'Nota previa\n[Tesorería] Pago hecho'))
        self.assertEqual(list(models.DocumentoAdjunto.objects.filter(factura=f).values_list('nombre_archivo', 'tipo_documento')),
                         [('comprobante.pdf', 'Comprobante de Pago')])
        self.assertEqual(self.historial(f), [('Pago aplicado y factura pagada', 'Autorizada', 'Pagada',
                                              'Usuario Tesorería', 'Tesorería', 'Pago hecho')])
        self.assertEqual(self.notificados(marca), {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'media'),
                                                   'Usuario Tesorería': ('SLA_ALERTA', 'alta')})  # aviso del SLA al responsable

    def test_el_pago_aplicado_es_todo_o_nada(self):
        f = self.factura('Autorizada', numero_confirmacion='CONF-2026-0001')
        self.nas.enabled = False
        r = self.pagar(f, numero_transaccion='TRX-9')
        self.assertEqual((r.status_code, r.data['error']), (400, 'Datos de validacion incorrectos.'))
        self.assertEqual((f.estado, f.numero_transaccion), ('Autorizada', None))
        self.assertEqual(self.historial(f), [])
        r = self.cliente('Tesorería').post(f'/api/financiero/facturas/{f.id}/registrar_pago_aplicado/', {
            'numero_transaccion': 'TRX-9', 'comprobante_bancario': SimpleUploadedFile('x.exe', b'MZ', 'application/octet-stream'),
        }, format='multipart')
        self.assertEqual((r.status_code, r.data['error']), (400, 'Datos de validacion incorrectos.'))
        self.assertEqual(list(r.data['detail']), ['archivo'])

    def test_el_pago_aplicado_ante_errores_inesperados(self):
        f = self.factura('Autorizada', numero_confirmacion='CONF-2026-0001')
        guardar = 'financiero.api.facturas.tesoreria._guardar_documento_en_carpeta_compartida'
        with mock.patch(guardar, side_effect=RuntimeError('disco lleno')):
            r = self.pagar(f, numero_transaccion='TRX-9')
        self.assertEqual((r.status_code, r.data), (500, {'error': 'No fue posible registrar el pago aplicado.',
                                                         'detail': 'disco lleno'}))
        self.assertEqual((f.estado, f.numero_transaccion), ('Autorizada', None))
        with mock.patch(guardar, side_effect=IntegrityError('duplicado')):
            r = self.pagar(f, numero_transaccion='TRX-9')
        self.assertEqual((r.status_code, r.data),
                         (400, {'error': 'El número de transacción bancaria ya está registrado en otra factura.'}))
        self.assertEqual(self.historial(f), [])

    # ------------------------------------------------------------------ corregir
    def test_corregir(self):
        f = self.factura('Devuelta')
        models.ItemFactura.objects.create(factura=f, orden=1, descripcion='Viejo', cantidad=1, valor_unitario=1000,
                                          valor_subtotal=1000, valor_iva=190, valor_total=1190)
        rechazo = models.RechazoDevolucion.objects.create(factura=f, tipo='Rechazo', etapa_rechazo='Devolución',
                                                          motivo='Falta la orden', estado_devolucion='Pendiente Corrección')
        url = f'/api/financiero/facturas/{f.id}/corregir/'
        r = self.cliente('Contabilidad').patch(url, {}, format='json')
        self.assertEqual((r.status_code, r.data), (403, {'error': 'No autorizado para corregir esta factura.'}))
        marca = self.marca()
        r = self.cliente('Proveedor').patch(url, {'items': [ITEM, dict(ITEM, descripcion='Otro')],
                                                  'observaciones_correccion': 'Agregué la orden'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        f.refresh_from_db()
        self.assertEqual((f.estado, f.etapa_actual, f.usuario_responsable, f.fecha_inicio_etapa, f.fecha_recepcion),
                         ('Recibida', 'Recepción y Registro', None, HOY, HOY))
        self.assertEqual(list(f.items.order_by('orden').values_list('orden', 'descripcion')), [(1, 'Servicio'), (2, 'Otro')])
        rechazo.refresh_from_db()
        self.assertEqual((rechazo.estado_devolucion, rechazo.usuario_corrige, rechazo.observaciones_correccion, rechazo.fecha_correccion),
                         ('Reenviada', self.u['Proveedor'], 'Agregué la orden', AHORA))
        self.assertEqual(self.historial(f), [('Corrección enviada por proveedor', 'Devuelta', 'Recibida',
                                              'Usuario Proveedor', 'Proveedor', 'Agregué la orden')])
        self.assertEqual(self.notificados(marca), {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'alta'),
                                                   'Usuario Contabilidad': ('FACTURA_ETAPA_ACTUALIZADA', 'alta')})
        r = self.cliente('Proveedor').patch(url, {}, format='json')
        self.assertEqual(r.data, {'error': 'Solo se pueden corregir facturas en estado Devuelta o Rechazada.'})

    def test_corregir_sin_items_ni_observacion(self):
        f = self.factura('Rechazada')
        url = f'/api/financiero/facturas/{f.id}/corregir/'
        r = self.cliente('Proveedor').patch(url, {'items': []}, format='json')
        self.assertEqual((r.status_code, r.data), (400, {'items': ['Debe registrar al menos un bien o servicio.']}))
        r = self.cliente('Proveedor').patch(url, {}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(self.historial(f)[0][5], 'Corrección enviada por proveedor.')

    # ------------------------------------------------------------------ completar registro
    def test_completar_registro(self):
        f = self.factura('Recibida', fecha_inicio_etapa=None)
        url = f'/api/financiero/facturas/{f.id}/completar_registro/'
        marca = self.marca()
        r = self.cliente('Funcionario').patch(url, {'observaciones': 'Datos completos'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        f.refresh_from_db()
        self.assertEqual((f.estado, f.etapa_actual, f.usuario_responsable, f.fecha_inicio_etapa, f.observaciones),
                         ('Registrada', 'Radicación y Causación', self.u['Funcionario'], HOY, 'Datos completos'))
        self.assertEqual(self.historial(f), [('Completar Registro', 'Recibida', 'Registrada', None, 'Funcionario',
                                              'Factura registrada correctamente por el funcionario')])
        self.assertEqual(set(self.notificados(marca)), {'Usuario Funcionario', 'Usuario Contabilidad'})
        f = self.factura('Radicada', numero='FAC-A-2')
        r = self.cliente('Funcionario').patch(f'/api/financiero/facturas/{f.id}/completar_registro/', {}, format='json')
        self.assertEqual(r.data, {'error': 'Solo se pueden completar facturas en estado Recibida, Registrada o Devuelta. '
                                           'Estado actual: Radicada'})
