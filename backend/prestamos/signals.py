from django.core.exceptions import ValidationError
from django.db.models.signals import pre_save
from django.dispatch import receiver

from periodos.models import PeriodoAcademico

from .availability import validar_disponibilidad_prestamo
from .models import PrestamoEspacio, PrestamoEspacioPublico


@receiver(pre_save, sender=PrestamoEspacio)
@receiver(pre_save, sender=PrestamoEspacioPublico)
def asignar_periodo_prestamo(sender, instance, **kwargs):
    periodo = PeriodoAcademico.objects.filter(
        fecha_inicio__lte=instance.fecha,
        fecha_fin__gte=instance.fecha,
    ).order_by('-fecha_inicio', '-id').first()

    if periodo is None:
        raise ValidationError(
            f'La fecha del préstamo ({instance.fecha}) no está dentro de ningún periodo activo.'
        )

    instance.periodo = periodo


@receiver(pre_save, sender=PrestamoEspacio)
@receiver(pre_save, sender=PrestamoEspacioPublico)
def validar_solapamiento_prestamo(sender, instance, **kwargs):
    validar_disponibilidad_prestamo(instance)
