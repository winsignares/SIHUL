"""Reconocimiento de encabezados (títulos, capítulos, artículos, subtítulos y secciones académicas)."""
import re


_TITULO = re.compile(r"^T[ÍI]TULO\b")
_CAPITULO = re.compile(r"^CAP[ÍI]TULO\b")
_ARTICULO = re.compile(r"^ART[ÍI]CULO\b")
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
