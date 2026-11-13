"""Marcas de página del texto extraído de un PDF."""
import re


# Marca de página: el texto extraído de un PDF lleva una línea «⟦p12⟧» al comenzar cada
# página para que el troceado sepa en qué página cae cada fragmento. Se quita antes de
# guardar el contenido (strip_page_markers).
_MARK_RE = re.compile(r"^\u27e6p(\d+)\u27e7$")


def _page_mark(number: int) -> str:
    return f"\u27e6p{number}\u27e7"


def strip_page_markers(text: str) -> str:
    return "\n".join(l for l in text.split("\n") if not _MARK_RE.match(l.strip()))
