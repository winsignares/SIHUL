"""Extracción del texto de un PDF: páginas, tablas, orden de lectura y columnas."""
from collections import Counter
import fitz
from .errores import IngestionError
from .marcas import _page_mark
from .tablas import _table_lines


# Posición del margen superior bajo el cual una tabla se considera continuación
# de la tabla de la página anterior (y hereda sus encabezados).
_TOP_OF_PAGE = 130


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
