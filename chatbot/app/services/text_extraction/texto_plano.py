"""Texto plano y CSV: decodificación y conversión a una línea por fila."""
import codecs
import csv
import io
from .errores import IngestionError
from .tablas import _clean


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
