"""
Script de transformación – extrae los métodos de Command en seed_initial_data.py
y genera archivos seeder independientes en la carpeta seeders/.

Uso:
    python _build_seeders.py
(ejecutar desde el directorio del script)
"""

import re
import os
import textwrap

SRC = os.path.join(os.path.dirname(__file__), "seed_initial_data.py")
DEST_DIR = os.path.join(os.path.dirname(__file__), "seeders")

# --------------------------------------------------------------------------- #
# 1. Leer el archivo fuente                                                    #
# --------------------------------------------------------------------------- #
with open(SRC, encoding="utf-8") as fh:
    source = fh.read()

# --------------------------------------------------------------------------- #
# 2. Extraer métodos de la clase Command                                       #
# --------------------------------------------------------------------------- #
# Cada método comienza con "    def <nombre>(self" (4 espacios de indentación).
# Lo delimitamos hasta el siguiente método o fin de clase.
METHOD_HEADER = re.compile(r"^    def (\w+)\(self.*?\):", re.MULTILINE)

matches = list(METHOD_HEADER.finditer(source))


def extract_body(start_match, end_match, full_source):
    """Devuelve el cuerpo del método (sin la línea def) con un nivel menos de indent."""
    start = start_match.end()          # justo después de ':'
    end = end_match.start() if end_match else len(full_source)
    raw = full_source[start:end]
    # Quitar el primer salto de línea si existe
    if raw.startswith("\n"):
        raw = raw[1:]
    # Reducir 4 espacios de indentación (nivel de clase → nivel de módulo)
    lines = raw.splitlines(keepends=True)
    dedented = []
    for line in lines:
        if line.startswith("        "):
            dedented.append(line[4:])          # quitar 4 de los 8 espacios
        elif line.startswith("    "):
            dedented.append(line[4:])          # quitar 4 espacios
        else:
            dedented.append(line)
    return "".join(dedented).rstrip()


methods = {}
for i, m in enumerate(matches):
    name = m.group(1)
    next_m = matches[i + 1] if i + 1 < len(matches) else None
    body = extract_body(m, next_m, source)
    methods[name] = body


# --------------------------------------------------------------------------- #
# 3. Transformar self.stdout / self.style → parámetros pasados                #
# --------------------------------------------------------------------------- #
def transform(body: str) -> str:
    body = body.replace("self.stdout", "stdout")
    body = body.replace("self.style", "style")
    return body


# --------------------------------------------------------------------------- #
# 4. Construir cada archivo seeder                                             #
# --------------------------------------------------------------------------- #
IMPORTS_BASE = """\
from sedes.models import Sede
from espacios.models import TipoEspacio, EspacioFisico
from usuarios.models import Rol, Usuario
from facultades.models import Facultad
from programas.models import Programa
from asignaturas.models import Asignatura, AsignaturaPrograma
from componentes.models import Componente, ComponenteRol
from periodos.models import PeriodoAcademico
from grupos.models import Grupo
from horario.models import Horario
from datetime import date, time
"""

SEEDER_FILES = {
    "roles_seeder.py": {
        "doc": "Seeder de roles del sistema.",
        "imports": "from usuarios.models import Rol",
        "methods": ["create_roles"],
        "public_fn": "create_roles",
    },
    "sedes_seeder.py": {
        "doc": "Seeder de sedes de la universidad.",
        "imports": "from sedes.models import Sede",
        "methods": ["create_sedes"],
        "public_fn": "create_sedes",
    },
    "tipos_espacio_seeder.py": {
        "doc": "Seeder de tipos de espacio físico.",
        "imports": "from espacios.models import TipoEspacio",
        "methods": ["create_tipos_espacio"],
        "public_fn": "create_tipos_espacio",
    },
    "facultades_seeder.py": {
        "doc": "Seeder de facultades.",
        "imports": "from sedes.models import Sede\nfrom facultades.models import Facultad",
        "methods": ["create_facultades"],
        "public_fn": "create_facultades",
    },
    "programas_seeder.py": {
        "doc": "Seeder de programas académicos.",
        "imports": "from facultades.models import Facultad\nfrom programas.models import Programa",
        "methods": ["create_programas"],
        "public_fn": "create_programas",
    },
    "usuarios_seeder.py": {
        "doc": "Seeder de usuarios del sistema y docentes.",
        "imports": "from sedes.models import Sede\nfrom usuarios.models import Rol, Usuario",
        "methods": ["create_usuarios_sistema", "create_usuarios_docentes"],
        "public_fn": None,  # múltiples funciones públicas
    },
    "asignaturas_seeder.py": {
        "doc": "Seeder de asignaturas de todos los programas.",
        "imports": "from asignaturas.models import Asignatura",
        "methods": ["create_asignaturas", "_get_all_asignaturas"],
        "public_fn": "create_asignaturas",
    },
    "asignaturas_programa_seeder.py": {
        "doc": "Seeder de relaciones Asignatura-Programa.",
        "imports": "from asignaturas.models import Asignatura, AsignaturaPrograma\nfrom programas.models import Programa",
        "methods": ["create_asignaturas_programa"],
        "public_fn": "create_asignaturas_programa",
    },
    "espacios_seeder.py": {
        "doc": "Seeder de espacios físicos de las sedes.",
        "imports": "from sedes.models import Sede\nfrom espacios.models import TipoEspacio, EspacioFisico",
        "methods": ["create_espacios_fisicos"],
        "public_fn": "create_espacios_fisicos",
    },
    "componentes_seeder.py": {
        "doc": "Seeder de componentes del sistema de permisos y su asignación a roles.",
        "imports": "from componentes.models import Componente, ComponenteRol\nfrom usuarios.models import Rol",
        "methods": ["create_componentes", "create_componentes_rol"],
        "public_fn": None,
    },
    "periodos_seeder.py": {
        "doc": "Seeder de periodos académicos.",
        "imports": "from datetime import date\nfrom periodos.models import PeriodoAcademico",
        "methods": ["create_periodos_academicos"],
        "public_fn": "create_periodos_academicos",
    },
    "grupos_seeder.py": {
        "doc": "Seeder de grupos académicos.",
        "imports": "from programas.models import Programa\nfrom periodos.models import PeriodoAcademico\nfrom grupos.models import Grupo",
        "methods": ["create_grupos"],
        "public_fn": "create_grupos",
    },
    "horarios_seeder.py": {
        "doc": "Seeder de horarios para Sede Centro y Sede Principal.",
        "imports": (
            "from datetime import time\n"
            "from sedes.models import Sede\n"
            "from espacios.models import TipoEspacio, EspacioFisico\n"
            "from usuarios.models import Rol, Usuario\n"
            "from asignaturas.models import Asignatura\n"
            "from programas.models import Programa\n"
            "from periodos.models import PeriodoAcademico\n"
            "from grupos.models import Grupo\n"
            "from horario.models import Horario"
        ),
        "methods": ["create_horarios_sede_centro", "create_horarios_sede_principal"],
        "public_fn": None,
    },
}


def build_seeder_file(filename, cfg):
    lines = []
    lines.append(f'"""\n{cfg["doc"]}\n"""')
    lines.append("")
    lines.append(cfg["imports"])
    lines.append("")
    lines.append("")

    for method_name in cfg["methods"]:
        if method_name not in methods:
            print(f"  WARN: método '{method_name}' no encontrado – se omite.")
            continue
        body = transform(methods[method_name])

        # Construir la firma de la función:
        # _get_all_asignaturas no requiere stdout/style
        if method_name == "_get_all_asignaturas":
            sig = f"def {method_name}():"
        else:
            sig = f"def {method_name}(stdout, style):"

        lines.append(sig)
        # El body ya fue desindentado 4 espacios por extract_body
        # (8 espacios en clase → 4 espacios en módulo), así que se escribe tal cual.
        for line in body.splitlines():
            lines.append(line)
        lines.append("")
        lines.append("")

    content = "\n".join(lines)
    dest = os.path.join(DEST_DIR, filename)
    with open(dest, "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"  ✓ {filename}")


print("Generando seeders...")
for fname, cfg in SEEDER_FILES.items():
    build_seeder_file(fname, cfg)

# --------------------------------------------------------------------------- #
# 5. Verificar que todos los métodos se cubrieron                              #
# --------------------------------------------------------------------------- #
covered = set()
for cfg in SEEDER_FILES.values():
    covered.update(cfg["methods"])

uncovered = [n for n in methods if n not in covered and n != "handle"]
if uncovered:
    print(f"\nADVERTENCIA – métodos sin seeder asignado: {uncovered}")
else:
    print("\nTodos los métodos cubiertos.")
