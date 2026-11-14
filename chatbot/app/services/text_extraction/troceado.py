"""Troceado del texto por secciones, con la ruta de la sección y la página de cada fragmento."""
import re
from bisect import bisect_right
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.config import get_settings
from .marcas import _MARK_RE
from .encabezados import _TOC_LINE, _academic_heading_level, _heading_level, _is_caps_line, _is_real_subheading, _same_chapter


_settings = get_settings()
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=_settings.CHUNK_SIZE,
    chunk_overlap=_settings.CHUNK_OVERLAP,
)

_ARTICULO_NUM = re.compile(r"^(ART[ÍI]CULO\s+\d+\.?)\s*(.*)$")
_BARE_ARTICULO = re.compile(r"^ART[ÍI]CULO$")
# Cierre de un documento («Expedido en…», «Firman:»): se aparta en su propia sección
# para que los nombres y cargos no queden diluidos en el último artículo.
_CIERRE = re.compile(r"^(Expedido en|Firman\b|Firmado por|Atentamente)", re.IGNORECASE)
_CIERRE_SECCION = "FIRMAS Y EXPEDICIÓN"


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
