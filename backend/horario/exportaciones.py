"""
Archivos PDF y Excel de horarios.

Reciben la lista de horarios (los diccionarios que entrega el listado extendido) y devuelven los bytes del
archivo; las vistas se ocupan de la petición y la respuesta HTTP.

Cada horario se ubica en una cuadrícula de 6:00 a 21:00 por día de la semana, ocupando todas las horas
entre su inicio y su fin. Las variantes son:
- por grupo (Centro de Horarios y Mi horario del estudiante): una página u hoja por «grupo - programa»; la celda
  dice «Asignatura / DOCENTE» y el salón;
- por docente (también Mi horario del docente): una página u hoja por docente, con su facultad; la celda dice
  «Asignatura / GRUPO» y el salón.
"""
from io import BytesIO

import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

DIAS_ORDEN = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
DIAS_MAP = {
    'lunes': 'lunes',
    'martes': 'martes',
    'miercoles': 'miercoles',
    'miércoles': 'miercoles',
    'jueves': 'jueves',
    'viernes': 'viernes',
    'sabado': 'sabado',
    'sábado': 'sabado',
    'domingo': 'domingo'
}
DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
NUMEROS_ROMANOS = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']
# (etiqueta, clave): 06:00-07:00 … 20:00-21:00
HORAS_INTERVALOS = [(f"{h:02d}:00-{h+1:02d}:00", f"{h:02d}:00") for h in range(6, 21)]


# ---------------------------------------------------------------- agrupación y contenido de celdas
def agrupar_por_grupo(horarios):
    grupos = {}
    for h in horarios:
        grupo_key = f"{h.get('grupo_nombre', 'N/A')} - {h.get('programa_nombre', 'N/A')}"
        if grupo_key not in grupos:
            grupos[grupo_key] = []
        grupos[grupo_key].append(h)
    return grupos


def agrupar_por_docente(horarios):
    """{docente: {'facultad': programa del primer horario del docente, 'horarios': [...]}}"""
    docentes = {}
    for h in horarios:
        docente_key = h.get('docente_nombre', 'Sin asignar')
        facultad = h.get('programa_nombre', 'N/A')

        if docente_key not in docentes:
            docentes[docente_key] = {
                'facultad': facultad,
                'horarios': []
            }
        docentes[docente_key]['horarios'].append(h)
    return docentes


def normalizar_hora(hora_str):
    """«10:00:00» -> «10:00»."""
    if ':' in hora_str:
        partes = hora_str.split(':')
        return f"{partes[0]}:{partes[1]}"
    return hora_str


def formatear_asignatura(asignatura):
    """Mayúscula inicial en cada palabra y números romanos en mayúsculas: «calculo i» -> «Calculo I»."""
    palabras_fmt = []
    for palabra in asignatura.strip().split():
        if palabra.lower() in NUMEROS_ROMANOS:
            palabras_fmt.append(palabra.upper())
        else:
            palabras_fmt.append(palabra.capitalize())
    return ' '.join(palabras_fmt)


def celda_con_docente(h):
    """«Asignatura / DOCENTE» y el salón en otra línea; None si no hay asignatura."""
    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
    docente = str(h.get('docente_nombre', '')).strip() or ''
    espacio = str(h.get('espacio_nombre', '')).strip() or ''
    if not asignatura:
        return None
    docente_fmt = docente.upper() if docente and docente != "Sin asignar" else ""
    cell_content = f"{formatear_asignatura(asignatura)}"
    if docente_fmt:
        cell_content += f" / {docente_fmt}"
    if espacio:
        cell_content += f"\n{espacio}"
    return cell_content


def celda_con_grupo(separador_espacio):
    """«Asignatura / GRUPO» seguido del salón con `separador_espacio`; None si no hay asignatura."""
    def celda(h):
        asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
        grupo = str(h.get('grupo_nombre', '')).strip() or ''
        espacio = str(h.get('espacio_nombre', '')).strip() or ''
        if not asignatura:
            return None
        cell_content = f"{formatear_asignatura(asignatura)}"
        if grupo:
            cell_content += f" / {grupo}"
        if espacio:
            cell_content += f"{separador_espacio}{espacio}"
        return cell_content
    return celda


def cuadricula(horarios, contenido_celda):
    """{dia: {'HH:00': texto}} con cada horario en todas las horas que ocupa.

    Si las horas no se pueden leer como números, el texto queda solo bajo la hora de inicio tal como llegó
    (y no aparece en la tabla, que solo muestra las horas en punto). Los días desconocidos se ignoran.
    """
    dias_dict = {dia: {} for dia in DIAS_ORDEN}
    for h in horarios:
        dia_raw = h.get('dia_semana', '').lower().strip()
        hora_inicio = normalizar_hora(str(h.get('hora_inicio', '')).strip())
        hora_fin = normalizar_hora(str(h.get('hora_fin', '')).strip())
        dia = DIAS_MAP.get(dia_raw, dia_raw)

        if dia and hora_inicio and dia in dias_dict:
            cell_content = contenido_celda(h)
            if cell_content is None:
                continue
            try:
                hora_inicio_h = int(hora_inicio.split(':')[0])
                hora_fin_h = int(hora_fin.split(':')[0])
                for h_actual in range(hora_inicio_h, hora_fin_h):
                    dias_dict[dia][f"{h_actual:02d}:00"] = cell_content
            except Exception:
                dias_dict[dia][hora_inicio] = cell_content
    return dias_dict


def filas_de_texto(dias_dict):
    """Las filas de la cuadrícula como texto: [intervalo, lunes, …, domingo]."""
    return [[intervalo] + [dias_dict[dia].get(hora_key, '') for dia in DIAS_ORDEN]
            for intervalo, hora_key in HORAS_INTERVALOS]


# ---------------------------------------------------------------- PDF
def _tabla_pdf(dias_dict):
    cell_style = ParagraphStyle(
        'CellStyle',
        fontName='Helvetica',
        fontSize=5,
        leading=6,
        alignment=TA_CENTER,
    )
    table_data = [['Hora'] + DIAS_NOMBRES]
    for intervalo, hora_key in HORAS_INTERVALOS:
        row = [intervalo]
        for dia in DIAS_ORDEN:
            cell_text = dias_dict[dia].get(hora_key, '')
            if cell_text:
                row.append(Paragraph(cell_text.replace('\n', '<br/>'), cell_style))
            else:
                row.append('')
        table_data.append(row)

    # 1 columna de hora (0.8") + 7 de días (1.4") = 10.6", cabe en A4 horizontal
    col_widths = [0.8 * inch] + [1.4 * inch] * 7
    row_heights = [0.35 * inch] + [0.4 * inch] * (len(table_data) - 1)
    table = Table(table_data, colWidths=col_widths, rowHeights=row_heights)

    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#991B1B')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('BACKGROUND', (0, 1), (0, -1), colors.HexColor('#F3F4F6')),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (0, -1), 5),
        ('FONTSIZE', (1, 1), (-1, -1), 5),
        ('TOPPADDING', (1, 1), (-1, -1), 2),
        ('BOTTOMPADDING', (1, 1), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 3),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
    ])
    # Celdas con clase en azul
    for row_idx, (intervalo, hora_key) in enumerate(HORAS_INTERVALOS, start=1):
        for col_idx, dia in enumerate(DIAS_ORDEN, start=1):
            if hora_key in dias_dict[dia]:
                style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), colors.HexColor('#DBEAFE'))
    table.setStyle(style)
    return table


def _pdf(paginas):
    """`paginas`: [(títulos, dias_dict)]. Una página A4 horizontal por elemento."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                            rightMargin=30, leftMargin=30,
                            topMargin=30, bottomMargin=30)
    elements = []
    for titulos, dias_dict in paginas:
        table = _tabla_pdf(dias_dict)
        title_style = getSampleStyleSheet()['Heading3']
        for titulo in titulos:
            elements.append(Paragraph(f"<b>{titulo}</b>", title_style))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(table)
        elements.append(PageBreak())
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def pdf_por_grupo(horarios):
    return _pdf([([f"Grupo: {grupo_key}"], cuadricula(horarios_grupo, celda_con_docente))
                 for grupo_key, horarios_grupo in agrupar_por_grupo(horarios).items()])


def pdf_por_docente(horarios):
    return _pdf([([f"Docente: {docente_nombre}", f"Facultad: {info['facultad']}"],
                  cuadricula(info['horarios'], celda_con_grupo('\n')))
                 for docente_nombre, info in agrupar_por_docente(horarios).items()])


# ---------------------------------------------------------------- Excel
def _guardar(libro):
    buffer = BytesIO()
    libro.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()


def _borde_fino():
    return Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )


def excel_por_grupo(horarios):
    """Centro de Horarios: una hoja por grupo; solo las celdas de los días llevan borde y alineación."""
    wb = Workbook()
    wb.remove(wb.active)

    header_font = Font(bold=True, color="FFFFFF", size=12)
    header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")
    class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
    center_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    border = _borde_fino()

    for grupo_key, horarios_grupo in agrupar_por_grupo(horarios).items():
        dias_dict = cuadricula(horarios_grupo, celda_con_docente)
        ws = wb.create_sheet(title=grupo_key[:31])  # Excel limita el nombre a 31 caracteres

        ws.append(['Hora'] + DIAS_NOMBRES)
        for cell in ws[1]:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center_alignment
            cell.border = border

        for row in filas_de_texto(dias_dict):
            ws.append(row)

        for row_idx, (intervalo, hora_key) in enumerate(HORAS_INTERVALOS, start=2):
            for col_idx, dia in enumerate(DIAS_ORDEN, start=2):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell_text = dias_dict[dia].get(hora_key, '')
                cell.value = cell_text
                if cell_text:
                    cell.fill = class_fill
                cell.alignment = center_alignment
                cell.border = border

        ws.column_dimensions['A'].width = 14
        for col in 'BCDEFGH':
            ws.column_dimensions[col].width = 25
        for row in range(2, len(HORAS_INTERVALOS) + 2):
            ws.row_dimensions[row].height = 75

    if len(wb.sheetnames) == 0:
        ws = wb.create_sheet(title="Vacío")
        ws.append(['No hay horarios para mostrar'])
    return _guardar(wb)


def excel_por_docente(horarios):
    """Una hoja por docente con su nombre y facultad arriba y la tabla desde la fila 4."""
    workbook = openpyxl.Workbook()
    workbook.remove(workbook.active)

    for docente_nombre, info in agrupar_por_docente(horarios).items():
        facultad = info['facultad']
        dias_dict = cuadricula(info['horarios'], celda_con_grupo(' - '))
        table_data = [['Hora'] + DIAS_NOMBRES] + filas_de_texto(dias_dict)

        ws = workbook.create_sheet(title=f"{docente_nombre[:30]}")

        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")
        class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
        hora_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")
        title_font = Font(bold=True, size=14, color="000000")
        hora_font = Font(bold=True, size=10, color="333333")
        border = _borde_fino()
        center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        left_alignment = Alignment(horizontal='left', vertical='center')

        ws['A1'] = f"Docente: {docente_nombre}"
        ws['A1'].font = title_font
        ws['A1'].alignment = left_alignment

        ws['A2'] = f"Facultad: {facultad}"
        ws['A2'].font = title_font
        ws['A2'].alignment = left_alignment

        ws['A3'] = ""

        for row_idx, row_data in enumerate(table_data, start=4):
            for col_idx, cell_value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=cell_value)
                cell.border = border
                cell.alignment = center_alignment
                if row_idx == 4:  # encabezado
                    cell.fill = header_fill
                    cell.font = header_font
                elif col_idx == 1:  # columna de horas
                    cell.fill = hora_fill
                    cell.font = hora_font
                elif cell_value and cell_value.strip():  # celdas con clase
                    cell.fill = class_fill
                    cell.font = Font(bold=False, size=10)

        ws.column_dimensions['A'].width = 14
        for col_idx in range(2, 9):
            ws.column_dimensions[get_column_letter(col_idx)].width = 25

        ws.row_dimensions[1].height = 25
        ws.row_dimensions[2].height = 25
        for row_idx in range(4, 4 + len(table_data)):
            ws.row_dimensions[row_idx].height = 75

    return _guardar(workbook)
