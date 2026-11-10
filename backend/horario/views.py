from .models import Horario
from django.http import JsonResponse, HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter
from io import BytesIO
import sys
import openpyxl


def _estados_exportables_horario(data):
    estado = str(data.get('estado_horario') or data.get('estadoHorario') or '').strip().lower()
    include_pending = bool(data.get('include_pending') or data.get('includePending'))

    if estado == 'pendiente':
        return {'pendiente'}
    if estado in {'todos', 'all'} or include_pending:
        return {'aprobado', 'pendiente'}
    return {'aprobado'}


# -------- Endpoint para exportar PDF con array de horarios (POST) --------
@csrf_exempt
def exportar_horarios_pdf_post(request):
    """Genera y descarga horarios en formato PDF desde un array de horarios"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        horarios_data = data.get('horarios', [])

        if not horarios_data:
            return JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

        estados_exportables = _estados_exportables_horario(data)
        horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

        if not horarios_data:
            return JsonResponse({"error": "No hay horarios para exportar"}, status=400)

        # Agrupar horarios por grupo
        grupos_dict = {}
        for h in horarios_data:
            grupo_key = f"{h.get('grupo_nombre', 'N/A')} - {h.get('programa_nombre', 'N/A')}"
            if grupo_key not in grupos_dict:
                grupos_dict[grupo_key] = []
            grupos_dict[grupo_key].append(h)

        # Crear PDF con múltiples tablas (una por grupo)
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                               rightMargin=30, leftMargin=30,
                               topMargin=30, bottomMargin=30)

        elements = []

        for grupo_key, horarios_grupo in grupos_dict.items():
            # Crear tabla para este grupo con TODAS las horas (6:00 a 21:00)
            dias_dict = {}

            # Inicializar estructura de días (mapeo de nombres en español)
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_grupo:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                # Normalizar horas (quitar segundos si los tiene: "10:00:00" -> "10:00")
                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)

                # Normalizar nombre del día
                dia = dias_map.get(dia_raw, dia_raw)


                if dia and hora_inicio and dia in dias_dict:
                    # Crear contenido de la celda - formato especificado
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    docente = str(h.get('docente_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    # Formatear según especificación:
                    # Asignatura (Mayúscula inicial) / DOCENTE (MAYÚSCULAS) - Salón
                    if asignatura:
                        # Capitalizar asignatura correctamente (incluyendo números romanos)
                        # Ejemplo: "calculo i" -> "Cálculo I"
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            # Si la palabra es un número romano, convertir a mayúsculas
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        # Docente en mayúsculas
                        docente_fmt = docente.upper() if docente and docente != "Sin asignar" else ""

                        # Salón tal cual
                        espacio_fmt = espacio

                        # Formato con saltos de línea para que no se cruce entre celdas
                        # Asignatura en primera línea
                        # Docente en segunda línea
                        # Salón en tercera línea
                        cell_content = f"{asignatura_fmt}"
                        if docente_fmt:
                            cell_content += f" / {docente_fmt}"
                        if espacio_fmt:
                            cell_content += f"\n{espacio_fmt}"

                        # Agregar la asignatura en TODAS las horas que ocupa
                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            # Llenar todas las horas desde inicio hasta fin
                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content

                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas (6:00-7:00, 7:00-8:00, etc.)
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))  # (etiqueta, clave_busqueda)

            # Preparar datos para tabla
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            table_data = [['Hora'] + dias_nombres]

            cell_style = ParagraphStyle(
                'CellStyle',
                fontName='Helvetica',
                fontSize=5,
                leading=6,
                alignment=TA_CENTER,
            )

            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    if cell_text:
                        row.append(Paragraph(cell_text.replace('\n', '<br/>'), cell_style))
                    else:
                        row.append('')
                table_data.append(row)

            # Crear tabla optimizada para una página
            # Ancho: 1 col hora (0.8") + 7 cols días (1.4" c/u) = 10.6" (cabe en landscape A4)
            col_widths = [0.8 * inch] + [1.4 * inch] * 7
            # Alto: ajustar según cantidad de filas
            num_filas = len(table_data)
            # Primera fila (header) más compacta, resto para 3 líneas de contenido
            row_heights = [0.35 * inch] + [0.4 * inch] * (num_filas - 1)
            table = Table(table_data, colWidths=col_widths, rowHeights=row_heights)

            # Estilo optimizado para una página
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

            # Colorear celdas con clases
            for row_idx, (intervalo, hora_key) in enumerate(horas_intervalos, start=1):
                for col_idx, dia in enumerate(dias_orden, start=1):
                    if hora_key in dias_dict[dia]:
                        style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), colors.HexColor('#DBEAFE'))

            table.setStyle(style)

            # Agregar título y tabla a elementos
            styles = getSampleStyleSheet()
            title_style = styles['Heading3']

            elements.append(Paragraph(f"<b>Grupo: {grupo_key}</b>", title_style))
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(table)
            elements.append(PageBreak())  # Una página por grupo

        # Generar PDF
        doc.build(elements)

        # Respuesta
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="horarios_centro.pdf"'

        return response

    except Exception as e:
        import traceback
        print(f"ERROR en PDF: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


# -------- Endpoint para exportar Excel con array de horarios (POST) --------
@csrf_exempt
def exportar_horarios_excel_post(request):
    """Genera y descarga horarios en formato Excel desde un array de horarios"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        horarios_data = data.get('horarios', [])

        if not horarios_data:
            return JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

        estados_exportables = _estados_exportables_horario(data)
        horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

        if not horarios_data:
            return JsonResponse({"error": "No hay horarios para exportar"}, status=400)

        # Agrupar horarios por grupo
        grupos_dict = {}
        for h in horarios_data:
            grupo_key = f"{h.get('grupo_nombre', 'N/A')} - {h.get('programa_nombre', 'N/A')}"
            if grupo_key not in grupos_dict:
                grupos_dict[grupo_key] = []
            grupos_dict[grupo_key].append(h)


        # Crear workbook con múltiples hojas (una por grupo)
        wb = Workbook()
        wb.remove(wb.active)  # Remover hoja por defecto

        # Estilos
        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")
        class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
        center_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        for grupo_key, horarios_grupo in grupos_dict.items():
            # Crear tabla para este grupo con TODAS las horas (6:00 a 21:00)
            dias_dict = {}

            # Inicializar estructura de días (mapeo de nombres en español)
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_grupo:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                # Normalizar horas (quitar segundos si los tiene: "10:00:00" -> "10:00")
                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)

                # Normalizar nombre del día
                dia = dias_map.get(dia_raw, dia_raw)


                if dia and hora_inicio and dia in dias_dict:
                    # Crear contenido de la celda - formato especificado
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    docente = str(h.get('docente_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    # Formatear según especificación:
                    # Asignatura (Mayúscula inicial) / DOCENTE (MAYÚSCULAS) - Salón
                    if asignatura:
                        # Capitalizar asignatura correctamente (incluyendo números romanos)
                        # Ejemplo: "calculo i" -> "Cálculo I"
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            # Si la palabra es un número romano, convertir a mayúsculas
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        # Docente en mayúsculas
                        docente_fmt = docente.upper() if docente and docente != "Sin asignar" else ""

                        # Salón tal cual
                        espacio_fmt = espacio

                        # Formato con saltos de línea para que no se cruce entre celdas
                        # Asignatura / Docente en primera línea
                        # Salón en segunda línea
                        cell_content = f"{asignatura_fmt}"
                        if docente_fmt:
                            cell_content += f" / {docente_fmt}"
                        if espacio_fmt:
                            cell_content += f"\n{espacio_fmt}"

                        # Agregar la asignatura en TODAS las horas que ocupa
                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            # Llenar todas las horas desde inicio hasta fin
                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content

                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas (6:00-7:00, 7:00-8:00, etc.)
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))  # (etiqueta, clave_busqueda)

            # Crear hoja para este grupo
            ws = wb.create_sheet(title=grupo_key[:31])  # Excel limita nombre a 31 caracteres

            # Header con días
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            ws.append(['Hora'] + dias_nombres)

            for cell in ws[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = center_alignment
                cell.border = border

            # Datos - intervalos de horas
            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    row.append(cell_text)
                ws.append(row)

            # Aplicar estilos a datos
            for row_idx, (intervalo, hora_key) in enumerate(horas_intervalos, start=2):
                for col_idx, dia in enumerate(dias_orden, start=2):
                    cell = ws.cell(row=row_idx, column=col_idx)
                    cell_text = dias_dict[dia].get(hora_key, '')

                    cell.value = cell_text

                    if cell_text:
                        cell.fill = class_fill

                    cell.alignment = center_alignment
                    cell.border = border

            # Ajustar ancho de columnas
            ws.column_dimensions['A'].width = 14
            for col in 'BCDEFGH':
                ws.column_dimensions[col].width = 25

            # Ajustar alto de filas para 3 líneas de contenido
            for row in range(2, len(horas_intervalos) + 2):
                ws.row_dimensions[row].height = 75

        # Validar que hay al menos una hoja
        if len(wb.sheetnames) == 0:
            print(f"ADVERTENCIA: No hay hojas en el workbook, creando hoja vacía", file=sys.stderr)
            ws = wb.create_sheet(title="Vacío")
            ws.append(['No hay horarios para mostrar'])

        # Guardar en buffer
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        # Respuesta
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="horarios_centro.xlsx"'

        return response

    except Exception as e:
        import traceback
        print(f"ERROR en Excel: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


# -------- Endpoints para exportar PDF y Excel por Docente --------
@csrf_exempt
def exportar_horarios_pdf_docente(request):
    """Genera y descarga horarios en formato PDF agrupados por docente"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        horarios_data = data.get('horarios', [])

        if not horarios_data:
            return JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

        estados_exportables = _estados_exportables_horario(data)
        horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

        if not horarios_data:
            return JsonResponse({"error": "No hay horarios para exportar"}, status=400)

        # Agrupar horarios por docente
        docentes_dict = {}
        for h in horarios_data:
            docente_key = h.get('docente_nombre', 'Sin asignar')
            facultad = h.get('programa_nombre', 'N/A')

            if docente_key not in docentes_dict:
                docentes_dict[docente_key] = {
                    'facultad': facultad,
                    'horarios': []
                }
            docentes_dict[docente_key]['horarios'].append(h)

        # Crear PDF con múltiples tablas (una por docente)
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                               rightMargin=30, leftMargin=30,
                               topMargin=30, bottomMargin=30)

        elements = []

        for docente_nombre, docente_info in docentes_dict.items():
            facultad = docente_info['facultad']
            horarios_docente = docente_info['horarios']

            # Crear tabla para este docente
            dias_dict = {}

            # Inicializar estructura de días
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_docente:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                # Normalizar horas
                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)

                # Normalizar nombre del día
                dia = dias_map.get(dia_raw, dia_raw)

                if dia and hora_inicio and dia in dias_dict:
                    # Crear contenido de la celda
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    grupo = str(h.get('grupo_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    if asignatura:
                        # Capitalizar asignatura
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        # Formato: Asignatura / GRUPO - Salón
                        cell_content = f"{asignatura_fmt}"
                        if grupo:
                            cell_content += f" / {grupo}"
                        if espacio:
                            cell_content += f"\n{espacio}"

                        # Agregar la asignatura en TODAS las horas que ocupa
                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content

                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))

            # Preparar datos para tabla
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            table_data = [['Hora'] + dias_nombres]

            cell_style = ParagraphStyle(
                'CellStyle',
                fontName='Helvetica',
                fontSize=5,
                leading=6,
                alignment=TA_CENTER,
            )

            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    if cell_text:
                        row.append(Paragraph(cell_text.replace('\n', '<br/>'), cell_style))
                    else:
                        row.append('')
                table_data.append(row)

            # Crear tabla
            col_widths = [0.8 * inch] + [1.4 * inch] * 7
            num_filas = len(table_data)
            row_heights = [0.35 * inch] + [0.4 * inch] * (num_filas - 1)
            table = Table(table_data, colWidths=col_widths, rowHeights=row_heights)

            # Estilo
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

            # Colorear celdas con clases
            for row_idx, (intervalo, hora_key) in enumerate(horas_intervalos, start=1):
                for col_idx, dia in enumerate(dias_orden, start=1):
                    if hora_key in dias_dict[dia]:
                        style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), colors.HexColor('#DBEAFE'))

            table.setStyle(style)

            # Agregar título y tabla a elementos
            styles = getSampleStyleSheet()
            title_style = styles['Heading3']

            elements.append(Paragraph(f"<b>Docente: {docente_nombre}</b>", title_style))
            elements.append(Paragraph(f"<b>Facultad: {facultad}</b>", title_style))
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(table)
            elements.append(PageBreak())

        # Generar PDF
        doc.build(elements)

        # Respuesta
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="horarios_docentes.pdf"'

        return response

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_horarios_pdf_docente: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def exportar_horarios_excel_docente(request):
    """Genera y descarga horarios en formato Excel agrupados por docente"""
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        data = json.loads(request.body)
        horarios_data = data.get('horarios', [])

        if not horarios_data:
            return JsonResponse({"error": "No se proporcionaron horarios"}, status=400)

        estados_exportables = _estados_exportables_horario(data)
        horarios_data = [h for h in horarios_data if h.get('estado', '').lower() in estados_exportables]

        if not horarios_data:
            return JsonResponse({"error": "No hay horarios para exportar"}, status=400)

        # Agrupar horarios por docente
        docentes_dict = {}
        for h in horarios_data:
            docente_key = h.get('docente_nombre', 'Sin asignar')
            facultad = h.get('programa_nombre', 'N/A')

            if docente_key not in docentes_dict:
                docentes_dict[docente_key] = {
                    'facultad': facultad,
                    'horarios': []
                }
            docentes_dict[docente_key]['horarios'].append(h)

        # Crear Excel con múltiples hojas (una por docente)
        workbook = openpyxl.Workbook()
        workbook.remove(workbook.active)  # Remover hoja por defecto

        for docente_nombre, docente_info in docentes_dict.items():
            facultad = docente_info['facultad']
            horarios_docente = docente_info['horarios']

            # Crear tabla para este docente
            dias_dict = {}

            # Inicializar estructura de días
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_docente:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                # Normalizar horas
                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)

                # Normalizar nombre del día
                dia = dias_map.get(dia_raw, dia_raw)

                if dia and hora_inicio and dia in dias_dict:
                    # Crear contenido de la celda
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    grupo = str(h.get('grupo_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    if asignatura:
                        # Capitalizar asignatura
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        # Formato: Asignatura / GRUPO - Salón
                        cell_content = f"{asignatura_fmt}"
                        if grupo:
                            cell_content += f" / {grupo}"
                        if espacio:
                            cell_content += f" - {espacio}"

                        # Agregar la asignatura en TODAS las horas que ocupa
                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content

                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))

            # Preparar datos para tabla
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            table_data = [['Hora'] + dias_nombres]

            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    row.append(cell_text)
                table_data.append(row)

            # Crear hoja en Excel
            sheet_name = f"{docente_nombre[:30]}"  # Limitar nombre de hoja a 30 caracteres
            ws = workbook.create_sheet(title=sheet_name)

            # Definir estilos (igual que en Centro de Horarios)
            header_font = Font(bold=True, color="FFFFFF", size=12)
            header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")  # Rojo oscuro
            class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")  # Azul claro
            hora_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")  # Gris claro
            title_font = Font(bold=True, size=14, color="000000")  # Negro
            hora_font = Font(bold=True, size=10, color="333333")  # Gris oscuro
            border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
            center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
            left_alignment = Alignment(horizontal='left', vertical='center')

            # Agregar título con docente y facultad
            ws['A1'] = f"Docente: {docente_nombre}"
            ws['A1'].font = title_font
            ws['A1'].alignment = left_alignment

            ws['A2'] = f"Facultad: {facultad}"
            ws['A2'].font = title_font
            ws['A2'].alignment = left_alignment

            ws['A3'] = ""  # Espacio en blanco

            # Agregar tabla a partir de fila 4
            for row_idx, row_data in enumerate(table_data, start=4):
                for col_idx, cell_value in enumerate(row_data, start=1):
                    cell = ws.cell(row=row_idx, column=col_idx, value=cell_value)
                    cell.border = border
                    cell.alignment = center_alignment

                    # Aplicar estilos al header (primera fila de datos - fila 4)
                    if row_idx == 4:
                        # Todo el header en rojo
                        cell.fill = header_fill
                        cell.font = header_font
                    # Columna de hora (col_idx == 1) en datos - gris claro
                    elif col_idx == 1:
                        cell.fill = hora_fill
                        cell.font = hora_font
                    # Aplicar color azul a las celdas con contenido (clases)
                    elif cell_value and cell_value.strip():
                        cell.fill = class_fill
                        cell.font = Font(bold=False, size=10)

            # Ajustar ancho de columnas
            ws.column_dimensions['A'].width = 14
            for col_idx in range(2, 9):
                ws.column_dimensions[get_column_letter(col_idx)].width = 25

            # Ajustar altura de filas
            ws.row_dimensions[1].height = 25
            ws.row_dimensions[2].height = 25
            for row_idx in range(4, 4 + len(table_data)):
                ws.row_dimensions[row_idx].height = 75  # Altura mayor para mostrar contenido multilínea

        # Guardar Excel
        buffer = BytesIO()
        workbook.save(buffer)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="horarios_docentes.xlsx"'

        return response

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_horarios_excel_docente: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


# -------- Endpoints para descargar horario individual (docente/estudiante) --------
@csrf_exempt
def exportar_pdf_usuario(request):
    """Descarga el horario en PDF para un usuario específico (docente o estudiante)"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        usuario_id = request.GET.get('usuario_id')
        if not usuario_id:
            return JsonResponse({"error": "usuario_id requerido"}, status=400)

        try:
            # Obtener horarios del usuario
            horarios_data = list_horarios_extendidos_usuario(usuario_id)

            if not horarios_data:
                return JsonResponse({"error": "No hay horarios registrados"}, status=400)

            # Generar PDF directamente
            return generar_pdf_horarios(horarios_data)
        except Exception as inner_e:
            import traceback
            print(f"ERROR en exportar_pdf_usuario (inner): {str(inner_e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return JsonResponse({"error": "No hay horarios registrados"}, status=400)

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_pdf_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def exportar_excel_usuario(request):
    """Descarga el horario en Excel para un usuario específico (docente o estudiante)"""
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)

    try:
        usuario_id = request.GET.get('usuario_id')
        if not usuario_id:
            return JsonResponse({"error": "usuario_id requerido"}, status=400)

        try:
            # Obtener horarios del usuario
            horarios_data = list_horarios_extendidos_usuario(usuario_id)

            if not horarios_data:
                return JsonResponse({"error": "No hay horarios registrados"}, status=400)

            # Generar Excel directamente
            return generar_excel_horarios(horarios_data)
        except Exception as inner_e:
            import traceback
            print(f"ERROR en exportar_excel_usuario (inner): {str(inner_e)}", file=sys.stderr)
            print(traceback.format_exc(), file=sys.stderr)
            return JsonResponse({"error": "No hay horarios registrados"}, status=400)

    except Exception as e:
        import traceback
        print(f"ERROR en exportar_excel_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def generar_pdf_horarios(horarios_data):
    """Genera un PDF con los horarios proporcionados"""
    try:
        # Agrupar horarios por grupo
        grupos_dict = {}
        for h in horarios_data:
            grupo_key = f"{h.get('grupo_nombre', 'N/A')} - {h.get('programa_nombre', 'N/A')}"
            if grupo_key not in grupos_dict:
                grupos_dict[grupo_key] = []
            grupos_dict[grupo_key].append(h)

        # Crear PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                               rightMargin=30, leftMargin=30,
                               topMargin=30, bottomMargin=30)

        elements = []

        for grupo_key, horarios_grupo in grupos_dict.items():
            dias_dict = {}
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_grupo:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)
                dia = dias_map.get(dia_raw, dia_raw)

                if dia and hora_inicio and dia in dias_dict:
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    docente = str(h.get('docente_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    if asignatura:
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        docente_fmt = docente.upper() if docente and docente != "Sin asignar" else ""
                        espacio_fmt = espacio

                        cell_content = f"{asignatura_fmt}"
                        if docente_fmt:
                            cell_content += f" / {docente_fmt}"
                        if espacio_fmt:
                            cell_content += f"\n{espacio_fmt}"

                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content
                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))

            # Preparar datos para tabla
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            table_data = [['Hora'] + dias_nombres]

            cell_style = ParagraphStyle(
                'CellStyle',
                fontName='Helvetica',
                fontSize=5,
                leading=6,
                alignment=TA_CENTER,
            )

            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    if cell_text:
                        row.append(Paragraph(cell_text.replace('\n', '<br/>'), cell_style))
                    else:
                        row.append('')
                table_data.append(row)

            # Crear tabla
            col_widths = [0.8 * inch] + [1.4 * inch] * 7
            num_filas = len(table_data)
            row_heights = [0.35 * inch] + [0.4 * inch] * (num_filas - 1)
            table = Table(table_data, colWidths=col_widths, rowHeights=row_heights)

            # Estilo
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

            for row_idx, (intervalo, hora_key) in enumerate(horas_intervalos, start=1):
                for col_idx, dia in enumerate(dias_orden, start=1):
                    if hora_key in dias_dict[dia]:
                        style.add('BACKGROUND', (col_idx, row_idx), (col_idx, row_idx), colors.HexColor('#DBEAFE'))

            table.setStyle(style)

            styles = getSampleStyleSheet()
            title_style = styles['Heading3']

            elements.append(Paragraph(f"<b>Grupo: {grupo_key}</b>", title_style))
            elements.append(Spacer(1, 0.1 * inch))
            elements.append(table)
            elements.append(PageBreak())

        # Generar PDF
        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="horarios.pdf"'
        return response

    except Exception as e:
        import traceback
        print(f"ERROR en generar_pdf_horarios: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def generar_excel_horarios(horarios_data):
    """Genera un Excel con los horarios proporcionados"""
    try:
        # Agrupar horarios por grupo
        grupos_dict = {}
        for h in horarios_data:
            grupo_key = f"{h.get('grupo_nombre', 'N/A')} - {h.get('programa_nombre', 'N/A')}"
            if grupo_key not in grupos_dict:
                grupos_dict[grupo_key] = []
            grupos_dict[grupo_key].append(h)

        # Crear workbook
        wb = Workbook()
        wb.remove(wb.active)

        # Estilos
        header_font = Font(bold=True, color="FFFFFF", size=12)
        header_fill = PatternFill(start_color="8B0000", end_color="8B0000", fill_type="solid")
        class_fill = PatternFill(start_color="DBEAFE", end_color="DBEAFE", fill_type="solid")
        center_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )

        for grupo_key, horarios_grupo in grupos_dict.items():
            dias_dict = {}
            dias_orden = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
            dias_map = {
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

            for dia in dias_orden:
                dias_dict[dia] = {}

            # Llenar con los horarios disponibles
            for h in horarios_grupo:
                dia_raw = h.get('dia_semana', '').lower().strip()
                hora_inicio_raw = str(h.get('hora_inicio', '')).strip()
                hora_fin_raw = str(h.get('hora_fin', '')).strip()

                def normalizar_hora(hora_str):
                    if ':' in hora_str:
                        partes = hora_str.split(':')
                        return f"{partes[0]}:{partes[1]}"
                    return hora_str

                hora_inicio = normalizar_hora(hora_inicio_raw)
                hora_fin = normalizar_hora(hora_fin_raw)
                dia = dias_map.get(dia_raw, dia_raw)

                if dia and hora_inicio and dia in dias_dict:
                    asignatura = str(h.get('asignatura_nombre', '')).strip() or ''
                    docente = str(h.get('docente_nombre', '')).strip() or ''
                    espacio = str(h.get('espacio_nombre', '')).strip() or ''

                    if asignatura:
                        asignatura_fmt = asignatura.strip()
                        palabras = asignatura_fmt.split()
                        palabras_fmt = []
                        for palabra in palabras:
                            if palabra.lower() in ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x']:
                                palabras_fmt.append(palabra.upper())
                            else:
                                palabras_fmt.append(palabra.capitalize())
                        asignatura_fmt = ' '.join(palabras_fmt)

                        docente_fmt = docente.upper() if docente and docente != "Sin asignar" else ""
                        espacio_fmt = espacio

                        cell_content = f"{asignatura_fmt}"
                        if docente_fmt:
                            cell_content += f" / {docente_fmt}"
                        if espacio_fmt:
                            cell_content += f"\n{espacio_fmt}"

                        try:
                            hora_inicio_h = int(hora_inicio.split(':')[0])
                            hora_fin_h = int(hora_fin.split(':')[0])

                            for h_actual in range(hora_inicio_h, hora_fin_h):
                                hora_key = f"{h_actual:02d}:00"
                                dias_dict[dia][hora_key] = cell_content
                        except Exception as e:
                            dias_dict[dia][hora_inicio] = cell_content

            # Generar intervalos de horas
            horas_intervalos = []
            for h in range(6, 21):
                intervalo = f"{h:02d}:00-{h+1:02d}:00"
                horas_intervalos.append((intervalo, f"{h:02d}:00"))

            # Crear hoja
            ws = wb.create_sheet(title=grupo_key[:31])

            # Header
            dias_nombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            ws.append(['Hora'] + dias_nombres)

            for cell in ws[1]:
                cell.font = header_font
                cell.fill = header_fill
                cell.alignment = center_alignment
                cell.border = border

            # Datos
            for intervalo, hora_key in horas_intervalos:
                row = [intervalo]
                for dia in dias_orden:
                    cell_text = dias_dict[dia].get(hora_key, '')
                    row.append(cell_text)
                ws.append(row)

            # Aplicar estilos
            for row in ws.iter_rows(min_row=2, max_row=ws.max_row, min_col=1, max_col=6):
                for cell in row:
                    cell.alignment = center_alignment
                    cell.border = border
                    if cell.value:
                        cell.fill = class_fill

            # Ajustar ancho de columnas
            ws.column_dimensions['A'].width = 14
            for col in 'BCDEFGH':
                ws.column_dimensions[col].width = 25

            # Ajustar alto de filas
            for row in range(2, len(horas_intervalos) + 2):
                ws.row_dimensions[row].height = 75

        # Validar que hay al menos una hoja
        if len(wb.sheetnames) == 0:
            ws = wb.create_sheet(title="Vacío")
            ws.append(['No hay horarios para mostrar'])

        # Guardar en buffer
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)

        # Respuesta
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="horarios.xlsx"'

        return response

    except Exception as e:
        import traceback
        print(f"ERROR en generar_excel_horarios: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return JsonResponse({"error": str(e)}, status=500)


def list_horarios_extendidos_usuario(usuario_id):
    """Obtiene los horarios extendidos para un usuario específico (docente o estudiante)"""
    try:
        from django.contrib.auth.models import User
        import traceback

        usuario = User.objects.get(id=usuario_id)

        # Obtener el perfil del usuario para determinar si es docente o estudiante
        from usuarios.models import Perfil
        perfil = Perfil.objects.get(usuario=usuario)

        horarios = []

        if perfil.rol.nombre == 'docente':
            # Si es docente, obtener sus horarios
            from docentes.models import Docente
            try:
                docente = Docente.objects.get(usuario=usuario)
                items = Horario.objects.filter(docente=docente).select_related(
                    'grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa'
                )
            except Docente.DoesNotExist:
                print(f"ADVERTENCIA: No se encontró Docente para usuario {usuario_id}", file=sys.stderr)
                items = []
        else:
            # Si es estudiante, obtener horarios de su grupo
            from estudiantes.models import Estudiante
            try:
                estudiante = Estudiante.objects.get(usuario=usuario)
                items = Horario.objects.filter(grupo=estudiante.grupo).select_related(
                    'grupo', 'asignatura', 'docente', 'espacio', 'grupo__programa'
                )
            except Estudiante.DoesNotExist:
                print(f"ADVERTENCIA: No se encontró Estudiante para usuario {usuario_id}", file=sys.stderr)
                items = []

        for i in items:
            horarios.append({
                "id": i.id,
                "grupo_id": i.grupo.id,
                "grupo_nombre": i.grupo.nombre,
                "programa_id": i.grupo.programa.id,
                "programa_nombre": i.grupo.programa.nombre,
                "semestre": i.grupo.semestre,
                "asignatura_id": i.asignatura.id,
                "asignatura_nombre": i.asignatura.nombre,
                "docente_id": (i.docente.id if i.docente else None),
                "docente_nombre": i.docente.nombre if i.docente else "Sin asignar",
                "espacio_id": i.espacio.id,
                "espacio_nombre": i.espacio.nombre,
                "dia_semana": i.dia_semana,
                "hora_inicio": str(i.hora_inicio),
                "hora_fin": str(i.hora_fin),
                "cantidad_estudiantes": i.cantidad_estudiantes
            })

        return horarios

    except Exception as e:
        import traceback
        print(f"ERROR en list_horarios_extendidos_usuario: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        return []
