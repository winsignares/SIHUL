"""Protección XSS de SIHUL: sanitización y validación de entradas para evitar ataques XSS.

Todo lo público sigue importándose desde `nucleo.xss_protection`.
"""
from .patrones import ALLOWED_CHARS_PATTERNS, DANGEROUS_CHARS, XSS_PATTERNS  # noqa: F401
from .valores import sanitize_string, sanitize_integer, sanitize_boolean  # noqa: F401
from .estructuras import sanitize_dict, validate_json_input  # noqa: F401
from .salida import escape_html_output, remove_null_bytes, sanitize_filename  # noqa: F401
from .esquemas_academicos import GRUPO_SCHEMA, ASIGNATURA_SCHEMA, PROGRAMA_SCHEMA, FACULTAD_SCHEMA, SEDE_SCHEMA, RECURSO_SCHEMA, HORARIO_SCHEMA  # noqa: F401
from .esquemas_financieros import PROVEEDOR_SCHEMA, FACTURA_SCHEMA, DEPARTAMENTO_SCHEMA, CUENTA_CONTABLE_SCHEMA, CENTRO_COSTO_SCHEMA  # noqa: F401
from .esquemas_usuarios import ROL_SCHEMA, USUARIO_SCHEMA  # noqa: F401
from .esquemas_prestamos import TIPO_ACTIVIDAD_SCHEMA, PRESTAMO_SCHEMA, PRESTAMO_PUBLICO_SCHEMA  # noqa: F401
from .esquemas_componentes import COMPONENTE_SCHEMA  # noqa: F401
from .esquemas_notificaciones import NOTIFICACION_SCHEMA  # noqa: F401
