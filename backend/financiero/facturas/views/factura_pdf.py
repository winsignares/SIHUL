import hashlib
import logging
from io import BytesIO
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from financiero.facturas.models import DocumentoAdjunto, DocumentoUnificado
from financiero.facturas.upload_paths import _safe_path_segment


from .helpers import _documento_bytes, _factura_ciclo_documental_actual

logger = logging.getLogger(__name__)


class FacturaPdfMixin:
    """Generacion de PDF unificado / portada del expediente."""


    def _build_pdf_page(self, titulo, lineas):
        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        y = height - 50

        pdf.setFont('Helvetica-Bold', 14)
        pdf.drawString(40, y, titulo)
        y -= 24
        pdf.setFont('Helvetica', 10)

        for linea in lineas:
            for segmento in str(linea).split('\n'):
                pdf.drawString(40, y, segmento[:110])
                y -= 16
                if y < 60:
                    pdf.showPage()
                    pdf.setFont('Helvetica', 10)
                    y = height - 50

        pdf.save()
        return output.getvalue()


    def _build_portada_factura(self, factura, documentos, scope):
        """Genera una portada profesional e informativa para el PDF consolidado."""
        output = BytesIO()
        pdf = canvas.Canvas(output, pagesize=letter)
        width, height = letter
        
        # Colores
        COLOR_HEADER = colors.HexColor('#1e40af')
        COLOR_ACCENT = colors.HexColor('#0369a1')
        COLOR_TEXT = colors.HexColor('#1f2937')
        COLOR_LIGHT = colors.HexColor('#f3f4f6')
        
        # Encabezado con fondo
        pdf.setFillColor(COLOR_HEADER)
        pdf.rect(0, height - 100, width, 100, fill=1, stroke=0)
        
        # Título principal
        pdf.setFont('Helvetica-Bold', 24)
        pdf.setFillColor(colors.white)
        pdf.drawString(40, height - 50, 'DOCUMENTACIÓN CONSOLIDADA')
        
        # Número de factura
        pdf.setFont('Helvetica-Bold', 16)
        pdf.setFillColor(colors.HexColor('#fbbf24'))
        pdf.drawString(40, height - 75, f'Factura: {factura.numero_factura}')
        
        y = height - 120
        
        # Sección 1: Información de la Factura
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '📋 INFORMACIÓN DE LA FACTURA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        info_factura = [
            ('Número Factura:', factura.numero_factura),
            ('Estado Actual:', factura.estado or 'N/A'),
            ('Etapa:', factura.etapa_actual or 'N/A'),
            ('Fecha Factura:', str(factura.fecha_factura) if factura.fecha_factura else 'N/A'),
            ('Fecha Recepción:', str(factura.fecha_recepcion) if factura.fecha_recepcion else 'N/A'),
        ]
        
        for label, valor in info_factura:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 2: Información del Proveedor
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '👤 INFORMACIÓN DEL PROVEEDOR')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        proveedor = factura.proveedor
        info_proveedor = [
            ('Razón Social:', getattr(proveedor, 'razon_social', 'N/A') if proveedor else 'N/A'),
            ('NIT:', getattr(proveedor, 'nit', 'N/A') if proveedor else 'N/A'),
            ('Email:', getattr(proveedor, 'email', 'N/A') if proveedor else 'N/A'),
        ]
        
        for label, valor in info_proveedor:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 3: Información Financiera
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '💰 INFORMACIÓN FINANCIERA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        info_financiera = [
            ('Subtotal:', f'${float(factura.valor_subtotal or 0):,.2f}'),
            ('IVA:', f'${float(factura.valor_iva or 0):,.2f}'),
            ('Total:', f'${float(factura.valor_total or 0):,.2f}'),
        ]
        
        for label, valor in info_financiera:
            pdf.drawString(50, y, f'{label}')
            pdf.setFont('Helvetica-Bold', 10)
            pdf.drawString(200, y, str(valor))
            pdf.setFont('Helvetica', 10)
            y -= 16
        
        y -= 10
        
        # Sección 4: Información Operativa
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, '⚙️ INFORMACIÓN OPERATIVA')
        y -= 20
        
        pdf.setFont('Helvetica', 10)
        pdf.setFillColor(COLOR_TEXT)
        
        dias_transcurridos = factura.dias_transcurridos or 0
        info_operativa = [
            ('Días Transcurridos:', f'{dias_transcurridos} días'),
            ('Área Solicitante:', getattr(factura.departamento, 'nombre', 'N/A') if factura.departamento else 'N/A'),
            ('Observaciones:', (factura.observaciones or 'Sin observaciones')[:50]),
        ]
        
        for label, valor in info_operativa:
            pdf.drawString(50, y, f'{label}')
            pdf.drawString(200, y, str(valor)[:60])
            y -= 16
        
        y -= 10
        
        # Sección 5: Documentos Incluidos
        pdf.setFont('Helvetica-Bold', 12)
        pdf.setFillColor(COLOR_ACCENT)
        pdf.drawString(40, y, f'📎 DOCUMENTOS INCLUIDOS ({len(documentos)})')
        y -= 20
        
        pdf.setFont('Helvetica', 9)
        pdf.setFillColor(COLOR_TEXT)
        
        for idx, doc in enumerate(documentos, 1):
            doc_text = f'{idx}. {doc.tipo_documento} - {doc.nombre_archivo}'
            pdf.drawString(50, y, doc_text[:80])
            y -= 14
            if y < 60:
                pdf.showPage()
                y = height - 50
        
        # Pie de página
        pdf.setFont('Helvetica', 8)
        pdf.setFillColor(colors.HexColor('#9ca3af'))
        pdf.drawString(40, 30, f'Generado: {timezone.now().strftime("%d/%m/%Y %H:%M:%S")} | Scope: {scope}')
        
        pdf.save()
        return output.getvalue()


    def _append_pdf_bytes(self, writer, raw_bytes):
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(raw_bytes))
            for page in reader.pages:
                writer.add_page(page)
            return True
        except Exception:
            return False


    def _append_image_bytes_as_pdf(self, writer, raw_bytes):
        try:
            from PIL import Image
            image = Image.open(BytesIO(raw_bytes))
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            output = BytesIO()
            image.save(output, format='PDF')
            output.seek(0)
            return self._append_pdf_bytes(writer, output.read())
        except Exception:
            return False


    def _documento_bytes(self, documento):
        return _documento_bytes(documento)


    def _guardar_pdf_unificado(self, factura, content, scope):
        safe_scope = _safe_path_segment(scope or 'all')
        safe_factura = _safe_path_segment(factura.numero_factura or f'factura-{factura.id}')
        nombre_archivo = f'Documentos_{safe_factura}_{safe_scope}.pdf'
        ciclo_documental = _factura_ciclo_documental_actual(factura)

        from financiero.facturas.shared_storage import shared_storage
        result = shared_storage.copy_unified_pdf(content, factura, scope)

        DocumentoUnificado.objects.update_or_create(
            factura=factura,
            scope=scope or 'all',
            ciclo_documental=ciclo_documental,
            defaults={
                'nombre_archivo': nombre_archivo,
                'tipo_mime': 'application/pdf',
                'tamano_bytes': len(content),
                'contenido_archivo': None,
                'hash_archivo': hashlib.sha256(content).hexdigest(),
                'nas_relative_path': result.nas_relative_path or '',
                'nas_storage_status': (
                    DocumentoAdjunto.NAS_STATUS_STORED if result.success
                    else (result.error_code or DocumentoAdjunto.NAS_STATUS_FAILED)
                ),
            },
        )

        if not result.success:
            logger.warning(
                '[SHARED_STORAGE] PDF unificado no copiado al NAS. factura_id=%s error_code=%s message=%s',
                factura.id, result.error_code, result.message,
            )


    def _pdf_consolidado_documentos(self, factura, documentos, scope, incluir_portada=True, guardar=True):
        try:
            from pypdf import PdfWriter
        except Exception:
            PdfWriter = None

        if PdfWriter is None:
            return self._build_pdf_page(
                f'Documentacion consolidada - {factura.numero_factura}',
                [
                    f'Scope solicitado: {scope}',
                    'No fue posible consolidar los soportes porque el motor PDF no esta disponible en el servidor.',
                ],
            )

        writer = PdfWriter()
        if incluir_portada:
            portada = self._build_portada_factura(factura, documentos, scope)
            self._append_pdf_bytes(writer, portada)

        if not documentos:
            buffer = BytesIO()
            writer.write(buffer)
            content = buffer.getvalue()
            if guardar:
                self._guardar_pdf_unificado(factura, content, scope)
            return content

        for documento in documentos:
            raw_bytes = self._documento_bytes(documento)
            lower_name = (documento.nombre_archivo or '').lower()
            lower_mime = (documento.tipo_mime or '').lower()
            merged = False

            if raw_bytes is not None:
                if lower_name.endswith('.pdf') or lower_mime == 'application/pdf':
                    merged = self._append_pdf_bytes(writer, raw_bytes)
                elif lower_name.endswith(('.png', '.jpg', '.jpeg')) or lower_mime in {'image/png', 'image/jpeg'}:
                    merged = self._append_image_bytes_as_pdf(writer, raw_bytes)
                elif lower_name.endswith('.txt') or lower_mime in {'text/plain', 'application/octet-stream'}:
                    try:
                        texto = raw_bytes.decode('utf-8', errors='replace')
                        lineas = [f'Archivo: {documento.nombre_archivo}', '']
                        lineas += texto.splitlines()
                        resumen = self._build_pdf_page('Archivo Plano SEVEN', lineas)
                        merged = self._append_pdf_bytes(writer, resumen)
                    except Exception:
                        pass

            if not merged:
                resumen = self._build_pdf_page(
                    f'Soporte no integrado: {documento.tipo_documento}',
                    [
                        f'Archivo: {documento.nombre_archivo}',
                        f'Tipo MIME: {documento.tipo_mime or "No registrado"}',
                        f'Fecha de carga: {documento.fecha_carga}',
                        '',
                        'Este soporte no pudo integrarse como pagina PDF, pero hace parte del expediente de la factura.',
                        f'URL registrada: {documento.url_storage or "Sin URL disponible"}',
                    ],
                )
                self._append_pdf_bytes(writer, resumen)

        buffer = BytesIO()
        writer.write(buffer)
        content = buffer.getvalue()
        if guardar:
            self._guardar_pdf_unificado(factura, content, scope)
        return content
