"""Flujo de la factura (acciones POST de /api/financiero/facturas/{id}/…): caracterización del comportamiento actual.

Cada paso exige un estado de partida, cambia estado y etapa, fija la fecha del paso y la de inicio de la etapa,
asigna el responsable, agrega las observaciones con una etiqueta, actualiza el SLA, deja una entrada en el historial
y notifica al creador y a los usuarios activos del rol que sigue.
"""
import datetime
from datetime import date
from unittest import mock

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from notificaciones.models import Notificacion
from usuarios.models import Rol, Usuario

from . import models
from .tests_reloj import fijar_hoy

AHORA = timezone.make_aware(datetime.datetime(2026, 11, 11, 15, 30))
HOY = date(2026, 11, 11)
MOTIVO = 'Los valores no coinciden con la orden'


class FlujoFacturaTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u = {}
        for rol in ('Funcionario', 'Contabilidad', 'Tesorería', 'Auditoría', 'Dirección Financiera', 'Rectoría', 'Proveedor'):
            r = Rol.objects.get_or_create(nombre=rol)[0]
            cls.u[rol] = Usuario.objects.create_user(correo=f'{rol[:5].lower()}@flujo.test', nombre=f'Usuario {rol}', rol=r)
        cls.inactivo = Usuario.objects.create_user(correo='inactivo@flujo.test', nombre='Inactivo',
                                                   rol=cls.u['Auditoría'].rol, activo=False)
        cls.proveedor = models.Proveedor.objects.create(nit='900123', razon_social='Proveedor Flujo',
                                                         tipo_proveedor='Servicios', usuario=cls.u['Proveedor'])
        cls.departamento = models.Departamento.objects.create(codigo='DF', nombre='Depto Flujo', tipo='Administrativo')

    def setUp(self):
        reloj = mock.patch('django.utils.timezone.now', return_value=AHORA)
        reloj.start()
        self.addCleanup(reloj.stop)
        fijar_hoy(self, HOY)

    def factura(self, estado='Registrada', numero='FAC-F-1', documentos=True, **extra):
        f = models.Factura.objects.create(
            numero_factura=numero, proveedor=self.proveedor, departamento=self.departamento, valor_subtotal=1000,
            valor_total=1190, tipo_documento='Factura', fecha_factura=date(2026, 10, 1), fecha_recepcion=date(2026, 10, 2),
            creado_por=self.u['Funcionario'], estado=estado, etapa_actual='Etapa previa',
            fecha_inicio_etapa=date(2026, 10, 5), observaciones='Nota previa', **extra)
        if documentos:
            for tipo, nombre in (('Factura', 'fac.pdf'), ('Contrato', 'orden_compra.pdf'), ('Soporte Adicional', 'certif_bancaria.pdf')):
                models.DocumentoAdjunto.objects.create(factura=f, nombre_archivo=nombre, tipo_documento=tipo)
        return f

    def accion(self, f, accion, quien='Contabilidad', **datos):
        c = APIClient()
        c.force_authenticate(user=self.u[quien])
        r = c.post(f'/api/financiero/facturas/{f.id}/{accion}/', datos, format='json')
        f.refresh_from_db()
        return r

    def ultimo_historial(self, f):
        return models.HistorialFactura.objects.filter(factura=f).order_by('-id').values(
            'accion', 'estado_anterior', 'estado_nuevo', 'usuario_nombre', 'usuario_rol', 'observacion',
            'datos_adicionales').first()

    def notificados(self, desde=0):
        """{nombre del usuario: (tipo, prioridad)} de las notificaciones creadas después de `desde`."""
        nombres = dict(Usuario.objects.values_list('id', 'nombre'))
        return {nombres[n.id_usuario]: (n.tipo_notificacion, n.prioridad)
                for n in Notificacion.objects.filter(id__gt=desde)}

    def marca(self):
        return Notificacion.objects.order_by('-id').values_list('id', flat=True).first() or 0

    # ------------------------------------------------------------------ recorrido completo
    def test_recorrido_completo(self):
        f = self.factura()
        marca = self.marca()
        r = self.accion(f, 'radicar', observaciones='Todo en orden', numero_operacion_contable='OP-9',
                        consecutivo_operacion='77')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['estado'], 'Radicada')
        self.assertEqual((f.estado, f.etapa_actual, f.numero_radicado, f.numero_operacion_contable,
                          f.consecutivo_operacion, f.fecha_radicacion, f.fecha_causacion, f.usuario_responsable),
                         ('Radicada', 'Radicación y Causación', 'OP-9-77', 'OP-9', '77', HOY, HOY, self.u['Contabilidad']))
        self.assertEqual(f.fecha_inicio_etapa, date(2026, 10, 5))  # radicar conserva el inicio de etapa que ya tenía
        self.assertEqual(f.observaciones, 'Nota previa')            # y no agrega las observaciones a la factura
        self.assertEqual(self.ultimo_historial(f), {
            'accion': 'Factura radicada', 'estado_anterior': 'Registrada', 'estado_nuevo': 'Radicada',
            'usuario_nombre': 'Usuario Contabilidad', 'usuario_rol': 'Contabilidad', 'observacion': 'Todo en orden',
            'datos_adicionales': None})
        self.assertEqual(self.notificados(marca), {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'media'),
                                                   'Usuario Contabilidad': ('FACTURA_ETAPA_ACTUALIZADA', 'media')})

        # La causación sube un soporte al NAS: se deja la factura causada para seguir.
        models.Factura.objects.filter(pk=f.pk).update(estado='Causada')
        siguientes = [
            # (acción, quien, datos, estado, etapa, campo de fecha, etiqueta de observación, roles notificados)
            ('alistar', 'Tesorería', {'numero_proceso_pago': 'PP-1', 'observaciones': 'Lista'}, 'Alistada',
             'Control Previo', 'fecha_alistamiento', '[Tesorería] Lista', ['Auditoría']),
            ('aprobar_auditoria', 'Auditoría', {'observaciones': 'Conforme'}, 'Aprobada Auditoría', 'Cargue Formal',
             'fecha_aprobacion_auditoria', '[Auditoría] Conforme', ['Dirección Financiera']),
            ('enviar_direccion_financiera', 'Tesorería', {}, 'Revisada Dir. Financiera', 'Cargue Formal',
             'fecha_revision_direccion', None, ['Dirección Financiera']),
            ('cargar_direccion_financiera', 'Dirección Financiera', {'observaciones': 'Cargada'}, 'Cargada',
             'Autorización de Pago', 'fecha_cargue', '[Dirección Financiera] Cargada', ['Rectoría']),
            ('enviar_rectoria', 'Dirección Financiera', {'observaciones': 'Va'}, 'Enviada Rectoría',
             'Autorización de Pago', 'fecha_envio_rectoria', '[Dirección Financiera - Envío] Va', ['Rectoría']),
            ('autorizar_rectoria', 'Rectoría', {'observaciones': 'Autorizo'}, 'Autorizada', 'Aplicación de Pago',
             'fecha_autorizacion', '[Rectoría] Autorizo', []),
        ]
        acciones_historial = {
            'alistar': 'Factura alistada', 'aprobar_auditoria': 'Factura aprobada por auditoría',
            'enviar_direccion_financiera': 'Factura enviada a Dirección Financiera',
            'cargar_direccion_financiera': 'Factura cargada en dirección financiera',
            'enviar_rectoria': 'Factura enviada a rectoría', 'autorizar_rectoria': 'Factura autorizada por Rectoría',
        }
        for accion, quien, datos, estado, etapa, campo_fecha, etiqueta, roles in siguientes:
            with self.subTest(accion=accion):
                f.refresh_from_db()
                anterior, observaciones_antes = f.estado, f.observaciones
                marca = self.marca()
                r = self.accion(f, accion, quien, **datos)
                self.assertEqual(r.status_code, 200, r.data)
                self.assertEqual((f.estado, f.etapa_actual, getattr(f, campo_fecha), f.fecha_inicio_etapa,
                                  f.usuario_responsable), (estado, etapa, HOY, HOY, self.u[quien]))
                esperado = '\n'.join([observaciones_antes, etiqueta]) if etiqueta else observaciones_antes
                self.assertEqual(f.observaciones, esperado)
                self.assertEqual(self.ultimo_historial(f), {
                    'accion': acciones_historial[accion], 'estado_anterior': anterior, 'estado_nuevo': estado,
                    'usuario_nombre': f'Usuario {quien}', 'usuario_rol': quien,
                    'observacion': datos.get('observaciones'), 'datos_adicionales': None})
                notificados = {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'media')}
                notificados.update({f'Usuario {rol}': ('FACTURA_ETAPA_ACTUALIZADA', 'media') for rol in roles})
                self.assertEqual(self.notificados(marca), notificados)
        self.assertEqual(f.numero_proceso_pago, 'PP-1')

        # Número de confirmación y control de pago (sin notificación y sin cambiar el estado)
        models.Factura.objects.create(
            numero_factura='FAC-CONF', proveedor=self.proveedor, valor_subtotal=1, valor_total=1, tipo_documento='Factura',
            fecha_factura=HOY, fecha_recepcion=HOY, numero_confirmacion='CONF-2026-0041')
        r = self.accion(f, 'generar_numero_confirmacion', 'Dirección Financiera')
        self.assertEqual((r.status_code, f.numero_confirmacion, f.estado), (200, 'CONF-2026-0042', 'Autorizada'))
        marca = self.marca()
        r = self.accion(f, 'confirmar_control_pago', 'Dirección Financiera', observaciones='Verificado')
        self.assertEqual(r.status_code, 200)
        self.assertEqual((f.estado, f.etapa_actual, f.numero_confirmacion, f.fecha_inicio_etapa),
                         ('Autorizada', 'Control de Pago Bancario', 'CONF-2026-0042', HOY))
        self.assertTrue(f.observaciones.endswith('\n[Control Pago] Verificado'))
        self.assertEqual(self.ultimo_historial(f), {
            'accion': 'Control de pago bancario confirmado', 'estado_anterior': 'Autorizada',
            'estado_nuevo': 'Control de Pago Bancario', 'usuario_nombre': 'Usuario Dirección Financiera',
            'usuario_rol': 'Dirección Financiera', 'observacion': 'Verificado',
            'datos_adicionales': {'numero_confirmacion': 'CONF-2026-0042'}})
        self.assertEqual(self.notificados(marca), {})

        # El pago aplicado sube el comprobante al NAS: se deja la factura con pago aplicado.
        models.Factura.objects.filter(pk=f.pk).update(estado='Pago Aplicado', fecha_pago_aplicado=date(2026, 11, 3))
        r = self.accion(f, 'generar_comprobante', 'Tesorería', numero_comprobante='CMP-1')
        self.assertEqual(r.status_code, 200)
        self.assertEqual((f.estado, f.etapa_actual, f.numero_comprobante, f.fecha_comprobante, f.fecha_inicio_etapa),
                         ('Pagada', 'Pago Aplicado', 'CMP-1', date(2026, 11, 3), date(2026, 11, 3)))
        self.assertEqual(self.ultimo_historial(f)['accion'], 'Factura marcada como pagada')

    # ------------------------------------------------------------------ validaciones
    def test_radicar_exige_soportes_datos_y_consecutivo_unico(self):
        f = self.factura(documentos=False)
        r = self.accion(f, 'radicar', observaciones='x', numero_operacion_contable='OP', consecutivo_operacion='1')
        self.assertEqual((r.status_code, r.data), (400, {
            'error': 'No se puede radicar: faltan soportes obligatorios.',
            'faltantes': ['Factura', 'Orden de Compra', 'Certificación Bancaria']}))
        f = self.factura(numero='FAC-F-2')
        for datos, error in (
            ({}, 'Las observaciones son obligatorias para radicar.'),
            ({'observaciones': 'x'}, 'El numero de operacion contable es obligatorio para radicar.'),
            ({'observaciones': 'x', 'numero_operacion_contable': 'OP'}, 'El consecutivo de operacion es obligatorio para radicar.'),
        ):
            self.assertEqual(self.accion(f, 'radicar', **datos).data, {'error': error})
        otra = self.factura(numero='FAC-F-3', documentos=False, consecutivo_operacion='55', numero_radicado='OP-55')
        r = self.accion(f, 'radicar', observaciones='x', numero_operacion_contable='OP', consecutivo_operacion='55')
        self.assertEqual(r.data, {'error': f'El consecutivo "55" ya está registrado en la factura {otra.numero_factura} '
                                           '(Radicado: OP-55). El consecutivo debe ser único en el sistema.'})
        self.assertEqual(f.estado, 'Registrada')

    def test_cada_accion_exige_su_estado(self):
        casos = {
            'radicar': 'La factura debe estar en estado Recibida o Registrada',
            'cargar_direccion_financiera': 'La factura debe estar revisada o devuelta para ser cargada en Dirección Financiera',
            'enviar_rectoria': 'La factura debe estar cargada para enviarla a Rectoría',
            'autorizar_rectoria': 'La factura debe estar enviada a Rectoría para autorizarla',
            'rechazar_rectoria': 'La factura debe estar enviada a Rectoría para rechazarla',
            'confirmar_control_pago': 'La factura debe estar autorizada para confirmar control de pago',
            'generar_numero_confirmacion': 'La factura debe estar autorizada para generar el numero de confirmacion',
            'alistar': 'La factura debe estar causada o detenida en tesorería',
            'aprobar_auditoria': 'La factura debe estar alistada para auditoría',
            'rechazar_auditoria': 'La factura debe estar alistada para auditoría',
            'enviar_direccion_financiera': 'La factura debe estar aprobada por Auditoría',
            'generar_comprobante': 'La factura debe estar con pago aplicado o pagada',
            'detener_en_tesoreria': 'Solo se pueden detener facturas en estado Causada o Detenida',
        }
        f = self.factura(estado='Anulada')
        for accion, error in casos.items():
            with self.subTest(accion=accion):
                r = self.accion(f, accion, motivo=MOTIVO, observaciones=MOTIVO)
                self.assertEqual((r.status_code, r.data), (400, {'error': error}))
        self.assertEqual(models.HistorialFactura.objects.filter(factura=f).count(), 0)

    def test_alistar_exige_proceso_o_archivo_plano_unico(self):
        self.factura(numero='FAC-OTRA', documentos=False, numero_proceso_pago='PP-7')
        f = self.factura(estado='Detenida')
        self.assertEqual(self.accion(f, 'alistar').data,
                         {'error': 'Debe registrar el número de proceso de pago o un archivo plano generado'})
        self.assertEqual(self.accion(f, 'alistar', numero_proceso_pago='PP-7').data, {
            'error': 'El número de proceso de pago "PP-7" ya está registrado en la factura FAC-OTRA. '
                     'Cada proceso de pago debe ser único.'})
        r = self.accion(f, 'alistar', 'Tesorería', archivo_plano_generado='plano.txt')
        self.assertEqual((r.status_code, f.estado, f.archivo_plano_generado, f.numero_proceso_pago, f.observaciones),
                         (200, 'Alistada', 'plano.txt', None, 'Nota previa'))
        self.assertEqual(self.ultimo_historial(f)['estado_anterior'], 'Detenida')

    def test_el_numero_de_confirmacion_se_conserva(self):
        f = self.factura(estado='Autorizada', numero_confirmacion='CONF-2025-0003')
        r = self.accion(f, 'generar_numero_confirmacion')
        self.assertEqual((r.status_code, f.numero_confirmacion), (200, 'CONF-2025-0003'))
        f = self.factura(estado='Autorizada', numero='FAC-F-2')
        self.accion(f, 'confirmar_control_pago')
        self.assertEqual(f.numero_confirmacion, 'CONF-2026-0001')

    # ------------------------------------------------------------------ rechazos y devoluciones
    def test_rechazo_en_auditoria(self):
        f = self.factura(estado='Alistada')
        self.assertEqual(self.accion(f, 'rechazar_auditoria', 'Auditoría', motivo='corto').data,
                         {'error': 'Debe registrar un motivo de rechazo (mínimo 10 caracteres)'})
        marca = self.marca()
        r = self.accion(f, 'rechazar_auditoria', 'Auditoría', motivo=MOTIVO)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((f.estado, f.etapa_actual, f.usuario_responsable, f.fecha_inicio_etapa, f.observaciones),
                         ('Rechazada Auditoría', 'Tesorería - Ajustes internos', None, HOY,
                          f'Nota previa\n[Auditoría - Rechazo] {MOTIVO}'))
        self.assertFalse(models.RechazoDevolucion.objects.filter(factura=f).exists())
        self.assertEqual(self.ultimo_historial(f)['observacion'], MOTIVO)
        self.assertEqual(set(self.notificados(marca)), {'Usuario Funcionario', 'Usuario Tesorería'})

    def test_rechazo_en_rectoria(self):
        f = self.factura(estado='Enviada Rectoría')
        marca = self.marca()
        r = self.accion(f, 'rechazar_rectoria', 'Rectoría', motivo=MOTIVO)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((f.estado, f.etapa_actual, f.usuario_responsable),
                         ('Rechazada por Rectoría', 'Corrección Dirección Financiera', None))
        self.assertTrue(f.observaciones.endswith(f'\n[Rectoría - Rechazo] {MOTIVO}'))
        self.assertEqual(list(models.RechazoDevolucion.objects.filter(factura=f).values(
            'tipo', 'etapa_rechazo', 'motivo', 'estado_devolucion', 'usuario_rechaza')),
            [{'tipo': 'Rechazo', 'etapa_rechazo': 'Rectoría', 'motivo': MOTIVO,
              'estado_devolucion': 'Pendiente Corrección', 'usuario_rechaza': self.u['Rectoría'].id}])
        self.assertEqual(self.notificados(marca), {'Usuario Funcionario': ('FACTURA_ETAPA_ACTUALIZADA', 'alta'),
                                                   'Usuario Dirección Financiera': ('FACTURA_ETAPA_ACTUALIZADA', 'alta')})
        # Desde el rechazo de Rectoría, Dirección Financiera la vuelve a cargar
        r = self.accion(f, 'cargar_direccion_financiera', 'Dirección Financiera')
        self.assertEqual((r.status_code, f.estado), (200, 'Cargada'))

    def test_detener_en_tesoreria(self):
        f = self.factura(estado='Causada')
        self.assertEqual(self.accion(f, 'detener_en_tesoreria', 'Tesorería', observaciones='corta').data,
                         {'error': 'Debe registrar una observación de al menos 10 caracteres'})
        marca = self.marca()
        r = self.accion(f, 'detener_en_tesoreria', 'Tesorería', observaciones=MOTIVO)
        self.assertEqual(r.status_code, 200)
        self.assertEqual((f.estado, f.etapa_actual, f.usuario_responsable, f.observaciones),
                         ('Detenida', 'Tesorería - Ajustes internos', self.u['Tesorería'],
                          f'Nota previa\n[Tesorería - Detenida] {MOTIVO}'))
        self.assertEqual(set(self.notificados(marca)), {'Usuario Funcionario'})

    def test_rechazar_segun_rol_y_destino(self):
        casos = [
            # (estado inicial, quien, destino, estado final, etapa final, responsable final)
            ('Causada', 'Funcionario', 'radicacion', 'Devuelta', 'Devolución', None),
            ('Causada', 'Contabilidad', 'Radicacion', 'Radicada', 'Corrección Radicación', None),
            ('Alistada', 'Tesorería', 'proveedor', 'Devuelta', 'Corrección Proveedor', 'Funcionario'),
            ('Alistada', 'Tesorería', 'funcionario', 'Registrada', 'Corrección Funcionario', 'Funcionario'),
            ('Radicada', 'Contabilidad', '', 'Registrada', 'Corrección Funcionario', 'Funcionario'),
            ('Cargada', 'Dirección Financiera', 'otro', 'Devuelta', 'Devolución', None),
        ]
        for n, (inicial, quien, destino, estado, etapa, responsable) in enumerate(casos):
            with self.subTest(inicial=inicial, quien=quien, destino=destino):
                f = self.factura(estado=inicial, numero=f'FAC-R-{n}', ciclo_documental_actual=2)
                marca = self.marca()
                r = self.accion(f, 'rechazar', quien, motivo=MOTIVO, destino=destino)
                self.assertEqual((r.status_code, r.data), (200, {'mensaje': f'Factura rechazada y enviada a {estado}'}))
                self.assertEqual((f.estado, f.etapa_actual, f.ciclo_documental_actual, f.fecha_inicio_etapa),
                                 (estado, etapa, 3, HOY))
                self.assertEqual(f.usuario_responsable, self.u[responsable] if responsable else None)
                self.assertEqual(list(models.RechazoDevolucion.objects.filter(factura=f).values_list('etapa_rechazo', 'motivo')),
                                 [('Etapa previa', MOTIVO)])
                self.assertEqual(self.ultimo_historial(f)['accion'], 'Factura devuelta')
                notificados = self.notificados(marca)
                devuelta = estado == 'Devuelta' or etapa == 'Corrección Funcionario'
                self.assertEqual(notificados['Usuario Funcionario'],
                                 ('FACTURA_DEVUELTA', 'alta') if devuelta else ('FACTURA_ETAPA_ACTUALIZADA', 'media'))
        self.assertEqual(self.accion(f, 'rechazar', motivo='corto').data,
                         {'error': 'El motivo de rechazo/devolución es obligatorio (mínimo 10 caracteres).'})

    def test_la_devolucion_avisa_el_motivo_al_creador(self):
        f = self.factura(estado='Cargada')
        marca = self.marca()
        self.accion(f, 'rechazar', 'Dirección Financiera', motivo=MOTIVO)
        aviso = Notificacion.objects.get(id__gt=marca, id_usuario=self.u['Funcionario'].id)
        self.assertEqual(aviso.mensaje, f'La factura FAC-F-1 ha sido devuelta para corrección. Motivo: {MOTIVO}. '
                                        'Por favor, realiza los ajustes necesarios y vuelve a enviarla.')
        otros = Notificacion.objects.filter(id__gt=marca).exclude(id_usuario=self.u['Funcionario'].id)
        self.assertEqual([n.mensaje for n in otros], [
            'La factura FAC-F-1 ha avanzado en su proceso de revisión. Estado anterior: Cargada. Estado actual: Devuelta. '
            'Puedes revisar los detalles en tu panel de facturas.'])
        self.assertNotIn(self.inactivo.id, Notificacion.objects.filter(id__gt=marca).values_list('id_usuario', flat=True))
