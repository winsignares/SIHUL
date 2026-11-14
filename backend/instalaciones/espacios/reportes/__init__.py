"""Cálculos de los reportes de espacios (Estado de Recursos y Reportes), sin depender de la petición HTTP.

Recorren la semana de lunes a sábado. Cuentan los horarios del día (aprobados, pendientes o todos, según el estado
pedido) y los préstamos 'Aprobado' de la fecha:
- detalle_ocupacion_semanal: filas del PDF de ocupación semanal;
- ocupacion_por_jornada y espacios_mas_usados: reporte de ocupación;
- disponibilidad: horas disponibles y ocupadas por espacio, con su resumen;
- capacidad: capacidad utilizada por tipo de espacio.
Las vistas de espacios/views/ leen los parámetros, filtran los espacios visibles y arman la respuesta.
"""
from ._semana import (  # noqa: F401
    DIAS_NOMBRE, dia_nombre, estados_horario, fechas_de_la_semana, normalizar_dia_semana, preparar_datos, semana,
)
from .capacidad import capacidad  # noqa: F401
from .disponibilidad import disponibilidad  # noqa: F401
from .ocupacion_semanal import detalle_ocupacion_semanal  # noqa: F401
from .reporte_ocupacion import espacios_mas_usados, ocupacion_por_jornada  # noqa: F401
