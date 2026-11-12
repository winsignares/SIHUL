"""Endpoints de espacios: un archivo por tema (filtros, listados, próximos, estado y ocupación)."""
from .estado import abrir_espacio, cerrar_espacio, get_estado_espacio, get_horario_espacio  # noqa: F401
from .listados import (  # noqa: F401
    list_all_espacios_disponibles_with_horarios,
    list_all_espacios_with_horarios,
    list_espacios_by_usuario,
    list_supervisor_espacios_disponibles_with_horarios,
    list_supervisor_espacios_with_horarios,
)
from .ocupacion import ocupacion_semanal  # noqa: F401
from .proximos import proximos_apertura_cierre  # noqa: F401
