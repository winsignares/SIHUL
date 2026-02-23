"""
Parse horarios_por_grupo_sedecentro.txt and emit Python tuples
for use in the seed file horarios_data list.

Usage:
    python parse_horarios.py > new_horarios_tuples.py
"""

import re
import sys

TXT_FILE = r"c:\Users\arman\Documents\horario\app\sihul\horarios_por_grupo_sedecentro.txt"

# ─── Day normalization ────────────────────────────────────────────────────────
DIAS_MAP = {
    'LUNES': 'LUNES', 'MARTES': 'MARTES', 'MIÉRCOLES': 'MIÉRCOLES',
    'MIERCOLES': 'MIÉRCOLES', 'JUEVES': 'JUEVES', 'VIERNES': 'VIERNES',
    'SÁBADO': 'SÁBADO', 'SABADO': 'SÁBADO', 'DOMINGO': 'DOMINGO',
}

# Groups that are malformed in the source txt (room name used as GRUPO, etc.) – skip.
SKIP_GROUPS = {
    '405NB',         # room as GRUPO, person name as ESPACIO
    'SALON 511NB',   # room as GRUPO
    'SALON 516 NB',  # room as GRUPO
    'SALON 603NB',   # room as GRUPO
    'SALON 607NB',   # room as GRUPO
    'SALÓN 411NB',   # room as GRUPO
    'SALON 512NB',   # (epidemiología clínica – no valid espacio)
    'SALON 612NB',   # same
}

# Groups already covered in current horarios_data – skip them to avoid duplicates.
# These are the *original* group name variants as they appear in GRUPO: lines.
ALREADY_IN_SEED = {
    # --- blank (horarios sin grupo) are already in seed
    '',
    # --- DERECHO by semester/group letter (mapped via grupos_derecho_map)
    '1 semestre grupo A', '1 Semestre grupo A',
    '1 semestre grupo B', '1 Semestre grupo B',
    '1 semestre grupo C', '1 Semestre grupo C',
    '1 semestre grupo D', '1 Semestre grupo D',
    '1 semestre grupo E', '1 Semestre grupo E',
    '1 semestre grupo AN', '1 semestre grupo AN-1E', '1 semestre grupo AN-E',
    '2 semestre grupo A', '2 Semestre grupo A',
    '2 semestre grupo B', '2 Semestre grupo B', '2. Semestre grupo B',
    '2 semestre grupo C', '2 Semestre grupo C',
    '2 semestre grupo D', '2 Semestre grupo D',
    '3 semestre grupo A', '3 Semestre grupo A', '3 semestre grupo AB', '3 semestre grupo AD',
    '3 semestre grupo B', '3 Semestre grupo B',
    '3 semestre grupo C', '3 Semestre grupo C',
    '3 semestre grupo D', '3 Semestre grupo D',
    '3 Semestre grupo D',
    '4 semestre grupo A', '4 Semestre grupo A',
    '5 semestre grupo A', '5 Semestre grupo A', '5 Semestre Grupo A',
    '5 semestre grupo B', '5 Semestre grupo B', '5 Semestre Grupo B',
    '5 semestre grupo C', '5 Semestre grupo C', '5 Semestre Grupo C', '5. Semestre grupo C',
    '5 semestre grupo D', '5 Semestre grupo D', '5 Semestre Grupo D', '5. Semestre grupo D',
    '5 semestre GRUPO D',
    '6 semestre grupo A', '6 Semestre grupo A', '6. Semestre grupo A',
    '6 ADMIN NEGOCIOS CD', '6 Semestre grupo A',
    '7 semestre grupo A', '7 Semestre grupo A', '7 Semestre Grupo A',
    '7 semestre grupo A - PROBATORIO',
    '7 semestre grupo B', '7 Semestre grupo B', '7 Semestre Grupo B',
    '7 semestre grupo C', '7 Semestre grupo C', '7 Semestre Grupo C',
    '7 semestre grupo D',
    '7 ADMIN NEG FN',
    '8 semestre grupo A', '8 Semestre grupo A',
    '8 semestre grupo B', '8 Semestre grupo B',
    '9 Semestre Diurno', '9 semestre Diurno',
    '9 Semestre Grupo A Nocturno', '9 semestre grupo A Nocturno',
    '9 Semestre grupo B', '9 semestre grupo B',
    '9 Semestre Grupo C',
    '10 semestre grupo A', '10 Semestre Grupo A Diurno', '10 semestre Grupo A Diurno',
    '10 semestre grupo B', '10 Semestre grupo B', '10 Semestre Grupo B Diurno', '10 semestre Grupo B Diurno',
    '10 semestre grupo B Diurno',  # lowercase-g variant
    '10 semestre grupo C', '10 Semestre grupo C',
}


def parse_horario_line(line):
    """
    Parse a bullet line like:
      • LUNES: 06:00:00 - 07:00:00 (SALON 501NB)
    or uncommon variants.
    Returns list of (dia, hora_inicio, hora_fin, espacio) or [] if can't parse.
    """
    # Remove bullet char and strip
    line = line.replace('•', '').replace('·', '').strip()
    if not line:
        return []

    # Pattern: DIA: HH:MM[:SS] - HH:MM[:SS] (ESPACIO)
    m = re.match(
        r'^([A-ZÁÉÍÓÚÜÑ]+)\s*:\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*\(([^)]+)\)',
        line, re.IGNORECASE
    )
    if not m:
        return []

    dia_raw = m.group(1).strip().upper()
    dia = DIAS_MAP.get(dia_raw, dia_raw.capitalize())
    h_ini = m.group(2).strip()
    h_fin = m.group(3).strip()
    espacio = m.group(4).strip()

    # Normalize time to HH:MM:SS
    def norm_time(t):
        parts = t.split(':')
        if len(parts) == 2:
            return f"{int(parts[0]):02d}:{parts[1]}:00"
        return f"{int(parts[0]):02d}:{parts[1]}:{parts[2]}"

    return [(dia, norm_time(h_ini), norm_time(h_fin), espacio)]


def parse_file(path):
    """
    Yields tuples: (grupo, materia, profesor, dia, hora_inicio, hora_fin, espacio)
    Skips entries whose grupo is in ALREADY_IN_SEED.
    """
    with open(path, encoding='utf-8') as f:
        lines = f.readlines()

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith('GRUPO:'):
            grupo = line[len('GRUPO:'):].strip().replace('"', '')
            materia = ''
            profesor = ''
            horario_lines = []

            i += 1
            while i < len(lines):
                l = lines[i].strip()
                if l.startswith('MATERIA:'):
                    materia = l[len('MATERIA:'):].strip().replace('"', '')
                elif l.startswith('PROFESOR:'):
                    profesor = l[len('PROFESOR:'):].strip().replace('"', '')
                elif l.startswith('HORARIOS:'):
                    pass  # header, continue reading bullets
                elif l.startswith('•') or l.startswith('·'):
                    horario_lines.append(l)
                elif l.startswith('=') or l.startswith('GRUPO:'):
                    break
                i += 1

            # Skip malformed (room-as-group) entries
            if grupo in SKIP_GROUPS:
                continue

            # Skip entries already in seed
            if grupo in ALREADY_IN_SEED:
                continue

            # Skip if no materia or no horarios
            if not materia or not horario_lines:
                continue

            for hl in horario_lines:
                parsed = parse_horario_line(hl)
                for dia, h_ini, h_fin, espacio in parsed:
                    yield (grupo, materia, profesor, dia, h_ini, h_fin, espacio)
        else:
            i += 1


def escape(s):
    return s.replace("'", "\\'")


def main():
    entries = list(parse_file(TXT_FILE))

    # Group by (grupo, materia) for a comment header
    print("# ── NEW HORARIOS FROM horarios_por_grupo_sedecentro.txt ─────────────────")
    print("# Append these tuples to horarios_data before the closing ]")
    print()

    current_grupo = None
    current_materia = None

    for grupo, materia, profesor, dia, h_ini, h_fin, espacio in entries:
        if grupo != current_grupo:
            print(f"\n            # ── {escape(grupo)} ──")
            current_grupo = grupo
            current_materia = None
        if materia != current_materia:
            print(f"            # {escape(materia)}")
            current_materia = materia

        line = (
            f"            ('{escape(grupo)}', '{escape(materia)}', "
            f"'{escape(profesor)}', '{dia}', '{h_ini}', '{h_fin}', '{escape(espacio)}'),"
        )
        print(line)

    print()
    print(f"# Total new entries: {len(entries)}")


if __name__ == '__main__':
    main()
