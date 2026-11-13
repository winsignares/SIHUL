"""Reportes PDF de espacios (Estado de Recursos y Reportes).

Cada función recibe los datos que ya calculó espacios/views/ y devuelve el PDF en bytes:
- ocupacion_semanal: resumen, detalle por espacio y, en otra página, el top 10 por ocupación;
- ocupacion: ocupación por jornada y espacios más utilizados;
- disponibilidad: totales y horas disponibles/ocupadas por espacio;
- capacidad: barras por tipo de espacio con su leyenda.
"""
from io import BytesIO

from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

TINTA = colors.HexColor('#0f172a')
GRIS = colors.HexColor('#475569')
BORDE = colors.HexColor('#cbd5f5')
FILA_ALTERNA = colors.HexColor('#f8fafc')
AZUL = colors.HexColor('#2563eb')
ROJO = colors.HexColor('#dc2626')
AMARILLO = colors.HexColor('#ca8a04')
VERDE = colors.HexColor('#16a34a')
MORADO = colors.HexColor('#9333ea')

# Encabezado oscuro de las tablas de detalle
CABECERA = [
    ('BACKGROUND', (0, 0), (-1, 0), TINTA),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
]


def _documento(buffer):
    return SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch * 0.6,
        leftMargin=inch * 0.6,
        topMargin=inch * 0.8,
        bottomMargin=inch * 0.8
    )


def _pdf(construir):
    """Arma el documento con los elementos que devuelve construir(doc, styles) y lo devuelve en bytes."""
    buffer = BytesIO()
    doc = _documento(buffer)
    doc.build(construir(doc, getSampleStyleSheet()))
    return buffer.getvalue()


def _semana(lunes, sabado):
    return f'{lunes.strftime("%d/%m/%Y")} - {sabado.strftime("%d/%m/%Y")}'


def _encabezado(styles, titulo, lunes, sabado):
    """Título y semana de los reportes de ocupación, disponibilidad y capacidad."""
    title_style = ParagraphStyle(
        'RptTitle',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=TINTA,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'RptSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=GRIS,
        alignment=TA_CENTER
    )
    return [
        Paragraph(titulo, title_style),
        Paragraph(f'<b>Semana:</b> {_semana(lunes, sabado)}', subtitle_style),
        Spacer(1, 0.25 * inch),
    ]


def _tabla_de_totales(doc, styles, titulos, valores, fondo, borde):
    """Fila de títulos pequeños sobre una fila de valores grandes, en columnas del mismo ancho."""
    stat_title_style = ParagraphStyle(
        'StatTitle',
        parent=styles['Normal'],
        fontSize=7,
        textColor=colors.HexColor('#64748b')
    )
    stat_value_style = ParagraphStyle(
        'StatValue',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=TINTA
    )
    columnas = len(titulos)
    tabla = Table(
        [[Paragraph(t, stat_title_style) for t in titulos], [Paragraph(v, stat_value_style) for v in valores]],
        colWidths=[(doc.width) / columnas] * columnas
    )
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(fondo)),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor(borde)),
        *[('LINEBEFORE', (i, 0), (i, -1), 0.5, colors.HexColor(borde)) for i in range(1, columnas)],
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    return tabla


# ------------------------------------------------------------------ ocupación semanal
def ocupacion_semanal(detalles_espacios, lunes, sabado, semana_offset):
    """detalles_espacios: una fila por espacio con nombre, tipo, edificio, capacidad, horas y porcentajes."""
    total_espacios = len(detalles_espacios)
    promedio_ocupacion = (sum(e['porcentajeOcupacion'] for e in detalles_espacios) / total_espacios) if total_espacios > 0 else 0
    total_horas_ocupadas = sum(e['horasOcupadasSemana'] for e in detalles_espacios)
    total_horas_disponibles = sum(e['horasDisponibles'] for e in detalles_espacios)
    espacios_sobreocupados = sum(1 for e in detalles_espacios if e['porcentajeOcupacion'] >= 85)
    espacios_subutilizados = sum(1 for e in detalles_espacios if e['porcentajeOcupacion'] <= 50 and e['porcentajeOcupacion'] > 0)

    def construir(doc, styles):
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=TINTA,
            alignment=TA_CENTER,
            spaceAfter=18
        )
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=GRIS,
            alignment=TA_CENTER
        )
        body_small_style = ParagraphStyle(
            'BodySmall',
            parent=styles['BodyText'],
            fontSize=7,
            leading=8,
            textColor=TINTA
        )

        elements = [
            Paragraph('Reporte de Ocupación Semanal de Espacios', title_style),
            Paragraph(f'<b>Período:</b> {_semana(lunes, sabado)} - <b>Semana:</b> {semana_offset:+d}', subtitle_style),
            Spacer(1, 0.2 * inch),
            _tabla_de_totales(
                doc, styles,
                ['Promedio ocupación', 'Horas ocupadas', 'Horas tot. disponibles', 'Sobreocupados', 'Subutilizados'],
                [f'{promedio_ocupacion:.1f}%', f'{total_horas_ocupadas:.0f}h', f'{total_horas_disponibles:.0f}h',
                 f'{espacios_sobreocupados}', f'{espacios_subutilizados}'],
                fondo='#e0f2fe', borde='#cbd5f5',
            ),
            Spacer(1, 0.3 * inch),
        ]

        table_data = [['Espacio', 'Tipo', 'Edificio', 'Capacidad', 'Horas', 'Ocupación', 'Jornadas']]
        for espacio in detalles_espacios:
            jornadas = (
                f'M: {espacio["porcentajeManana"]:.1f}%<br/>'
                f'T: {espacio["porcentajeTarde"]:.1f}%<br/>'
                f'N: {espacio["porcentajeNoche"]:.1f}%'
            )
            table_data.append([
                espacio['nombre'],
                espacio['tipo'],
                espacio['edificio'],
                str(espacio['capacidad']),
                f'{espacio["horasOcupadasSemana"]:.1f} / {espacio["horasDisponibles"]}h',
                f'{espacio["porcentajeOcupacion"]:.1f}%',
                Paragraph(jornadas, body_small_style)
            ])

        detail_col_widths = [2.0 * inch, 1.0 * inch, 1.0 * inch, 0.8 * inch, 1.0 * inch, 1.0 * inch, 1.4 * inch]
        detail_table = Table(table_data, colWidths=detail_col_widths)
        detail_table.setStyle(TableStyle([
            *CABECERA,
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ALIGN', (0, 0), (3, -1), 'LEFT'),
            ('ALIGN', (4, 0), (-2, -1), 'CENTER'),
            ('ALIGN', (-1, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, FILA_ALTERNA]),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        elements += [detail_table, Spacer(1, 0.4 * inch)]

        top_espacios = sorted(detalles_espacios, key=lambda x: x['porcentajeOcupacion'], reverse=True)[:10]
        if top_espacios:
            elements += [PageBreak(), Paragraph('Top 10 espacios por ocupación', styles['Heading3']),
                         Spacer(1, 0.1 * inch), _grafico_top(doc, top_espacios)]
        return elements

    return _pdf(construir)


def _grafico_top(doc, top_espacios):
    chart_width = doc.width - (inch * 0.4)
    chart_height = 190
    drawing = Drawing(chart_width, chart_height)
    chart = HorizontalBarChart()
    chart.x = 0
    chart.y = 10
    chart.width = chart_width
    chart.height = chart_height - 10
    chart.data = [[espacio['porcentajeOcupacion'] for espacio in top_espacios]]
    chart.categoryAxis.labels.fontSize = 7
    chart.categoryAxis.strokeColor = GRIS
    chart.categoryAxis.labels.dy = -2
    # Los nombres se cortan a 32 caracteres
    chart.categoryAxis.categoryNames = [espacio['nombre'][:32] for espacio in top_espacios]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = 100
    chart.valueAxis.valueStep = 20
    chart.valueAxis.labels.fontSize = 7
    chart.valueAxis.strokeColor = colors.HexColor('#94a3b8')
    chart.barLabels.nudge = 7
    chart.barLabels.fontSize = 7
    chart.barLabels.fillColor = TINTA
    chart.barLabels.dx = 0
    chart.barLabels.dy = 0
    chart.bars[0].fillColor = AZUL
    chart.bars[0].strokeWidth = 0
    drawing.add(chart)
    return drawing


# ------------------------------------------------------------------ ocupación
def ocupacion(ocupacion_por_jornada, espacios_mas_usados, lunes, sabado):
    def construir(doc, styles):
        section_style = ParagraphStyle(
            'RptSection',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=TINTA,
            spaceAfter=6
        )
        body_small_style = ParagraphStyle(
            'RptBodySmall',
            parent=styles['BodyText'],
            fontSize=8,
            leading=9,
            textColor=TINTA
        )
        elements = _encabezado(styles, 'Reporte: Ocupación de Espacios', lunes, sabado)

        # Ocupación por jornada: el porcentaje con el color de cada jornada en la pantalla
        table_data = [['Jornada', 'Ocupación', 'Espacios']]
        for item in ocupacion_por_jornada or []:
            table_data.append([item.get('jornada', ''), f"{item.get('ocupacion', 0)}%", str(item.get('espacios', 0))])
        jornada_colors = [AZUL, ROJO, AMARILLO]
        jornada_table = Table(table_data, colWidths=[3.3 * inch, 1.2 * inch, 1.0 * inch])
        jornada_table.setStyle(TableStyle([
            *CABECERA,
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, FILA_ALTERNA]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            *[('TEXTCOLOR', (1, i), (1, i), jornada_colors[min(i - 1, len(jornada_colors) - 1)])
              for i in range(1, len(table_data))],
        ]))
        elements += [Paragraph('Ocupación por Jornada - Semana Actual', section_style),
                     jornada_table, Spacer(1, 0.3 * inch)]

        # Espacios más utilizados: la ocupación en azul
        espacios_data = [['#', 'Espacio', 'Usos', 'Ocupación']]
        for idx, item in enumerate(espacios_mas_usados or []):
            espacios_data.append([str(idx + 1), item.get('espacio', ''), str(item.get('usos', 0)),
                                  f"{item.get('ocupacion', 0)}%"])
        espacios_table = Table(espacios_data, colWidths=[0.4 * inch, 3.1 * inch, 0.9 * inch, 1.1 * inch])
        espacios_table.setStyle(TableStyle([
            *CABECERA,
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, FILA_ALTERNA]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
            *[('TEXTCOLOR', (3, i), (3, i), AZUL) for i in range(1, len(espacios_data))],
        ]))
        elements += [Paragraph('Espacios Más Utilizados', section_style), espacios_table, Spacer(1, 0.1 * inch),
                     Paragraph('Generado por Benji', body_small_style)]
        return elements

    return _pdf(construir)


# ------------------------------------------------------------------ disponibilidad
def _color_de_ocupacion(texto):
    """Rojo desde 70 %, amarillo desde 50 %, verde por debajo."""
    try:
        pct = int(texto.replace('%', ''))
    except Exception:
        pct = 0
    if pct >= 70:
        return ROJO
    if pct >= 50:
        return AMARILLO
    return VERDE


def disponibilidad(filas, resumen, lunes, sabado):
    def construir(doc, styles):
        elements = _encabezado(styles, 'Reporte: Disponibilidad General de Espacios', lunes, sabado)
        elements += [
            _tabla_de_totales(
                doc, styles,
                ['Total disponible', 'Total ocupado', 'Promedio ocupación'],
                [f"{resumen.get('total_disponible', 0)}h", f"{resumen.get('total_ocupado', 0)}h",
                 f"{resumen.get('promedio_ocupacion', 0)}%"],
                fondo='#dcfce7', borde='#bbf7d0',
            ),
            Spacer(1, 0.25 * inch),
        ]

        table_data = [['Espacio', 'Tipo', 'Disponible', 'Ocupado', 'Ocupación']]
        for item in filas or []:
            table_data.append([
                item.get('nombre', ''),
                item.get('tipo', ''),
                f"{item.get('horasDisponibles', 0)}h",
                f"{item.get('horasOcupadas', 0)}h",
                f"{item.get('porcentajeOcupacion', 0)}%"
            ])
        detail_table = Table(table_data, colWidths=[2.3 * inch, 1.0 * inch, 1.0 * inch, 1.0 * inch, 0.9 * inch])
        detail_table.setStyle(TableStyle([
            *CABECERA,
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, FILA_ALTERNA]),
            ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            *[('TEXTCOLOR', (4, i), (4, i), _color_de_ocupacion(table_data[i][4])) for i in range(1, len(table_data))],
        ]))
        elements.append(detail_table)
        return elements

    return _pdf(construir)


# ------------------------------------------------------------------ capacidad
def _color_de_capacidad(porcentaje):
    """Verde por encima de 75 %, amarillo por encima de 40 %, morado por debajo."""
    if porcentaje > 75:
        return VERDE
    if porcentaje > 40:
        return AMARILLO
    return MORADO


def _barra(tipo, porcentaje):
    """Una barra vertical de alto proporcional al porcentaje, con el tipo y el porcentaje debajo."""
    bar_width = 0.8 * inch
    max_bar_height = 3.0 * inch
    bar_height = (porcentaje / 100) * max_bar_height
    bar_color = _color_de_capacidad(porcentaje)

    bar_table = Table([[''], [''], ['']], colWidths=[bar_width], rowHeights=[max_bar_height - bar_height, bar_height, 0])
    bar_style = [
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]
    if bar_height > 0:
        bar_style.append(('BACKGROUND', (0, 1), (0, 1), bar_color))
    bar_table.setStyle(TableStyle(bar_style))

    container_table = Table([[bar_table], [tipo], [f'{porcentaje}%']], colWidths=[bar_width])
    container_table.setStyle(TableStyle([
        ('ALIGN', (0, 1), (0, 2), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('FONTSIZE', (0, 1), (0, 1), 8),
        ('FONTSIZE', (0, 2), (0, 2), 9),
        ('TEXTCOLOR', (0, 1), (0, 1), TINTA),
        ('TEXTCOLOR', (0, 2), (0, 2), bar_color),
        ('LEFTPADDING', (0, 0), (-1, -1), 2),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    return container_table


def _leyenda_de_capacidad(styles):
    legend_title_style = ParagraphStyle(
        'LegendTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TINTA,
        spaceAfter=5
    )
    legend_table = Table(
        [['Alta', 'Media', 'Baja'], ['Alta (>75%)', '■ Media (40-75%)', 'Baja (<40%)']],
        colWidths=[2.0 * inch, 2.0 * inch, 2.0 * inch]
    )
    legend_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), FILA_ALTERNA),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDE),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TEXTCOLOR', (0, 1), (0, 1), VERDE),
        ('TEXTCOLOR', (1, 1), (1, 1), AMARILLO),
        ('TEXTCOLOR', (2, 1), (2, 1), MORADO),
    ]))
    return [Spacer(1, 0.2 * inch), Paragraph('Leyenda de Porcentajes:', legend_title_style), legend_table]


def capacidad(por_tipo, lunes, sabado):
    """por_tipo: una fila por tipo de espacio con su porcentaje de capacidad utilizada (se dibuja hasta 100 %)."""
    def construir(doc, styles):
        elements = _encabezado(styles, 'Reporte: Capacidad Utilizada', lunes, sabado)
        elements.append(Spacer(1, 0.2 * inch))
        barras = [_barra(item.get('tipo', ''), min(item.get('porcentaje', 0), 100)) for item in por_tipo or []]
        if barras:
            chart_title_style = ParagraphStyle(
                'ChartTitle',
                parent=styles['Normal'],
                fontSize=12,
                textColor=TINTA,
                alignment=TA_CENTER,
                spaceAfter=10
            )
            chart_table = Table([barras], colWidths=[0.8 * inch + 0.3 * inch] * len(barras))
            chart_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            elements += [Paragraph('Capacidad Utilizada por Tipo de Espacio', chart_title_style), chart_table,
                         *_leyenda_de_capacidad(styles)]
        return elements

    return _pdf(construir)
