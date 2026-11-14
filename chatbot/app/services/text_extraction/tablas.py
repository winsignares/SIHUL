"""Tablas de un PDF convertidas a una línea por registro."""



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
