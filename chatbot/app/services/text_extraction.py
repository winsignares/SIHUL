import codecs
import csv
import io
import re
from bisect import bisect_right
from collections import Counter

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
# Cierre de un documento («Expedido en…», «Firman:»): se aparta en su propia sección
# para que los nombres y cargos no queden diluidos en el último artículo.
_CIERRE = re.compile(r"^(Expedido en|Firman\b|Firmado por|Atentamente)", re.IGNORECASE)
_CIERRE_SECCION = "FIRMAS Y EXPEDICIÓN"

# Marca de página: el texto extraído de un PDF lleva una línea «⟦p12⟧» al comenzar cada
# página para que el troceado sepa en qué página cae cada fragmento. Se quita antes de
# guardar el contenido (strip_page_markers).
_MARK_RE = re.compile(r"^\u27e6p(\d+)\u27e7$")

# Encabezados de trabajos académicos («2.1 Antecedentes»). Solo se reconocen cuando el
# agente es de tipo investigativo: en un reglamento, «7. Ingresar a los baños…» es un
# ítem de lista, no un título.
_NUM_HEADING = re.compile(r"^(\d{1,2}(?:\.\d{1,2}){0,3})\.?\s+(\S.{1,90})$")
_SECCION_ACADEMICA = re.compile(
    r"^(Resumen|Abstract|Introducci[oó]n|Antecedentes|Marco te[oó]rico|Metodolog[ií]a|"
    r"Resultados|Discusi[oó]n|Conclusiones|Recomendaciones|Referencias|Bibliograf[ií]a|"
    r"Anexos?|Agradecimientos)\s*:?$",
    re.IGNORECASE,
)


class IngestionError(Exception):
    """El archivo no se puede ingerir; `status_code` es el HTTP que corresponde."""

    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


#  Extracción

def extract_text(raw: bytes, filename: str) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        text = _pdf_text(raw)
        if not text.strip():
            raise IngestionError(
                "El PDF no contiene texto extraíble. Si es un documento escaneado "
                "(páginas como imagen) debe pasar por OCR antes de subirlo."
            )
        return text

    text = _decode(raw)
    if name.endswith(".csv"):
        text = _csv_to_text(text)
    if not text.strip():
        raise IngestionError("El archivo está vacío.")
    return text


def _decode(raw: bytes) -> str:
    """UTF-8 (con o sin BOM), UTF-16 con BOM y, si no, Windows-1252 (Excel / Word)."""
    if raw.startswith((codecs.BOM_UTF16_LE, codecs.BOM_UTF16_BE)):
        return raw.decode("utf-16")
    if b"\x00" in raw[:4096]:
        raise IngestionError("El archivo no parece ser de texto.")
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            return raw.decode("cp1252")
        except UnicodeDecodeError:
            return raw.decode("latin-1")  # nunca falla


def _csv_to_text(text: str) -> str:
    """
    Una línea por fila con el nombre de cada columna («- zona: Norte | horario: 8-12»),
    de modo que ninguna fila pierda sus encabezados al trocear.
    """
    try:
        try:
            dialect = csv.Sniffer().sniff(text[:4096], delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
        rows = [[_clean(c) for c in r] for r in csv.reader(io.StringIO(text), dialect)]
    except csv.Error as e:
        raise IngestionError(f"El CSV está mal formado: {e}")
    rows = [r for r in rows if any(r)]
    if len(rows) < 2:
        return "\n".join(" | ".join(c for c in r if c) for r in rows)

    labels = [h or f"columna {i + 1}" for i, h in enumerate(rows[0])]
    lines = []
    for row in rows[1:]:
        pairs = (
            f"{labels[i] if i < len(labels) else f'columna {i + 1}'}: {c}"
            for i, c in enumerate(row) if c
        )
        lines.append("- " + " | ".join(pairs))
    return "\n".join(lines)


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


def _page_mark(number: int) -> str:
    return f"\u27e6p{number}\u27e7"


def strip_page_markers(text: str) -> str:
    return "\n".join(l for l in text.split("\n") if not _MARK_RE.match(l.strip()))


def _pdf_text(raw: bytes) -> str:
    try:
        doc = fitz.open(stream=raw, filetype="pdf")
    except Exception:
        raise IngestionError("El PDF está dañado o no se puede abrir.")
    if doc.needs_pass:
        raise IngestionError("El PDF está protegido con contraseña.")
    carry = None
    pages = []  # (número, [textos])
    for number, page in enumerate(doc, start=1):
        try:
            tables = page.find_tables().tables
        except Exception:
            tables = []  # si la detección falla se conserva el texto plano

        items = []  # (y0, x0, x1, y1, texto)
        for t in tables:
            lines, carry = _table_lines(t.extract(), carry, t.bbox[1] < _TOP_OF_PAGE)
            if lines:
                items.append((t.bbox[1], t.bbox[0], t.bbox[2], t.bbox[3], "\n".join(lines)))

        for x0, y0, x1, y1, text in _page_blocks(page):
            cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            if any(t.bbox[0] - 3 <= cx <= t.bbox[2] + 3 and t.bbox[1] - 3 <= cy <= t.bbox[3] + 3
                   for t in tables):
                continue  # ya está representado por la tabla
            text = text.strip()
            if text and not text.isdigit():  # descarta el número de página
                items.append((y0, x0, x1, y1, text))

        items = _merge_columns(_reading_order(items, page.rect.width))
        pages.append((number, [it[4] for it in items]))

    running = _running_headers(pages)
    out = []
    for number, texts in pages:
        kept = []
        for t in texts:
            rows = [l for l in t.split("\n") if l.strip() not in running]
            if rows:
                kept.append("\n".join(rows))
        body = "\n".join(kept)
        if body.strip():
            out.append(f"{_page_mark(number)}\n{body}")
    return "\n".join(out)


def _running_headers(pages: list[tuple[int, list[str]]]) -> set[str]:
    """
    Encabezados y pies de página repetidos («Autor», «Título del libro»): líneas cortas que
    abren o cierran muchas páginas con el mismo texto. Si quedaran, ensuciarían los
    fragmentos y los dividirían en medio de una frase.
    """
    if len(pages) < 6:
        return set()
    count: Counter = Counter()
    for _, texts in pages:
        edge = []
        for t in texts[:1] + texts[-1:]:
            rows = [l.strip() for l in t.split("\n") if l.strip()]
            edge += rows[:2] + rows[-2:]
        count.update({l for l in edge if len(l) <= 80})
    minimum = max(4, len(pages) // 4)
    return {l for l, n in count.items() if n >= minimum}


def _page_blocks(page):
    """
    Bloques de texto de la página. Si varios fragmentos están en la misma fila visual
    (columnas: «NOMBRE      NOMBRE») se separan con un tabulador en vez de salto de línea.
    """
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        rows = []  # [(y, [(x, texto)])]
        for line in block["lines"]:
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text:
                continue
            x0, y0 = line["bbox"][0], line["bbox"][1]
            if rows and abs(rows[-1][0] - y0) <= 3:
                rows[-1][1].append((x0, text))
            else:
                rows.append((y0, [(x0, text)]))
        if rows:
            text = "\n".join("\t".join(t for _, t in sorted(segs)) for _, segs in rows)
            x0, y0, x1, y1 = block["bbox"]
            yield x0, y0, x1, y1, text


def _reading_order(items: list[tuple], page_width: float) -> list[tuple]:
    """
    Orden de lectura de los bloques de una página. En una página de una columna es de
    arriba abajo. En una de dos columnas (artículos científicos) se lee la columna
    izquierda completa y luego la derecha; los bloques que ocupan todo el ancho (título,
    resumen, tablas anchas) separan «bandas» que se leen en su orden vertical.
    """
    items = sorted(items, key=lambda it: (round(it[0]), it[1]))
    mid, tol = page_width / 2, 8

    def side(it):
        if it[2] <= mid + tol:
            return "L"
        if it[1] >= mid - tol:
            return "R"
        return None  # ocupa las dos mitades

    sides = [side(it) for it in items]
    left = [it for it, s in zip(items, sides) if s == "L"]
    right = [it for it, s in zip(items, sides) if s == "R"]
    # Dos columnas de verdad: al menos dos bloques de la derecha a la altura de bloques de
    # la izquierda (una sangría o un número de página suelto no cuentan).
    paired = sum(
        any(min(r[3], l[3]) - max(r[0], l[0]) > 0.5 * min(r[3] - r[0], l[3] - l[0]) for l in left)
        for r in right
    )
    if len(left) < 2 or paired < 2:
        return items

    out, band_left, band_right = [], [], []

    def flush():
        out.extend(band_left)
        out.extend(band_right)
        band_left.clear()
        band_right.clear()

    for it, s in zip(items, sides):
        if s == "L":
            band_left.append(it)
        elif s == "R":
            band_right.append(it)
        else:
            flush()
            out.append(it)
    flush()
    return out


def _merge_columns(items: list[tuple]) -> list[tuple]:
    """
    Dos filas consecutivas con las mismas columnas (las firmas: los nombres en una fila y
    los cargos en la siguiente) se unen por columna: «MARLENE BELTRÁN PRIETO — Rectora».
    Leídas fila por fila, el modelo no puede saber qué cargo corresponde a qué nombre.
    """
    def columns(text):
        parts = [p.strip() for p in text.split("\t")]
        return parts if len(parts) >= 2 and all(p and len(p) <= 60 for p in parts) else None

    out, i = [], 0
    while i < len(items):
        y0, x0, x1, y1, text = items[i]
        top = columns(text)
        bottom = columns(items[i + 1][4]) if top and i + 1 < len(items) else None
        if top and bottom and len(top) == len(bottom):
            out.append((y0, x0, x1, y1, "\n".join(f"{a} — {b}" for a, b in zip(top, bottom))))
            i += 2
        else:
            out.append((y0, x0, x1, y1, text.replace("\t", " ")))
            i += 1
    return out


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


def _is_real_subheading(lines: list[str], i: int) -> bool:
    """
    Un subtítulo en mayúsculas encabeza texto. Los nombres de una firma o una fila en
    mayúsculas también lo parecen, pero no van seguidos de un párrafo: son contenido y
    deben quedar en el fragmento, no desaparecer en la ruta de sección.
    """
    if lines[i].endswith(":"):
        return True
    j = i + 1
    while j < len(lines) and not lines[j]:
        j += 1
    if j >= len(lines):
        return False
    nxt = lines[j]
    return _heading_level(nxt) is None and (len(nxt) >= 40 or nxt.startswith("- "))


def _is_caps_line(line: str) -> bool:
    """Continuación de un encabezado: mayúsculas y sin «:» (que marca un subtítulo propio)."""
    return (
        bool(line)
        and any(c.isalpha() for c in line)
        and line == line.upper()
        and len(line) <= 80
        and not line.endswith(":")
    )


def _next_line(lines: list[str], i: int) -> str | None:
    j = i + 1
    while j < len(lines) and not lines[j]:
        j += 1
    return lines[j] if j < len(lines) else None


_TOC_LINE = re.compile(r"(?:\.\s*){4,}")  # puntos guía del índice: «Introducción ..... 12»
_FUNCTION_WORDS = {
    "de", "del", "la", "el", "los", "las", "un", "una", "y", "o", "e", "a", "en", "con",
    "por", "para", "que", "se", "entre", "sobre", "al", "su", "sus", "como", "es", "son",
}


def _academic_heading_level(lines: list[str], i: int) -> int | None:
    """
    Nivel (1 a 3) de un encabezado de trabajo académico: «2. Marco teórico», «2.1
    Antecedentes», «3.2.1 Instrumentos» o una sección conocida («Resumen», «Conclusiones»).
    Un título va seguido de texto (o de un subtítulo más profundo), no de otro ítem del
    mismo nivel ni de una línea suelta: así se distinguen de los ítems de una lista.
    """
    line = lines[i]
    nxt = _next_line(lines, i)
    if nxt is None:
        return None

    if _SECCION_ACADEMICA.match(line):
        return 1 if len(nxt) >= 30 or _NUM_HEADING.match(nxt) else None

    m = _NUM_HEADING.match(line)
    if not m:
        return None
    number, title = m.groups()
    if not title[0].isupper() or title.endswith((".", ";", ",")) or len(title.split()) > 14:
        return None
    if title.split()[-1].lower() in _FUNCTION_WORDS:
        return None  # una frase cortada («1 Aunque en algunos contextos se usan entre»): nota al pie
    if "." not in number and not m.group(0).startswith(number + ".") and len(title.split()) > 8:
        return None  # «1 Texto largo…» sin punto tras el número: nota al pie, no título
    depth = number.count(".") + 1
    nxt_heading = _NUM_HEADING.match(nxt)
    if nxt_heading:
        if nxt_heading.group(1).count(".") + 1 <= depth:
            return None  # el siguiente es otro ítem del mismo nivel: esto es una lista
    elif len(nxt) < 30:
        return None
    return min(depth, 3)


def _same_chapter(parent: str, heading: str) -> bool:
    """«3. Método» es el padre de «3.2 Muestra»; «Introducción» o «1. Turismo» no lo son."""
    if not parent:
        return True
    x, y = _NUM_HEADING.match(parent), _NUM_HEADING.match(heading)
    return bool(x and y and x.group(1).split(".")[0] == y.group(1).split(".")[0])


def _pack_lines(lines: list[str], filename: str) -> list[str]:
    """Agrupa filas completas hasta el tamaño de chunk, sin partir ninguna fila."""
    limit = _settings.CHUNK_SIZE
    chunks, current, size = [], [], 0
    for line in lines:
        pieces = [line] if len(line) <= limit else _splitter.split_text(line)
        for piece in pieces:
            if current and size + len(piece) + 1 > limit:
                chunks.append(f"[{filename}]\n" + "\n".join(current))
                current, size = [], 0
            current.append(piece)
            size += len(piece) + 1
    if current:
        chunks.append(f"[{filename}]\n" + "\n".join(current))
    return chunks


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


def chunk_text(content: str, filename: str, numbered_headings: bool = False) -> list[str]:
    return [text for text, _ in chunk_text_with_pages(content, filename, numbered_headings)]


def chunk_text_with_pages(
    content: str, filename: str, numbered_headings: bool = False
) -> list[tuple[str, int | None]]:
    """
    Trocea el texto por secciones (título > capítulo > artículo > subtítulo) y
    antepone la ruta de la sección a cada fragmento. Sin esto, un ítem de una lista
    («Frecuentar billares…») pierde el título que lo clasifica («FALTAS GRAVES»).
    Los CSV y los textos sin encabezados reconocibles se trocean sin prefijo.

    Devuelve (fragmento, página) donde la página es la del inicio del fragmento (None si el
    documento no es un PDF). Con `numbered_headings` se reconocen además los encabezados
    de trabajos académicos («2.1 Antecedentes», «Conclusiones»).
    """
    if filename.lower().endswith(".csv"):
        return [(c, None) for c in _pack_lines(content.split("\n"), filename)]

    lines, pages, current = [], [], None
    for line in _join_split_headings([l.strip() for l in content.split("\n")]):
        mark = _MARK_RE.match(line)
        if mark:
            current = int(mark.group(1))
            continue
        lines.append(line)
        pages.append(current)

    crumbs = ["", "", "", ""]
    chunks: list[tuple[str, int | None]] = []
    buffer: list[tuple[str, int | None]] = []  # (línea, página)

    def flush():
        text = "\n".join(l for l, _ in buffer)
        starts, position = [], 0
        for l, _ in buffer:
            starts.append(position)
            position += len(l) + 1
        line_pages = [p for _, p in buffer]
        buffer.clear()
        body = text.strip()
        if not body:
            return
        lead = len(text) - len(text.lstrip())
        path = " > ".join(c for c in crumbs if c)
        cursor, page = 0, line_pages[0]
        for piece in _splitter.split_text(body):
            found = body.find(piece[:60], cursor)
            if found >= 0:
                page = line_pages[max(bisect_right(starts, lead + found) - 1, 0)]
                cursor = found + 1
            chunks.append((f"[{path}]\n{piece}" if path else piece, page))

    i = 0
    while i < len(lines):
        line = lines[i]
        if _TOC_LINE.search(line):  # entrada de un índice, no un encabezado
            buffer.append((line, pages[i]))
            i += 1
            continue
        academic = _academic_heading_level(lines, i) if numbered_headings else None
        level = academic if academic is not None else _heading_level(line)
        if academic is None and level == 3 and not _is_real_subheading(lines, i):
            level = None
        if level is None and crumbs[3] != _CIERRE_SECCION and _CIERRE.match(line):
            flush()
            crumbs[:] = ["", "", "", _CIERRE_SECCION]  # no pertenece al último artículo
            buffer.append((line, pages[i]))
            i += 1
            continue
        if level is None:
            if line:
                buffer.append((line, pages[i]))
            i += 1
            continue

        flush()
        heading, rest = line, ""
        if level == 2 and academic is None:
            # «ARTÍCULO 88. Los costos educativos…»: el encabezado es solo el número;
            # el resto de la línea ya es texto del artículo.
            m = _ARTICULO_NUM.match(line)
            if m and m.group(2) and m.group(2) != m.group(2).upper():
                heading, rest = m.group(1), m.group(2)
        if level <= 1 and academic is None:  # «CAPÍTULO IV» + «FALTAS» + «DISCIPLINARIAS» en líneas separadas
            j = i + 1
            while j < len(lines) and j - i <= 3 and _is_caps_line(lines[j]) and _heading_level(lines[j]) in (None, 3):
                heading += " " + lines[j]
                j += 1
            i = j - 1
        if academic is not None and level >= 2 and not _same_chapter(crumbs[1], heading):
            crumbs[1] = ""  # el capítulo anterior (p. ej. de un ejemplo) ya no es el padre
        crumbs[level] = heading
        for k in range(level + 1, 4):
            crumbs[k] = ""
        if rest:
            buffer.append((rest, pages[i]))
        i += 1

    flush()
    return chunks
