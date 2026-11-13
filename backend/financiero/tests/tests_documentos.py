"""Archivos que genera el módulo financiero: caracterización del contenido actual.

- Expediente consolidado (documentos_consolidados, comprobante_pdf, documentos_historial_zip): portada con los datos de la
  factura y la lista de soportes; luego cada soporte como páginas (PDF), imagen convertida, archivo plano en texto o una
  página que avisa que no se pudo integrar.
- Archivo plano TXT subido como soporte: se guarda convertido a PDF, en Courier, con las líneas largas partidas.
- Reporte financiero (reportes/exportar): Excel con una fila por factura o PDF con una línea por factura.
"""
import datetime
import io
import zipfile
from datetime import date
from unittest import mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from openpyxl import load_workbook
from PIL import Image
from pypdf import PdfReader
from reportlab.pdfgen import canvas
from rest_framework.test import APIClient

from identidad.usuarios.models import Rol, Usuario

from .. import models
from ..services.shared_storage_service import StorageResult

AHORA = timezone.make_aware(datetime.datetime(2026, 11, 11, 15, 30))


def _pdf(*paginas):
    b = io.BytesIO()
    c = canvas.Canvas(b)
    for texto in paginas:
        c.drawString(50, 700, texto)
        c.showPage()
    c.save()
    return b.getvalue()


def _png():
    b = io.BytesIO()
    Image.new('RGBA', (40, 30), 'red').save(b, format='PNG')
    return b.getvalue()


def _paginas(contenido):
    return [p.extract_text().strip() for p in PdfReader(io.BytesIO(contenido)).pages]


class DocumentosFinancieroTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.u = {}
        for rol in ('Funcionario', 'Contabilidad', 'Proveedor'):
            r = Rol.objects.get_or_create(nombre=rol)[0]
            cls.u[rol] = Usuario.objects.create_user(correo=f'{rol[:5].lower()}@docs.test', nombre=f'Usuario {rol}', rol=r)
        cls.proveedor = models.Proveedor.objects.create(nit='900789', razon_social='Proveedor Docs S.A.S.',
                                                         tipo_proveedor='Servicios', usuario=cls.u['Proveedor'],
                                                         email='proveedor@docs.test')
        departamento = models.Departamento.objects.create(codigo='DD', nombre='Facultad de Ingeniería', tipo='Administrativo')
        cls.factura = models.Factura.objects.create(
            numero_factura='FAC-DOC-1', proveedor=cls.proveedor, departamento=departamento, valor_subtotal=1000,
            valor_iva=190, valor_total=1190, tipo_documento='Factura', fecha_factura=date(2026, 10, 1),
            fecha_recepcion=date(2026, 10, 2), creado_por=cls.u['Funcionario'], estado='Pagada',
            etapa_actual='Pago Aplicado', numero_transaccion='TRX-1', numero_comprobante='CMP-1',
            fecha_autorizacion=date(2026, 10, 20), fecha_pago_aplicado=date(2026, 10, 25))
        for tipo, nombre, mime, contenido, rol in (
            ('Factura', 'factura.pdf', 'application/pdf', _pdf('Hoja uno', 'Hoja dos'), 'Proveedor'),
            ('Orden de Compra', 'orden.png', 'image/png', _png(), 'Funcionario'),
            ('Contrato', 'plano.txt', 'text/plain', b'linea A\nlinea B', 'Contabilidad'),
            ('Soporte Adicional', 'roto.pdf', 'application/pdf', b'no es pdf', 'Contabilidad'),
        ):
            models.DocumentoAdjunto.objects.create(factura=cls.factura, tipo_documento=tipo, nombre_archivo=nombre,
                                                   tipo_mime=mime, contenido_archivo=contenido, cargado_por=cls.u[rol])

    def setUp(self):
        reloj = mock.patch('django.utils.timezone.now', return_value=AHORA)
        reloj.start()
        self.addCleanup(reloj.stop)
        self.guardados = {}

        def copiar(factura, index, original_filename, content_bytes):
            self.guardados[original_filename] = content_bytes
            return StorageResult(True, nas_relative_path=f'facturas/{original_filename}')

        self.nas = mock.MagicMock()
        self.nas.enabled = True
        self.nas.copy_document.side_effect = copiar
        self.nas.copy_unified_pdf.return_value = StorageResult(True, nas_relative_path='facturas/unificado.pdf')
        self.nas.read_file.return_value = StorageResult(False, error_code='NOT_FOUND')
        nas = mock.patch('financiero.services.shared_storage_service.shared_storage', self.nas)
        nas.start()
        self.addCleanup(nas.stop)
        self.client = APIClient()
        self.client.force_authenticate(user=self.u['Contabilidad'])
        self.base = f'/api/financiero/facturas/{self.factura.id}'

    # ------------------------------------------------------------------ expediente
    def test_expediente_consolidado(self):
        r = self.client.get(f'{self.base}/documentos_consolidados/')
        self.assertEqual((r.status_code, r['Content-Type']), (200, 'application/pdf'))
        self.assertEqual(r['Content-Disposition'], 'inline; filename="Documentos_FAC-DOC-1_contabilidad.pdf"')
        portada, hoja1, hoja2, imagen, plano, roto = _paginas(r.content)
        for texto in ('DOCUMENTACIÓN CONSOLIDADA', 'Factura: FAC-DOC-1', 'Estado Actual:', 'Pagada',
                      'Razón Social:', 'Proveedor Docs S.A.S.', 'Total:', '$1,190.00', 'Facultad de Ingeniería',
                      'DOCUMENTOS INCLUIDOS (4)', '1. Factura - factura.pdf', '4. Soporte Adicional - roto.pdf',
                      'Generado: 11/11/2026 15:30:00 | Scope: contabilidad'):
            self.assertIn(texto, portada)
        self.assertEqual((hoja1, hoja2), ('Hoja uno', 'Hoja dos'))
        self.assertEqual(imagen, '')  # la imagen entra como página sin texto
        self.assertEqual(plano.splitlines(), ['Archivo Plano SEVEN', 'Archivo: plano.txt', 'linea A', 'linea B'])
        self.assertEqual(roto.splitlines()[:3], ['Soporte no integrado: Soporte Adicional', 'Archivo: roto.pdf',
                                                 'Tipo MIME: application/pdf'])
        unificado = models.DocumentoUnificado.objects.get(factura=self.factura)
        self.assertEqual((unificado.scope, unificado.nombre_archivo, unificado.tamano_bytes, unificado.nas_relative_path),
                         ('contabilidad', 'Documentos_FAC-DOC-1_contabilidad.pdf', len(r.content), 'facturas/unificado.pdf'))

    def test_expediente_por_alcance_y_documento_puntual(self):
        r = self.client.get(f'{self.base}/documentos_consolidados/?scope=proveedor&descargar=1')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="Documentos_FAC-DOC-1_proveedor.pdf"')
        paginas = _paginas(r.content)
        self.assertIn('DOCUMENTOS INCLUIDOS (1)', paginas[0])
        self.assertEqual(paginas[1:], ['Hoja uno', 'Hoja dos'])
        plano = models.DocumentoAdjunto.objects.get(nombre_archivo='plano.txt')
        r = self.client.get(f'{self.base}/documentos_consolidados/?doc_id={plano.id}')
        self.assertEqual([p.splitlines()[0] for p in _paginas(r.content)], ['Archivo Plano SEVEN'])  # sin portada
        self.assertEqual(models.DocumentoUnificado.objects.filter(factura=self.factura).values_list('scope', flat=True).get(),
                         'proveedor')  # el documento puntual no reemplaza el expediente guardado
        r = self.client.get(f'{self.base}/documentos_consolidados/?doc_id=999999')
        self.assertEqual((r.status_code, r.data), (404, {'error': 'El documento solicitado no está disponible.'}))

    def test_expediente_en_zip_y_comprobante(self):
        r = self.client.get(f'{self.base}/documentos_historial_zip/')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="Expediente_FAC-DOC-1.zip"')
        z = zipfile.ZipFile(io.BytesIO(r.content))
        self.assertEqual(z.namelist(), [
            'unificados/expediente_unificado.pdf', 'especificos/Factura/01-factura.pdf',
            'especificos/Orden-de-Compra/02-orden.png', 'especificos/Contrato/03-plano.txt',
            'especificos/Soporte-Adicional/04-roto.pdf'])
        self.assertEqual(z.read('especificos/Contrato/03-plano.txt'), b'linea A\nlinea B')
        self.assertEqual(len(_paginas(z.read('unificados/expediente_unificado.pdf'))), 6)

        r = self.client.get(f'{self.base}/comprobante_pdf/')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="Expediente_FAC-DOC-1.pdf"')
        self.assertEqual(len(_paginas(r.content)), 6)
        models.Factura.objects.filter(pk=self.factura.pk).update(estado='Autorizada')
        r = self.client.get(f'{self.base}/comprobante_pdf/')
        self.assertEqual((r.status_code, r.data), (400, {
            'error': 'La factura debe estar en pago aplicado o pagada para descargar el expediente.'}))

    # ------------------------------------------------------------------ archivo plano
    def test_el_archivo_plano_se_guarda_como_pdf(self):
        largo = 'X' * 130
        texto = 'uno\tdos\n' + largo + '\n' + '\n'.join(f'fila {i}' for i in range(80))
        r = self.client.post('/api/financiero/documentos/', {
            'factura': self.factura.id, 'tipo_documento': 'Archivo Plano Bancario', 'nombre_archivo': 'pagos.txt',
            'archivo': SimpleUploadedFile('pagos.txt', texto.encode('utf-8-sig'), 'text/plain')}, format='multipart')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual((r.data['nombre_archivo'], r.data['tipo_mime']), ('pagos.pdf', 'application/pdf'))
        paginas = _paginas(self.guardados['pagos.pdf'])
        lineas = [linea for p in paginas for linea in p.splitlines()]
        self.assertEqual(lineas[:4], ['uno dos', 'X' * 118, 'X' * 12, 'fila 0'])
        self.assertEqual(lineas[-1], 'fila 79')
        self.assertEqual(len(paginas), 2)
        self.assertEqual(len(paginas[0].splitlines()), 71)

    # ------------------------------------------------------------------ reporte financiero
    def test_reporte_en_excel(self):
        r = self.client.post('/api/financiero/reportes/exportar/', {'filtros': {'estado': 'Pagada'}}, format='json')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="consolidado_facturas_20261111_153000.xlsx"')
        hoja = load_workbook(io.BytesIO(r.content)).active
        self.assertEqual(hoja.title, 'Reporte Financiero')
        self.assertEqual([c.value for c in hoja[1]], [
            'Numero Factura', 'Proveedor', 'NIT', 'Departamento', 'Estado', 'Valor Total', 'Fecha Recepcion',
            'Fecha Autorizacion', 'Fecha Pago Aplicado', 'Fecha Comprobante', 'Numero Transaccion', 'Numero Comprobante'])
        self.assertEqual([c.value for c in hoja[2]], [
            'FAC-DOC-1', 'Proveedor Docs S.A.S.', '900789', 'Facultad de Ingeniería', 'Pagada', 1190, '2026-10-02',
            '2026-10-20', '2026-10-25', None, 'TRX-1', 'CMP-1'])  # la celda vacía se lee como None
        reporte = models.ReporteGenerado.objects.get()
        self.assertEqual((reporte.formato, reporte.cantidad_registros, reporte.tamano_archivo_bytes, reporte.parametros_filtros),
                         ('Excel', 1, len(r.content), {'estado': 'Pagada'}))

    def test_reporte_en_pdf(self):
        r = self.client.post('/api/financiero/reportes/exportar/', {'formato': 'PDF', 'tipo_reporte': 'pagos'}, format='json')
        self.assertEqual(r['Content-Disposition'], 'attachment; filename="pagos_20261111_153000.pdf"')
        self.assertEqual(_paginas(r.content)[0].splitlines(), [
            'Reporte Financiero - pagos', 'Generado: 2026-11-11 15:30', 'Registros: 1',
            'FAC-DOC-1 | Proveedor Docs S.A.S. | Pagada | $1,190'])
        r = self.client.post('/api/financiero/reportes/exportar/', {'formato': 'CSV'}, format='json')
        self.assertEqual((r.status_code, r.data), (400, {'error': 'Formato no soportado. Use Excel o PDF.'}))
