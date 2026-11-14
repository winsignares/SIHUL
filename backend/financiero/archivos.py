"""Archivos que genera el módulo financiero, sin depender de la petición HTTP ni de la carpeta compartida.

- `archivo_plano_a_pdf`: el TXT de Tesorería convertido a PDF legible (Courier, líneas largas partidas).
- `pagina_de_texto`: una página PDF con título y líneas (archivo plano dentro del expediente, avisos).
- `portada_factura` y `expediente`: el PDF consolidado de la factura, con su portada y cada soporte.
- `reporte_excel` y `reporte_pdf`: el reporte financiero con una fila o línea por factura.
"""
import os
import textwrap
from io import BytesIO

from django.utils import timezone
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

ENCABEZADOS_REPORTE = [
    'Numero Factura', 'Proveedor', 'NIT', 'Departamento', 'Estado', 'Valor Total',
    'Fecha Recepcion', 'Fecha Autorizacion', 'Fecha Pago Aplicado', 'Fecha Comprobante',
    'Numero Transaccion', 'Numero Comprobante'
]


# ------------------------------------------------------------------ archivo plano
def nombre_pdf_archivo_plano(nombre_archivo):
    base, _extension = os.path.splitext(os.path.basename(nombre_archivo or 'archivo_plano'))
    return f'{base or "archivo_plano"}.pdf'[:255]


def archivo_plano_a_pdf(content_bytes):
    """Convierte el contenido de un archivo plano a un PDF legible y paginado."""
    try:
        texto = content_bytes.decode('utf-8-sig')
    except UnicodeDecodeError:
        texto = content_bytes.decode('latin-1', errors='replace')

    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    _width, height = letter
    pdf.setFont('Courier', 7.5)
    y = height - 42
    lineas = texto.splitlines() or ['(El archivo plano no contiene líneas visibles.)']
    for linea in lineas:
        # Courier conserva la estructura tabular del TXT al abrirlo como PDF.
        segmentos = textwrap.wrap(
            linea.expandtabs(4), width=118, replace_whitespace=False,
            drop_whitespace=False, break_long_words=True,
        ) or ['']
        for segmento in segmentos:
            pdf.drawString(40, y, segmento)
            y -= 10
            if y < 48:
                pdf.showPage()
                pdf.setFont('Courier', 7.5)
                y = height - 42

    pdf.save()
    return output.getvalue()


# ------------------------------------------------------------------ expediente
def pagina_de_texto(titulo, lineas):
    """Título y líneas (cortadas a 110 caracteres), con las páginas que hagan falta."""
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


def _seccion(pdf, y, titulo, filas, color_titulo, color_texto, valor_en_negrita=False, recorte=60):
    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColor(color_titulo)
    pdf.drawString(40, y, titulo)
    y -= 20

    pdf.setFont('Helvetica', 10)
    pdf.setFillColor(color_texto)
    for label, valor in filas:
        pdf.drawString(50, y, f'{label}')
        if valor_en_negrita:
            pdf.setFont('Helvetica-Bold', 10)
            pdf.drawString(200, y, str(valor))
            pdf.setFont('Helvetica', 10)
        else:
            pdf.drawString(200, y, str(valor)[:recorte])
        y -= 16
    return y - 10


def portada_factura(factura, documentos, scope):
    """Portada del expediente: datos de la factura, del proveedor, financieros, operativos y lista de soportes."""
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    width, height = letter

    color_encabezado = colors.HexColor('#1e40af')
    color_seccion = colors.HexColor('#0369a1')
    color_texto = colors.HexColor('#1f2937')

    # Encabezado con fondo
    pdf.setFillColor(color_encabezado)
    pdf.rect(0, height - 100, width, 100, fill=1, stroke=0)

    pdf.setFont('Helvetica-Bold', 24)
    pdf.setFillColor(colors.white)
    pdf.drawString(40, height - 50, 'DOCUMENTACIÓN CONSOLIDADA')

    pdf.setFont('Helvetica-Bold', 16)
    pdf.setFillColor(colors.HexColor('#fbbf24'))
    pdf.drawString(40, height - 75, f'Factura: {factura.numero_factura}')

    y = height - 120
    y = _seccion(pdf, y, '📋 INFORMACIÓN DE LA FACTURA', [
        ('Número Factura:', factura.numero_factura),
        ('Estado Actual:', factura.estado or 'N/A'),
        ('Etapa:', factura.etapa_actual or 'N/A'),
        ('Fecha Factura:', str(factura.fecha_factura) if factura.fecha_factura else 'N/A'),
        ('Fecha Recepción:', str(factura.fecha_recepcion) if factura.fecha_recepcion else 'N/A'),
    ], color_seccion, color_texto)

    proveedor = factura.proveedor
    y = _seccion(pdf, y, '👤 INFORMACIÓN DEL PROVEEDOR', [
        ('Razón Social:', getattr(proveedor, 'razon_social', 'N/A') if proveedor else 'N/A'),
        ('NIT:', getattr(proveedor, 'nit', 'N/A') if proveedor else 'N/A'),
        ('Email:', getattr(proveedor, 'email', 'N/A') if proveedor else 'N/A'),
    ], color_seccion, color_texto)

    y = _seccion(pdf, y, '💰 INFORMACIÓN FINANCIERA', [
        ('Subtotal:', f'${float(factura.valor_subtotal or 0):,.2f}'),
        ('IVA:', f'${float(factura.valor_iva or 0):,.2f}'),
        ('Total:', f'${float(factura.valor_total or 0):,.2f}'),
    ], color_seccion, color_texto, valor_en_negrita=True)

    dias_transcurridos = factura.dias_transcurridos or 0
    y = _seccion(pdf, y, '⚙️ INFORMACIÓN OPERATIVA', [
        ('Días Transcurridos:', f'{dias_transcurridos} días'),
        ('Área Solicitante:', getattr(factura.departamento, 'nombre', 'N/A') if factura.departamento else 'N/A'),
        ('Observaciones:', (factura.observaciones or 'Sin observaciones')[:50]),
    ], color_seccion, color_texto)

    # Documentos incluidos
    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColor(color_seccion)
    pdf.drawString(40, y, f'📎 DOCUMENTOS INCLUIDOS ({len(documentos)})')
    y -= 20

    pdf.setFont('Helvetica', 9)
    pdf.setFillColor(color_texto)
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


def _agregar_pdf(writer, raw_bytes):
    try:
        from pypdf import PdfReader
        reader = PdfReader(BytesIO(raw_bytes))
        for page in reader.pages:
            writer.add_page(page)
        return True
    except Exception:
        return False


def _agregar_imagen(writer, raw_bytes):
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
        return _agregar_pdf(writer, output.read())
    except Exception:
        return False


def _agregar_soporte(writer, documento, raw_bytes):
    """Agrega el soporte según su tipo; si no se puede, agrega una página que lo describe."""
    lower_name = (documento.nombre_archivo or '').lower()
    lower_mime = (documento.tipo_mime or '').lower()
    merged = False

    if raw_bytes is not None:
        if lower_name.endswith('.pdf') or lower_mime == 'application/pdf':
            merged = _agregar_pdf(writer, raw_bytes)
        elif lower_name.endswith(('.png', '.jpg', '.jpeg')) or lower_mime in {'image/png', 'image/jpeg'}:
            merged = _agregar_imagen(writer, raw_bytes)
        elif lower_name.endswith('.txt') or lower_mime in {'text/plain', 'application/octet-stream'}:
            try:
                texto = raw_bytes.decode('utf-8', errors='replace')
                lineas = [f'Archivo: {documento.nombre_archivo}', '']
                lineas += texto.splitlines()
                merged = _agregar_pdf(writer, pagina_de_texto('Archivo Plano SEVEN', lineas))
            except Exception:
                pass

    if not merged:
        _agregar_pdf(writer, pagina_de_texto(
            f'Soporte no integrado: {documento.tipo_documento}',
            [
                f'Archivo: {documento.nombre_archivo}',
                f'Tipo MIME: {documento.tipo_mime or "No registrado"}',
                f'Fecha de carga: {documento.fecha_carga}',
                '',
                'Este soporte no pudo integrarse como pagina PDF, pero hace parte del expediente de la factura.',
                f'URL registrada: {documento.url_storage or "Sin URL disponible"}',
            ],
        ))


def expediente(factura, documentos, scope, leer_documento, incluir_portada=True):
    """PDF consolidado de la factura: portada (opcional) y cada soporte, leído con `leer_documento(documento)`.

    Devuelve (contenido, consolidado). `consolidado` es False si el servidor no tiene el motor para unir PDF; en ese
    caso el contenido es solo una página de aviso.
    """
    try:
        from pypdf import PdfWriter
    except Exception:
        PdfWriter = None

    if PdfWriter is None:
        return pagina_de_texto(
            f'Documentacion consolidada - {factura.numero_factura}',
            [
                f'Scope solicitado: {scope}',
                'No fue posible consolidar los soportes porque el motor PDF no esta disponible en el servidor.',
            ],
        ), False

    writer = PdfWriter()
    if incluir_portada:
        _agregar_pdf(writer, portada_factura(factura, documentos, scope))

    for documento in documentos:
        _agregar_soporte(writer, documento, leer_documento(documento))

    buffer = BytesIO()
    writer.write(buffer)
    return buffer.getvalue(), True


# ------------------------------------------------------------------ reporte financiero
def reporte_excel(filas):
    wb = Workbook()
    ws = wb.active
    ws.title = 'Reporte Financiero'
    ws.append(ENCABEZADOS_REPORTE)
    for fila in filas:
        ws.append(fila)

    output = BytesIO()
    wb.save(output)
    return output.getvalue()


def reporte_pdf(tipo_reporte, filas):
    """Encabezado y una línea por factura: número | proveedor | estado | valor total."""
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=letter)
    _, height = letter

    pdf.setFont('Helvetica-Bold', 12)
    pdf.drawString(40, height - 40, f'Reporte Financiero - {tipo_reporte}')
    pdf.setFont('Helvetica', 9)
    pdf.drawString(40, height - 55, f'Generado: {timezone.now().strftime("%Y-%m-%d %H:%M") }')
    pdf.drawString(40, height - 70, f'Registros: {len(filas)}')

    y = height - 95
    for fila in filas:
        pdf.drawString(40, y, f"{fila[0]} | {fila[1][:22]} | {fila[4]} | ${fila[5]:,.0f}")
        y -= 13
        if y < 50:
            pdf.showPage()
            pdf.setFont('Helvetica', 9)
            y = height - 40

    pdf.save()
    return output.getvalue()
