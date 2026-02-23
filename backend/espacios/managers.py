from django.db import models
from django.utils import timezone

# Mapping Python weekday index -> Spanish capitalized day name (matches dia_semana values in Horario)
_DIAS_SEMANA = {
    0: 'Lunes',
    1: 'Martes',
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo',
}


class EspacioFisicoManager(models.Manager):
    """Manager que sincroniza el estado de cada EspacioFisico antes de devolver
    el queryset, basándose en si existe un Horario activo en el momento actual.

    Reglas:
    - 'No Disponible'  → 'Disponible'   si NO hay horario activo ahora.
    - 'Disponible'     → 'No Disponible' si SÍ hay horario activo ahora.
    - 'Mantenimiento'  → sin cambios (siempre ignorado).
    """

    def get_queryset(self):
        self._sincronizar_estados()
        return super().get_queryset()

    def _sincronizar_estados(self):
        ahora = timezone.localtime()
        hora_actual = ahora.time()
        dia_actual = _DIAS_SEMANA[ahora.weekday()]

        # Usamos super().get_queryset() para acceder directamente a la tabla
        # sin volver a llamar a este manager y evitar recursión infinita.
        base_qs = super().get_queryset()

        # Filtro de horarios activos en este momento (sólo aprobados)
        filtro_activo = dict(
            horarios__dia_semana__iexact=dia_actual,
            horarios__hora_inicio__lte=hora_actual,
            horarios__hora_fin__gt=hora_actual,
            horarios__estado='aprobado',
        )

        # 1. "No Disponible" → "Disponible" cuando no existe horario activo
        base_qs.filter(estado='No Disponible').exclude(**filtro_activo).update(
            estado='Disponible'
        )

        # 2. "Disponible" → "No Disponible" cuando existe un horario activo
        base_qs.filter(estado='Disponible', **filtro_activo).update(
            estado='No Disponible'
        )
