import re

import fitz
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings

_settings = get_settings()
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=_settings.CHUNK_SIZE,
    chunk_overlap=_settings.CHUNK_OVERLAP,
)

# Posición del margen superior bajo el cual una tabla se considera continuación
# de la tabla de la página anterior (y hereda sus encabezados).
_TOP_OF_PAGE = 130

_TITULO = re.compile(r"^T[ÍI]TULO\b")
_CAPITULO = re.compile(r"^CAP[ÍI]TULO\b")
_ARTICULO = re.compile(r"^ART[ÍI]CULO\b")
_ARTICULO_NUM = re.compile(r"^(ART[ÍI]CULO\s+\d+\.?)\s*(.*)$")
_BARE_ARTICULO = re.compile(r"^ART[ÍI]CULO$")


#  Extracción

def extract_text(raw: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        return _pdf_text(raw)
    return raw.decode("utf-8")


def _clean(cell) -> str:
    return " ".join((cell or "").split())


def _is_header_row(cells: list[str]) -> bool:
    """Fila de encabezado: celdas de texto (sin cifras sueltas), en su mayoría en mayúsculas."""
    filled = [c for c in cells if c]
    if len(filled) < 2 or not all(any(ch.isalpha() for ch in c) for c in filled):
        return False
    return sum(c == c.upper() for c in filled) * 2 >= len(filled)


def _table_lines(rows: list[list], carry: dict | None, at_top: bool) -> tuple[list[str], dict | None]:
    """
    Convierte una tabla en una línea por registro: «- COLUMNA: valor | COLUMNA: valor».
    Así cada fila conserva el nombre de sus columnas (p. ej. «COSTOS 2025 PENSIÓN»)
    y no depende de qué otros fragmentos recupere la búsqueda.

    `carry` conserva los encabezados de la última tabla: una tabla que empieza arriba
    de la página sin encabezado propio es la continuación de la anterior.
    """
    rows = [[_clean(c) for c in row] for row in rows]
    rows = [r for r in rows if any(r)]
    if not rows:
        return [], carry
    ncols = len(rows[0])

    labels: list[str] = []
    if _is_header_row(rows[0]):
        top = rows[0]
        if len(rows) > 1 and not rows[1][0] and _is_header_row(rows[1]):
            # Dos filas de encabezado: la superior agrupa (celdas combinadas)
            sub = rows[1]
            filled, last = [], ""
            for c in top:
                last = c or last
                filled.append(last)
            labels = [" ".join(dict.fromkeys(p for p in (f, s) if p)) for f, s in zip(filled, sub)]
            rows = rows[2:]
        else:
            labels = list(top)
            rows = rows[1:]
        carry = {"ncols": ncols, "labels": labels}
    elif carry and carry["ncols"] == ncols and at_top:
        labels = carry["labels"]

    # Las celdas combinadas en vertical dejan la primera columna vacía: esa fila
    # continúa el registro anterior.
    records: list[list[str]] = []
    for row in rows:
        if not row[0] and records:
            prev = records[-1]
            for i, cell in enumerate(row):
                if cell:
                    prev[i] = f"{prev[i]}; {cell}" if prev[i] else cell
        else:
            records.append(list(row))

    named = [l for l in labels if l]
    sparse = bool(named) and len(named) < ncols  # celdas combinadas en el encabezado
    lines = []
    for rec in records:
        filled_cells = [c for c in rec if c]
        if sparse and len(filled_cells) == len(named):
            pairs = zip(named, filled_cells)
        else:
            pairs = ((labels[i] if i < len(labels) else "", c) for i, c in enumerate(rec) if c)
        lines.append("- " + " | ".join(f"{l}: {c}" if l else c for l, c in pairs))
    return lines, carry


def _pdf_text(raw: bytes) -> str:
    doc = fitz.open(stream=raw, filetype="pdf")
    carry = None
    pages = []
    for page in doc:
        try:
            tables = page.find_tables().tables
        except Exception:
            tables = []  # si la detección falla se conserva el texto plano

        items = []  # (y, x, texto)
        for t in tables:
            lines, carry = _table_lines(t.extract(), carry, t.bbox[1] < _TOP_OF_PAGE)
            if lines:
                items.append((t.bbox[1], t.bbox[0], "\n".join(lines)))

        for x0, y0, x1, y1, text, _, kind in page.get_text("blocks"):
            if kind != 0:
                continue
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            if any(t.bbox[0] - 3 <= cx <= t.bbox[2] + 3 and t.bbox[1] - 3 <= cy <= t.bbox[3] + 3
                   for t in tables):
                continue  # ya está representado por la tabla
            text = text.strip()
            if text and not text.isdigit():  # descarta el número de página
                items.append((y0, x0, text))

        items.sort(key=lambda it: (round(it[0]), it[1]))
        pages.append("\n".join(it[2] for it in items))
    return "\n".join(pages)


#  Troceado

def _heading_level(line: str) -> int | None:
    """0 título, 1 capítulo, 2 artículo, 3 subtítulo en mayúsculas; None si no es encabezado."""
    if _TITULO.match(line):
        return 0
    if _CAPITULO.match(line):
        return 1
    if _ARTICULO.match(line):
        return 2
    letters = [c for c in line if c.isalpha()]
    if (
        len(letters) >= 4
        and len(line) <= 70
        and line == line.upper()
        and not line.endswith(".")
        and "," not in line
        and not line.startswith("- ")
        and (len(line.split()) >= 2 or line.endswith(":"))
    ):
        return 3
    return None


def _is_caps_line(line: str) -> bool:
    """Continuación de un encabezado: mayúsculas y sin «:» (que marca un subtítulo propio)."""
    return (
        bool(line)
        and any(c.isalpha() for c in line)
        and line == line.upper()
        and len(line) <= 80
        and not line.endswith(":")
    )


def _join_split_headings(lines: list[str]) -> list[str]:
    """El PDF a veces parte «ARTÍCULO 17. TÍTULO» en tres líneas por cambio de fuente."""
    out, i = [], 0
    while i < len(lines):
        if _BARE_ARTICULO.match(lines[i]) and i + 1 < len(lines) and re.match(r"^\d+\.?$", lines[i + 1]):
            joined = f"{lines[i]} {lines[i + 1]}"
            i += 2
            while i < len(lines) and _is_caps_line(lines[i]) and _heading_level(lines[i]) in (None, 3):
                joined += " " + lines[i]
                i += 1
            out.append(joined)
        else:
            out.append(lines[i])
            i += 1
    return out


def chunk_text(content: str, filename: str) -> list[str]:
    """
    Trocea el texto por secciones (título > capítulo > artículo > subtítulo) y
    antepone la ruta de la sección a cada fragmento. Sin esto, un ítem de una lista
    («Frecuentar billares…») pierde el título que lo clasifica («FALTAS GRAVES»).
    Los CSV y los textos sin encabezados reconocibles se trocean sin prefijo.
    """
    if filename.lower().endswith(".csv"):
        return _splitter.split_text(content)

    lines = _join_split_headings([l.strip() for l in content.split("\n")])
    crumbs = ["", "", "", ""]
    chunks: list[str] = []
    buffer: list[str] = []

    def flush():
        body = "\n".join(buffer).strip()
        buffer.clear()
        if not body:
            return
        path = " > ".join(c for c in crumbs if c)
        for piece in _splitter.split_text(body):
            chunks.append(f"[{path}]\n{piece}" if path else piece)

    i = 0
    while i < len(lines):
        line = lines[i]
        level = _heading_level(line)
        if level is None:
            if line:
                buffer.append(line)
            i += 1
            continue

        flush()
        heading, rest = line, ""
        if level == 2:
            # «ARTÍCULO 88. Los costos educativos…»: el encabezado es solo el número;
            # el resto de la línea ya es texto del artículo.
            m = _ARTICULO_NUM.match(line)
            if m and m.group(2) and m.group(2) != m.group(2).upper():
                heading, rest = m.group(1), m.group(2)
        if level <= 1:  # «CAPÍTULO IV» + «FALTAS» + «DISCIPLINARIAS» en líneas separadas
            j = i + 1
            while j < len(lines) and j - i <= 3 and _is_caps_line(lines[j]) and _heading_level(lines[j]) in (None, 3):
                heading += " " + lines[j]
                j += 1
            i = j - 1
        crumbs[level] = heading
        for k in range(level + 1, 4):
            crumbs[k] = ""
        if rest:
            buffer.append(rest)
        i += 1

    flush()
    return chunks
