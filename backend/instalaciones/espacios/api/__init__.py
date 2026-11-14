"""Endpoints de espacios: un archivo por tema (filtros, listados, próximos, estado y ocupación)."""
from .estado import AbrirEspacioView, CerrarEspacioView, GetEstadoEspacioView, GetHorarioEspacioView  # noqa: F401
from .listados import (  # noqa: F401
    ListAllEspaciosDisponiblesWithHorariosView,
    ListAllEspaciosWithHorariosView,
    ListEspaciosByUsuarioView,
    ListSupervisorEspaciosDisponiblesWithHorariosView,
    ListSupervisorEspaciosWithHorariosView,
)
from .ocupacion import OcupacionSemanalView  # noqa: F401
from .proximos import ProximosAperturaCierreView  # noqa: F401
